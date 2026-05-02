<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="visible" class="search-overlay" @click.self="$emit('cancel')">
        <div class="search-inner">
        <div class="search-bar">
          <input
            ref="inputRef"
            class="search-input"
            v-model="query"
            placeholder="Titre du film"
            autocomplete="off"
            @input="onQueryInput"
            @keydown.escape="$emit('cancel')"
          />
          <button class="search-cancel" @click="$emit('cancel')">Annuler</button>
        </div>

        <div class="search-results">
          <div v-if="isSearching" class="search-status">Recherche…</div>
          <template v-else-if="results.length">
            <button
              v-for="movie in results"
              :key="movie.id"
              class="search-result"
              @click="$emit('select', movie)"
            >
              <span class="result-title">{{ movie.title }}</span>
              <span class="result-year">{{ movie.release_date?.split('-')[0] ?? '—' }}</span>
            </button>
          </template>
          <div v-else-if="query.length >= 2" class="search-status">Aucun résultat</div>
          <div v-else class="search-hint">Commencez à taper pour rechercher</div>
        </div>

        <div v-if="query.trim().length > 0" class="search-footer">
          <button class="search-confirm" @click="$emit('confirm', query.trim())">
            Utiliser « {{ query.trim() }} »
          </button>
        </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { TmdbMovie } from '~/types'

const props = defineProps<{
  visible: boolean
  initialQuery: string
}>()

const emit = defineEmits<{
  select: [movie: TmdbMovie]
  confirm: [title: string]
  cancel: []
}>()

const { searchMovies } = useTmdb()

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const results = ref<TmdbMovie[]>([])
const isSearching = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.visible, (val) => {
  if (val) {
    query.value = props.initialQuery
    results.value = []
    isSearching.value = false
    nextTick(() => inputRef.value?.focus())
  } else {
    if (debounceTimer) clearTimeout(debounceTimer)
  }
})

function onQueryInput() {
  if (debounceTimer) clearTimeout(debounceTimer)

  if (query.value.trim().length < 2) {
    results.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true
  debounceTimer = setTimeout(async () => {
    const response = await searchMovies(query.value)
    results.value = response.results.slice(0, 6)
    isSearching.value = false
  }, 400)
}
</script>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

.search-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (hover: hover) {
  .search-overlay {
    background: rgba(25, 23, 31, 0.8);
    backdrop-filter: blur(6px);
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .search-inner {
    flex: none;
    width: 100%;
    max-width: 420px;
    max-height: 70vh;
    background: var(--surface);
    border: 1px solid var(--border-mid);
    border-radius: var(--r-md);
    overflow: hidden;
  }
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  border-bottom: 1px solid var(--border);
}

.search-input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 16px; /* prevents iOS zoom on focus */
  padding: 10px 14px;
  min-height: 44px;
  outline: none;
  transition: border-color 150ms;
}

.search-input:focus {
  border-color: var(--border-strong);
}

.search-cancel {
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 4px;
  flex-shrink: 0;
  transition: color 150ms;
}

@media (hover: hover) {
  .search-cancel:hover { color: var(--text); }
}

.search-results {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.search-status,
.search-hint {
  font-size: 13px;
  color: var(--text-faint);
  padding: 24px 16px;
  text-align: center;
}

.search-result {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: background 120ms;
}

@media (hover: hover) {
  .search-result:hover { background: var(--surface); }
}

.result-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-year {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.search-footer {
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--border);
}

.search-confirm {
  width: 100%;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  padding: 12px;
  cursor: pointer;
  text-align: left;
  transition: color 150ms, border-color 150ms;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (hover: hover) {
  .search-confirm:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 200ms;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(32px);
  opacity: 0;
}
</style>
