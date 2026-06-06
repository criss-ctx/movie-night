<template>
  <Teleport to="body">
    <div
      v-if="personId !== null"
      class="pm-overlay"
      @click.self="closePerson"
    >
      <div
        class="pm-card"
        role="dialog"
        aria-modal="true"
        :aria-label="person?.name ?? 'Fiche personne'"
      >
        <button class="pm-close" @click="closePerson" aria-label="Fermer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div v-if="pending" class="pm-loading">Chargement…</div>

        <template v-else-if="person">
          <div class="pm-header">
            <div class="pm-photo-wrap">
              <img v-if="photoUrl" :src="photoUrl" :alt="person.name" class="pm-photo" />
              <div v-else class="pm-photo-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
            </div>

            <div class="pm-identity">
              <h2 class="pm-name">{{ person.name }}</h2>
              <p v-if="deptLabel" class="pm-dept">{{ deptLabel }}</p>
              <p v-if="personAge" class="pm-age">{{ personAge }}</p>
            </div>
          </div>

          <p v-if="shortBio" class="pm-bio">{{ shortBio }}</p>

          <div v-if="topKnownFilms.length" class="pm-films">
            <span v-for="film in topKnownFilms" :key="film.id" class="pm-film-chip">{{ film.title }}</span>
          </div>

          <NuxtLink :to="`/person/${person.id}`" class="pm-full-link" @click="closePerson">
            Voir la fiche complète →
          </NuxtLink>
        </template>

        <p v-else-if="!pending" class="pm-loading">Impossible de charger cette fiche.</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { TmdbPersonDetail, TmdbPersonMovieCredit } from '~/types'

const { personId, closePerson } = usePersonModal()
const { getPosterUrl, getPersonDetail } = useTmdb()

const person = ref<TmdbPersonDetail | null>(null)
const pending = ref(false)

watch(personId, async (id) => {
  if (id === null) { person.value = null; return }
  pending.value = true
  try {
    person.value = await getPersonDetail(id)
  } catch {
    person.value = null
  } finally {
    pending.value = false
  }
}, { immediate: true })

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && personId.value !== null) closePerson()
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

const photoUrl = computed(() => getPosterUrl(person.value?.profile_path ?? null, 'w185'))

const DEPT_LABELS: Record<string, string> = {
  Acting: 'Acteur · Actrice',
  Directing: 'Réalisateur · Réalisatrice',
  Writing: 'Scénariste',
  Production: 'Production',
  Sound: 'Son',
  'Visual Effects': 'Effets visuels',
  Camera: 'Directeur de la photographie',
  Editing: 'Montage',
}
const deptLabel = computed(() => person.value
  ? (DEPT_LABELS[person.value.known_for_department] ?? person.value.known_for_department)
  : null
)

const personAge = computed(() => {
  const b = person.value?.birthday
  const d = person.value?.deathday
  if (!b) return null
  const birth = new Date(b)
  const ref = d ? new Date(d) : new Date()
  let age = ref.getFullYear() - birth.getFullYear()
  if (ref < new Date(ref.getFullYear(), birth.getMonth(), birth.getDate())) age--
  const birthStr = birth.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return d ? `${birthStr} — †${age} ans` : `${birthStr} · ${age} ans`
})

const shortBio = computed(() => {
  const bio = person.value?.biography
  if (!bio) return ''
  return bio.length > 220 ? bio.slice(0, 220).trimEnd() + '…' : bio
})

const topKnownFilms = computed((): TmdbPersonMovieCredit[] => {
  if (!person.value) return []

  const { cast, crew } = person.value.movie_credits
  const directorCredits = crew.filter(c => c.job === 'Director')

  // Mixed profile: significant credits exist in both acting and directing
  const hasSignificantActing = cast.some(c => c.vote_count > 500)
  const hasSignificantDirecting = directorCredits.some(c => c.vote_count > 500)
  const isMixed = hasSignificantActing && hasSignificantDirecting

  let pool: TmdbPersonMovieCredit[]
  if (isMixed) {
    const seen = new Set<number>()
    pool = [...cast, ...directorCredits].filter(f => !seen.has(f.id) && seen.add(f.id))
  } else {
    pool = person.value.known_for_department === 'Directing' ? directorCredits : cast
  }

  return pool
    .filter(f => f.vote_count > 100)
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 4)
})
</script>

<style scoped>
.pm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(25, 23, 31, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}

.pm-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-md);
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pm-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 150ms;
}

@media (hover: hover) {
  .pm-close:hover { color: var(--text); }
}

.pm-loading {
  font-size: var(--text-meta);
  color: var(--text-faint);
  text-align: center;
  padding: 20px 0;
  margin: 0;
}

.pm-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding-right: 24px;
}

.pm-photo-wrap {
  flex-shrink: 0;
  width: 72px;
}

.pm-photo {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: var(--r-sm);
  display: block;
}

.pm-photo-placeholder {
  width: 100%;
  aspect-ratio: 2/3;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
}

.pm-identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 2px;
}

.pm-name {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  line-height: 1.2;
}

.pm-dept {
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0;
}

.pm-age {
  font-size: var(--text-meta);
  color: var(--text-secondary);
  margin: 0;
}

.pm-bio {
  font-size: var(--text-body);
  line-height: var(--leading-prose);
  color: var(--text-secondary);
  margin: 0;
  padding-top: 4px;
  border-top: 1px solid var(--border);
}

.pm-films {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pm-film-chip {
  font-size: var(--text-label);
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 10px;
}

.pm-full-link {
  display: inline-block;
  font-size: var(--text-label);
  font-weight: 500;
  color: var(--accent);
  text-decoration: none;
  align-self: flex-start;
  transition: opacity 150ms;
  padding-top: 2px;
}

@media (hover: hover) {
  .pm-full-link:hover { opacity: 0.75; }
}
</style>
