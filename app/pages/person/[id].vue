<template>
  <div class="page-person">
    <div class="pdv-wrapper">

      <button class="pdv-back" @click="router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>

      <div v-if="pending" class="pdv-loading">Chargement…</div>

      <template v-else-if="person">
        <div class="pdv-hero">
          <div class="pdv-photo-col">
            <button
              class="pdv-photo-wrap"
              :class="{ 'pdv-photo-wrap--clickable': allPhotos.length > 1 }"
              @click="allPhotos.length > 1 && openLightbox(0)"
              :aria-label="allPhotos.length > 1 ? `Voir les ${allPhotos.length} photos` : undefined"
            >
              <img v-if="mainPhotoUrl" :src="mainPhotoUrl" :alt="person.name" class="pdv-photo" />
              <div v-else class="pdv-photo-placeholder">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <div v-if="allPhotos.length > 1" class="pdv-photo-count">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                {{ allPhotos.length }}
              </div>
            </button>
          </div>

          <div class="pdv-identity">
            <h1 class="pdv-name">{{ person.name }}</h1>
            <p v-if="deptLabel" class="pdv-dept">{{ deptLabel }}</p>
            <dl class="pdv-facts">
              <div v-if="birthInfo" class="pdv-fact-row">
                <dt>Naissance</dt>
                <dd>{{ birthInfo }}</dd>
              </div>
              <div v-if="person.deathday" class="pdv-fact-row">
                <dt>Décès</dt>
                <dd>{{ formatDate(person.deathday) }}</dd>
              </div>
              <div v-if="person.place_of_birth" class="pdv-fact-row">
                <dt>Lieu</dt>
                <dd>{{ person.place_of_birth }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div v-if="person.biography" class="pdv-bio-wrap">
          <p class="pdv-bio">{{ displayedBio }}</p>
          <button v-if="isBioLong" class="pdv-bio-toggle" @click="showFullBio = !showFullBio">
            {{ showFullBio ? 'Voir moins' : 'Voir plus' }}
          </button>
        </div>

        <section v-if="castGroups.length" class="pdv-section">
          <h2 class="pdv-section-title">Filmographie</h2>
          <div v-for="group in castGroups" :key="group.year" class="pdv-year-group">
            <div class="pdv-year-sep">
              <span class="pdv-year-label">{{ group.year }}</span>
            </div>
            <ul class="pdv-film-list">
              <li v-for="film in group.films" :key="film.id" class="pdv-film-item">
                <NuxtLink :to="`/movie/${film.id}`" class="pdv-film-link">{{ film.title }}</NuxtLink>
                <span v-if="film.character" class="pdv-film-role">{{ film.character }}</span>
              </li>
            </ul>
          </div>
        </section>

        <section v-if="directorGroups.length" class="pdv-section">
          <h2 class="pdv-section-title">Réalisation</h2>
          <div v-for="group in directorGroups" :key="group.year" class="pdv-year-group">
            <div class="pdv-year-sep">
              <span class="pdv-year-label">{{ group.year }}</span>
            </div>
            <ul class="pdv-film-list">
              <li v-for="film in group.films" :key="film.id" class="pdv-film-item">
                <NuxtLink :to="`/movie/${film.id}`" class="pdv-film-link">{{ film.title }}</NuxtLink>
              </li>
            </ul>
          </div>
        </section>
      </template>

      <p v-else class="pdv-loading">Impossible de charger cette fiche.</p>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightboxOpen" class="lb-overlay" @click.self="closeLightbox" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
        <button class="lb-close" @click="closeLightbox" aria-label="Fermer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <button v-if="allPhotos.length > 1" class="lb-nav lb-nav--prev" @click="navigate(-1)" aria-label="Photo précédente">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <img
          v-if="currentLightboxUrl"
          :src="currentLightboxUrl"
          :alt="person?.name"
          class="lb-image"
        />

        <button v-if="allPhotos.length > 1" class="lb-nav lb-nav--next" @click="navigate(1)" aria-label="Photo suivante">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <span class="lb-counter">{{ lightboxIndex + 1 }} / {{ allPhotos.length }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { TmdbPersonDetail, TmdbPersonMovieCredit } from '~/types'

const router = useRouter()
const route = useRoute()
const { getPersonDetail, getPosterUrl } = useTmdb()

const { data: person, pending } = await useAsyncData<TmdbPersonDetail>(
  `person-${route.params.id}`,
  () => getPersonDetail(Number(route.params.id))
)

// Photos
const allPhotos = computed(() =>
  [...(person.value?.images?.profiles ?? [])]
    .sort((a, b) => b.vote_average - a.vote_average)
)
const mainPhotoUrl = computed(() => getPosterUrl(allPhotos.value[0]?.file_path ?? person.value?.profile_path ?? null, 'w342'))

// Lightbox
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const currentLightboxUrl = computed(() => {
  const photo = allPhotos.value[lightboxIndex.value]
  return photo ? getPosterUrl(photo.file_path, 'original') : null
})

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

function navigate(dir: 1 | -1) {
  const len = allPhotos.value.length
  lightboxIndex.value = (lightboxIndex.value + dir + len) % len
}


const touchStartX = ref(0)
function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
}
function onTouchEnd(e: TouchEvent) {
  const delta = e.changedTouches[0].clientX - touchStartX.value
  if (Math.abs(delta) > 50) navigate(delta < 0 ? 1 : -1)
}

function onKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') navigate(1)
  if (e.key === 'ArrowLeft') navigate(-1)
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''

})

// Identity
const DEPT_LABELS: Record<string, string> = {
  Acting: 'Acteur · Actrice',
  Directing: 'Réalisateur · Réalisatrice',
  Writing: 'Scénariste',
  Production: 'Production',
  Sound: 'Son',
  'Visual Effects': 'Effets visuels',
  Camera: 'Directeur de la photographie',
  Editing: 'Montage',
}
const deptLabel = computed(() => person.value
  ? (DEPT_LABELS[person.value.known_for_department] ?? person.value.known_for_department)
  : null
)

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const birthInfo = computed(() => {
  const b = person.value?.birthday
  const d = person.value?.deathday
  if (!b) return null
  const birth = new Date(b)
  const ref = d ? new Date(d) : new Date()
  let age = ref.getFullYear() - birth.getFullYear()
  if (ref < new Date(ref.getFullYear(), birth.getMonth(), birth.getDate())) age--
  return d ? formatDate(b) : `${formatDate(b)} (${age} ans)`
})

// Biography toggle
const BIO_LIMIT = 400
const showFullBio = ref(false)
const isBioLong = computed(() => (person.value?.biography?.length ?? 0) > BIO_LIMIT)
const displayedBio = computed(() => {
  const bio = person.value?.biography
  if (!bio) return ''
  if (showFullBio.value || !isBioLong.value) return bio
  return bio.slice(0, BIO_LIMIT).trimEnd() + '…'
})

// Filmography grouping
function groupByYear(films: TmdbPersonMovieCredit[]) {
  const sorted = [...films]
    .filter(f => f.release_date)
    .sort((a, b) => b.release_date.localeCompare(a.release_date))

  const map = sorted.reduce<Record<string, TmdbPersonMovieCredit[]>>((acc, film) => {
    const year = film.release_date.split('-')[0]
    ;(acc[year] ??= []).push(film)
    return acc
  }, {})

  return Object.entries(map)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, films]) => ({ year, films }))
}

const castGroups = computed(() => groupByYear(person.value?.movie_credits.cast ?? []))
const directorGroups = computed(() =>
  groupByYear((person.value?.movie_credits.crew ?? []).filter(c => c.job === 'Director'))
)
</script>

<style scoped>
.page-person {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 20px 32px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.pdv-wrapper {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.pdv-loading {
  color: var(--text-faint);
  font-size: 14px;
  text-align: center;
  padding: 48px 0;
  margin: 0;
}

.pdv-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-ui);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  transition: color 150ms;
}

@media (hover: hover) {
  .pdv-back:hover { color: var(--text); }
}

/* Hero */
.pdv-hero {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.pdv-photo-col {
  flex-shrink: 0;
  width: 120px;
}

.pdv-photo-wrap {
  position: relative;
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: default;
}

.pdv-photo-wrap--clickable {
  cursor: pointer;
}

.pdv-photo {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: var(--r-md);
  display: block;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
  transition: opacity 150ms;
}

@media (hover: hover) {
  .pdv-photo-wrap--clickable:hover .pdv-photo { opacity: 0.85; }
}

.pdv-photo-placeholder {
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

.pdv-photo-count {
  position: absolute;
  bottom: 7px;
  right: 7px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.62);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

/* Identity */
.pdv-identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 2px;
}

.pdv-name {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  line-height: 1.15;
}

.pdv-dept {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0;
}

.pdv-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px 12px;
  margin: 0;
}

.pdv-fact-row { display: contents; }

.pdv-facts dt {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
  white-space: nowrap;
  padding-top: 1px;
}

.pdv-facts dd {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* Biography */
.pdv-bio-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
  margin-bottom: 24px;
}

.pdv-bio {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
  margin: 0;
  white-space: pre-line;
}

.pdv-bio-toggle {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--accent);
  cursor: pointer;
  display: block;
  text-align: left;
  transition: opacity 150ms;
}

@media (hover: hover) {
  .pdv-bio-toggle:hover { opacity: 0.75; }
}

/* Filmography */
.pdv-section {
  border-top: 1px solid var(--border);
  padding-top: 20px;
  margin-bottom: 24px;
}

.pdv-section-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 16px;
}

.pdv-year-group { margin-bottom: 12px; }

.pdv-year-sep {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.pdv-year-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.pdv-year-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
  flex-shrink: 0;
}

.pdv-film-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pdv-film-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pdv-film-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  text-decoration: none;
  transition: color 150ms;
}

@media (hover: hover) {
  .pdv-film-link:hover { color: var(--accent); }
}

.pdv-film-role {
  font-size: 12px;
  color: var(--text-faint);
  font-style: italic;
}

/* Lightbox */
.lb-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.lb-image {
  max-height: 85vh;
  max-width: min(90vw, 480px);
  object-fit: contain;
  border-radius: var(--r-sm);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
  display: block;
}

.lb-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: #fff;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms;
}

@media (hover: hover) {
  .lb-close:hover { background: rgba(255, 255, 255, 0.22); }
}

.lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: #fff;
  cursor: pointer;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms;
}

.lb-nav--prev { left: 16px; }
.lb-nav--next { right: 16px; }

@media (hover: hover) {
  .lb-nav:hover { background: rgba(255, 255, 255, 0.22); }
}

.lb-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.08em;
}
</style>
