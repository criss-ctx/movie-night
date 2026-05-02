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

      <div v-if="pending" class="movie-loading">Chargement…</div>

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

      <p v-else class="movie-loading">Aucun film trouvé pour ce filtre.</p>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { TmdbDiscoverResponse } from '~/types'

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

const { data, pending, refresh } = await useAsyncData<TmdbDiscoverResponse>(
  `discover-${year}`,
  () => discoverMovies({
    year,
    sort_by: activeFilter.value.sort_by,
    with_genres: activeFilter.value.with_genres,
    vote_count_gte: activeFilter.value.vote_count_gte,
  })
)

const movies = computed(() => data.value?.results ?? [])

async function setFilter(filter: typeof filters[0]) {
  activeFilter.value = filter
  await refresh()
}
</script>
