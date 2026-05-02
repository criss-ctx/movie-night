export interface Profile {
  id: number
  name: string
}

export interface JournalEntry {
  id: number
  title: string
  release_year: number
  profile_id: number | null
  watch_date: string
  tmdb_id: number | null
  profiles: { name: string } | null
}

export interface PendingDraw {
  id: number
  profile_id: number | null
  year: number
  drawn_at: string
  profiles: { name: string } | null
}

export interface ConfirmState {
  visible: boolean
  message: string
  label: string
  resolve: ((value: boolean) => void) | null
}
