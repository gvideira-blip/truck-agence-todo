<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tableau des Ventes – Truck Agence</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --blue: #004472;
    --red: #CD1719;
    --bg: #0d1117;
    --surface: #161b22;
    --surface2: #21262d;
    --border: #30363d;
    --text: #e6edf3;
    --muted: #8b949e;
    --green: #3fb950;
    --orange: #d29922;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Segoe UI', system-ui, sans-serif;
    min-height: 100vh;
    padding: 0;
  }

  /* HEADER */
  header {
    background: var(--blue);
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid var(--red);
  }
  header h1 {
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #fff;
  }
  header .month {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.7);
    margin-top: 2px;
  }
  .header-right {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .nav-links {
    display: flex;
    gap: 8px;
  }
  .nav-links a {
    color: rgba(255,255,255,0.75);
    text-decoration: none;
    font-size: 0.8rem;
    padding: 5px 12px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    transition: all 0.15s;
  }
  .nav-links a:hover { background: rgba(255,255,255,0.1); color: #fff; }

  btn-add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--red);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  /* MAIN */
  main {
    padding: 24px 28px;
  }

  /* RECAP */
  .recap {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  .recap-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 18px 20px;
  }
  .recap-card .label {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  .recap-card .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
  }
  .recap-card .value.green { color: var(--green); }
  .recap-card .value.orange { color: var(--orange); }
  .recap-card .sub {
    font-size: 0.78rem;
    color: var(--muted);
    margin-top: 6px;
  }
  .progress-bar {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin-top: 10px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--green);
    border-radius: 2px;
    transition: width 0.4s;
  }

  /* TOOLBAR */
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .toolbar-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .btn-add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--red);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 9px 18px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .btn-add:hover { opacity: 0.85; }

  /* TABLE */
  .table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
    min-width: 1000px;
  }
  thead th {
    background: var(--surface2);
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 11px 14px;
    text-align: left;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: rgba(255,255,255,0.03); }
  tbody tr.facture { opacity: 0.65; }
  tbody td {
    padding: 10px 14px;
    color: var(--text);
    vertical-align: middle;
  }
  td input[type="text"], td input[type="number"] {
    background: transparent;
    border: none;
    color: var(--text);
    font-size: 0.82rem;
    width: 100%;
    outline: none;
    padding: 2px 0;
    font-family: inherit;
  }
  td input[type="text"]:focus, td input[type="number"]:focus {
    border-bottom: 1px solid var(--blue);
  }
  td input[type="number"] { text-align: right; }
  
  .marge-cell {
    font-weight: 700;
  }
  .marge-cell.positive { color: var(--green); }
  .marge-cell.negative { color: var(--red); }

  /* Checkbox facturé */
  .facture-check {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  .facture-check input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--green);
    cursor: pointer;
  }
  .facture-label {
    font-size: 0.75rem;
    font-weight: 600;
  }
  .facture-label.ok { color: var(--green); }
  .facture-label.pending { color: var(--orange); }

  .btn-delete {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 1rem;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.15s;
    line-height: 1;
  }
  .btn-delete:hover { color: var(--red); background: rgba(205,23,25,0.1); }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
  }
  .empty-state .icon { font-size: 2.5rem; margin-bottom: 12px; }
  .empty-state p { font-size: 0.9rem; }

  .save-indicator {
    font-size: 0.75rem;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .save-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--green);
  }
  .save-dot.saving { background: var(--orange); animation: pulse 0.8s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  .reset-btn {
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .reset-btn:hover { border-color: var(--red); color: var(--red); }

  @media (max-width: 768px) {
    main { padding: 16px; }
    .recap { grid-template-columns: repeat(2, 1fr); }
    header { padding: 12px 16px; }
  }
</style>
</head>
<body>

<header>
  <div>
    <h1>📊 Tableau des Ventes</h1>
    <div class="month" id="currentMonth"></div>
  </div>
  <div class="header-right">
    <div class="save-indicator">
      <div class="save-dot" id="saveDot"></div>
      <span id="saveLabel">Sauvegardé</span>
    </div>
    <nav class="nav-links">
      <a href="/">✅ Todo</a>
      <a href="/tableau-blanc.html">🖊️ Tableau blanc</a>
    </nav>
  </div>
</header>

<main>
  <!-- RECAP -->
  <div class="recap">
    <div class="recap-card">
      <div class="label">Marge facturée</div>
      <div class="value green" id="margeFacturee">0 €</div>
      <div class="sub" id="countFacturee">0 vente(s) facturée(s)</div>
    </div>
    <div class="recap-card">
      <div class="label">Potentiel à facturer</div>
      <div class="value orange" id="margePotentiel">0 €</div>
      <div class="sub" id="countPotentiel">0 vente(s) en cours</div>
    </div>
    <div class="recap-card">
      <div class="label">Total mois</div>
      <div class="value" id="margeTotal">0 €</div>
      <div class="sub" id="countTotal">0 vente(s) au total</div>
    </div>
    <div class="recap-card">
      <div class="label">Objectif mensuel · 50 000 €</div>
      <div class="value" id="pctObjectif">0%</div>
      <div class="sub" id="labelObjectif">0 € réalisés</div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill" style="width:0%"></div>
      </div>
    </div>
  </div>

  <!-- TOOLBAR -->
  <div class="toolbar">
    <span class="toolbar-title">Ventes du mois</span>
    <div style="display:flex;gap:10px;align-items:center;">
      <button class="reset-btn" onclick="confirmReset()">🗑️ Remise à zéro</button>
      <button class="btn-add" onclick="addRow()">+ Ajouter une vente</button>
    </div>
  </div>

  <!-- TABLE -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Acheteur</th>
          <th>Vendeur</th>
          <th>Immat.</th>
          <th>Marque / Modèle</th>
          <th style="text-align:right">Achat HT €</th>
          <th style="text-align:right">Vente HT €</th>
          <th style="text-align:right">Prépa €</th>
          <th style="text-align:right">Marge €</th>
          <th style="text-align:right">%</th>
          <th style="text-align:center">Facturé</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
    <div class="empty-state" id="emptyState">
      <div class="icon">📋</div>
      <p>Aucune vente ce mois-ci.<br>Cliquez sur <strong>+ Ajouter une vente</strong> pour commencer.</p>
    </div>
  </div>
</main>

<script>
const GITHUB_TOKEN = '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';
const REPO = 'gvideira-blip/truck-agence-todo';
const FILE = 'ventes.json';
const OBJECTIF = 50000;

let ventes = [];
let saveTimer = null;
let currentSha = null;

// --- INIT ---
async function init() {
  const now = new Date();
  document.getElementById('currentMonth').textContent =
    now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  await loadData();
  render();
}

// --- GITHUB LOAD ---
async function loadData() {
  try {
    const r = await fetch(`/api/ventes`);
    const d = await r.json();
    ventes = d.ventes || [];
    currentSha = d.sha || null;
  } catch(e) {
    ventes = [];
  }
}

// --- SAVE ---
function scheduleSave() {
  setSaving(true);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveData, 1200);
}

async function saveData() {
  try {
    await fetch('/api/ventes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventes })
    });
    setSaving(false);
  } catch(e) {
    setSaving(false);
  }
}

function setSaving(saving) {
  const dot = document.getElementById('saveDot');
  const label = document.getElementById('saveLabel');
  if (saving) {
    dot.classList.add('saving');
    label.textContent = 'Sauvegarde...';
  } else {
    dot.classList.remove('saving');
    label.textContent = 'Sauvegardé';
  }
}

// --- RENDER ---
function render() {
  const tbody = document.getElementById('tbody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';
  empty.style.display = ventes.length ? 'none' : 'block';

  ventes.forEach((v, i) => {
    const achat = parseFloat(v.achat) || 0;
    const vente = parseFloat(v.vente) || 0;
    const prepa = parseFloat(v.prepa) || 0;
    const marge = vente - achat - prepa;
    const pct = vente > 0 ? ((marge / vente) * 100).toFixed(1) : '—';
    const margeClass = marge >= 0 ? 'positive' : 'negative';

    const tr = document.createElement('tr');
    if (v.facture) tr.classList.add('facture');
    tr.innerHTML = `
      <td style="color:var(--muted);font-size:0.75rem">${i+1}</td>
      <td><input type="text" value="${esc(v.acheteur||'')}" placeholder="Acheteur" onchange="update(${i},'acheteur',this.value)"></td>
      <td><input type="text" value="${esc(v.vendeur||'')}" placeholder="Vendeur" onchange="update(${i},'vendeur',this.value)"></td>
      <td><input type="text" value="${esc(v.immat||'')}" placeholder="AB-123-CD" onchange="update(${i},'immat',this.value)" style="font-family:monospace;letter-spacing:1px"></td>
      <td><input type="text" value="${esc(v.marque||'')}" placeholder="Volvo FH 460" onchange="update(${i},'marque',this.value)"></td>
      <td><input type="number" value="${v.achat||''}" placeholder="0" onchange="update(${i},'achat',this.value)" oninput="recomputeRow(this,${i})"></td>
      <td><input type="number" value="${v.vente||''}" placeholder="0" onchange="update(${i},'vente',this.value)" oninput="recomputeRow(this,${i})"></td>
      <td><input type="number" value="${v.prepa||''}" placeholder="0" onchange="update(${i},'prepa',this.value)" oninput="recomputeRow(this,${i})"></td>
      <td class="marge-cell ${margeClass}" id="marge-${i}">${formatEur(marge)}</td>
      <td style="color:var(--muted);text-align:right;font-size:0.78rem" id="pct-${i}">${pct !== '—' ? pct+'%' : '—'}</td>
      <td style="text-align:center">
        <label class="facture-check">
          <input type="checkbox" ${v.facture?'checked':''} onchange="toggleFacture(${i},this.checked)">
          <span class="facture-label ${v.facture?'ok':'pending'}">${v.facture?'OK':'En att.'}</span>
        </label>
      </td>
      <td><button class="btn-delete" onclick="deleteRow(${i})" title="Supprimer">✕</button></td>
    `;
    tbody.appendChild(tr);
  });

  updateRecap();
}

function recomputeRow(input, i) {
  // live update marge cell without full re-render
  const row = input.closest('tr');
  const inputs = row.querySelectorAll('input[type="number"]');
  const achat = parseFloat(inputs[0].value) || 0;
  const vente = parseFloat(inputs[1].value) || 0;
  const prepa = parseFloat(inputs[2].value) || 0;
  const marge = vente - achat - prepa;
  const pct = vente > 0 ? ((marge/vente)*100).toFixed(1) : '—';
  const margeCell = document.getElementById(`marge-${i}`);
  const pctCell = document.getElementById(`pct-${i}`);
  margeCell.textContent = formatEur(marge);
  margeCell.className = `marge-cell ${marge >= 0 ? 'positive' : 'negative'}`;
  pctCell.textContent = pct !== '—' ? pct+'%' : '—';
  updateRecap();
}

function updateRecap() {
  let facturee = 0, potentiel = 0, cntF = 0, cntP = 0;
  ventes.forEach((v, i) => {
    const achat = parseFloat(v.achat)||0;
    const vente = parseFloat(v.vente)||0;
    const prepa = parseFloat(v.prepa)||0;
    const marge = vente - achat - prepa;
    if (v.facture) { facturee += marge; cntF++; }
    else { potentiel += marge; cntP++; }
  });
  const total = facturee + potentiel;
  const pct = Math.min(Math.round((total / OBJECTIF) * 100), 100);

  document.getElementById('margeFacturee').textContent = formatEur(facturee);
  document.getElementById('margePotentiel').textContent = formatEur(potentiel);
  document.getElementById('margeTotal').textContent = formatEur(total);
  document.getElementById('countFacturee').textContent = `${cntF} vente(s) facturée(s)`;
  document.getElementById('countPotentiel').textContent = `${cntP} vente(s) en cours`;
  document.getElementById('countTotal').textContent = `${cntF+cntP} vente(s) au total`;
  document.getElementById('pctObjectif').textContent = `${pct}%`;
  document.getElementById('labelObjectif').textContent = `${formatEur(total)} réalisés`;
  document.getElementById('progressFill').style.width = pct + '%';
}

// --- ACTIONS ---
function addRow() {
  ventes.push({ acheteur:'', vendeur:'', immat:'', marque:'', achat:'', vente:'', prepa:'', facture:false });
  render();
  // focus first input of last row
  const rows = document.querySelectorAll('#tbody tr');
  if (rows.length) rows[rows.length-1].querySelector('input').focus();
  scheduleSave();
}

function update(i, field, value) {
  ventes[i][field] = value;
  scheduleSave();
}

function toggleFacture(i, checked) {
  ventes[i].facture = checked;
  render();
  scheduleSave();
}

function deleteRow(i) {
  ventes.splice(i, 1);
  render();
  scheduleSave();
}

function confirmReset() {
  if (confirm('Remettre à zéro toutes les ventes du mois ? Cette action est irréversible.')) {
    ventes = [];
    render();
    scheduleSave();
  }
}

// --- UTILS ---
function formatEur(n) {
  return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', minimumFractionDigits:0, maximumFractionDigits:0 }).format(n);
}
function esc(s) {
  return s.replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

init();
</script>
</body>
</html>
