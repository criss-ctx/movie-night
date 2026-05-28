export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing person id' })
  }

  const { tmdbToken } = useRuntimeConfig(event)

  if (!tmdbToken) {
    return null
  }

  const data = await $fetch(
    `https://api.themoviedb.org/3/person/${id}?language=fr-FR&append_to_response=movie_credits,images`,
    {
      headers: {
        Authorization: `Bearer ${tmdbToken}`,
        accept: 'application/json'
      }
    }
  )

  return data
})
