import type { JournalEntry } from '~/types'

export function useJournal() {
  const supabase = useSupabaseClient()
  const entries = useState<JournalEntry[]>('journalEntries', () => [])

  async function load() {
    const { data } = await supabase
      .from('journal')
      .select('*, profiles(name)')
      .order('watch_date', { ascending: false })
    if (data) entries.value = data as JournalEntry[]
  }

  const pickedYears = computed(() => entries.value.map(e => e.release_year))
  const lastChooser = computed(() => entries.value[0]?.profiles?.name ?? null)

  async function add(entry: Pick<JournalEntry, 'title' | 'release_year' | 'profile_id' | 'watch_date'>) {
    const { error } = await supabase.from('journal').insert(entry)
    if (!error) await load()
    return { error }
  }

  async function update(id: number, changes: Partial<Pick<JournalEntry, 'title' | 'release_year' | 'profile_id' | 'watch_date'>>) {
    const { error } = await supabase.from('journal').update(changes).eq('id', id)
    if (!error) await load()
    return { error }
  }

  async function remove(id: number) {
    const { error } = await supabase.from('journal').delete().eq('id', id)
    if (!error) await load()
    return { error }
  }

  return { entries, load, pickedYears, lastChooser, add, update, remove }
}
