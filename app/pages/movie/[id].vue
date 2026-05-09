<template>
  <div class="page-movie">
    <div class="movie-wrapper">

      <button class="movie-back" @click="router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>

      <div v-if="pending" class="movie-loading">Chargement…</div>

      <div v-else-if="movie" class="movie-content">
        <div class="movie-poster-col">
          <img
            v-if="posterUrl"
            :src="posterUrl"
            :alt="`Affiche de ${movie.title}`"
            class="movie-poster"
          />
          <div v-else class="movie-poster-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="2"/>
              <path d="M7 8h10M7 12h10M7 16h6"/>
            </svg>
          </div>
        </div>

        <div class="movie-info-col">
          <h1 class="movie-title">{{ movie.title }}</h1>
          <p v-if="movie.original_title !== movie.title" class="movie-original-title">{{ movie.original_title }}</p>
          <p v-if="movie.tagline" class="movie-tagline">« {{ movie.tagline }} »</p>

          <div class="movie-meta">
            <span v-if="releaseYear" class="movie-meta-item">{{ releaseYear }}</span>
            <span v-if="movie.runtime" class="movie-meta-item">{{ formattedRuntime }}</span>
          </div>

          <div v-if="movie.genres.length || hasWarning" class="movie-genres">
            <span v-if="hasWarning" class="movie-genre-warning">⚠ Genre déconseillé</span>
            <span v-for="genre in movie.genres" :key="genre.id" class="movie-genre-tag">{{ genre.name }}</span>
          </div>

          <div v-if="movie.vote_count > 0" class="movie-rating">
            <span class="movie-rating-score">{{ movie.vote_average.toFixed(1) }}</span>
            <span class="movie-rating-label">/ 10 · {{ movie.vote_count.toLocaleString('fr-FR') }} votes</span>
          </div>

          <p v-if="movie.overview" class="movie-overview">{{ movie.overview }}</p>
        </div>
      </div>

      <button
        v-if="pendingDraw && movie"
        class="choose-btn"
        :class="{ 'choose-btn--chosen': isChosen }"
        @click="handleChoose"
      >
        {{ isChosen ? 'Retirer ce film' : 'Choisir ce film' }}
      </button>

      <p v-if="!pending && !movie" class="movie-error">Impossible de charger ce film.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TmdbMovieDetail } from '~/types'
import { TMDB_WARNING_GENRES } from '~/constants/tmdb'

const router = useRouter()
const route = useRoute()
const { getMovieDetail, getPosterUrl } = useTmdb()
const { pendingDraw, load: loadPendingDraw, setFilm, clearFilm } = usePendingDraw()
const { requireAuth } = useAuth()

const { data: movie, pending } = await useAsyncData<TmdbMovieDetail>(
  `movie-${route.params.id}`,
  () => getMovieDetail(Number(route.params.id))
)

const posterUrl = computed(() => movie.value ? getPosterUrl(movie.value.poster_path, 'w342') : null)

const releaseYear = computed(() => {
  if (!movie.value?.release_date) return null
  return movie.value.release_date.split('-')[0]
})

const formattedRuntime = computed(() => {
  if (!movie.value?.runtime) return null
  const h = Math.floor(movie.value.runtime / 60)
  const m = movie.value.runtime % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
})

const isChosen = computed(() => pendingDraw.value?.tmdb_id === movie.value?.id)
const hasWarning = computed(() => movie.value?.genres.some(g => TMDB_WARNING_GENRES.includes(g.id)) ?? false)

async function handleChoose() {
  if (!movie.value) return
  await requireAuth(async () => {
    if (isChosen.value) {
      await clearFilm()
    } else {
      await setFilm(movie.value!.id, movie.value!.title)
    }
  })
}

await loadPendingDraw()
</script>

<style scoped>
.page-movie {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.movie-wrapper {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.movie-loading,
.movie-error {
  color: var(--text-faint);
  font-size: 14px;
  text-align: center;
  padding: 48px 0;
}

.movie-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.movie-poster-col {
  flex-shrink: 0;
  width: 120px;
}

.movie-poster {
  width: 100%;
  border-radius: var(--r-md);
  display: block;
}

.movie-poster-placeholder {
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

.movie-info-col {
  flex: 1;
  min-width: 0;
}

.movie-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 4px;
  line-height: 1.2;
  letter-spacing: 0.02em;
}

.movie-original-title {
  font-size: 13px;
  color: var(--text-faint);
  margin: 0 0 10px;
  font-style: italic;
}

.movie-tagline {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 14px;
  font-style: italic;
  line-height: 1.5;
}

.movie-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.movie-meta-item {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.movie-meta-item + .movie-meta-item::before {
  content: '·';
  margin-right: 10px;
  color: var(--text-faint);
}

.movie-genres {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.movie-genre-tag {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 10px;
}

.movie-genre-warning {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f5a623;
  background: rgba(245, 166, 35, 0.08);
  border: 1px solid rgba(245, 166, 35, 0.4);
  border-radius: 999px;
  padding: 3px 10px;
}

.movie-rating {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 16px;
}

.movie-rating-score {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  color: var(--text);
}

.movie-rating-label {
  font-size: 12px;
  color: var(--text-faint);
}

.movie-overview {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-secondary);
  margin: 0;
}

.choose-btn {
  display: block;
  width: 100%;
  margin-top: 24px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  color: var(--bg);
  background: var(--accent);
  border: none;
  border-radius: var(--r-sm);
  padding: 12px;
  cursor: pointer;
  transition: opacity 150ms;
}

.choose-btn--chosen {
  background: var(--surface);
  color: var(--accent);
  border: 1px solid var(--accent);
  cursor: default;
}

@media (hover: hover) {
  .choose-btn:not(.choose-btn--chosen):hover { opacity: 0.88; }
}
</style>
