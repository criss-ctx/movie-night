<template>
  <div class="page-about">
    <div class="about-wrapper">

      <button class="movie-back" @click="router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>

      <h1 class="about-title">À propos</h1>
      <p class="about-desc">
        Movie Night est une app privée pour suivre nos soirées ciné — tirage d'année, journal des films vus, fiches détaillées.
      </p>

      <hr class="about-divider" />

      <section class="about-section" aria-labelledby="tmdb-heading">
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" class="about-tmdb-logo-link">
          <img src="/tmdb-logo.svg" alt="The Movie Database" class="about-tmdb-logo" />
        </a>
        <h2 id="tmdb-heading" class="about-section-title">The Movie Database</h2>
        <p class="about-section-text">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
          class="about-tmdb-link"
        >
          Visiter themoviedb.org
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
</script>
