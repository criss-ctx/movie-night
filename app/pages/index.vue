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

if (import.meta.client) updateGlowColor()
watch(theme, updateGlowColor)

await Promise.all([loadProfiles(), loadJournal(), loadPendingDraw()])
</script>

<style scoped>
.page-picker {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(ellipse 70% 50% at 50% 55%, var(--surface) 0%, transparent 100%);
  overflow: hidden;
}

.slide-label {
  font-size: 15px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.7;
  margin: 0 0 44px;
}

.glowing-btn {
  position: relative;
  color: var(--glow-color);
  padding: 0.35em 1em;
  border: 0.15em solid var(--glow-color);
  border-radius: 0.45em;
  background: none;
  perspective: 2em;
  font-family: "Raleway", sans-serif;
  font-size: clamp(1.4em, 7vw, 2em);
  font-weight: 900;
  letter-spacing: 1em;
  box-shadow:
    inset 0 0 0.5em 0 var(--glow-color),
    0 0 0.5em 0 var(--glow-color);
  animation: border-flicker 2s linear infinite;
  cursor: pointer;
  min-height: 56px;
  min-width: 120px;
}

.glowing-txt {
  float: left;
  margin-right: -0.8em;
  text-shadow:
    0 0 0.125em hsl(0 0% 100% / 0.3),
    0 0 0.45em var(--glow-color);
  animation: text-flicker 3s linear infinite;
}

.faulty-letter {
  opacity: 0.5;
  animation: faulty-flicker 2s linear infinite;
}

.glowing-btn::before {
  content: "";
  position: absolute;
  top: 0; bottom: 0; left: 0; right: 0;
  opacity: 0.7;
  filter: blur(1em);
  transform: translateY(120%) rotateX(95deg) scale(1, 0.35);
  background: var(--glow-color);
  pointer-events: none;
}

.glowing-btn::after {
  content: "";
  position: absolute;
  border-radius: 0.20em;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  opacity: 0;
  z-index: -1;
  background-color: var(--glow-color);
  box-shadow: 0 0 2em 0.2em var(--glow-color);
  transition: opacity 100ms linear;
}

@media (hover: hover) {
  .glowing-btn:hover {
    color: rgba(0, 0, 0, 0.85);
    text-shadow: none;
    animation: none;
  }
  .glowing-btn:hover .glowing-txt      { animation: none; }
  .glowing-btn:hover .faulty-letter    { animation: none; text-shadow: none; opacity: 1; }
  .glowing-btn:hover::before           { filter: blur(1.5em); opacity: 1; }
  .glowing-btn:hover::after            { opacity: 1; }
}

.profile-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 6px;
}

.profile-btn {
  font-family: var(--font-ui);
  font-size: 0.85rem;
  padding: 7px 16px;
  min-height: 36px;
  border: 1px solid var(--border-mid);
  border-radius: 999px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 150ms, color 150ms, box-shadow 150ms;
}

.profile-btn--selected {
  border-color: var(--glow-color);
  color: var(--text);
  box-shadow: 0 0 8px var(--glow-color);
}

.last-chooser {
  font-size: 0.8rem;
  color: var(--text-faint);
  margin: 0 0 20px;
  min-height: 1em;
}

.result-display-wrapper {
  position: relative;
  padding: 16px 24px;
  margin-top: 48px;
}

.result-display {
  font-family: var(--font-display);
  font-size: clamp(52px, 18vw, 80px);
  font-weight: 600;
  letter-spacing: 0.25em;
  margin: 0;
  min-height: 70px;
  transform: translateX(0.12em);
  color: var(--text);
}

/* .digit spans are created dynamically via innerHTML — :global() bypasses scoping */
:global(.result-display .digit) {
  display: inline-block;
  opacity: 0.3;
  transition: opacity 80ms;
}

:global(.result-display .digit.settled) {
  opacity: 1;
  text-shadow: 0 0 12px var(--glow-color), 0 0 30px var(--glow-color);
}

:global([data-theme="light"] .result-display .digit.settled) {
  text-shadow: 0 2px 12px rgba(122, 92, 30, 0.2);
}

@media (prefers-reduced-motion: reduce) {
  .glowing-btn,
  .glowing-txt,
  .faulty-letter {
    animation: none;
  }
  .glowing-btn {
    opacity: 1;
  }
}

[data-theme="light"] .glowing-btn {
  font-family: var(--font-display);
  font-weight: 600;
  color: #f5ead8;
  background: #261a10;
  border: none;
  border-radius: 0.25em;
  padding: 0.25em 1.1em;
  animation: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  box-shadow:
    0 3px 0 #120e08,
    0 5px 20px rgba(18, 14, 8, 0.22);
  transition: transform 80ms ease, box-shadow 80ms ease;
}

[data-theme="light"] .glowing-btn::before { display: none; }
[data-theme="light"] .glowing-btn::after  { display: none; }

@media (hover: hover) {
  [data-theme="light"] .glowing-btn:hover {
    color: #f5ead8;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    animation: none;
  }
  [data-theme="light"] .glowing-btn:hover::before { display: none; }
  [data-theme="light"] .glowing-btn:hover::after  { display: none; }
  [data-theme="light"] .glowing-btn:hover .glowing-txt   { animation: none; }
  [data-theme="light"] .glowing-btn:hover .faulty-letter { animation: none; opacity: 1; text-shadow: none; }
}

[data-theme="light"] .glowing-btn:active {
  transform: translateY(3px);
  box-shadow:
    0 0 0 #120e08,
    0 1px 8px rgba(18, 14, 8, 0.15);
}

[data-theme="light"] .glowing-txt {
  animation: none;
  opacity: 1;
  text-shadow: none;
}

[data-theme="light"] .faulty-letter {
  animation: none;
  opacity: 1;
  display: inline-block;
  transform: none;
}

[data-theme="light"] .profile-btn--selected {
  border-color: var(--accent);
  box-shadow: none;
}

.memoriser-btn {
  margin-top: 16px;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 10px 20px;
  cursor: pointer;
  transition: color 150ms, border-color 150ms;
}

.memoriser-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (hover: hover) {
  .memoriser-btn:not(:disabled):hover {
    color: var(--text-secondary);
    border-color: var(--border-mid);
  }
}

.discover-btn {
  margin-top: 16px;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--accent);
  background: none;
  border: 1px solid rgba(201, 165, 90, 0.35);
  border-radius: var(--r-sm);
  padding: 10px 20px;
  transition: color 150ms, border-color 150ms, background 150ms;
  display: inline-block;
}

@media (hover: hover) {
  .discover-btn:hover {
    background: rgba(201, 165, 90, 0.08);
    border-color: var(--accent);
  }
}
</style>
