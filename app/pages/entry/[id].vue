<template>
  <div class="page-entry">
    <div class="entry-wrapper">

      <button class="entry-back" @click="router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>

      <div v-if="!entry" class="entry-status">Film introuvable.</div>

      <template v-else>
        <MovieDetailView
          :movie="movie"
          :providers="providers"
          :fallback-title="entry.title"
          :fallback-year="entry.release_year"
          :journal-meta="{ name: entry.profiles?.name ?? null, date: entry.watch_date }"
        >
          <button class="modify-btn" @click="handleModify">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Modifier
          </button>
        </MovieDetailView>

        <section class="vs">

          <div class="vs-header">
            <h2 class="vs-title">Votes</h2>
            <span class="vs-count">{{ votes.length }}/{{ profiles.length }}</span>
          </div>

          <div class="vs-who">
            <div v-for="profile in profiles" :key="profile.id" class="vs-who-row">
              <UserAvatar :name="profile.name" :avatar="profile.avatar" />
              <span class="vs-who-name">{{ profile.name }}</span>
              <span class="vs-who-badge" :class="{ voted: hasVoted(profile.id) }">
                {{ hasVoted(profile.id) ? '✓' : '…' }}
              </span>
            </div>
          </div>

          <template v-if="isLocked">

            <div class="vs-averages">
              <div v-if="avgRatingFilm !== null" class="vs-avg-row">
                <span class="vs-avg-label">Note du film</span>
                <span class="vs-avg-value">{{ avgRatingFilm.toFixed(1) }} / 10</span>
              </div>
              <div v-if="avgRatingPick !== null" class="vs-avg-row">
                <span class="vs-avg-label">Note du choix</span>
                <span class="vs-avg-value">{{ avgRatingPick.toFixed(1) }} / 10</span>
              </div>
            </div>

            <div
              v-for="profile in profiles" :key="`r-${profile.id}`"
              class="vs-result"
              :class="{ 'vs-result--picker': profile.id === entry?.profile_id }"
            >
              <UserAvatar :name="profile.name" :avatar="profile.avatar" />
              <span class="vs-result-name">{{ profile.name }}</span>
              <span v-if="profile.id === entry?.profile_id" class="vs-picker-badge">Sélectionneur</span>
              <div class="vs-tags">
                <template v-if="getVote(profile.id)">
                  <span v-if="getVote(profile.id)?.already_seen && !getVote(profile.id)?.happy_to_rewatch" class="vs-tag">Déjà vu</span>
                  <span v-if="getVote(profile.id)?.happy_to_rewatch === true" class="vs-tag">Content de le revoir</span>
                  <span v-if="getVote(profile.id)?.already_seen === false && getVote(profile.id)?.prior_knowledge === false" class="vs-tag">Découverte</span>
                  <span v-if="getVote(profile.id)?.wanted_to_see === true" class="vs-tag">Voulait le voir</span>
                  <span v-if="getVote(profile.id)?.wanted_to_see === false" class="vs-tag vs-tag--skeptic">Pas attiré</span>
                  <span v-if="getVote(profile.id)?.surprised_by_pick" class="vs-tag">Surpris</span>
                </template>
                <span v-else class="vs-tag vs-tag--pending">n'a pas voté</span>
              </div>
            </div>

          </template>

          <template v-else-if="myProfile">
            <div class="vs-form">
              <h3 class="vs-form-title">{{ myVote ? 'Modifier ton vote' : 'Ton vote' }}</h3>

              <div class="vs-field">
                <div class="vs-field-header">
                  <label class="vs-field-label">Note du film</label>
                  <span class="vs-field-value" :class="{ unset: !draft.rating_film }">
                    {{ draft.rating_film ? `${draft.rating_film} / 10` : '— / 10' }}
                  </span>
                </div>
                <input
                  type="range" min="1" max="10" step="1"
                  class="rating-slider"
                  :value="draft.rating_film ?? 5"
                  :style="sliderStyle(draft.rating_film)"
                  @input="draft.rating_film = Number(($event.target as HTMLInputElement).value)"
                />
              </div>

              <div v-if="!isPicker" class="vs-field">
                <div class="vs-field-header">
                  <label class="vs-field-label">Note du choix</label>
                  <span class="vs-field-value" :class="{ unset: !draft.rating_pick }">
                    {{ draft.rating_pick ? `${draft.rating_pick} / 10` : '— / 10' }}
                  </span>
                </div>
                <input
                  type="range" min="1" max="10" step="1"
                  class="rating-slider"
                  :value="draft.rating_pick ?? 5"
                  :style="sliderStyle(draft.rating_pick)"
                  @input="draft.rating_pick = Number(($event.target as HTMLInputElement).value)"
                />
              </div>

              <div class="vs-bools">
                <div class="vs-bool-group">
                  <span class="vs-bool-label">Déjà vu ?</span>
                  <div class="vs-bool-toggle">
                    <button :class="{ active: draft.already_seen === true }" @click="setAlreadySeen(true)">Oui</button>
                    <button :class="{ active: draft.already_seen === false }" @click="setAlreadySeen(false)">Non</button>
                  </div>
                </div>

                <div v-if="draft.already_seen === true" class="vs-bool-group vs-bool-sub">
                  <span class="vs-bool-label">Content de le revoir ?</span>
                  <div class="vs-bool-toggle">
                    <button :class="{ active: draft.happy_to_rewatch === true }" @click="draft.happy_to_rewatch = draft.happy_to_rewatch === true ? null : true">Oui</button>
                    <button :class="{ active: draft.happy_to_rewatch === false }" @click="draft.happy_to_rewatch = draft.happy_to_rewatch === false ? null : false">Non</button>
                  </div>
                </div>

                <template v-if="!isPicker && draft.already_seen !== true">
                  <div class="vs-bool-group">
                    <span class="vs-bool-label">Entendu parler ?</span>
                    <div class="vs-bool-toggle">
                      <button :class="{ active: draft.prior_knowledge === true }" @click="draft.prior_knowledge = draft.prior_knowledge === true ? null : true">Oui</button>
                      <button :class="{ active: draft.prior_knowledge === false }" @click="draft.prior_knowledge = draft.prior_knowledge === false ? null : false">Non</button>
                    </div>
                  </div>

                  <div v-if="draft.prior_knowledge === true" class="vs-bool-group vs-bool-sub">
                    <span class="vs-bool-label">Je voulais le voir ?</span>
                    <div class="vs-bool-toggle">
                      <button :class="{ active: draft.wanted_to_see === true }" @click="draft.wanted_to_see = draft.wanted_to_see === true ? null : true">Oui</button>
                      <button :class="{ active: draft.wanted_to_see === false }" @click="draft.wanted_to_see = draft.wanted_to_see === false ? null : false">Non</button>
                    </div>
                  </div>
                </template>

                <div v-if="!isPicker" class="vs-bool-group">
                  <span class="vs-bool-label">Choix surprenant ?</span>
                  <div class="vs-bool-toggle">
                    <button :class="{ active: draft.surprised_by_pick === true }" @click="draft.surprised_by_pick = draft.surprised_by_pick === true ? null : true">Oui</button>
                    <button :class="{ active: draft.surprised_by_pick === false }" @click="draft.surprised_by_pick = draft.surprised_by_pick === false ? null : false">Non</button>
                  </div>
                </div>
              </div>

              <button class="vs-submit" @click="handleSubmitVote">
                {{ myVote ? 'Mettre à jour' : 'Envoyer mon vote' }}
              </button>
            </div>
          </template>

        </section>

      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { JournalEntry, TmdbMovieDetail, TmdbWatchProvidersResponse, Vote, VoteInput } from '~/types'

const router = useRouter()
const route = useRoute()
const entryId = Number(route.params.id)

const { getEntryById, update } = useJournal()
const { getMovieDetail, getWatchProviders } = useTmdb()
const { profiles, load: loadProfiles } = useProfiles()
const { requireAuth } = useAuth()
const { editEntry } = useEditEntry()

const { data: entry } = await useAsyncData<JournalEntry | null>(
  `entry-${entryId}`,
  () => getEntryById(entryId)
)

const { data: movie, refresh: refreshMovie } = await useAsyncData<TmdbMovieDetail | null>(
  `entry-tmdb-${entryId}`,
  () => entry.value?.tmdb_id ? getMovieDetail(entry.value.tmdb_id) : Promise.resolve(null)
)

const { data: watchProvidersData } = await useAsyncData<TmdbWatchProvidersResponse | null>(
  `entry-providers-${entryId}`,
  () => entry.value?.tmdb_id ? getWatchProviders(entry.value.tmdb_id) : Promise.resolve(null)
)

const providers = computed(() => watchProvidersData.value?.results?.['FR'] ?? null)

await loadProfiles()

const { loadVotes, castVote } = useVotes()
const votes = ref<Vote[]>([])

const user = useSupabaseUser()
const myProfile = computed(() =>
  profiles.value.find(p => p.user_id === ((user.value as any)?.sub ?? user.value?.id))
)
const isLocked = computed(() =>
  profiles.value.length > 0 && votes.value.length >= profiles.value.length
)
const myVote = computed(() =>
  votes.value.find(v => v.profile_id === myProfile.value?.id) ?? null
)
const isPicker = computed(() =>
  myProfile.value !== null && entry.value?.profile_id === myProfile.value?.id
)

const avgRatingFilm = computed(() => {
  const vals = votes.value.map(v => v.rating_film).filter((r): r is number => r !== null)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
})
const avgRatingPick = computed(() => {
  // Exclude the picker's vote — they don't rate their own pick
  const vals = votes.value
    .filter(v => v.profile_id !== entry.value?.profile_id)
    .map(v => v.rating_pick)
    .filter((r): r is number => r !== null)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
})

function sliderStyle(value: number | null): Record<string, string> {
  if (value === null) return { background: 'var(--border-mid)' }
  const pct = ((value - 1) / 9 * 100).toFixed(1)
  return { background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border-mid) ${pct}%)` }
}

const draft = reactive<VoteInput>({
  rating_film: null,
  rating_pick: null,
  already_seen: null,
  happy_to_rewatch: null,
  prior_knowledge: null,
  wanted_to_see: null,
  surprised_by_pick: null,
})

function setAlreadySeen(value: boolean) {
  draft.already_seen = draft.already_seen === value ? null : value
  if (draft.already_seen === true) {
    draft.prior_knowledge = null
    draft.wanted_to_see = null
  } else {
    draft.happy_to_rewatch = null
  }
}

votes.value = await loadVotes(entryId)

watch(myVote, v => {
  if (v) Object.assign(draft, {
    rating_film: v.rating_film,
    rating_pick: v.rating_pick,
    already_seen: v.already_seen,
    happy_to_rewatch: v.happy_to_rewatch,
    prior_knowledge: v.prior_knowledge,
    wanted_to_see: v.wanted_to_see,
    surprised_by_pick: v.surprised_by_pick,
  })
}, { immediate: true })

function hasVoted(profileId: number): boolean {
  return votes.value.some(v => v.profile_id === profileId)
}

function getVote(profileId: number): Vote | undefined {
  return votes.value.find(v => v.profile_id === profileId)
}

async function handleSubmitVote() {
  if (!myProfile.value) return
  await requireAuth(async () => {
    const { error } = await castVote(entryId, myProfile.value!.id, { ...draft })
    if (!error) votes.value = await loadVotes(entryId)
  })
}

async function handleModify() {
  if (!entry.value) return
  await requireAuth(async () => {
    const changes = await editEntry(entry.value!, profiles.value)
    if (changes) {
      await update(entryId, changes)
      entry.value = await getEntryById(entryId)
      await refreshMovie()
    }
  })
}
</script>

<style scoped>
.page-entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.entry-wrapper {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.entry-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-ui);
  font-size: 15px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  transition: color 150ms;
}

@media (hover: hover) {
  .entry-back:hover { color: var(--text); }
}

.entry-status {
  color: var(--text-faint);
  font-size: 14px;
  text-align: center;
  padding: 48px 0;
}

.modify-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 24px;
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  padding: 8px 14px;
  cursor: pointer;
  transition: color 150ms, border-color 150ms, background 150ms;
}

@media (hover: hover) {
  .modify-btn:hover {
    color: var(--text);
    border-color: var(--border-strong);
    background: var(--surface-raised);
  }
}

/* ── Votes section ── */
.vs {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.vs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.vs-title {
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-faint);
  margin: 0;
}

.vs-count {
  font-family: var(--font-ui);
  font-size: 15px;
  color: var(--text-faint);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1px 7px;
}

/* Who has voted */
.vs-who {
  display: flex;
  gap: 14px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.vs-who-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.vs-who-name {
  font-size: 15px;
  color: var(--text-secondary);
}

.vs-who-badge {
  font-size: 15px;
  color: var(--text-faint);
  transition: color 150ms;
}
.vs-who-badge.voted { color: var(--accent); }

/* Averages */
.vs-averages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-md);
  margin-bottom: 20px;
}

.vs-avg-row { display: flex; align-items: center; gap: 10px; }
.vs-avg-label {
  font-size: 14px;
  color: var(--text-secondary);
  flex: 1;
}
.vs-avg-value {
  font-family: var(--font-ui);
  font-size: 18px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: -0.01em;
}

/* Results (locked) */
.vs-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.vs-result:last-child { border-bottom: 1px solid var(--border); }

.vs-result-name {
  font-size: 15px;
  color: var(--text-secondary);
  min-width: 52px;
}

.vs-result--picker {
  background: var(--surface);
  border-radius: var(--r-sm);
  padding-left: 10px;
  padding-right: 10px;
  margin: 0 -10px;
}

.vs-picker-badge {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.vs-tags { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
.vs-tag {
  font-size: 14px;
  color: var(--text-faint);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
}
.vs-tag--pending { font-style: italic; }
.vs-tag--skeptic { color: var(--text-secondary); border-color: var(--border-mid); }

/* Vote form */
.vs-form {
  padding: 18px;
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-md);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.vs-form-title {
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.vs-field { display: flex; flex-direction: column; gap: 10px; }
.vs-field-header { display: flex; align-items: center; justify-content: space-between; }
.vs-field-label {
  font-size: 14px;
  color: var(--text-secondary);
}
.vs-field-value {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
}
.vs-field-value.unset { color: var(--text-faint); }

.rating-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  outline: none;
  cursor: grab;
  transition: height 100ms;
}
.rating-slider:active { cursor: grabbing; }
.rating-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent);
  cursor: grab;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  transition: transform 100ms;
}
.rating-slider:active::-webkit-slider-thumb { transform: scale(1.2); cursor: grabbing; }
.rating-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  cursor: grab;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
}

.vs-bools { display: flex; flex-direction: column; gap: 10px; }
.vs-bool-group { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.vs-bool-sub {
  padding-left: 14px;
  border-left: 2px solid var(--border-mid);
}
.vs-bool-label {
  font-size: 15px;
  color: var(--text-secondary);
}

.vs-bool-toggle {
  display: flex;
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  overflow: hidden;
  flex-shrink: 0;
}
.vs-bool-toggle button {
  background: none;
  border: none;
  padding: 6px 14px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-faint);
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.vs-bool-toggle button + button { border-left: 1px solid var(--border-mid); }
.vs-bool-toggle button.active {
  background: var(--accent);
  color: var(--bg);
}

.vs-submit {
  align-self: flex-start;
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 600;
  color: var(--bg);
  background: var(--accent);
  border: none;
  border-radius: var(--r-sm);
  padding: 9px 20px;
  cursor: pointer;
  transition: opacity 150ms;
}
@media (hover: hover) {
  .vs-submit:hover { opacity: 0.85; }
}
</style>
