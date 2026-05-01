const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const MIN_YEAR = 1970

// --- Auth ---

let pendingAction = null

function showLoginModal() {
  document.getElementById('login-overlay').style.display = 'flex'
}

function hideLoginModal() {
  document.getElementById('login-overlay').style.display = 'none'
  document.getElementById('login-error').textContent = ''
}

async function requireAuth(action) {
  const { data: { session } } = await client.auth.getSession()
  if (session) {
    await action()
  } else {
    pendingAction = action
    showLoginModal()
  }
}

async function updateAuthUI() {
  const { data: { session } } = await client.auth.getSession()
  document.getElementById('logout-btn').style.display = session ? 'block' : 'none'
}

document.getElementById('login-close').addEventListener('click', () => {
  pendingAction = null
  hideLoginModal()
})

document.getElementById('login-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('login-overlay')) {
    pendingAction = null
    hideLoginModal()
  }
})

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    document.getElementById('login-error').textContent = 'Email ou mot de passe incorrect.'
  } else {
    hideLoginModal()
    updateAuthUI()
    if (pendingAction) {
      await pendingAction()
      pendingAction = null
    }
  }
})

document.getElementById('logout-btn').addEventListener('click', async () => {
  await client.auth.signOut()
  updateAuthUI()
})

// --- Profiles ---

let profiles = []
let selectedPickerProfileId = null

async function loadProfiles() {
  const { data, error } = await client.from('profiles').select('*').order('id')
  if (error) { console.error(error); return }
  profiles = data
  renderPickerProfiles()
  renderFormProfileSelect()
}

function renderPickerProfiles() {
  const el = document.getElementById('picker-profiles')
  el.innerHTML = profiles.map(p =>
    `<button class="profile-btn${selectedPickerProfileId === p.id ? ' profile-btn--selected' : ''}" data-profile-id="${p.id}">${escapeHtml(p.name)}</button>`
  ).join('')
}

function renderFormProfileSelect() {
  const options = '<option value="">— Choisir —</option>' +
    profiles.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')
  const select = document.getElementById('picked-by')
  select.innerHTML = options
  if (selectedPickerProfileId) select.value = selectedPickerProfileId
}

document.getElementById('picker-profiles').addEventListener('click', (e) => {
  if (!e.target.matches('.profile-btn')) return
  selectedPickerProfileId = Number(e.target.dataset.profileId)
  renderPickerProfiles()
  renderFormProfileSelect()
})

// --- Journal ---

async function loadJournal() {
  const { data: entries, error } = await client.from('journal').select('*, profiles(name)').order('watch_date')
  if (error) { console.error(error); return }
  pickedYears = entries.map(e => Number(e.release_year))
  updateLastChooser(entries)
  renderJournal(entries)
}

function updateLastChooser(entries) {
  const last = entries[entries.length - 1]
  document.getElementById('last-chooser').textContent =
    last?.profiles?.name ? `Dernier choix : ${last.profiles.name}` : ''
}

let editingId = null

function renderJournal(entries) {
  const html = entries.length
    ? entries.map(e => String(e.id) === String(editingId)
        ? `<div class="journal-entry journal-entry--editing" data-id="${e.id}">
            <input class="entry-edit-input" data-field="title" value="${escapeAttr(e.title)}" placeholder="Titre du film" />
            <input class="entry-edit-input" data-field="release_year" type="number" value="${e.release_year}" placeholder="Année de sortie" />
            <select class="entry-edit-input" data-field="profile_id">
              ${profiles.map(p => `<option value="${p.id}"${String(e.profile_id) === String(p.id) ? ' selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
            </select>
            <input class="entry-edit-input" data-field="watch_date" type="date" value="${escapeAttr(e.watch_date)}" />
            <div class="entry-actions">
              <button class="save-btn" data-id="${e.id}" aria-label="Enregistrer">&#10003;</button>
              <button class="cancel-btn" aria-label="Annuler">&times;</button>
            </div>
          </div>`
        : `<div class="journal-entry">
            <span class="entry-title">${escapeHtml(e.title)}</span>
            <span class="entry-year">${escapeHtml(String(e.release_year))}</span>
            <span class="entry-meta">Choisi par ${escapeHtml(e.profiles?.name ?? e.picked_by ?? '?')} &middot; Vu le ${formatDate(e.watch_date)}</span>
            <div class="entry-actions">
              <button class="edit-btn" data-id="${e.id}" aria-label="Modifier">&#9998;</button>
              <button class="delete-btn" data-id="${e.id}" aria-label="Supprimer">&times;</button>
            </div>
          </div>`
      ).join('')
    : '<p class="journal-empty">Aucune entrée pour l\'instant.<br>Ajoutez votre premier film !</p>'
  document.getElementById('journal-entries').innerHTML = html
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;')
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

document.addEventListener('submit', async (e) => {
  if (!e.target.matches('#journal-form')) return
  e.preventDefault()
  const form = e.target
  const entry = {
    title: form.querySelector('#movie-title').value.trim(),
    release_year: Number(form.querySelector('#release-year').value),
    profile_id: Number(form.querySelector('#picked-by').value),
    watch_date: form.querySelector('#watch-date').value,
  }
  await requireAuth(async () => {
    const { error } = await client.from('journal').insert(entry)
    if (!error) { form.reset(); renderFormProfileSelect(); loadJournal() }
  })
})

document.addEventListener('click', async (e) => {
  if (e.target.matches('.edit-btn')) {
    await requireAuth(async () => {
      editingId = e.target.dataset.id
      loadJournal()
    })
  } else if (e.target.matches('.cancel-btn')) {
    editingId = null
    loadJournal()
  } else if (e.target.matches('.save-btn')) {
    const id = e.target.dataset.id
    const card = e.target.closest('.journal-entry--editing')
    const updated = {}
    card.querySelectorAll('.entry-edit-input').forEach(input => {
      const val = input.value
      updated[input.dataset.field] = (input.type === 'number' || input.dataset.field === 'profile_id')
        ? Number(val)
        : val
    })
    await requireAuth(async () => {
      const { error } = await client.from('journal').update(updated).eq('id', id)
      if (!error) { editingId = null; loadJournal() }
    })
  } else if (e.target.matches('.delete-btn')) {
    if (!confirm('Supprimer cette entrée définitivement ?')) return
    const id = e.target.dataset.id
    await requireAuth(async () => {
      await client.from('journal').delete().eq('id', id)
      loadJournal()
    })
  }
})

// --- Year picker ---

let pickedYears = []

const getRandomYear = (min, max) => Math.round(Math.random() * (max - min) + min)
const getRandomColor = () => Math.round(Math.random() * 360)

const randomColor = `hsl(${getRandomColor()} 100% 69%)`
document.documentElement.style.setProperty('--glow-color', randomColor)

function getMovieYear(minYear, maxYear) {
  const nbOfYears = maxYear - minYear + 1
  const resultDisplay = document.querySelector('.result-display')

  let year
  while (!year || pickedYears.includes(year)) {
    if (pickedYears.length === nbOfYears) year = minYear - 1
    else year = getRandomYear(minYear, maxYear)
  }

  animateDigits(resultDisplay, year)
}

function animateDigits(el, year) {
  const rollSpeedMs = 180          // how fast digits cycle
  const firstDigitSettleMs = 2000  // delay before the 1st digit locks in
  const delayPerDigitMs = 1500     // extra delay per subsequent digit

  const digits = String(year).split('')
  el.innerHTML = digits.map(() => `<span class="digit">0</span>`).join('')
  const spans = el.querySelectorAll('.digit')

  digits.forEach((finalDigit, i) => {
    const settleAfterMs = firstDigitSettleMs + i * delayPerDigitMs
    let elapsedMs = 0

    const timer = setInterval(() => {
      elapsedMs += rollSpeedMs
      if (elapsedMs >= settleAfterMs) {
        spans[i].textContent = finalDigit
        spans[i].classList.add('settled')
        clearInterval(timer)
      } else {
        spans[i].textContent = Math.floor(Math.random() * 10)
      }
    }, rollSpeedMs)
  })
}

// --- Tab navigation ---

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'))
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.getElementById('tab-' + tab).classList.add('active')
    btn.classList.add('active')
  })
})

loadProfiles()
loadJournal()
updateAuthUI()

document.getElementById('btn-tirage').addEventListener('click', () => {
  getMovieYear(MIN_YEAR, new Date().getFullYear())
})
