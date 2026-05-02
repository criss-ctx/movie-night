<template>
  <div class="page-picker">
    <p class="slide-label">Année du film<br>de la prochaine séance</p>

    <div class="profile-selector">
      <button
        v-for="profile in profiles"
        :key="profile.id"
        class="profile-btn"
        :class="{ 'profile-btn--selected': selectedProfileId === profile.id }"
        @click="selectedProfileId = profile.id"
      >{{ profile.name }}</button>
    </div>

    <p class="last-chooser">{{ lastChooser ? `Dernier choix : ${lastChooser}` : '' }}</p>

    <button class="glowing-btn" @click="drawYear">
      <span class="glowing-txt">G<span class="faulty-letter">O</span></span>
    </button>

    <div class="result-display-wrapper">
      <p ref="resultDisplay" class="result-display"></p>
    </div>

    <button
      v-if="lastDrawnYear && !pendingDraw"
      class="memoriser-btn"
      :disabled="!selectedProfileId"
      @click="handleMemorize"
    >Mémoriser ce tirage</button>

    <NuxtLink
      v-if="yearRevealed"
      :to="`/discover/${lastDrawnYear}`"
      class="discover-btn"
    >Découvrir les films de {{ lastDrawnYear }}</NuxtLink>
  </div>
</template>

<script setup lang="ts">
const MIN_YEAR = 1970

const { profiles, load: loadProfiles } = useProfiles()
const { load: loadJournal, pickedYears, lastChooser } = useJournal()
const { pendingDraw, load: loadPendingDraw, save: savePendingDraw } = usePendingDraw()
const { requireAuth } = useAuth()
const { theme } = useTheme()

const selectedProfileId = ref<number | null>(null)
const lastDrawnYear = ref<number | null>(null)
const yearRevealed = ref(false)
const resultDisplay = ref<HTMLElement | null>(null)

function drawYear() {
  const maxYear = new Date().getFullYear()
  const total = maxYear - MIN_YEAR + 1
  let year: number

  if (pickedYears.value.length >= total) {
    year = MIN_YEAR - 1
  } else {
    do {
      year = Math.round(Math.random() * (maxYear - MIN_YEAR) + MIN_YEAR)
    } while (pickedYears.value.includes(year))
  }

  lastDrawnYear.value = year
  yearRevealed.value = false
  animateDigits(year)
}

function animateDigits(year: number) {
  if (!resultDisplay.value) return

  const rollSpeedMs = 180
  const firstDigitSettleMs = 2000
  const delayPerDigitMs = 1500

  const digits = String(year).split('')
  resultDisplay.value.innerHTML = digits.map(() => `<span class="digit">0</span>`).join('')
  const spans = resultDisplay.value.querySelectorAll('.digit')

  digits.forEach((finalDigit, i) => {
    const settleAfterMs = firstDigitSettleMs + i * delayPerDigitMs
    let elapsedMs = 0

    const timer = setInterval(() => {
      elapsedMs += rollSpeedMs
      if (elapsedMs >= settleAfterMs) {
        ;(spans[i] as HTMLElement).textContent = finalDigit
        ;(spans[i] as HTMLElement).classList.add('settled')
        clearInterval(timer)
        if (i === digits.length - 1) yearRevealed.value = true
      } else {
        ;(spans[i] as HTMLElement).textContent = String(Math.floor(Math.random() * 10))
      }
    }, rollSpeedMs)
  })
}

async function handleMemorize() {
  if (!lastDrawnYear.value || !selectedProfileId.value) return
  await requireAuth(async () => {
    await savePendingDraw(selectedProfileId.value!, lastDrawnYear.value!)
  })
}

const glowHue = Math.round(Math.random() * 360)

function updateGlowColor() {
  const lightness = theme.value === 'dark' ? 69 : 48
  document.documentElement.style.setProperty('--glow-color', `hsl(${glowHue} 100% ${lightness}%)`)
}

onMounted(updateGlowColor)
watch(theme, updateGlowColor)

await Promise.all([loadProfiles(), loadJournal(), loadPendingDraw()])
</script>
