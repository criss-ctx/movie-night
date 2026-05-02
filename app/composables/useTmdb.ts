import type { TmdbSearchResponse, TmdbMovieDetail } from '~/types'

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/'

export function useTmdb() {
  async function searchMovies(query: string): Promise<TmdbSearchResponse> {
    return await $fetch<TmdbSearchResponse>('/api/tmdb/search', {
      query: { query }
    })
  }

  async function getMovieDetail(tmdbId: number): Promise<TmdbMovieDetail> {
    return await $fetch<TmdbMovieDetail>(`/api/tmdb/movie/${tmdbId}`)
  }

  function getPosterUrl(posterPath: string | null, size: 'w185' | 'w342' | 'w500' = 'w342'): string | null {
    if (!posterPath) return null
    return `${POSTER_BASE_URL}${size}${posterPath}`
  }

  return { searchMovies, getMovieDetail, getPosterUrl }
}
