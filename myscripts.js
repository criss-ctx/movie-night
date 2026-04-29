// --- Journal ---

async function loadJournal() {
  const res = await fetch('/api/journal');
  const entries = await res.json();
  pickedYears = entries.map(e => Number(e.releaseYear));
  renderJournal(entries);
}

let editingId = null;

function renderJournal(entries) {
  const sorted = [...entries].sort((a, b) => a.watchDate.localeCompare(b.watchDate));
  const html = sorted.length
    ? sorted.map(e => String(e.id) === String(editingId)
        ? `<div class="journal-entry journal-entry--editing" data-id="${e.id}">
            <input class="entry-edit-input" data-field="title" value="${escapeAttr(e.title)}" placeholder="Movie title" />
            <input class="entry-edit-input" data-field="releaseYear" type="number" value="${e.releaseYear}" placeholder="Release year" />
            <input class="entry-edit-input" data-field="pickedBy" value="${escapeAttr(e.pickedBy)}" placeholder="Picked by" />
            <input class="entry-edit-input" data-field="watchDate" type="date" value="${escapeAttr(e.watchDate)}" />
            <div class="entry-actions">
              <button class="save-btn" data-id="${e.id}" aria-label="Enregistrer">&#10003;</button>
              <button class="cancel-btn" aria-label="Annuler">&times;</button>
            </div>
          </div>`
        : `<div class="journal-entry">
            <span class="entry-title">${escapeHtml(e.title)}</span>
            <span class="entry-year">${escapeHtml(String(e.releaseYear))}</span>
            <span class="entry-meta">Choisi par ${escapeHtml(e.pickedBy)} &middot; Vu le ${formatDate(e.watchDate)}</span>
            <div class="entry-actions">
              <button class="edit-btn" data-id="${e.id}" aria-label="Modifier">&#9998;</button>
              <button class="delete-btn" data-id="${e.id}" aria-label="Supprimer">&times;</button>
            </div>
          </div>`
      ).join('')
    : '<p class="journal-empty">Aucune entrée pour l\'instant.<br>Ajoutez votre premier film !</p>';
  document.querySelectorAll('#journal-entries').forEach(el => el.innerHTML = html);
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

document.addEventListener('submit', async (e) => {
  if (!e.target.matches('#journal-form')) return;
  e.preventDefault();
  const form = e.target;
  const entry = {
    title: form.querySelector('#movie-title').value.trim(),
    releaseYear: form.querySelector('#release-year').value,
    pickedBy: form.querySelector('#picked-by').value.trim(),
    watchDate: form.querySelector('#watch-date').value,
  };
  await fetch('/api/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  form.reset();
  loadJournal();
});

document.addEventListener('click', async (e) => {
  if (e.target.matches('.edit-btn')) {
    editingId = e.target.dataset.id;
    loadJournal();
  } else if (e.target.matches('.cancel-btn')) {
    editingId = null;
    loadJournal();
  } else if (e.target.matches('.save-btn')) {
    const id = e.target.dataset.id;
    const card = e.target.closest('.journal-entry--editing');
    const updated = {};
    card.querySelectorAll('.entry-edit-input').forEach(input => {
      updated[input.dataset.field] = input.value;
    });
    await fetch(`/api/journal/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    editingId = null;
    loadJournal();
  } else if (e.target.matches('.delete-btn')) {
    if (!confirm('Supprimer cette entrée définitivement ?')) return;
    await fetch(`/api/journal/${e.target.dataset.id}`, { method: 'DELETE' });
    loadJournal();
  }
});

loadJournal();

// --- Year picker ---

let pickedYears = []

const getRandomYear = (min, max) => Math.round(Math.random() * (max - min) + min)
const getRandomColor = () => Math.round(Math.random() * (360 - 0))

const randomColor = `hsl(${getRandomColor()} 100% 69%)`
document.documentElement.style.setProperty('--glow-color', randomColor);

function getMovieYear(minYear, maxYear) {
  const nbOfYears = maxYear - minYear + 1
  const resultDisplayWrapper = document.querySelector('.result-display-wrapper')
  const resultDisplay = document.querySelector('.result-display')

  // resultDisplay.textContent = getRandomYear(1970, 2023)
  let tempResult
  while(!tempResult || pickedYears.includes(tempResult)) {
    if (pickedYears.length === nbOfYears) tempResult = minYear - 1
    else tempResult = getRandomYear(minYear, maxYear)
  }

  resultDisplay.textContent = tempResult

  resultDisplayWrapper.classList.remove('date-shown-a')
  setTimeout(() => {
    resultDisplayWrapper.classList.add('date-shown-a')
  }, 500);
}
