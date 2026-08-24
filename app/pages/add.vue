<template>
  <div class="page-add">
    <div class="form-wrapper">
      <div
        v-if="pendingDraw"
        class="pending-shell"
        :class="{ 'pending-shell--locked-delete': swipeLocked === 'delete' }"
        @click="handleShellClick"
      >
        <!-- Zone droite : annuler le tirage entier (rouge) -->
        <div class="pending-zone pending-zone--delete" :class="{ 'pending-zone--locked': swipeLocked === 'delete' }" aria-hidden="true">
          <button class="pending-zone-btn" @click.stop="handleDeletePendingDraw" aria-label="Annuler le tirage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>

        <!-- Zone hover desktop droite -->
        <div class="pending-desktop-delete-area" @click.stop="handleDeletePendingDraw" aria-label="Annuler le tirage"></div>

        <!-- Face -->
        <div
          class="pending-face"
          :style="swipeStyle"
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd"
        >
          <p class="pending-banner-label">Tirage en attente</p>
          <p class="pending-banner-info">
            {{ pendingDraw.profiles?.name ?? '?' }} · {{ pendingDrawLabel }}<template v-if="pendingMovie?.title"> · {{ pendingMovie.title }}</template><template v-else-if="pendingDraw.movie_chosen"> · Film choisi</template>
          </p>
          <button v-if="pendingMovie" type="button" class="pending-clear-film-btn" @click.stop="handleClearFilm">retirer ce film</button>
          <button v-else-if="pendingDraw.movie_chosen && isAdmin" type="button" class="pending-clear-film-btn" @click.stop="handleClearFilm">annuler le choix</button>
          <button v-if="pendingDraw.year" type="button" class="pending-btn-primary" @click.stop="prefillFromPendingDraw">Pré-remplir le formulaire</button>
          <NuxtLink v-if="pendingDraw.year" :to="`/discover/${pendingDraw.year}`" class="pending-link-secondary">Explorer les films →</NuxtLink>
          <NuxtLink v-else-if="pendingDraw.kind === 'cinema'" to="/discover/cinema" class="pending-link-secondary">Explorer les films →</NuxtLink>
          <div v-else class="pending-joker-picker" @click.stop @touchstart.stop>
            <input
              v-model.number="jokerYearInput"
              type="number"
              :min="MIN_YEAR"
              :max="MAX_YEAR"
              :placeholder="`${MIN_YEAR}–${MAX_YEAR}`"
              class="pending-joker-input"
            />
            <NuxtLink
              v-if="jokerYearValid"
              :to="`/discover/${jokerYearInput}`"
              class="pending-link-secondary pending-joker-link"
            >Explorer {{ jokerYearInput }} →</NuxtLink>
          </div>
        </div>
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
                  <span v-if="TMDB_WARNING_GENRES.some(id => movie.genre_ids?.includes(id))" class="search-result-genre-warning" title="Genre déconseillé">⚠</span>
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
import { MIN_YEAR, MAX_YEAR } from '~/constants/years'

const router = useRouter()

const { profiles, load: loadProfiles } = useProfiles()
const { add: addEntry } = useJournal()
const { pendingDraw, pendingMovie, load: loadPendingDraw, remove: deletePendingDraw, clearFilm } = usePendingDraw()
const { requireAuth, user } = useAuth()

const isAdmin = computed(() => profiles.value.find(p => p.user_id === user.value?.id)?.is_admin ?? false)

const pendingDrawLabel = computed(() => {
  if (!pendingDraw.value) return ''
  if (pendingDraw.value.year) return String(pendingDraw.value.year)
  return pendingDraw.value.kind === 'joker' ? 'JOKER' : 'CINEMA'
})

const jokerYearInput = ref<number | null>(null)
const jokerYearValid = computed(() =>
  jokerYearInput.value !== null && jokerYearInput.value >= MIN_YEAR && jokerYearInput.value <= MAX_YEAR
)
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
  if (!pendingDraw.value?.year) return
  form.release_year = pendingDraw.value.year
  form.profile_id = pendingDraw.value.profile_id ?? ''
  form.watch_date = new Date().toISOString().split('T')[0] ?? ''
  if (pendingMovie.value?.title) form.title = pendingMovie.value.title
  if (pendingMovie.value?.tmdb_id) form.tmdb_id = pendingMovie.value.tmdb_id
}

// ── Swipe banner ──────────────────────────────────────────
const SWIPE_THRESHOLD = 72
let startX = 0
let currentDx = 0
const swipeOffset = ref(0)
const swipeLocked = ref<'delete' | null>(null)
const isSwiping = ref(false)

const swipeStyle = computed(() => {
  if (swipeOffset.value === 0) return {}
  return {
    transform: `translateX(${swipeOffset.value}px)`,
    transition: isSwiping.value ? 'none' : 'transform 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }
})

function onTouchStart(e: TouchEvent) {
  startX = e.touches[0].clientX
  currentDx = 0
  isSwiping.value = true
}

function onTouchMove(e: TouchEvent) {
  currentDx = e.touches[0].clientX - startX
  if (currentDx > 0) { swipeOffset.value = 0; return }
  swipeOffset.value = Math.max(-SWIPE_THRESHOLD * 1.4, currentDx)
}

function onTouchEnd() {
  isSwiping.value = false
  if (currentDx < -SWIPE_THRESHOLD) {
    swipeOffset.value = -SWIPE_THRESHOLD
    swipeLocked.value = 'delete'
  } else {
    resetSwipe()
  }
}

function resetSwipe() {
  swipeOffset.value = 0
  swipeLocked.value = null
}

function handleShellClick() {
  if (swipeLocked.value) resetSwipe()
}

async function handleClearFilm() {
  resetSwipe()
  await requireAuth(async () => { await clearFilm() })
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

.pending-shell {
  position: relative;
  border-radius: var(--r-md);
  overflow: hidden;
  margin-bottom: 24px;
}

.pending-shell--locked-delete .pending-face {
  pointer-events: none;
}

.pending-zone {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
}

.pending-zone--delete {
  background: rgba(217, 107, 107, 0.15);
  justify-content: flex-end;
  padding-right: 8px;
}

.pending-zone--locked.pending-zone--delete { background: rgba(217, 107, 107, 0.25); }

.pending-zone-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  transition: transform 150ms;
}

.pending-zone--delete .pending-zone-btn { color: var(--danger); }
.pending-zone--locked .pending-zone-btn { transform: scale(1.1); }

.pending-desktop-delete-area {
  display: none;
}

@media (hover: hover) {
  .pending-desktop-delete-area {
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 44px;
    z-index: 2;
    cursor: pointer;
  }

  .pending-desktop-delete-area:hover ~ .pending-face { transform: translateX(-52px); }

  .pending-shell--locked-delete .pending-desktop-delete-area { display: none; }
}

.pending-face {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border: 1px solid rgba(201, 165, 90, 0.4);
  border-radius: var(--r-md);
  padding: 14px 16px;
  transition: transform 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.pending-banner-label {
  font-size: var(--text-label);
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

.pending-clear-film-btn {
  align-self: flex-start;
  font-family: var(--font-ui);
  font-size: var(--text-meta);
  color: var(--text-faint);
  background: none;
  border: none;
  padding: 6px 0;
  min-height: 36px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 150ms;
}

@media (hover: hover) {
  .pending-clear-film-btn:hover { color: var(--danger); }
}

.pending-btn-primary {
  width: 100%;
  margin-top: 14px;
  font-family: var(--font-ui);
  font-size: var(--text-label);
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
  font-size: var(--text-meta);
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 150ms;
}

@media (hover: hover) {
  .pending-link-secondary:hover { color: var(--text); }
}

.pending-joker-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.pending-joker-input {
  width: 11ch;
  font-family: var(--font-ui);
  font-size: var(--text-meta);
  text-align: center;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  padding: 6px 4px;
}

.pending-joker-input::-webkit-outer-spin-button,
.pending-joker-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.pending-joker-input[type=number] { -moz-appearance: textfield; }

.pending-joker-link {
  margin-top: 0;
}

.journal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
