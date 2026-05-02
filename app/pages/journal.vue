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
