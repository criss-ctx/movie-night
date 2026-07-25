<template>
  <div class="page-picker">
    <div class="picker-header">
      <p class="slide-label">Prochaine séance</p>

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
    </div>

    <div class="picker-center">
      <button class="glowing-btn" @click="drawYear">
        <span class="glowing-txt">G<span class="faulty-letter">O</span></span>
      </button>

      <div class="result-zone">
        <div v-if="!(isJoker && yearRevealed)" class="result-display-wrapper">
          <p ref="resultDisplay" class="result-display"></p>
        </div>
        <div v-else class="joker-picker">
          <span class="joker-picker-label">Choisis ton année</span>
          <div class="year-input-frame" :class="{ 'year-input-frame--valid': jokerYearValid }">
            <input
              v-model.number="jokerYear"
              type="number"
              :min="MIN_YEAR"
              :max="MAX_YEAR"
              class="joker-year-input"
            />
          </div>
          <span class="joker-year-hint">{{ MIN_YEAR }} – {{ MAX_YEAR }}</span>
        </div>
      </div>
    </div>

    <div ref="pickerActions" class="picker-actions">
      <button
        v-if="showMemorize"
        class="memoriser-btn"
        :disabled="!canMemorize"
        @click="handleMemorize"
      >Mémoriser ce tirage</button>

      <NuxtLink
        v-if="yearRevealed && effectiveYear"
        :to="`/discover/${effectiveYear}`"
        class="discover-btn"
      >Découvrir les films de {{ effectiveYear }}</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const MIN_YEAR = 1970
const MAX_YEAR = new Date().getFullYear() - 1
const JOKER_PROBABILITY = 0.1

const { profiles, load: loadProfiles } = useProfiles()
const { load: loadJournal, pickedYears, lastChooser } = useJournal()
const { pendingDraw, load: loadPendingDraw, save: savePendingDraw } = usePendingDraw()
const { requireAuth } = useAuth()
const { theme } = useTheme()

const selectedProfileId = ref<number | null>(null)


const lastDrawnYear = ref<number | null>(null)
const isJoker = ref(false)
const jokerYear = ref<number | null>(null)
const yearRevealed = ref(false)
const resultDisplay = ref<HTMLElement | null>(null)
const pickerActions = ref<HTMLElement | null>(null)

const jokerYearValid = computed(() =>
  jokerYear.value !== null && jokerYear.value >= MIN_YEAR && jokerYear.value <= MAX_YEAR
)

const effectiveYear = computed(() => isJoker.value ? jokerYear.value : lastDrawnYear.value)

const showMemorize = computed(() => {
  if (!yearRevealed.value || pendingDraw.value || !selectedProfileId.value) return false
  return isJoker.value || lastDrawnYear.value !== null
})

const canMemorize = computed(() =>
  showMemorize.value && (!isJoker.value || jokerYearValid.value)
)

function drawYear() {
  const total = MAX_YEAR - MIN_YEAR + 1
  isJoker.value = false
  jokerYear.value = null
  yearRevealed.value = false

  if (Math.random() < JOKER_PROBABILITY) {
    isJoker.value = true
    lastDrawnYear.value = null
    const visualYear = Math.round(Math.random() * (MAX_YEAR - MIN_YEAR) + MIN_YEAR)
    animateDigits(visualYear, () => setTimeout(revealJoker, 1500))
    return
  }

  let year: number
  if (pickedYears.value.length >= total) {
    year = MIN_YEAR - 1
  } else {
    do {
      year = Math.round(Math.random() * (MAX_YEAR - MIN_YEAR) + MIN_YEAR)
    } while (pickedYears.value.includes(year))
  }

  lastDrawnYear.value = year
  animateDigits(year, () => setTimeout(() => { yearRevealed.value = true }, 1500))
}

function generateFakeYear(realYear: number): number {
  let fake: number
  do {
    fake = Math.round(Math.random() * (MAX_YEAR - MIN_YEAR) + MIN_YEAR)
  } while (fake === realYear)
  return fake
}

function animateDigits(year: number, onReveal: () => void) {
  if (!resultDisplay.value) return

  const rollSpeedMs = 180
  const firstSettleMs = 2000
  const delayPerDigitMs = 1500
  const pauseMs = 800
  const rerollMs = 1200
  const rerollGapMs = 400

  const digits = String(year).split('')
  resultDisplay.value.innerHTML = digits.map(() => `<span class="digit">0</span>`).join('')
  const spans = Array.from(resultDisplay.value.querySelectorAll('.digit')) as HTMLElement[]

  // Settle order: last → 2nd → 1st → 3rd (breaks the 1→9 predictability)
  const settleOrder = [3, 1, 0, 2]
  const scenario = Math.floor(Math.random() * 3) + 1

  // Phase 1 targets: sc1 = real year, sc2 = fake year with correct last digit, sc3 = fully fake
  const phase1Digits = scenario === 1
    ? digits
    : (() => {
        const fake = String(generateFakeYear(year)).split('')
        if (scenario === 2) fake[3] = digits[3] // last digit was "right" all along
        return fake
      })()

  // All 4 digits start rolling simultaneously
  const timers = spans.map(span =>
    setInterval(() => { span.textContent = String(Math.floor(Math.random() * 10)) }, rollSpeedMs)
  )

  // Phase 1: settle each digit to phase1Digits in settleOrder
  settleOrder.forEach((digitIndex, order) => {
    setTimeout(() => {
      clearInterval(timers[digitIndex])
      spans[digitIndex].textContent = phase1Digits[digitIndex]
      spans[digitIndex].classList.add('settled')
    }, firstSettleMs + order * delayPerDigitMs)
  })

  const phase1EndMs = firstSettleMs + (settleOrder.length - 1) * delayPerDigitMs

  if (scenario === 1) {
    setTimeout(onReveal, phase1EndMs)
    return
  }

  // Phase 2: re-roll the 3 wrong digits (0, 1, 2) in shuffled order to their correct values
  const rerollOrder = [0, 1, 2].sort(() => Math.random() - 0.5)
  rerollOrder.forEach((digitIndex, order) => {
    const startAt = phase1EndMs + pauseMs + order * (rerollMs + rerollGapMs)
    setTimeout(() => {
      spans[digitIndex].classList.remove('settled')
      let elapsed = 0
      const t = setInterval(() => {
        elapsed += rollSpeedMs
        if (elapsed >= rerollMs) {
          clearInterval(t)
          spans[digitIndex].textContent = digits[digitIndex]
          spans[digitIndex].classList.add('settled')
        } else {
          spans[digitIndex].textContent = String(Math.floor(Math.random() * 10))
        }
      }, rollSpeedMs)
    }, startAt)
  })

  const phase2EndMs = phase1EndMs + pauseMs + rerollOrder.length * (rerollMs + rerollGapMs)

  if (scenario === 2) {
    setTimeout(onReveal, phase2EndMs)
    return
  }

  // Scenario 3 only: the "confirmed" last digit was fake — re-roll it as a final surprise
  setTimeout(() => {
    spans[3].classList.remove('settled')
    let elapsed = 0
    const t = setInterval(() => {
      elapsed += rollSpeedMs
      if (elapsed >= rerollMs) {
        clearInterval(t)
        spans[3].textContent = digits[3]
        spans[3].classList.add('settled')
        onReveal()
      } else {
        spans[3].textContent = String(Math.floor(Math.random() * 10))
      }
    }, rollSpeedMs)
  }, phase2EndMs + pauseMs)
}

function revealJoker() {
  if (!resultDisplay.value) return

  // Phase 1: each digit bursts with staggered delay for organic chaos
  const spans = Array.from(resultDisplay.value.querySelectorAll('.digit')) as HTMLElement[]
  spans.forEach((span, i) => {
    span.classList.remove('settled')
    span.style.animationDelay = `${i * 25}ms`
    span.classList.add('static-bursting')
  })

  // Phase 2: silence, then JOKER is just… there
  setTimeout(() => {
    if (!resultDisplay.value) return
    resultDisplay.value.innerHTML = 'JOKER'.split('').map(l =>
      `<span class="digit joker-letter">${l}</span>`
    ).join('')

    setTimeout(() => {
      const jokerSpans = Array.from(resultDisplay.value!.querySelectorAll('.digit')) as HTMLElement[]
      jokerSpans.forEach(span => span.classList.add('settled'))
      setTimeout(() => { yearRevealed.value = true }, 2000)
    }, 80)
  }, 620)
}

async function handleMemorize() {
  const year = isJoker.value ? jokerYear.value : lastDrawnYear.value
  if (!year || !selectedProfileId.value) return
  await requireAuth(async () => {
    await savePendingDraw(selectedProfileId.value!, year!)
  })
}

const glowHue = Math.round(Math.random() * 360)

function updateGlowColor() {
  const lightness = theme.value === 'dark' ? 69 : 48
  document.documentElement.style.setProperty('--glow-color', `hsl(${glowHue} 100% ${lightness}%)`)
}

if (import.meta.client) updateGlowColor()
watch(theme, updateGlowColor)

const hasPickerActions = computed(() =>
  showMemorize.value || (yearRevealed.value && !!effectiveYear.value)
)

watch(hasPickerActions, (has) => {
  if (has) {
    nextTick(() => {
      setTimeout(() => {
        const container = pickerActions.value?.closest('.page-picker') as HTMLElement | null
        if (container && container.scrollHeight > container.clientHeight) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
        }
      }, 50)
    })
  }
})

await Promise.all([loadProfiles(), loadJournal(), loadPendingDraw()])
</script>

<style scoped>
.page-picker {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow-y: auto;
  background: radial-gradient(ellipse 70% 50% at 50% 55%, var(--surface) 0%, transparent 100%);
}

.picker-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 24px 0;
  width: 100%;
  flex-shrink: 0;
}

.picker-center {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(28px, 4vh, 80px) 24px 0;
  width: 100%;
}

.picker-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 32px;
  width: 100%;
}

.result-zone {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 38px;
}

.slide-label {
  font-size: var(--text-label);
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
  font-size: var(--text-label);
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
  font-size: var(--text-meta);
  color: var(--text-faint);
  margin: 10px 0 16px;
  min-height: 1em;
}

.result-display-wrapper {
  position: relative;
  padding: 16px 24px;
}

.result-display {
  font-family: var(--font-display);
  font-size: clamp(52px, 18vw, 80px);
  font-weight: 600;
  letter-spacing: 0.25em;
  margin: 0;
  min-height: clamp(52px, 18vw, 80px);
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

:global(.result-display .digit.joker-letter) {
  letter-spacing: 0.12em;
}

:global(.result-display .digit.static-bursting) {
  animation: tv-static-burst 0.52s ease-in forwards;
}

@keyframes tv-static-burst {
  0%   { transform: translate(0,0) scale(1);             color: var(--text);       opacity: 1;    text-shadow: none; filter: none; }
  8%   { transform: translate(-4px, 2px) scale(1.04);    color: #fff;              opacity: 1;    text-shadow:  6px 0 0 #ff2200, -6px 0 0 #00ccff,  0  4px 0 #ffff00; filter: brightness(2.5); }
  18%  { transform: translate( 7px,-4px) skewX(-4deg);   color: var(--glow-color); opacity: 1;    text-shadow: -9px 0 0 #ff0066,  9px 0 0 #00ffcc,  0 -5px 0 #ff00ff; filter: brightness(6) contrast(1.5); }
  28%  { transform: translate(-4px, 6px) scale(0.96);    color: #fff;              opacity: 0.95; text-shadow:  5px 5px 0 #ffcc00, -5px -5px 0 #ff0000, 10px 0 0 #00ffff; filter: brightness(2); }
  38%  { transform: translate( 9px,-5px) skewX(5deg);    color: var(--glow-color); opacity: 1;    text-shadow: 11px 0 0 #00ffff, -11px 0 0 #ff2200,  0  7px 0 #ff00cc; filter: brightness(7) hue-rotate(90deg); }
  47%  { transform: translate(-7px, 3px) scale(1.05);    color: #fff;              opacity: 0.9;  text-shadow: -8px 3px 0 #ff2200,  8px -3px 0 #0055ff, 4px 8px 0 #00ff88; filter: brightness(4); }
  56%  { transform: translate( 5px,-8px) skewX(-6deg);   color: var(--glow-color); opacity: 0.75; text-shadow: 12px 0 0 #00ff66, -12px 0 0 #ff00cc, -5px -7px 0 #ffee00; filter: brightness(5) contrast(2); }
  65%  { transform: translate(-9px, 4px) scale(0.94);    color: #fff;              opacity: 0.6;  text-shadow: -5px 8px 0 #ffee00,  5px -8px 0 #ff2200, 10px 3px 0 #00ccff; filter: brightness(3) hue-rotate(180deg); }
  74%  { transform: translate( 6px,-3px) skewX(4deg);    color: var(--glow-color); opacity: 0.45; text-shadow: 10px -5px 0 #00ffff,-10px  5px 0 #ff2200,  0  -8px 0 #ff00aa; filter: brightness(6); }
  84%  { transform: translate(-4px, 5px) scale(1.02);    color: #fff;              opacity: 0.28; text-shadow: -7px 0 0 #ff2200,   7px 0 0 #00ff88,   0   5px 0 #ffcc00; filter: brightness(2.5); }
  93%  { transform: translate( 2px,-2px);                 color: var(--glow-color); opacity: 0.12; text-shadow:  4px -4px 0 #00ffff, -4px  4px 0 #ff2200; filter: brightness(4); }
  100% { transform: translate(0,0) scale(1);              color: #fff;              opacity: 0;    text-shadow: none; filter: none; }
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
  font-family: var(--font-ui);
  font-size: var(--text-meta);
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

.joker-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: picker-emerge 0.5s ease-out both;
}

@keyframes picker-emerge {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.joker-picker-label {
  font-family: var(--font-ui);
  font-size: var(--text-meta);
  font-weight: 400;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.year-input-frame {
  position: relative;
  display: inline-flex;
  padding: 8px 20px;
}

.year-input-frame::before,
.year-input-frame::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--glow-color);
  border-style: solid;
  opacity: 0.5;
  transition: opacity 200ms;
}

.year-input-frame::before {
  top: 0; left: 0;
  border-width: 1.5px 0 0 1.5px;
}

.year-input-frame::after {
  bottom: 0; right: 0;
  border-width: 0 1.5px 1.5px 0;
}

.year-input-frame:focus-within::before,
.year-input-frame:focus-within::after {
  opacity: 1;
}

.year-input-frame--valid::before,
.year-input-frame--valid::after {
  opacity: 1;
  box-shadow: 0 0 6px var(--glow-color);
}

.joker-year-hint {
  font-family: var(--font-ui);
  font-size: var(--text-meta);
  color: var(--text-faint);
  letter-spacing: 0.1em;
}

.joker-year-input {
  font-family: var(--font-display);
  font-size: clamp(36px, 10vw, 52px);
  text-align: center;
  width: 5ch;
  background: none;
  border: none;
  color: var(--text);
  outline: none;
  caret-color: var(--glow-color);
  letter-spacing: 0.1em;
  padding: 0;
}

.joker-year-input::-webkit-outer-spin-button,
.joker-year-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.joker-year-input[type=number] { -moz-appearance: textfield; }

.discover-btn {
  font-family: var(--font-ui);
  font-size: var(--text-meta);
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
