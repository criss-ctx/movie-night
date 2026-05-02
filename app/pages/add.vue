<template>
  <div class="page-add">
    <div class="form-wrapper">
      <div
        v-if="pendingDraw"
        class="pending-banner visible"
        @click="prefillFromPendingDraw"
      >
        <p class="pending-banner-label">Tirage en attente</p>
        <p class="pending-banner-info">{{ pendingDraw.profiles?.name ?? '?' }} · {{ pendingDraw.year }}</p>
        <p class="pending-banner-hint">Appuyer pour pré-remplir le formulaire</p>
        <button class="pending-banner-delete" aria-label="Annuler ce tirage" @click.stop="handleDeletePendingDraw">&times;</button>
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
    const response = await searchMovies(q)
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
  form.watch_date = new Date().toISOString().split('T')[0]
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
