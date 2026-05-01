import type { Profile } from '~/types'

export function useProfiles() {
  const supabase = useSupabaseClient()
  const profiles = useState<Profile[]>('profiles', () => [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('id')
    if (data) profiles.value = data as Profile[]
  }

  return { profiles, load }
}
