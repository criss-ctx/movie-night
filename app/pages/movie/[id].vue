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

      <template v-else-if="movie">
        <MovieDetailView :movie="movie" :providers="providers">
          <button
            v-if="pendingDraw && (Number(releaseYear) === pendingDraw.year || isChosen)"
            class="choose-btn"
            :class="{ 'choose-btn--chosen': isChosen }"
            @click="handleChoose"
          >
            {{ isChosen ? 'Retirer ce film' : 'Choisir ce film' }}
          </button>
        </MovieDetailView>
      </template>

      <p v-if="!pending && !movie" class="movie-error">Impossible de charger ce film.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TmdbMovieDetail, TmdbWatchProvidersResponse } from '~/types'

const router = useRouter()
const route = useRoute()
const { getMovieDetail, getWatchProviders } = useTmdb()
const { pendingDraw, pendingMovie, load: loadPendingDraw, setFilm, clearFilm } = usePendingDraw()
const { requireAuth } = useAuth()

const { data: movie, pending } = await useAsyncData<TmdbMovieDetail>(
  `movie-${route.params.id}`,
  () => getMovieDetail(Number(route.params.id))
)

const { data: watchProvidersData } = await useAsyncData<TmdbWatchProvidersResponse>(
  `providers-${route.params.id}`,
  () => getWatchProviders(Number(route.params.id))
)

const providers = computed(() => watchProvidersData.value?.results?.['FR'] ?? null)
const releaseYear = computed(() => movie.value?.release_date?.split('-')[0] ?? null)
const isChosen = computed(() => pendingMovie.value?.tmdb_id === movie.value?.id)

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
  padding: 20px 20px 32px;
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

.movie-back {
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
  .movie-back:hover { color: var(--text); }
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
  padding: 13px;
  cursor: pointer;
  transition: opacity 150ms;
  letter-spacing: 0.03em;
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
