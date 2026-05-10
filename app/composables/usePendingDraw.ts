import type { PendingDraw } from '~/types'

export function usePendingDraw() {
  const supabase = useSupabaseClient()
  const pendingDraw = useState<PendingDraw | null>('pendingDraw', () => null)

  // First element if owner (RLS filters it out for others)
  const pendingMovie = computed(() => pendingDraw.value?.pending_movie[0] ?? null)

  async function load() {
    const { data } = await supabase
      .from('pending_draw')
      .select('*, profiles(name), pending_movie(tmdb_id, title)')
      .limit(1)
      .maybeSingle()
    pendingDraw.value = (data as PendingDraw) ?? null
  }

  async function save(profileId: number, year: number) {
    await supabase.from('pending_draw').delete().gte('id', 1)
    const { error } = await supabase.from('pending_draw').insert({
      profile_id: profileId,
      year,
      drawn_at: new Date().toISOString().split('T')[0]
    })
    if (!error) await load()
    return { error }
  }

  async function setFilm(tmdbId: number, title: string) {
    if (!pendingDraw.value) return
    await supabase
      .from('pending_movie')
      .delete()
      .eq('pending_draw_id', pendingDraw.value.id)

    const { error } = await supabase
      .from('pending_movie')
      .insert({
        pending_draw_id: pendingDraw.value.id,
        profile_id: pendingDraw.value.profile_id,
        tmdb_id: tmdbId,
        title
      })

    if (!error) {
      await supabase.from('pending_draw').update({ movie_chosen: true }).eq('id', pendingDraw.value.id)
      await load()
    }
    return { error }
  }

  async function clearFilm() {
    if (!pendingDraw.value) return
    const { error } = await supabase
      .from('pending_movie')
      .delete()
      .eq('pending_draw_id', pendingDraw.value.id)

    if (!error) {
      await supabase.from('pending_draw').update({ movie_chosen: false }).eq('id', pendingDraw.value.id)
      await load()
    }
    return { error }
  }

  async function remove() {
    if (!pendingDraw.value) return
    await supabase.from('pending_draw').delete().eq('id', pendingDraw.value.id)
    pendingDraw.value = null
  }

  return { pendingDraw, pendingMovie, load, save, setFilm, clearFilm, remove }
}
