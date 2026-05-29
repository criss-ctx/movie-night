export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: number
          name: string
          user_id: string | null
          is_admin: boolean
          avatar: string | null
        }
        Insert: {
          name: string
          user_id?: string | null
          is_admin?: boolean
          avatar?: string | null
        }
        Update: {
          name?: string
          user_id?: string | null
          is_admin?: boolean
          avatar?: string | null
        }
        Relationships: []
      }
      journal: {
        Row: {
          id: number
          title: string
          release_year: number
          profile_id: number | null
          watch_date: string
          tmdb_id: number | null
          created_at: string
        }
        Insert: {
          title: string
          release_year: number
          profile_id?: number | null
          watch_date: string
          tmdb_id?: number | null
        }
        Update: {
          title?: string
          release_year?: number
          profile_id?: number | null
          watch_date?: string
          tmdb_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'journal_profile_id_fkey'
            columns: ['profile_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      pending_draw: {
        Row: {
          id: number
          profile_id: number | null
          year: number
          drawn_at: string
          movie_chosen: boolean
          created_at: string
        }
        Insert: {
          profile_id?: number | null
          year: number
          drawn_at: string
          movie_chosen?: boolean
        }
        Update: {
          profile_id?: number | null
          year?: number
          drawn_at?: string
          movie_chosen?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'pending_draw_profile_id_fkey'
            columns: ['profile_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      pending_movie: {
        Row: {
          id: number
          pending_draw_id: number | null
          profile_id: number | null
          tmdb_id: number
          title: string
          created_at: string
        }
        Insert: {
          pending_draw_id?: number | null
          profile_id?: number | null
          tmdb_id: number
          title: string
        }
        Update: {
          pending_draw_id?: number | null
          profile_id?: number | null
          tmdb_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pending_movie_pending_draw_id_fkey'
            columns: ['pending_draw_id']
            referencedRelation: 'pending_draw'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pending_movie_profile_id_fkey'
            columns: ['profile_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      votes: {
        Row: {
          id: number
          journal_id: number
          profile_id: number | null
          rating_film: number | null
          rating_pick: number | null
          already_seen: boolean | null
          happy_to_rewatch: boolean | null
          prior_knowledge: boolean | null
          wanted_to_see: boolean | null
          surprised_by_pick: boolean | null
          created_at: string
        }
        Insert: {
          journal_id: number
          profile_id?: number | null
          rating_film?: number | null
          rating_pick?: number | null
          already_seen?: boolean | null
          happy_to_rewatch?: boolean | null
          prior_knowledge?: boolean | null
          wanted_to_see?: boolean | null
          surprised_by_pick?: boolean | null
        }
        Update: {
          journal_id?: number
          profile_id?: number | null
          rating_film?: number | null
          rating_pick?: number | null
          already_seen?: boolean | null
          happy_to_rewatch?: boolean | null
          prior_knowledge?: boolean | null
          wanted_to_see?: boolean | null
          surprised_by_pick?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'votes_journal_id_fkey'
            columns: ['journal_id']
            referencedRelation: 'journal'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'votes_profile_id_fkey'
            columns: ['profile_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
