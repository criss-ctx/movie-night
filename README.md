# Movie Night

Application privée pour gérer les soirées cinéma en famille. Chaque participant tire une année au sort, choisit un film en secret, et le révèle lors de la séance suivante.

## Fonctionnalités

- **Tirage** — tire une année aléatoire, animation slot machine, mémorise le tirage en attente
- **Journal** — historique des films vus, filtré par participant, avec fiches TMDB
- **Ajouter** — formulaire avec autocomplete TMDB (titre, année, affiche liés automatiquement)
- **Découvrir** — grille de films par année tirée (5 filtres, infinite scroll)
- **Fiche film** — affiche, genres, durée, note, synopsis, bouton Modifier

## Stack

- **Frontend** — Vue 3 + Nuxt 4 + TypeScript
- **Base de données** — Supabase (PostgreSQL + RLS)
- **API** — TMDB (The Movie Database)
- **Déploiement** — Vercel (`movie-night-flax.vercel.app`)

## Prérequis

Créer un fichier `.env` à la racine (voir `.env.example`) :

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your_anon_key
NUXT_TMDB_TOKEN=your_tmdb_bearer_token
```

Sans `NUXT_TMDB_TOKEN`, les appels TMDB utilisent des données mock (Inception, The Dark Knight…).

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
# → http://localhost:3000
```

## Production

```bash
npm run build
npm run preview
```
