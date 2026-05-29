import type { Vote, VoteInput } from '~/types'

export function useVotes() {
  const supabase = useSupabaseClient()

  async function loadVotes(journalId: number): Promise<Vote[]> {
    const { data } = await supabase
      .from('votes')
      .select('*, profiles(name, avatar)')
      .eq('journal_id', journalId)
      .order('profile_id')
    return (data as Vote[]) ?? []
  }

  async function castVote(
    journalId: number,
    profileId: number,
    input: VoteInput
  ): Promise<{ error: unknown }> {
    const { error } = await supabase
      .from('votes')
      .upsert(
        { journal_id: journalId, profile_id: profileId, ...input },
        { onConflict: 'journal_id,profile_id' }
      )
    return { error }
  }

  return { loadVotes, castVote }
}
