import { getMockSearchResults } from '../../mock/tmdb'

export default defineEventHandler(async (event) => {
  const { query } = getQuery(event)

  if (!query || typeof query !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing query parameter' })
  }

  const { tmdbToken } = useRuntimeConfig(event)

  if (!tmdbToken) {
    return getMockSearchResults(query)
  }

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&include_adult=false`

  const data = await $fetch(url, {
    headers: {
      Authorization: `Bearer ${tmdbToken}`,
      accept: 'application/json'
    }
  })

  return data
})
