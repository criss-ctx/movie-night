<template>
  <div class="page-journal">
    <div class="journal-wrapper">
      <h2 class="slide-heading">Journal</h2>

      <div class="journal-filter">
        <button
          class="filter-btn"
          :class="{ 'filter-btn--active': filterProfileId === null }"
          @click="filterProfileId = null"
        >Tous</button>
        <button
          v-for="profile in profiles"
          :key="profile.id"
          class="filter-btn"
          :class="{ 'filter-btn--active': filterProfileId === profile.id }"
          @click="filterProfileId = profile.id"
        >{{ profile.name }}</button>
      </div>

      <div class="journal-entries">
        <template v-if="filteredEntries.length">
          <div
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="journal-entry"
            :class="{ 'journal-entry--editing': editingId === entry.id }"
          >
            <template v-if="editingId === entry.id">
              <EditEntryForm :ref="el => setFormRef(entry.id, el)" :entry="entry" :profiles="profiles" />
              <div class="entry-actions">
                <button class="save-btn" aria-label="Enregistrer" @click="handleSave(entry.id)">&#10003;</button>
                <button class="cancel-btn" aria-label="Annuler" @click="editingId = null">&#x2715;</button>
              </div>
            </template>

            <template v-else>
              <span class="entry-title">{{ entry.title }}</span>
              <span class="entry-year">{{ entry.release_year }}</span>
              <span class="entry-meta">Choisi par {{ entry.profiles?.name ?? '?' }} · Vu le {{ formatDate(entry.watch_date) }}</span>
              <div class="entry-actions">
                <NuxtLink v-if="entry.tmdb_id" :to="`/movie/${entry.tmdb_id}`" class="info-btn" aria-label="Fiche film">&#9432;</NuxtLink>
                <button class="edit-btn" aria-label="Modifier" @click="handleEdit(entry)">&#9998;</button>
                <button class="delete-btn" aria-label="Supprimer" @click="handleDelete(entry.id)">&#x2715;</button>
              </div>
            </template>
          </div>
        </template>
        <p v-else class="journal-empty">Aucune entrée pour l'instant.<br>Ajoutez votre premier film !</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JournalEntry } from '~/types'

const { profiles, load: loadProfiles } = useProfiles()
const { entries, load: loadJournal, update, remove } = useJournal()
const { requireAuth } = useAuth()
const { confirm } = useConfirm()

const filterProfileId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const formRefs = ref<Record<number, { getChanges: () => Partial<JournalEntry> } | null>>({})

function setFormRef(id: number, el: unknown) {
  formRefs.value[id] = el as { getChanges: () => Partial<JournalEntry> } | null
}

const filteredEntries = computed(() =>
  filterProfileId.value === null
    ? entries.value
    : entries.value.filter(e => e.profile_id === filterProfileId.value)
)

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function handleEdit(entry: JournalEntry) {
  await requireAuth(async () => {
    editingId.value = entry.id
  })
}

async function handleSave(id: number) {
  await requireAuth(async () => {
    const changes = formRefs.value[id]?.getChanges()
    if (!changes) return
    await update(id, changes)
    editingId.value = null
  })
}

async function handleDelete(id: number) {
  if (!await confirm('Supprimer cette entrée ?', 'Supprimer')) return
  await requireAuth(async () => {
    await remove(id)
  })
}

await Promise.all([loadProfiles(), loadJournal()])
</script>

<style scoped>
.page-journal {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 36px 24px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.journal-wrapper {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

.journal-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filter-btn {
  font-family: var(--font-ui);
  font-size: 0.85rem;
  padding: 6px 14px;
  min-height: 34px;
  border: 1px solid var(--border-mid);
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 150ms, color 150ms, background 150ms;
}

.filter-btn--active {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(201, 165, 90, 0.08);
}

@media (hover: hover) {
  .filter-btn:not(.filter-btn--active):hover {
    border-color: var(--border-strong);
    color: var(--text);
  }
}

.journal-entries {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
}

.journal-entry {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--r-md);
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 4px 12px;
  align-items: center;
  transition: background 180ms;
}

@media (hover: hover) {
  .journal-entry:hover {
    background: var(--surface-raised);
  }
}

.entry-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
  grid-column: 1;
  grid-row: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-year {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  grid-column: 1;
  grid-row: 2;
}

.entry-meta {
  font-size: 12px;
  color: var(--text-secondary);
  grid-column: 1;
  grid-row: 3;
  padding-top: 2px;
}

.entry-actions {
  grid-column: 2;
  grid-row: 1 / 4;
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
}

.info-btn,
.edit-btn,
.delete-btn,
.save-btn,
.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  background: none;
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  color: var(--text-secondary);
  font-size: 15px;
  cursor: pointer;
  transition: color 150ms, border-color 150ms, background 150ms;
}

@media (hover: hover) {
  .info-btn:hover,
  .edit-btn:hover,
  .cancel-btn:hover {
    color: var(--text);
    border-color: var(--border-strong);
    background: var(--surface-raised);
  }

  .delete-btn:hover {
    color: var(--danger);
    border-color: var(--danger);
    background: rgba(217, 107, 107, 0.08);
  }

  .save-btn:hover {
    color: var(--bg);
    background: var(--accent);
    border-color: var(--accent);
  }
}

.save-btn {
  color: var(--accent);
  border-color: rgba(201, 165, 90, 0.35);
}

.journal-entry--editing {
  border-left-color: var(--border-mid);
  background: var(--surface-raised);
  grid-template-columns: 1fr auto;
  grid-template-rows: repeat(4, auto);
  gap: 8px 12px;
}

.journal-entry--editing .entry-actions {
  grid-column: 2;
  grid-row: 1 / 5;
}

.journal-empty {
  color: var(--text-faint);
  font-size: 14px;
  text-align: center;
  padding: 48px 0;
  line-height: 1.9;
}
</style>
