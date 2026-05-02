<template>
  <div class="edit-entry-form">
    <div class="search-field">
      <input
        class="entry-edit-input"
        v-model="localTitle"
        placeholder="Titre du film"
        autocomplete="off"
        @input="onTitleInput"
        @blur="onTitleBlur"
      />
      <div v-if="showDropdown" class="search-dropdown">
        <div v-if="isSearching" class="search-status">Recherche…</div>
        <template v-else-if="searchResults.length">
          <button
            v-for="movie in searchResults"
            :key="movie.id"
            type="button"
            class="search-result"
            @mousedown.prevent
            @click="selectMovie(movie)"
          >
            <span class="search-result-title">{{ movie.title }}</span>
            <span class="search-result-year">{{ movie.release_date?.split('-')[0] ?? '—' }}</span>
          </button>
        </template>
        <div v-else class="search-status">Aucun résultat</div>
      </div>
    </div>
    <input class="entry-edit-input" v-model.number="localYear" type="number" placeholder="Année de sortie" />
    <select class="entry-edit-input" v-model="localProfileId">
      <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
    </select>
    <input class="entry-edit-input" v-model="localDate" type="date" />
  </div>
</template>

<script setup lang="ts">
import type { JournalEntry, Profile, TmdbMovie } from '~/types'

const props = defineProps<{
  entry: JournalEntry
  profiles: Profile[]
}>()

const emit = defineEmits<{
  save: [changes: Partial<Pick<JournalEntry, 'title' | 'release_year' | 'profile_id' | 'watch_date' | 'tmdb_id'>>]
}>()

const { searchMovies } = useTmdb()

const localTitle = ref(props.entry.title)
const localYear = ref(props.entry.release_year)
const localProfileId = ref(props.entry.profile_id ?? 0)
const localDate = ref(props.entry.watch_date)
const localTmdbId = ref<number | null>(props.entry.tmdb_id)

const searchResults = ref<TmdbMovie[]>([])
const isSearching = ref(false)
const showDropdown = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onTitleInput() {
  localTmdbId.value = null
  const q = localTitle.value.trim()

  if (debounceTimer) clearTimeout(debounceTimer)

  if (q.length < 2) {
    searchResults.value = []
    showDropdown.value = false
    return
  }

  isSearching.value = true
  showDropdown.value = true

  debounceTimer = setTimeout(async () => {
    const response = await searchMovies(q)
    searchResults.value = response.results.slice(0, 6)
    isSearching.value = false
  }, 400)
}

function onTitleBlur() {
  setTimeout(() => { showDropdown.value = false }, 150)
}

function selectMovie(movie: TmdbMovie) {
  localTitle.value = movie.title
  localYear.value = movie.release_date ? Number(movie.release_date.split('-')[0]) : localYear.value
  localTmdbId.value = movie.id
  searchResults.value = []
  showDropdown.value = false
}

defineExpose({
  getChanges: () => ({
    title: localTitle.value.trim(),
    release_year: localYear.value,
    profile_id: localProfileId.value,
    watch_date: localDate.value,
    tmdb_id: localTmdbId.value
  })
})
</script>

<style scoped>
.edit-entry-form {
  display: contents;
}

.entry-edit-input {
  background: var(--bg);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 15px;
  padding: 9px 12px;
  min-height: 44px;
  width: 100%;
  outline: none;
  grid-column: 1;
  transition: border-color 150ms;
}

.entry-edit-input:focus {
  border-color: var(--border-strong);
}
</style>
