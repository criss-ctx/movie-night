const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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

// --- Journal ---

async function loadJournal() {
  const { data: entries, error } = await client.from('journal').select('*').order('watch_date')
  if (error) { console.error(error); return }
  pickedYears = entries.map(e => Number(e.release_year))
  renderJournal(entries)
}

let editingId = null

function renderJournal(entries) {
  const html = entries.length
    ? entries.map(e => String(e.id) === String(editingId)
        ? `<div class="journal-entry journal-entry--editing" data-id="${e.id}">
            <input class="entry-edit-input" data-field="title" value="${escapeAttr(e.title)}" placeholder="Titre du film" />
            <input class="entry-edit-input" data-field="release_year" type="number" value="${e.release_year}" placeholder="Année de sortie" />
            <input class="entry-edit-input" data-field="picked_by" value="${escapeAttr(e.picked_by)}" placeholder="Choisi par" />
            <input class="entry-edit-input" data-field="watch_date" type="date" value="${escapeAttr(e.watch_date)}" />
            <div class="entry-actions">
              <button class="save-btn" data-id="${e.id}" aria-label="Enregistrer">&#10003;</button>
              <button class="cancel-btn" aria-label="Annuler">&times;</button>
            </div>
          </div>`
        : `<div class="journal-entry">
            <span class="entry-title">${escapeHtml(e.title)}</span>
            <span class="entry-year">${escapeHtml(String(e.release_year))}</span>
            <span class="entry-meta">Choisi par ${escapeHtml(e.picked_by)} &middot; Vu le ${formatDate(e.watch_date)}</span>
            <div class="entry-actions">
              <button class="edit-btn" data-id="${e.id}" aria-label="Modifier">&#9998;</button>
              <button class="delete-btn" data-id="${e.id}" aria-label="Supprimer">&times;</button>
            </div>
          </div>`
      ).join('')
    : '<p class="journal-empty">Aucune entrée pour l\'instant.<br>Ajoutez votre premier film !</p>'
  document.querySelectorAll('#journal-entries').forEach(el => el.innerHTML = html)
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
    picked_by: form.querySelector('#picked-by').value.trim(),
    watch_date: form.querySelector('#watch-date').value,
  }
  await requireAuth(async () => {
    const { error } = await client.from('journal').insert(entry)
    if (!error) { form.reset(); loadJournal() }
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
      updated[input.dataset.field] = input.value
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
  const resultDisplayWrapper = document.querySelector('.result-display-wrapper')
  const resultDisplay = document.querySelector('.result-display')

  let tempResult
  while (!tempResult || pickedYears.includes(tempResult)) {
    if (pickedYears.length === nbOfYears) tempResult = minYear - 1
    else tempResult = getRandomYear(minYear, maxYear)
  }

  resultDisplay.textContent = tempResult
  resultDisplayWrapper.classList.remove('date-shown-a')
  setTimeout(() => { resultDisplayWrapper.classList.add('date-shown-a') }, 500)
}

loadJournal()
updateAuthUI()
