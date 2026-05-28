export interface Profile {
  id: number
  name: string
  user_id?: string
  is_admin?: boolean
  avatar?: string | null
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

export interface PendingMovie {
  tmdb_id: number
  title: string
}

export interface PendingDraw {
  id: number
  profile_id: number | null
  year: number
  drawn_at: string
  movie_chosen: boolean
  profiles: { name: string } | null
  pending_movie: PendingMovie[]
}

export interface TmdbMovie {
  id: number
  title: string
  original_title: string
  release_date: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
}

export interface TmdbGenre {
  id: number
  name: string
}

export interface TmdbMovieDetail {
  id: number
  title: string
  original_title: string
  tagline: string
  overview: string
  release_date: string
  runtime: number | null
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  vote_count: number
  popularity: number
  genres: TmdbGenre[]
  status: string
}

export interface TmdbProvider {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority: number
}

export interface TmdbWatchProviders {
  link?: string
  flatrate?: TmdbProvider[]
  rent?: TmdbProvider[]
  buy?: TmdbProvider[]
}

export interface TmdbWatchProvidersResponse {
  id: number
  results: Record<string, TmdbWatchProviders>
}

export interface TmdbSearchResponse {
  page: number
  results: TmdbMovie[]
  total_pages: number
  total_results: number
}

export type TmdbDiscoverResponse = TmdbSearchResponse

export interface ConfirmState {
  visible: boolean
  message: string
  label: string
  resolve: ((value: boolean) => void) | null
}

export type EditChanges = Partial<Pick<JournalEntry, 'title' | 'release_year' | 'profile_id' | 'watch_date' | 'tmdb_id'>>

export interface EditModalState {
  visible: boolean
  entry: JournalEntry | null
  profiles: Profile[]
  resolve: ((changes: EditChanges | null) => void) | null
}
