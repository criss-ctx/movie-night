export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing movie id' })
  }

  const { tmdbToken } = useRuntimeConfig(event)

  if (!tmdbToken) {
    return { id: Number(id), results: {} }
  }

  const data = await $fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers`, {
    headers: {
      Authorization: `Bearer ${tmdbToken}`,
      accept: 'application/json'
    }
  })

  return data
})
