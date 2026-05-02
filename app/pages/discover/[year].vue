<template>
  <div class="page-discover">
    <div class="discover-wrapper">

      <button class="movie-back" @click="router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>

      <h2 class="slide-heading">Films de {{ year }}</h2>

      <div class="discover-filters" role="group" aria-label="Filtres">
        <button
          v-for="filter in filters"
          :key="filter.key"
          class="discover-filter-btn"
          :class="{ 'discover-filter-btn--active': activeFilter.key === filter.key }"
          @click="setFilter(filter)"
        >{{ filter.label }}</button>
      </div>

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

const router = useRouter()
const route = useRoute()
const { discoverMovies, getPosterUrl } = useTmdb()

const year = Number(route.params.year)

const filters = [
  { key: 'popular',   label: 'Populaires',   sort_by: 'popularity.desc',    vote_count_gte: undefined, with_genres: undefined },
  { key: 'top_rated', label: 'Mieux notés',   sort_by: 'vote_average.desc',  vote_count_gte: 100,       with_genres: undefined },
  { key: 'revenue',   label: 'Box-office',    sort_by: 'revenue.desc',       vote_count_gte: undefined, with_genres: undefined },
  { key: 'drama',     label: 'Drama',         sort_by: 'popularity.desc',    vote_count_gte: undefined, with_genres: '18' },
  { key: 'comedy',    label: 'Comédie',       sort_by: 'popularity.desc',    vote_count_gte: undefined, with_genres: '35' },
]

const activeFilter = ref(filters[0])
const page = ref(1)
const totalPages = ref(1)
const movies = ref<TmdbMovie[]>([])
const loadingMore = ref(false)
const sentinel = ref<HTMLElement | null>(null)

const { data, pending, refresh } = await useAsyncData<TmdbDiscoverResponse>(
  `discover-${year}`,
  () => discoverMovies({
    year,
    sort_by: activeFilter.value.sort_by,
    with_genres: activeFilter.value.with_genres,
    vote_count_gte: activeFilter.value.vote_count_gte,
    page: 1,
  })
)

watch(data, (val) => {
  if (!val) return
  movies.value = val.results
  totalPages.value = val.total_pages
  page.value = 1
}, { immediate: true })

async function setFilter(filter: typeof filters[0]) {
  activeFilter.value = filter
  movies.value = []
  await refresh()
}

async function loadMore() {
  if (loadingMore.value || page.value >= totalPages.value) return
  loadingMore.value = true
  page.value++
  const more = await discoverMovies({
    year,
    sort_by: activeFilter.value.sort_by,
    with_genres: activeFilter.value.with_genres,
    vote_count_gte: activeFilter.value.vote_count_gte,
    page: page.value,
  })
  movies.value = [...movies.value, ...more.results]
  loadingMore.value = false
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
})
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

.discover-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 20px;
  scrollbar-width: none;
}

.discover-filters::-webkit-scrollbar {
  display: none;
}

.discover-filter-btn {
  flex-shrink: 0;
  font-family: var(--font-ui);
  font-size: 0.85rem;
  padding: 6px 14px;
  min-height: 34px;
  border: 1px solid var(--border-mid);
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 150ms, color 150ms, background 150ms;
}

.discover-filter-btn--active {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(201, 165, 90, 0.08);
}

@media (hover: hover) {
  .discover-filter-btn:not(.discover-filter-btn--active):hover {
    border-color: var(--border-strong);
    color: var(--text);
  }
}

.discover-grid {
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
  aspect-ratio: 2/3;
  border-radius: var(--r-sm);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
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
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.movie-card-year {
  font-size: 11px;
  color: var(--text-faint);
}

.discover-loading-more {
  text-align: center;
  font-size: 13px;
  color: var(--text-faint);
  padding: 20px 0 8px;
}

.discover-sentinel {
  height: 1px;
}
</style>
