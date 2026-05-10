import type { Profile } from '~/types'

export function useProfiles() {
  const supabase = useSupabaseClient()
  const profiles = useState<Profile[]>('profiles', () => [])

  async function load() {
    const { data } = await supabase.from('profiles').select('id, name, user_id, is_admin').order('id')
    if (data) profiles.value = data as Profile[]
  }

  return { profiles, load }
}
