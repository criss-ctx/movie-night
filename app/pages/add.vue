<template>
  <div class="page-add">
    <div class="form-wrapper">
      <div v-if="pendingDraw" class="pending-banner visible">
        <p class="pending-banner-label">Tirage en attente</p>
        <p class="pending-banner-info">{{ pendingDraw.profiles?.name ?? '?' }} · {{ pendingDraw.year }}</p>
        <button type="button" class="pending-btn-primary" @click="prefillFromPendingDraw">Pré-remplir le formulaire</button>
        <NuxtLink :to="`/discover/${pendingDraw.year}`" class="pending-link-secondary">Explorer les films →</NuxtLink>
        <button class="pending-banner-delete" aria-label="Annuler ce tirage" @click="handleDeletePendingDraw">&times;</button>
      </div>

      <h2 class="slide-heading">Ajouter au journal</h2>

      <form class="journal-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="movie-title">Titre du film</label>
          <div class="search-field">
            <input
              id="movie-title"
              v-model="form.title"
              type="text"
              placeholder="ex. Jurassic Park"
              required
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
                  <span v-if="TMDB_WARNING_GENRES.some(id => movie.genre_ids?.includes(id))" class="search-result-genre-warning" title="Film d'horreur">⚠</span>
                  <span class="search-result-year">{{ movie.release_date?.split('-')[0] ?? '—' }}</span>
                </button>
              </template>
              <div v-else class="search-status">Aucun résultat</div>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="release-year">Année de sortie</label>
          <input id="release-year" v-model="form.release_year" type="number" placeholder="ex. 1993" min="1888" max="2030" required />
        </div>
        <div class="form-group">
          <label for="picked-by">Choisi par</label>
          <select id="picked-by" v-model="form.profile_id" required>
            <option value="">— Choisir —</option>
            <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="watch-date">Date de visionnage</label>
          <input id="watch-date" v-model="form.watch_date" type="date" required />
        </div>
        <button type="submit" class="form-submit">Ajouter</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TmdbMovie } from '~/types'
import { TMDB_WARNING_GENRES } from '~/constants/tmdb'

const router = useRouter()

const { profiles, load: loadProfiles } = useProfiles()
const { add: addEntry } = useJournal()
const { pendingDraw, load: loadPendingDraw, remove: deletePendingDraw } = usePendingDraw()
const { requireAuth } = useAuth()
const { confirm } = useConfirm()
const { searchMovies } = useTmdb()

const form = reactive({
  title: '',
  release_year: '' as string | number,
  profile_id: '' as string | number,
  watch_date: '',
  tmdb_id: null as number | null
})

const searchResults = ref<TmdbMovie[]>([])
const isSearching = ref(false)
const showDropdown = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onTitleInput() {
  form.tmdb_id = null
  const q = form.title.trim()

  if (debounceTimer) clearTimeout(debounceTimer)

  if (q.length < 2) {
    searchResults.value = []
    showDropdown.value = false
    return
  }

  isSearching.value = true
  showDropdown.value = true

  debounceTimer = setTimeout(async () => {
    const year = Number(form.release_year) >= 1888 ? Number(form.release_year) : undefined
    const response = await searchMovies(q, year)
    searchResults.value = response.results.slice(0, 6)
    isSearching.value = false
  }, 400)
}

function onTitleBlur() {
  setTimeout(() => { showDropdown.value = false }, 150)
}

function selectMovie(movie: TmdbMovie) {
  form.title = movie.title
  form.release_year = movie.release_date ? Number(movie.release_date.split('-')[0]) : ''
  form.tmdb_id = movie.id
  searchResults.value = []
  showDropdown.value = false
}

function prefillFromPendingDraw() {
  if (!pendingDraw.value) return
  form.release_year = pendingDraw.value.year
  form.profile_id = pendingDraw.value.profile_id ?? ''
  form.watch_date = new Date().toISOString().split('T')[0] ?? ''
}

async function handleDeletePendingDraw() {
  if (!await confirm('Annuler ce tirage en attente ?', 'Annuler le tirage')) return
  await requireAuth(async () => {
    await deletePendingDraw()
  })
}

async function handleSubmit() {
  await requireAuth(async () => {
    const { error } = await addEntry({
      title: form.title.trim(),
      release_year: Number(form.release_year),
      profile_id: Number(form.profile_id),
      watch_date: form.watch_date,
      tmdb_id: form.tmdb_id
    })
    if (!error) {
      if (pendingDraw.value) await deletePendingDraw()
      form.title = ''
      form.release_year = ''
      form.profile_id = ''
      form.watch_date = ''
      form.tmdb_id = null
      await router.push('/journal')
    }
  })
}

await Promise.all([loadProfiles(), loadPendingDraw()])
</script>

<style scoped>
.page-add {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 36px 24px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.form-wrapper {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.pending-banner {
  display: none;
  position: relative;
  background: rgba(201, 165, 90, 0.06);
  border: 1px solid rgba(201, 165, 90, 0.4);
  border-radius: var(--r-md);
  padding: 14px 16px;
  margin-bottom: 24px;
}

.pending-banner.visible {
  display: flex;
  flex-direction: column;
}

.pending-banner-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 6px;
}

.pending-banner-info {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  letter-spacing: 0.02em;
}

.pending-btn-primary {
  width: 100%;
  margin-top: 14px;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--bg);
  background: var(--accent);
  border: none;
  border-radius: var(--r-sm);
  padding: 10px 12px;
  cursor: pointer;
  transition: opacity 150ms;
}

@media (hover: hover) {
  .pending-btn-primary:hover { opacity: 0.88; }
}

.pending-link-secondary {
  display: block;
  text-align: center;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 150ms;
}

@media (hover: hover) {
  .pending-link-secondary:hover { color: var(--text); }
}

.pending-banner-delete {
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  color: var(--text-faint);
  font-size: 18px;
  line-height: 1;
  padding: 4px 6px;
  cursor: pointer;
  transition: color 150ms;
}

@media (hover: hover) {
  .pending-banner-delete:hover { color: var(--danger); }
}

.journal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
