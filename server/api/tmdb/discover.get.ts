import { getMockDiscoverResults } from '../../mock/tmdb'
import { TMDB_EXCLUDED_GENRES } from '../../constants/tmdb'

export default defineEventHandler(async (event) => {
  const { year, mode, sort_by = 'popularity.desc', with_genres, page = '1', vote_count_gte, vote_average_gte, with_original_language } = getQuery(event)

  if (!year && mode !== 'cinema') {
    throw createError({ statusCode: 400, statusMessage: 'Missing year parameter' })
  }

  const { tmdbToken } = useRuntimeConfig(event)

  if (!tmdbToken) {
    return getMockDiscoverResults()
  }

  if (mode === 'cinema') {
    // /discover/movie's release-date/release-type filters ignore `region` entirely for
    // this combination (verified empirically — same result count with a bogus region),
    // so it can't be scoped to France that way. The dedicated now_playing endpoint does
    // scope correctly; it just doesn't support genre/sort/vote filters, so those are
    // dropped for this mode and excluded genres are filtered out after the fact instead
    const excludedGenreIds = TMDB_EXCLUDED_GENRES.split(',').map(Number)
    const minYear = new Date().getFullYear() - 1
    const params = new URLSearchParams({ language: 'fr-FR', region: 'FR', page: String(page) })
    const data = await $fetch<{ results: { genre_ids: number[], release_date: string }[] }>(`https://api.themoviedb.org/3/movie/now_playing?${params}`, {
      headers: { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' }
    })
    return {
      ...data,
      results: data.results.filter(m =>
        !m.genre_ids.some(id => excludedGenreIds.includes(id)) &&
        Number(m.release_date?.split('-')[0]) >= minYear
      )
    }
  }

  const params = new URLSearchParams({
    sort_by: String(sort_by),
    include_adult: 'false',
    include_video: 'false',
    language: 'fr-FR',
    page: String(page),
    primary_release_year: String(year)
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
