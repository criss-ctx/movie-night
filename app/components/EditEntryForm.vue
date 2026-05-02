<template>
  <div class="edit-entry-form">
    <input
      class="entry-edit-input entry-edit-input--title"
      :value="localTitle"
      placeholder="Titre du film"
      readonly
      @click="showOverlay = true"
    />
    <input class="entry-edit-input" v-model.number="localYear" type="number" placeholder="Année de sortie" />
    <select class="entry-edit-input" v-model="localProfileId">
      <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
    </select>
    <input class="entry-edit-input" v-model="localDate" type="date" />

    <MovieSearchOverlay
      :visible="showOverlay"
      :initialQuery="localTitle"
      @select="onMovieSelect"
      @confirm="onTitleConfirm"
      @cancel="showOverlay = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { JournalEntry, Profile, TmdbMovie } from '~/types'

const props = defineProps<{
  entry: JournalEntry
  profiles: Profile[]
}>()

const localTitle = ref(props.entry.title)
const localYear = ref(props.entry.release_year)
const localProfileId = ref(props.entry.profile_id ?? 0)
const localDate = ref(props.entry.watch_date)
const localTmdbId = ref<number | null>(props.entry.tmdb_id)
const showOverlay = ref(false)

function onMovieSelect(movie: TmdbMovie) {
  localTitle.value = movie.title
  localYear.value = movie.release_date ? Number(movie.release_date.split('-')[0]) : localYear.value
  localTmdbId.value = movie.id
  showOverlay.value = false
}

function onTitleConfirm(title: string) {
  localTitle.value = title
  localTmdbId.value = null
  showOverlay.value = false
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
  transition: border-color 150ms;
}

.entry-edit-input:focus {
  border-color: var(--border-strong);
}

.entry-edit-input--title {
  cursor: pointer;
}
</style>
