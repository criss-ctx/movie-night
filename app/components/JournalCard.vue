<template>
  <div
    class="card-shell"
    :class="{
      'card-shell--locked-edit': swipeLocked === 'edit',
      'card-shell--locked-delete': swipeLocked === 'delete'
    }"
    @click="handleCardClick"
  >
    <!-- Edit zone (left, revealed by swipe right) -->
    <div class="zone zone--edit" :class="{ 'zone--locked': swipeLocked === 'edit' }" aria-hidden="true">
      <button class="zone-btn" @click.stop="handleEdit" aria-label="Modifier">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>

    <!-- Delete zone (right, revealed by swipe left) -->
    <div class="zone zone--delete" :class="{ 'zone--locked': swipeLocked === 'delete' }" aria-hidden="true">
      <button class="zone-btn" @click.stop="handleDelete" aria-label="Supprimer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>

    <!-- Desktop hover areas (before card-face for ~ sibling selector, mobile: display none) -->
    <div class="desktop-edit-area" @click.stop="handleEdit" aria-label="Modifier"></div>
    <div class="desktop-delete-area" @click.stop="handleDelete" aria-label="Supprimer"></div>

    <!-- Card face -->
    <div
      class="card-face"
      :style="swipeStyle"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div class="card-body">
        <div class="card-top">
          <span class="entry-title">{{ entry.title }}</span>
          <span class="entry-year">{{ entry.release_year }}</span>
        </div>
        <span class="entry-meta">Choisi par {{ entry.profiles?.name ?? '?' }} · Vu le {{ formatDate(entry.watch_date) }}</span>
        <div v-if="entry.tmdb_id" class="entry-tmdb-hint" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JournalEntry, Profile } from '~/types'

const props = defineProps<{
  entry: JournalEntry
  profiles: Profile[]
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  navigate: []
}>()

// ── Swipe state ──────────────────────────────────────────
const THRESHOLD = 72
let startX = 0
let currentDx = 0
const swipeOffset = ref(0)
const swipeLocked = ref<'edit' | 'delete' | null>(null)
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
  const max = THRESHOLD * 1.4
  swipeOffset.value = Math.max(-max, Math.min(max, currentDx))
}

function onTouchEnd() {
  isSwiping.value = false
  if (currentDx < -THRESHOLD) {
    swipeOffset.value = -THRESHOLD
    swipeLocked.value = 'delete'
  } else if (currentDx > THRESHOLD) {
    swipeOffset.value = THRESHOLD
    swipeLocked.value = 'edit'
  } else {
    resetSwipe()
  }
}

function resetSwipe() {
  swipeOffset.value = 0
  swipeLocked.value = null
}

// ── Actions ──────────────────────────────────────────────
function handleCardClick() {
  if (swipeLocked.value) {
    resetSwipe()
    return
  }
  emit('navigate')
}

function handleEdit() {
  resetSwipe()
  emit('edit')
}

function handleDelete() {
  resetSwipe()
  emit('delete')
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.card-shell {
  position: relative;
  border-radius: var(--r-md);
  overflow: hidden;
}

/* When locked, card-face and inactive zone don't intercept clicks */
.card-shell--locked-edit .zone--delete,
.card-shell--locked-delete .zone--edit,
.card-shell--locked-edit .card-face,
.card-shell--locked-delete .card-face {
  pointer-events: none;
}

/* ── Zones (behind the card face) ───────────────────── */
.zone {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
}

.zone--edit {
  background: rgba(201, 165, 90, 0.15);
  justify-content: flex-start;
  padding-left: 8px;
}

.zone--delete {
  background: rgba(217, 107, 107, 0.15);
  justify-content: flex-end;
  padding-right: 8px;
}

.zone--locked.zone--edit { background: rgba(201, 165, 90, 0.22); }
.zone--locked.zone--delete { background: rgba(217, 107, 107, 0.22); }

.zone-btn {
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

.zone--edit .zone-btn { color: var(--accent); }
.zone--delete .zone-btn { color: var(--danger); }
.zone--locked .zone-btn { transform: scale(1.1); }

/* ── Card face ───────────────────────────────────────── */
.card-face {
  position: relative;
  z-index: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--r-md);
  padding: 14px 16px;
  cursor: pointer;
  transition: background 180ms, transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@media (hover: hover) {
  .card-face:hover {
    background: var(--surface-raised);
  }
}

/* ── Card body ───────────────────────────────────────── */
.card-body {
  position: relative;
  display: grid;
  grid-template-rows: auto auto;
  gap: 4px;
  padding-right: 44px; /* keeps text away from delete hover area */
}

.card-top {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.entry-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.entry-year {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  flex-shrink: 0;
}

.entry-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.entry-tmdb-hint {
  position: absolute;
  bottom: 0;
  right: 0;
  color: var(--text-faint);
  opacity: 0.5;
}

/* ── Desktop hover areas ─────────────────────────────── */
.desktop-edit-area,
.desktop-delete-area {
  display: none;
}

@media (hover: hover) {
  .desktop-edit-area,
  .desktop-delete-area {
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 2;
    cursor: pointer;
  }

  .desktop-edit-area {
    left: 0;
    width: 40px;
  }

  .desktop-delete-area {
    right: 0;
    width: 44px;
  }

  /* Translate card-face to reveal the colored zone behind */
  .desktop-edit-area:hover ~ .card-face {
    transform: translateX(52px);
  }

  .desktop-delete-area:hover ~ .card-face {
    transform: translateX(-52px);
  }

  /* Hide hover areas when swipe is locked (mobile gesture active) */
  .card-shell--locked-edit .desktop-edit-area,
  .card-shell--locked-edit .desktop-delete-area,
  .card-shell--locked-delete .desktop-edit-area,
  .card-shell--locked-delete .desktop-delete-area {
    display: none;
  }
}
</style>
