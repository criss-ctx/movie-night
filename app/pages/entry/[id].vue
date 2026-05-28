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
        <MovieDetailView
          :movie="movie"
          :providers="providers"
          :fallback-title="entry.title"
          :fallback-year="entry.release_year"
          :journal-meta="{ name: entry.profiles?.name ?? null, date: entry.watch_date }"
        >
          <button class="modify-btn" @click="handleModify">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Modifier
          </button>
        </MovieDetailView>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { JournalEntry, TmdbMovieDetail, TmdbWatchProvidersResponse } from '~/types'

const router = useRouter()
const route = useRoute()
const entryId = Number(route.params.id)

const { getEntryById, update } = useJournal()
const { getMovieDetail, getWatchProviders } = useTmdb()
const { profiles, load: loadProfiles } = useProfiles()
const { requireAuth } = useAuth()
const { editEntry } = useEditEntry()

const { data: entry } = await useAsyncData<JournalEntry | null>(
  `entry-${entryId}`,
  () => getEntryById(entryId)
)

const { data: movie, refresh: refreshMovie } = await useAsyncData<TmdbMovieDetail | null>(
  `entry-tmdb-${entryId}`,
  () => entry.value?.tmdb_id ? getMovieDetail(entry.value.tmdb_id) : Promise.resolve(null)
)

const { data: watchProvidersData } = await useAsyncData<TmdbWatchProvidersResponse | null>(
  `entry-providers-${entryId}`,
  () => entry.value?.tmdb_id ? getWatchProviders(entry.value.tmdb_id) : Promise.resolve(null)
)

const providers = computed(() => watchProvidersData.value?.results?.['FR'] ?? null)

await loadProfiles()

async function handleModify() {
  if (!entry.value) return
  await requireAuth(async () => {
    const changes = await editEntry(entry.value!, profiles.value)
    if (changes) {
      await update(entryId, changes)
      entry.value = await getEntryById(entryId)
      await refreshMovie()
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

.modify-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 24px;
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
