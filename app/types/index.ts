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

export interface TmdbReleaseDate {
  certification: string
  iso_639_1: string
  note: string
  release_date: string
  type: number
}

export interface TmdbReleaseDatesEntry {
  iso_3166_1: string
  release_dates: TmdbReleaseDate[]
}

export interface TmdbCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface TmdbCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
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
  production_countries: { iso_3166_1: string; name: string }[]
  production_companies: { id: number; name: string; origin_country: string }[]
  credits: {
    cast: TmdbCastMember[]
    crew: TmdbCrewMember[]
  }
  release_dates?: {
    results: TmdbReleaseDatesEntry[]
  }
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

export interface TmdbPersonMovieCredit {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  vote_count: number
  popularity: number
  character?: string
  job?: string
}

export interface TmdbPersonImage {
  file_path: string
  width: number
  height: number
  vote_average: number
  vote_count: number
}

export interface TmdbPersonDetail {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  profile_path: string | null
  known_for_department: string
  popularity: number
  movie_credits: {
    cast: TmdbPersonMovieCredit[]
    crew: TmdbPersonMovieCredit[]
  }
  images?: {
    profiles: TmdbPersonImage[]
  }
}

export interface Vote {
  id: number
  journal_id: number
  profile_id: number
  rating_film: number | null
  rating_pick: number | null
  already_seen: boolean | null
  happy_to_rewatch: boolean | null
  prior_knowledge: boolean | null
  wanted_to_see: boolean | null
  surprised_by_pick: boolean | null
  created_at: string
  profiles?: { name: string; avatar?: string | null }
}

export type VoteInput = Pick<Vote,
  'rating_film' | 'rating_pick' |
  'already_seen' | 'happy_to_rewatch' |
  'prior_knowledge' | 'wanted_to_see' |
  'surprised_by_pick'
>

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
