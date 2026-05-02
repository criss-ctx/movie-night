import type { JournalEntry, Profile, EditModalState, EditChanges } from '~/types'

export function useEditEntry() {
  const state = useState<EditModalState>('editModal', () => ({
    visible: false,
    entry: null,
    profiles: [],
    resolve: null
  }))

  function editEntry(entry: JournalEntry, profiles: Profile[]): Promise<EditChanges | null> {
    return new Promise(resolve => {
      state.value = { visible: true, entry, profiles, resolve }
    })
  }

  return { editEntry }
}
