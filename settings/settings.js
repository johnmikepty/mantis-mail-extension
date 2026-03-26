// settings.js — Config persistence
// Handles: mantis_url, api_token, agent_name, templates CRUD

const $ = id => document.getElementById(id);

// ── Storage helpers ─────────────────────────────────────────────────────────

function load(keys) {
  return new Promise(resolve => chrome.storage.sync.get(keys, resolve));
}

function save(data) {
  return new Promise(resolve => chrome.storage.sync.set(data, resolve));
}

// ── API via background worker (no CORS) ─────────────────────────────────────

function sendToBackground(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!response?.ok) {
        reject(new Error(response?.error || 'Unknown error'));
      } else {
        resolve(response.data);
      }
    });
  });
}

// ── Toast ────────────────────────────────────────────────────────────────────

let toastTimer;
function showToast(msg, type = 'ok') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 2800);
}

// ── Sidebar navigation ───────────────────────────────────────────────────────

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    $(`section-${item.dataset.section}`).classList.add('active');
  });
});

// ── Connection section ───────────────────────────────────────────────────────

async function loadConnection() {
  const data = await load(['mantis_url', 'api_token', 'agent_name']);
  if (data.mantis_url) $('mantis-url').value = data.mantis_url;
  if (data.api_token)  $('api-token').value  = data.api_token;
  if (data.agent_name) $('agent-name').value = data.agent_name;
}

$('btn-save-conn').addEventListener('click', async () => {
  const url   = $('mantis-url').value.trim().replace(/\/$/, '');
  const token = $('api-token').value.trim();
  if (!url || !token) { showToast('Completá URL y token', 'fail'); return; }
  await save({ mantis_url: url, api_token: token });
  showToast('Conexión guardada ✓');
});

$('btn-save-agent').addEventListener('click', async () => {
  const name = $('agent-name').value.trim();
  if (!name) { showToast('Ingresá un nombre de agente', 'fail'); return; }
  await save({ agent_name: name });
  showToast('Agente guardado ✓');
});

$('btn-test').addEventListener('click', async () => {
  const url   = $('mantis-url').value.trim().replace(/\/$/, '');
  const token = $('api-token').value.trim();
  const status = $('conn-status');

  if (!url || !token) { showToast('Completá URL y token primero', 'fail'); return; }

  status.className = 'status-badge idle';
  status.textContent = 'Probando…';

  try {
    const data = await sendToBackground({ action: 'testConnection', url, token });
    const username = data.account?.name || data.name || 'usuario';
    status.className = 'status-badge ok';
    status.textContent = `✓ ${username}`;
    showToast(`Conectado como ${username}`);
    await save({ mantis_url: url, api_token: token });
  } catch (err) {
    status.className = 'status-badge fail';
    status.textContent = '✗ Error';
    showToast(`Error: ${err.message}`, 'fail');
  }
});

// ── Templates section ────────────────────────────────────────────────────────

let templates = [];

async function loadTemplates() {
  const data = await load(['templates']);
  templates = data.templates || [];
  renderTemplates();
}

function renderTemplates() {
  const list = $('template-list');

  if (templates.length === 0) {
    list.innerHTML = `<div class="empty">No hay templates aún. Creá uno con el botón de abajo.</div>`;
    return;
  }

  list.innerHTML = templates.map(tpl => `
    <div class="template-item" data-id="${tpl.id}">
      <div class="template-item-info">
        <div class="template-name">${escHtml(tpl.name)}</div>
        <div class="template-preview">${escHtml(tpl.subject)}</div>
      </div>
      <div class="template-actions">
        <button class="btn btn-ghost btn-sm btn-edit" data-id="${tpl.id}">Editar</button>
        <button class="btn btn-danger btn-sm btn-delete" data-id="${tpl.id}">Borrar</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.id));
  });
  list.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTemplate(btn.dataset.id));
  });
}

async function deleteTemplate(id) {
  templates = templates.filter(t => t.id !== id);
  await save({ templates });
  renderTemplates();
  showToast('Template eliminado');
}

// ── Template modal ───────────────────────────────────────────────────────────

let editingId = null;

function openModal(id = null) {
  editingId = id;
  const modal = $('modal');
  const tpl   = id ? templates.find(t => t.id === id) : null;

  $('modal-title').textContent = id ? 'Editar template' : 'Nuevo template';
  $('tpl-name').value    = tpl ? tpl.name    : '';
  $('tpl-subject').value = tpl ? tpl.subject : '';
  $('tpl-body').value    = tpl ? tpl.body    : '';

  modal.classList.add('open');
  $('tpl-name').focus();
}

function closeModal() {
  $('modal').classList.remove('open');
  editingId = null;
}

$('btn-new-template').addEventListener('click', () => openModal());
$('btn-cancel-modal').addEventListener('click', closeModal);
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });

$('btn-save-template').addEventListener('click', async () => {
  const name    = $('tpl-name').value.trim();
  const subject = $('tpl-subject').value.trim();
  const body    = $('tpl-body').value.trim();

  if (!name || !subject || !body) {
    showToast('Completá todos los campos del template', 'fail');
    return;
  }

  if (editingId) {
    const idx = templates.findIndex(t => t.id === editingId);
    templates[idx] = { id: editingId, name, subject, body };
  } else {
    templates.push({ id: crypto.randomUUID(), name, subject, body });
  }

  await save({ templates });
  renderTemplates();
  closeModal();
  showToast('Template guardado ✓');
});

document.querySelectorAll('.var-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const textarea = $('tpl-body');
    const v   = chip.dataset.var;
    const s   = textarea.selectionStart;
    const e   = textarea.selectionEnd;
    const val = textarea.value;
    textarea.value = val.slice(0, s) + v + val.slice(e);
    textarea.selectionStart = textarea.selectionEnd = s + v.length;
    textarea.focus();
  });
});

// ── Utils ────────────────────────────────────────────────────────────────────

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ─────────────────────────────────────────────────────────────────────

(async () => {
  await loadConnection();
  await loadTemplates();
})();
