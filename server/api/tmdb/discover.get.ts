import { getMockDiscoverResults } from '../../mock/tmdb'
import { TMDB_EXCLUDED_GENRES } from '../../constants/tmdb'

export default defineEventHandler(async (event) => {
  const { year, sort_by = 'popularity.desc', with_genres, page = '1', vote_count_gte, vote_average_gte, with_original_language } = getQuery(event)

  if (!year) {
    throw createError({ statusCode: 400, statusMessage: 'Missing year parameter' })
  }

  const { tmdbToken } = useRuntimeConfig(event)

  if (!tmdbToken) {
    return getMockDiscoverResults()
  }

  const params = new URLSearchParams({
    primary_release_year: String(year),
    sort_by: String(sort_by),
    include_adult: 'false',
    include_video: 'false',
    language: 'fr-FR',
    page: String(page)
  })

  params.set('without_genres', TMDB_EXCLUDED_GENRES)
  if (with_genres) params.set('with_genres', String(with_genres))
  if (vote_count_gte) params.set('vote_count.gte', String(vote_count_gte))
  if (vote_average_gte) params.set('vote_average.gte', String(vote_average_gte))
  if (with_original_language) params.set('with_original_language', String(with_original_language))

  const data = await $fetch(`https://api.themoviedb.org/3/discover/movie?${params}`, {
    headers: {
      Authorization: `Bearer ${tmdbToken}`,
      accept: 'application/json'
    }
  })

  return data
})
