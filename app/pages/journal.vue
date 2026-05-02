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
          <JournalCard
            v-for="entry in filteredEntries"
            :key="entry.id"
            :entry="entry"
            :profiles="profiles"
            @navigate="router.push(`/entry/${entry.id}`)"
            @edit="handleEdit(entry)"
            @delete="handleDelete(entry.id)"
          />
        </template>
        <p v-else class="journal-empty">Aucune entrée pour l'instant.<br>Ajoutez votre premier film !</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JournalEntry } from '~/types'

const router = useRouter()
const { profiles, load: loadProfiles } = useProfiles()
const { entries, load: loadJournal, update, remove } = useJournal()
const { requireAuth } = useAuth()
const { confirm } = useConfirm()
const { editEntry } = useEditEntry()

const filterProfileId = ref<number | null>(null)

const filteredEntries = computed(() =>
  filterProfileId.value === null
    ? entries.value
    : entries.value.filter(e => e.profile_id === filterProfileId.value)
)

async function handleEdit(entry: JournalEntry) {
  await requireAuth(async () => {
    const changes = await editEntry(entry, profiles.value)
    if (changes) await update(entry.id, changes)
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

.journal-empty {
  color: var(--text-faint);
  font-size: 14px;
  text-align: center;
  padding: 48px 0;
  line-height: 1.9;
}
</style>
