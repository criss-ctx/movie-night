import type { PendingDraw } from '~/types'

export function usePendingDraw() {
  const supabase = useSupabaseClient()
  const pendingDraw = useState<PendingDraw | null>('pendingDraw', () => null)

  async function load() {
    const { data } = await supabase
      .from('pending_draw')
      .select('*, profiles(name)')
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

  async function remove() {
    if (!pendingDraw.value) return
    await supabase.from('pending_draw').delete().eq('id', pendingDraw.value.id)
    pendingDraw.value = null
  }

  return { pendingDraw, load, save, remove }
}
