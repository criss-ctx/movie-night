import type { TmdbSearchResponse, TmdbMovieDetail, TmdbDiscoverResponse, TmdbWatchProvidersResponse, TmdbPersonDetail } from '~/types'

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/'

export function useTmdb() {
  async function searchMovies(query: string, year?: number): Promise<TmdbSearchResponse> {
    return await $fetch<TmdbSearchResponse>('/api/tmdb/search', {
      query: { query, ...(year ? { year } : {}) }
    })
  }

  async function discoverMovies(params: {
    year: number
    sort_by?: string
    with_genres?: string
    vote_count_gte?: number
    vote_average_gte?: number
    with_original_language?: string
    page?: number
  }): Promise<TmdbDiscoverResponse> {
    return await $fetch<TmdbDiscoverResponse>('/api/tmdb/discover', { query: params })
  }

  async function getMovieDetail(tmdbId: number): Promise<TmdbMovieDetail> {
    return await $fetch<TmdbMovieDetail>(`/api/tmdb/movie/${tmdbId}`)
  }

  async function getWatchProviders(tmdbId: number): Promise<TmdbWatchProvidersResponse> {
    return await $fetch<TmdbWatchProvidersResponse>(`/api/tmdb/providers/${tmdbId}`)
  }

  async function getPersonDetail(personId: number): Promise<TmdbPersonDetail> {
    return await $fetch<TmdbPersonDetail>(`/api/tmdb/person/${personId}`)
  }

  function getPosterUrl(posterPath: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'): string | null {
    if (!posterPath) return null
    return `${POSTER_BASE_URL}${size}${posterPath}`
  }

  return { searchMovies, getMovieDetail, discoverMovies, getPosterUrl, getWatchProviders, getPersonDetail }
}
