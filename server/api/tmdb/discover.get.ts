import { getMockDiscoverResults } from '../../mock/tmdb'

export default defineEventHandler(async (event) => {
  const { year, sort_by = 'popularity.desc', with_genres, page = '1', vote_count_gte } = getQuery(event)

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

  if (with_genres) params.set('with_genres', String(with_genres))
  if (vote_count_gte) params.set('vote_count.gte', String(vote_count_gte))

  const data = await $fetch(`https://api.themoviedb.org/3/discover/movie?${params}`, {
    headers: {
      Authorization: `Bearer ${tmdbToken}`,
      accept: 'application/json'
    }
  })

  return data
})
