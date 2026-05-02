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

          <div v-if="movie.genres.length" class="movie-genres">
            <span v-for="genre in movie.genres" :key="genre.id" class="movie-genre-tag">{{ genre.name }}</span>
          </div>

          <div v-if="movie.vote_count > 0" class="movie-rating">
            <span class="movie-rating-score">{{ movie.vote_average.toFixed(1) }}</span>
            <span class="movie-rating-label">/ 10 · {{ movie.vote_count.toLocaleString('fr-FR') }} votes</span>
          </div>

          <p v-if="movie.overview" class="movie-overview">{{ movie.overview }}</p>
        </div>
      </div>

      <p v-else class="movie-error">Impossible de charger ce film.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TmdbMovieDetail } from '~/types'

const router = useRouter()
const route = useRoute()
const { getMovieDetail, getPosterUrl } = useTmdb()

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
</script>
