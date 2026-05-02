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
              <input class="entry-edit-input" v-model="editForm.title" placeholder="Titre du film" />
              <input class="entry-edit-input" v-model.number="editForm.release_year" type="number" placeholder="Année de sortie" />
              <select class="entry-edit-input" v-model="editForm.profile_id">
                <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <input class="entry-edit-input" v-model="editForm.watch_date" type="date" />
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
const editForm = ref({ title: '', release_year: 0, profile_id: 0, watch_date: '' })

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
    editForm.value = {
      title: entry.title,
      release_year: entry.release_year,
      profile_id: entry.profile_id ?? 0,
      watch_date: entry.watch_date
    }
  })
}

async function handleSave(id: number) {
  await requireAuth(async () => {
    await update(id, editForm.value)
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
