import type { TmdbSearchResponse } from '~/types'

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/'

export function useTmdb() {
  async function searchMovies(query: string): Promise<TmdbSearchResponse> {
    return await $fetch<TmdbSearchResponse>('/api/tmdb/search', {
      query: { query }
    })
  }

  function getPosterUrl(posterPath: string | null, size: 'w185' | 'w342' | 'w500' = 'w342'): string | null {
    if (!posterPath) return null
    return `${POSTER_BASE_URL}${size}${posterPath}`
  }

  return { searchMovies, getPosterUrl }
}
