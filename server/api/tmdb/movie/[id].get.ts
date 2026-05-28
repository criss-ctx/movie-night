import { getMockMovieDetail } from '../../../mock/tmdb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing movie id' })
  }

  const { tmdbToken } = useRuntimeConfig(event)

  if (!tmdbToken) {
    return getMockMovieDetail(Number(id))
  }

  const data = await $fetch(`https://api.themoviedb.org/3/movie/${id}?language=fr-FR&append_to_response=credits,release_dates`, {
    headers: {
      Authorization: `Bearer ${tmdbToken}`,
      accept: 'application/json'
    }
  })

  return data
})
