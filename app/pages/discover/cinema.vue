<template>
  <div ref="scrollContainer" class="page-discover">
    <div class="discover-wrapper">

      <button class="movie-back" @click="router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>

      <h2 class="slide-heading">Films en salle</h2>

      <div v-if="pending && movies.length === 0" class="movie-loading">Chargement…</div>

      <div v-else-if="movies.length" class="discover-grid">
        <NuxtLink
          v-for="movie in movies"
          :key="movie.id"
          :to="`/movie/${movie.id}`"
          class="movie-card"
        >
          <div class="movie-card-poster-wrap">
            <img
              v-if="getPosterUrl(movie.poster_path, 'w185')"
              :src="getPosterUrl(movie.poster_path, 'w185')!"
              :alt="`Affiche de ${movie.title}`"
              class="movie-card-poster"
              loading="lazy"
            />
            <div v-else class="movie-card-poster-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="2"/>
                <path d="M7 8h10M7 12h10M7 16h6"/>
              </svg>
            </div>
            <template v-if="TMDB_WARNING_GENRES.some(id => movie.genre_ids.includes(id))">
              <button
                class="genre-warning"
                @click.prevent.stop="toggleWarning(movie.id)"
                aria-label="Genre déconseillé"
              >⚠</button>
              <div
                class="genre-warning-overlay"
                :class="{ 'genre-warning-overlay--active': activeWarningId === movie.id }"
              >Genre déconseillé</div>
            </template>
            <span
              v-if="watchedTmdbIds.has(movie.id)"
              class="card-seen-badge"
              title="Déjà vu"
              aria-label="Déjà vu"
            >vu</span>
            <button
              v-if="canChooseHere(movie)"
              class="card-choose-btn"
              :class="{ 'card-choose-btn--chosen': pendingMovie?.tmdb_id === movie.id }"
              :title="pendingMovie?.tmdb_id === movie.id ? 'Film sélectionné' : 'Choisir ce film'"
              @click.prevent.stop="toggleFilm(movie)"
            >{{ pendingMovie?.tmdb_id === movie.id ? '✓' : '+' }}</button>
          </div>
          <div class="movie-card-info">
            <span class="movie-card-title">{{ movie.title }}</span>
            <span class="movie-card-year">{{ movie.release_date?.split('-')[0] }}</span>
          </div>
        </NuxtLink>
      </div>

      <p v-else-if="!pending" class="movie-loading">Aucun film trouvé pour ce filtre.</p>

      <div v-if="loadingMore" class="discover-loading-more">Chargement…</div>

      <div ref="sentinel" class="discover-sentinel" aria-hidden="true" />

    </div>
  </div>
</template>

<script setup lang="ts">
import type { TmdbMovie, TmdbDiscoverResponse } from '~/types'
import { TMDB_WARNING_GENRES } from '~/constants/tmdb'

interface DiscoverCache {
  movies: TmdbMovie[]
  page: number
  totalPages: number
  scrollTop: number
}

const { pendingMovie, load: loadPendingDraw, setFilm, clearFilm, canChooseFilm } = usePendingDraw()
const { entries: journalEntries, load: loadJournal } = useJournal()
const { requireAuth } = useAuth()

await Promise.all([loadPendingDraw(), loadJournal()])

const watchedTmdbIds = computed(() => new Set(journalEntries.value.map(e => e.tmdb_id).filter(Boolean)))

const router = useRouter()
const { discoverMovies, getPosterUrl } = useTmdb()

const cache = useState<DiscoverCache | null>('discoverCache-cinema', () => null)

const page = ref(cache.value?.page ?? 1)
const totalPages = ref(cache.value?.totalPages ?? 1)
const movies = ref<TmdbMovie[]>(cache.value?.movies ?? [])
const loadingMore = ref(false)
const sentinel = ref<HTMLElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)

const { data, pending } = await useAsyncData<TmdbDiscoverResponse>(
  'discover-cinema',
  () => discoverMovies({ mode: 'cinema', page: 1 }),
  { immediate: !cache.value }
)

function syncCache() {
  cache.value = {
    movies: movies.value,
    page: page.value,
    totalPages: totalPages.value,
    scrollTop: cache.value?.scrollTop ?? 0,
  }
}

watch(data, (val) => {
  if (!val) return
  movies.value = val.results
  totalPages.value = val.total_pages
  page.value = 1
  syncCache()
}, { immediate: true })

onMounted(() => {
  if (cache.value?.scrollTop && scrollContainer.value) {
    nextTick(() => { scrollContainer.value!.scrollTop = cache.value!.scrollTop })
  }
})

onBeforeRouteLeave(() => {
  syncCache()
  if (cache.value) cache.value.scrollTop = scrollContainer.value?.scrollTop ?? 0
})

async function loadMore() {
  if (loadingMore.value || page.value >= totalPages.value) return
  loadingMore.value = true
  page.value++
  const more = await discoverMovies({ mode: 'cinema', page: page.value })
  movies.value = [...movies.value, ...more.results]
  loadingMore.value = false
  syncCache()
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore()
  }, { threshold: 0.1 })

  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  observer?.disconnect()
  if (warningTimer) clearTimeout(warningTimer)
})

const activeWarningId = ref<number | null>(null)
let warningTimer: ReturnType<typeof setTimeout> | null = null

function toggleWarning(movieId: number) {
  if (warningTimer) clearTimeout(warningTimer)
  if (activeWarningId.value === movieId) {
    activeWarningId.value = null
  } else {
    activeWarningId.value = movieId
    warningTimer = setTimeout(() => { activeWarningId.value = null }, 2500)
  }
}

function canChooseHere(movie: TmdbMovie): boolean {
  return canChooseFilm(movie.id, Number(movie.release_date?.split('-')[0]))
}

async function toggleFilm(movie: TmdbMovie) {
  const releaseYear = Number(movie.release_date?.split('-')[0])
  if (!releaseYear) return
  await requireAuth(async () => {
    if (pendingMovie.value?.tmdb_id === movie.id) {
      await clearFilm()
    } else {
      await setFilm(movie.id, movie.title, releaseYear)
    }
  })
}
</script>

<style scoped>
.page-discover {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.discover-wrapper {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.discover-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.movie-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-decoration: none;
  color: inherit;
}

.movie-card-poster-wrap {
  position: relative;
  aspect-ratio: 2/3;
  border-radius: var(--r-sm);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
}

.genre-warning {
  position: absolute;
  top: 6px;
  left: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: rgba(0, 0, 0, 0.78);
  color: #f5a623;
  border: 2px solid rgba(245, 166, 35, 0.6);
  border-radius: 50%;
  font-size: var(--text-meta);
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.genre-warning-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  color: #f5a623;
  font-family: var(--font-ui);
  font-size: var(--text-meta);
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  padding: 7px 4px;
  z-index: 1;
}

@media (hover: hover) {
  .movie-card-poster-wrap:has(.genre-warning:hover) .genre-warning-overlay { display: flex; }
}

.genre-warning-overlay--active { display: flex; }

.card-choose-btn {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  transition: background 150ms, border-color 150ms;
}

.card-choose-btn--chosen {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

.card-seen-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 3px 7px;
  line-height: 1;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  pointer-events: none;
}

.movie-card-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 150ms;
}

@media (hover: hover) {
  .movie-card:hover .movie-card-poster {
    opacity: 0.85;
  }
}

.movie-card-poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
}

.movie-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.movie-card-title {
  font-size: var(--text-meta);
  font-weight: 500;
  color: var(--text);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.movie-card-year {
  font-size: var(--text-label);
  color: var(--text-faint);
}

.discover-loading-more {
  text-align: center;
  font-size: var(--text-label);
  color: var(--text-faint);
  padding: 20px 0 8px;
}

.discover-sentinel {
  height: 1px;
}
</style>
