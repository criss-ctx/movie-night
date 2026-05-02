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

export interface TmdbSearchResponse {
  page: number
  results: TmdbMovie[]
  total_pages: number
  total_results: number
}

export interface ConfirmState {
  visible: boolean
  message: string
  label: string
  resolve: ((value: boolean) => void) | null
}
