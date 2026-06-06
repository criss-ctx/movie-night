<template>
  <div class="mdv">

    <div class="mdv-hero">
      <div class="mdv-poster-wrap">
        <img v-if="posterUrl" :src="posterUrl" :alt="`Affiche de ${title}`" class="mdv-poster" />
        <div v-else class="mdv-poster-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="2"/>
            <path d="M7 8h10M7 12h10M7 16h6"/>
          </svg>
        </div>
        <button v-if="trailerKey" class="mdv-trailer-btn" @click="showEmbed = !showEmbed">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          {{ showEmbed ? 'Masquer' : 'Bande annonce' }}
        </button>
      </div>

      <div class="mdv-hero-info">
        <div>
          <h1 class="mdv-title">{{ title }}</h1>
          <p v-if="movie && movie.original_title !== movie.title" class="mdv-original-title">{{ movie.original_title }}</p>
        </div>

        <div class="mdv-facts">
          <span v-if="releaseYear" class="mdv-fact">{{ releaseYear }}</span>
          <span v-if="formattedRuntime" class="mdv-fact">{{ formattedRuntime }}</span>
          <span v-if="originCountry" class="mdv-fact">{{ originCountry }}</span>
        </div>

        <div v-if="movie?.genres?.length || hasWarning || frCertification" class="mdv-genres">
          <span
            v-if="frCertification"
            class="mdv-cert-badge"
            :data-meaning="frCertMeaning"
            tabindex="0"
            :aria-label="frCertMeaning ?? frCertification"
          >{{ frCertification }}</span>
          <span v-if="hasWarning" class="mdv-genre-warning">⚠ Déconseillé</span>
          <span v-for="genre in movie!.genres" :key="genre.id" class="mdv-genre-tag">{{ genre.name }}</span>
        </div>

        <div v-if="movie && movie.vote_count > 0" class="mdv-rating">
          <span class="mdv-rating-score">{{ movie.vote_average.toFixed(1) }}</span>
          <div class="mdv-rating-sub">
            <span>/ 10</span>
            <span class="mdv-rating-votes">{{ movie.vote_count.toLocaleString('fr-FR') }} votes</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="trailerKey && showEmbed" class="mdv-trailer-embed">
      <iframe
        :src="`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`"
        allow="autoplay; encrypted-media; fullscreen"
        allowfullscreen
        class="mdv-trailer-iframe"
        title="Bande annonce"
      />
    </div>

    <div class="mdv-body">
      <p v-if="movie?.tagline" class="mdv-tagline">« {{ movie.tagline }} »</p>

      <div v-if="displayedOverview" class="mdv-overview-wrap">
        <p class="mdv-overview">{{ displayedOverview }}</p>
        <button v-if="isOverviewLong" class="mdv-overview-toggle" @click="showFullOverview = !showFullOverview">
          {{ showFullOverview ? 'Voir moins' : 'Voir plus' }}
        </button>
      </div>

      <dl v-if="director || mainCast.length || mainProductionCompanies.length" class="mdv-credits">
        <div v-if="director" class="mdv-credit-row">
          <dt>Réalisation</dt>
          <dd>
            <button class="mdv-person-btn" @click="openPerson(director.id)">{{ director.name }}</button>
          </dd>
        </div>
        <div v-if="mainCast.length" class="mdv-credit-row">
          <dt>Avec</dt>
          <dd class="mdv-cast-list">
            <template v-for="(actor, i) in mainCast" :key="actor.id">
              <button class="mdv-person-btn" @click="openPerson(actor.id)">{{ actor.name }}</button>
              <span v-if="i < mainCast.length - 1" class="mdv-cast-sep">, </span>
            </template>
          </dd>
        </div>
        <div v-if="mainProductionCompanies.length" class="mdv-credit-row">
          <dt>Production</dt>
          <dd>{{ mainProductionCompanies.map(c => c.name).join(', ') }}</dd>
        </div>
      </dl>

      <div v-if="journalMeta" class="mdv-journal-meta">
        <span>Choisi par <strong>{{ journalMeta.name ?? '?' }}</strong></span>
        <span>Vu le {{ formatDate(journalMeta.date) }}</span>
      </div>
    </div>

    <div v-if="providers?.flatrate?.length || providers?.rent?.length" class="mdv-providers">
      <div class="mdv-providers-header">
        <span class="mdv-providers-label">Disponible sur</span>
        <a :href="providers!.link" target="_blank" rel="noopener" class="mdv-providers-jwlink">JustWatch →</a>
      </div>
      <div v-if="providers!.flatrate?.length" class="mdv-providers-group">
        <span class="mdv-providers-type">Abonnement</span>
        <div class="mdv-providers-list">
          <span v-for="p in providers!.flatrate" :key="p.provider_id" class="mdv-provider-item" :data-name="p.provider_name" tabindex="0" :aria-label="p.provider_name">
            <img :src="getPosterUrl(p.logo_path, 'original')!" :alt="p.provider_name" class="mdv-provider-logo" />
          </span>
        </div>
      </div>
      <div v-if="providers!.rent?.length" class="mdv-providers-group">
        <span class="mdv-providers-type">Location</span>
        <div class="mdv-providers-list">
          <span v-for="p in providers!.rent" :key="p.provider_id" class="mdv-provider-item" :data-name="p.provider_name" tabindex="0" :aria-label="p.provider_name">
            <img :src="getPosterUrl(p.logo_path, 'original')!" :alt="p.provider_name" class="mdv-provider-logo" />
          </span>
        </div>
      </div>
      <p class="mdv-providers-disclaimer">Netflix non inclus · données JustWatch</p>
    </div>

    <slot />

  </div>
</template>

<script setup lang="ts">
import type { TmdbMovieDetail, TmdbWatchProviders } from '~/types'
import { TMDB_WARNING_GENRES } from '~/constants/tmdb'

// type 3 = theatrical release — prioritized to get the relevant certification
function extractFrCertification(movie: TmdbMovieDetail | null): string | null {
  const fr = movie?.release_dates?.results?.find(r => r.iso_3166_1 === 'FR')
  if (!fr) return null
  const theatrical = fr.release_dates.find(d => d.type === 3 && d.certification)
  return theatrical?.certification ?? fr.release_dates.find(d => d.certification)?.certification ?? null
}

const props = defineProps<{
  movie: TmdbMovieDetail | null
  providers: TmdbWatchProviders | null
  fallbackTitle?: string
  fallbackYear?: number
  journalMeta?: { name: string | null; date: string } | null
}>()

const { getPosterUrl, getBestTrailer } = useTmdb()
const { openPerson } = usePersonModal()

const { data: trailerKey } = await useAsyncData(
  `trailer-${props.movie?.id ?? 'none'}`,
  () => props.movie?.id ? getBestTrailer(props.movie!.id) : Promise.resolve(null)
)
const showEmbed = ref(false)

const posterUrl = computed(() => props.movie ? getPosterUrl(props.movie.poster_path, 'w342') : null)
const title = computed(() => props.movie?.title ?? props.fallbackTitle ?? '')
const releaseYear = computed(() => props.movie?.release_date?.split('-')[0] ?? (props.fallbackYear ? String(props.fallbackYear) : null))

const formattedRuntime = computed(() => {
  if (!props.movie?.runtime) return null
  const h = Math.floor(props.movie.runtime / 60)
  const m = props.movie.runtime % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
})

const hasWarning = computed(() => props.movie?.genres?.some(g => TMDB_WARNING_GENRES.includes(g.id)) ?? false)
const frCertification = computed(() => extractFrCertification(props.movie))

const FR_CERT_MEANINGS: Record<string, string> = {
  'TP': 'Tous publics',
  'U': 'Tous publics',
  '10': 'Déconseillé aux moins de 10 ans',
  '12': 'Interdit aux moins de 12 ans',
  '16': 'Interdit aux moins de 16 ans',
  '18': 'Interdit aux moins de 18 ans',
}
const frCertMeaning = computed(() => frCertification.value ? (FR_CERT_MEANINGS[frCertification.value] ?? null) : null)
const director = computed(() => props.movie?.credits?.crew.find(c => c.job === 'Director') ?? null)
const mainCast = computed(() => props.movie?.credits?.cast.slice(0, 5) ?? [])
const mainProductionCompanies = computed(() => props.movie?.production_companies?.slice(0, 2) ?? [])
const originCountry = computed(() => props.movie?.production_countries?.[0]?.name ?? null)

const OVERVIEW_LIMIT = 280
const showFullOverview = ref(false)
const isOverviewLong = computed(() => (props.movie?.overview?.length ?? 0) > OVERVIEW_LIMIT)
const displayedOverview = computed(() => {
  if (!props.movie?.overview) return ''
  if (showFullOverview.value || !isOverviewLong.value) return props.movie.overview
  return props.movie.overview.slice(0, OVERVIEW_LIMIT).trimEnd() + '…'
})

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.mdv-hero {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.mdv-poster-wrap {
  flex-shrink: 0;
  width: 150px;
}

.mdv-poster {
  width: 100%;
  display: block;
  border-radius: var(--r-md);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
}

.mdv-poster-placeholder {
  width: 100%;
  aspect-ratio: 2/3;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
}

.mdv-hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding-top: 2px;
}

.mdv-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 3px;
  line-height: 1.15;
  letter-spacing: 0.01em;
}

.mdv-original-title {
  font-size: 14px;
  color: var(--text-faint);
  font-style: italic;
  margin: 0;
}

.mdv-facts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.mdv-fact {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.mdv-fact + .mdv-fact::before {
  content: '·';
  margin: 0 5px;
  color: var(--text-faint);
}

.mdv-genres {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.mdv-genre-tag {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 8px;
}

.mdv-cert-badge {
  position: relative;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
  border: 1.5px solid var(--border-mid, var(--border));
  border-radius: 3px;
  padding: 2px 5px;
  outline: none;
  cursor: default;
}

.mdv-cert-badge[data-meaning]::after {
  content: attr(data-meaning);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-raised, var(--surface));
  color: var(--text);
  border: 1px solid var(--border-mid, var(--border));
  border-radius: 4px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0;
  white-space: nowrap;
  padding: 3px 7px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms;
  z-index: 10;
}

.mdv-cert-badge:hover::after,
.mdv-cert-badge:focus::after {
  opacity: 1;
}

.mdv-genre-warning {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #f5a623;
  background: rgba(245, 166, 35, 0.08);
  border: 1px solid rgba(245, 166, 35, 0.4);
  border-radius: 999px;
  padding: 2px 8px;
}

.mdv-rating {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: auto;
}

.mdv-rating-score {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 600;
  color: var(--text);
  line-height: 1;
}

.mdv-rating-sub {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mdv-rating-sub span:first-child {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.mdv-rating-votes {
  font-size: 15px;
  color: var(--text-faint);
}

.mdv-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
}

.mdv-tagline {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
  line-height: 1.5;
  letter-spacing: 0.01em;
}

.mdv-overview-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mdv-overview {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-secondary);
  margin: 0;
}

.mdv-overview-toggle {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--font-ui);
  font-size: 15px;
  color: var(--accent);
  cursor: pointer;
  display: block;
  text-align: left;
}

.mdv-credits {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 16px;
  margin: 0;
  padding: 16px 0 0;
  border-top: 1px solid var(--border);
}

.mdv-credit-row {
  display: contents;
}

.mdv-credits dt {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
  white-space: nowrap;
  padding-top: 2px;
}

.mdv-credits dd {
  font-size: 15px;
  color: var(--text);
  margin: 0;
  line-height: 1.4;
}

.mdv-person-btn {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--font-ui);
  font-size: 15px;
  color: var(--text);
  cursor: pointer;
  transition: color 150ms;
}

@media (hover: hover) {
  .mdv-person-btn:hover { color: var(--accent); }
}

.mdv-cast-list {
  display: inline;
}

.mdv-cast-sep {
  color: var(--text);
  font-size: 15px;
}

.mdv-journal-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  color: var(--text-secondary);
  border-top: 1px solid var(--border);
  padding-top: 14px;
}

.mdv-journal-meta strong {
  color: var(--text);
  font-weight: 500;
}

.mdv-providers {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mdv-providers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mdv-providers-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
}

.mdv-providers-jwlink {
  font-size: 14px;
  color: var(--text-faint);
  text-decoration: none;
}

@media (hover: hover) {
  .mdv-providers-jwlink:hover { color: var(--text-secondary); }
}

.mdv-providers-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mdv-providers-type {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.mdv-providers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mdv-provider-item {
  position: relative;
  display: inline-block;
  outline: none;
}

.mdv-provider-item::after {
  content: attr(data-name);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-raised, var(--surface));
  color: var(--text);
  border: 1px solid var(--border-mid);
  border-radius: 4px;
  font-family: var(--font-ui);
  font-size: 14px;
  white-space: nowrap;
  padding: 3px 6px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms;
  z-index: 10;
}

.mdv-provider-item:hover::after,
.mdv-provider-item:focus::after {
  opacity: 1;
}

.mdv-provider-logo {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
}

.mdv-providers-disclaimer {
  font-size: 15px;
  color: var(--text-faint);
  font-style: italic;
  margin: 0;
}

/* Trailer */
.mdv-trailer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 8px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  padding: 7px 0;
  cursor: pointer;
  transition: color 150ms, border-color 150ms, background 150ms;
}

@media (hover: hover) {
  .mdv-trailer-btn:hover {
    color: var(--text);
    border-color: var(--border-strong);
    background: var(--surface-raised);
  }
}

.mdv-trailer-embed {
  margin-top: 12px;
  margin-bottom: 20px;
  border-radius: var(--r-md);
  overflow: hidden;
  aspect-ratio: 16 / 9;
  position: relative;
  background: #000;
}

.mdv-trailer-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}
</style>
