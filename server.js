const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const JOURNAL_FILE = path.join(__dirname, 'journal.json');

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/journal', (req, res) => {
  const data = fs.existsSync(JOURNAL_FILE) ? fs.readFileSync(JOURNAL_FILE, 'utf8') : '[]';
  res.json(JSON.parse(data));
});

app.post('/api/journal', (req, res) => {
  const data = fs.existsSync(JOURNAL_FILE) ? JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8')) : [];
  const entry = { id: Date.now(), ...req.body };
  data.push(entry);
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(data, null, 2));
  res.json(entry);
});

app.put('/api/journal/:id', (req, res) => {
  const data = fs.existsSync(JOURNAL_FILE) ? JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8')) : [];
  const index = data.findIndex(e => String(e.id) === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  data[index] = { ...data[index], ...req.body };
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(data, null, 2));
  res.json(data[index]);
});

app.delete('/api/journal/:id', (req, res) => {
  const data = fs.existsSync(JOURNAL_FILE) ? JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8')) : [];
  const filtered = data.filter(e => String(e.id) !== req.params.id);
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(filtered, null, 2));
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Movie Night running at http://localhost:3000'));
