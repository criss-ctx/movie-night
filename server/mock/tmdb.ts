import type { TmdbMovieDetail, TmdbMovie, TmdbSearchResponse } from '~/types'

export const mockMovieDetails: Record<number, TmdbMovieDetail> = {
  27205: {
    id: 27205,
    title: 'Inception',
    original_title: 'Inception',
    tagline: 'Votre esprit est la scène du crime.',
    overview: 'Dom Cobb est un voleur d\'un genre très particulier : il s\'est spécialisé dans l\'art délicat de s\'emparer des secrets enfouis au plus profond des rêves. Cette capacité fait de lui un acteur très prisé dans le monde trouble de l\'espionnage, mais aussi un fugitif qui a perdu tout ce qui lui est cher.',
    release_date: '2010-07-16',
    runtime: 148,
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.369,
    vote_count: 36000,
    popularity: 102.5,
    genres: [
      { id: 28, name: 'Action' },
      { id: 878, name: 'Science-Fiction' },
      { id: 12, name: 'Aventure' }
    ],
    status: 'Released'
  },
  155: {
    id: 155,
    title: 'The Dark Knight : Le Chevalier Noir',
    original_title: 'The Dark Knight',
    tagline: 'Pourquoi si sérieux ?',
    overview: 'Dans ce nouveau volet, Batman relève l\'un des plus grands défis psychologiques et physiques qu\'il ait jamais eu à affronter. Batman, Gordon et le nouveau procureur Harvey Dent s\'unissent pour démanteler les organisations criminelles qui gangrènent la ville.',
    release_date: '2008-07-18',
    runtime: 152,
    poster_path: null,
    backdrop_path: null,
    vote_average: 9.0,
    vote_count: 32000,
    popularity: 130.2,
    genres: [
      { id: 28, name: 'Action' },
      { id: 80, name: 'Crime' },
      { id: 18, name: 'Drame' }
    ],
    status: 'Released'
  },
  329: {
    id: 329,
    title: 'Jurassic Park',
    original_title: 'Jurassic Park',
    tagline: 'Une aventure 65 millions d\'années en préparation.',
    overview: 'Le milliardaire John Hammond réalise son rêve en créant un parc d\'attractions sur une île, le Jurassic Park, en faisant revivre des dinosaures grâce au génie génétique. Il invite le paléontologue Alan Grant et la paléobotaniste Ellie Sattler à visiter le parc.',
    release_date: '1993-06-11',
    runtime: 127,
    poster_path: null,
    backdrop_path: null,
    vote_average: 7.9,
    vote_count: 15800,
    popularity: 85.3,
    genres: [
      { id: 12, name: 'Aventure' },
      { id: 878, name: 'Science-Fiction' }
    ],
    status: 'Released'
  }
}

const mockSearchResults: TmdbMovie[] = [
  {
    id: 27205,
    title: 'Inception',
    original_title: 'Inception',
    release_date: '2010-07-16',
    overview: 'Dom Cobb est un voleur spécialisé dans l\'art de s\'emparer des secrets enfouis au plus profond des rêves.',
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.4,
    vote_count: 36000,
    popularity: 102.5,
    genre_ids: [28, 878, 12]
  },
  {
    id: 155,
    title: 'The Dark Knight : Le Chevalier Noir',
    original_title: 'The Dark Knight',
    release_date: '2008-07-18',
    overview: 'Batman, Gordon et Harvey Dent s\'unissent pour démanteler les organisations criminelles de Gotham.',
    poster_path: null,
    backdrop_path: null,
    vote_average: 9.0,
    vote_count: 32000,
    popularity: 130.2,
    genre_ids: [28, 80, 18]
  },
  {
    id: 329,
    title: 'Jurassic Park',
    original_title: 'Jurassic Park',
    release_date: '1993-06-11',
    overview: 'Un milliardaire crée un parc d\'attractions avec de véritables dinosaures ressuscités par génie génétique.',
    poster_path: null,
    backdrop_path: null,
    vote_average: 7.9,
    vote_count: 15800,
    popularity: 85.3,
    genre_ids: [12, 878]
  }
]

const DEFAULT_MOCK_MOVIE: TmdbMovieDetail = {
  id: 0,
  title: 'Film de test',
  original_title: 'Test Movie',
  tagline: 'Ceci est un film de démonstration.',
  overview: 'Ce film n\'existe pas vraiment — il s\'agit de données mock utilisées pendant le développement, quand aucun token TMDB n\'est configuré.',
  release_date: '2024-01-01',
  runtime: 90,
  poster_path: null,
  backdrop_path: null,
  vote_average: 7.5,
  vote_count: 1000,
  popularity: 50.0,
  genres: [{ id: 99, name: 'Mock' }],
  status: 'Released'
}

export function getMockMovieDetail(id: number): TmdbMovieDetail {
  return mockMovieDetails[id] ?? DEFAULT_MOCK_MOVIE
}

export function getMockSearchResults(query: string): TmdbSearchResponse {
  const q = query.toLowerCase()
  const filtered = mockSearchResults.filter(m =>
    m.title.toLowerCase().includes(q) || m.original_title.toLowerCase().includes(q)
  )
  return {
    page: 1,
    results: filtered.length > 0 ? filtered : mockSearchResults,
    total_pages: 1,
    total_results: filtered.length > 0 ? filtered.length : mockSearchResults.length
  }
}
