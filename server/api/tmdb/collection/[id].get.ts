export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing collection id' })
  }

  const { tmdbToken } = useRuntimeConfig(event)

  if (!tmdbToken) return null

  const data = await $fetch(`https://api.themoviedb.org/3/collection/${id}?language=fr-FR`, {
    headers: {
      Authorization: `Bearer ${tmdbToken}`,
      accept: 'application/json'
    }
  })

  return data
})
