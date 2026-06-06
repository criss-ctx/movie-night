import type { TmdbSearchResponse, TmdbMovieDetail, TmdbDiscoverResponse, TmdbWatchProvidersResponse, TmdbPersonDetail, TmdbVideo } from '~/types'

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

  async function getBestTrailer(tmdbId: number): Promise<string | null> {
    const data = await $fetch<{ results: TmdbVideo[] }>(`/api/tmdb/videos/${tmdbId}`)
    const trailers = (data.results ?? []).filter(v => v.site === 'YouTube' && v.type === 'Trailer')
    const best = trailers.find(v => v.official && v.iso_639_1 === 'fr')
      ?? trailers.find(v => v.official)
      ?? trailers.find(v => v.iso_639_1 === 'fr')
      ?? trailers[0]
      ?? null
    return best?.key ?? null
  }

  function getPosterUrl(posterPath: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'): string | null {
    if (!posterPath) return null
    return `${POSTER_BASE_URL}${size}${posterPath}`
  }

  return { searchMovies, getMovieDetail, discoverMovies, getPosterUrl, getWatchProviders, getPersonDetail, getBestTrailer }
}
