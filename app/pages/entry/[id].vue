<template>
  <div class="page-entry">
    <div class="entry-wrapper">

      <button class="entry-back" @click="router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>

      <div v-if="!entry" class="entry-status">Film introuvable.</div>

      <template v-else>
          <div class="entry-content">
            <div class="entry-poster-col">
              <img
                v-if="posterUrl"
                :src="posterUrl"
                :alt="`Affiche de ${entry.title}`"
                class="entry-poster"
              />
              <div v-else class="entry-poster-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                  <path d="M7 8h10M7 12h10M7 16h6"/>
                </svg>
              </div>
            </div>

            <div class="entry-info-col">
              <h1 class="entry-title">{{ movie?.title ?? entry.title }}</h1>
              <p v-if="movie && movie.original_title !== movie.title" class="entry-original-title">{{ movie.original_title }}</p>
              <p v-if="movie?.tagline" class="entry-tagline">« {{ movie.tagline }} »</p>

              <div class="entry-meta-row">
                <span class="entry-meta-item">{{ movie?.release_date?.split('-')[0] ?? entry.release_year }}</span>
                <span v-if="formattedRuntime" class="entry-meta-item">{{ formattedRuntime }}</span>
              </div>

              <div v-if="movie?.genres.length" class="entry-genres">
                <span v-for="genre in movie.genres" :key="genre.id" class="entry-genre-tag">{{ genre.name }}</span>
              </div>

              <div v-if="movie && movie.vote_count > 0" class="entry-rating">
                <span class="entry-rating-score">{{ movie.vote_average.toFixed(1) }}</span>
                <span class="entry-rating-label">/ 10 · {{ movie.vote_count.toLocaleString('fr-FR') }} votes</span>
              </div>

              <p v-if="movie?.overview" class="entry-overview">{{ movie.overview }}</p>

              <div class="entry-journal-meta">
                <span>Choisi par <strong>{{ entry.profiles?.name ?? '?' }}</strong></span>
                <span>Vu le {{ formatDate(entry.watch_date) }}</span>
              </div>
            </div>
          </div>

          <button class="modify-btn" @click="handleModify">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Modifier
          </button>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { JournalEntry, TmdbMovieDetail } from '~/types'

const router = useRouter()
const route = useRoute()
const entryId = Number(route.params.id)

const { getEntryById, update } = useJournal()
const { getMovieDetail, getPosterUrl } = useTmdb()
const { profiles, load: loadProfiles } = useProfiles()
const { requireAuth } = useAuth()
const { editEntry } = useEditEntry()

const { data: entry } = await useAsyncData<JournalEntry | null>(
  `entry-${entryId}`,
  () => getEntryById(entryId)
)

const { data: movie } = await useAsyncData<TmdbMovieDetail | null>(
  `entry-tmdb-${entryId}`,
  () => entry.value?.tmdb_id ? getMovieDetail(entry.value.tmdb_id) : Promise.resolve(null)
)

const posterUrl = computed(() => movie.value ? getPosterUrl(movie.value.poster_path, 'w342') : null)

const formattedRuntime = computed(() => {
  if (!movie.value?.runtime) return null
  const h = Math.floor(movie.value.runtime / 60)
  const m = movie.value.runtime % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
})

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

await loadProfiles()

async function handleModify() {
  if (!entry.value) return
  await requireAuth(async () => {
    const changes = await editEntry(entry.value!, profiles.value)
    if (changes) {
      await update(entryId, changes)
      entry.value = await getEntryById(entryId)
    }
  })
}
</script>

<style scoped>
.page-entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.entry-wrapper {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.entry-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-ui);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  transition: color 150ms;
}

@media (hover: hover) {
  .entry-back:hover { color: var(--text); }
}

.entry-status {
  color: var(--text-faint);
  font-size: 14px;
  text-align: center;
  padding: 48px 0;
}

.entry-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.entry-poster-col {
  flex-shrink: 0;
  width: 120px;
}

.entry-poster {
  width: 100%;
  border-radius: var(--r-md);
  display: block;
}

.entry-poster-placeholder {
  width: 100%;
  aspect-ratio: 2/3;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
}

.entry-info-col {
  flex: 1;
  min-width: 0;
}

.entry-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 4px;
  line-height: 1.2;
  letter-spacing: 0.02em;
}

.entry-original-title {
  font-size: 13px;
  color: var(--text-faint);
  margin: 0 0 10px;
  font-style: italic;
}

.entry-tagline {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 14px;
  font-style: italic;
  line-height: 1.5;
}

.entry-meta-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.entry-meta-item {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.entry-meta-item + .entry-meta-item::before {
  content: '·';
  margin-right: 10px;
  color: var(--text-faint);
}

.entry-genres {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.entry-genre-tag {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 10px;
}

.entry-rating {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 16px;
}

.entry-rating-score {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  color: var(--text);
}

.entry-rating-label {
  font-size: 12px;
  color: var(--text-faint);
}

.entry-overview {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.entry-journal-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--text-secondary);
  border-top: 1px solid var(--border);
  padding-top: 12px;
  margin-top: 4px;
}

.entry-journal-meta strong {
  color: var(--text);
  font-weight: 500;
}

.modify-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  padding: 8px 14px;
  cursor: pointer;
  transition: color 150ms, border-color 150ms, background 150ms;
}

@media (hover: hover) {
  .modify-btn:hover {
    color: var(--text);
    border-color: var(--border-strong);
    background: var(--surface-raised);
  }
}

</style>
