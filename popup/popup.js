// popup.js — Main popup logic
// Modes: CREATE (new issue) | NOTE (add note to existing case)

const CASE_PATTERN = /\[CASE-(\d+)\]/i;

const $ = id => document.getElementById(id);

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function getConfig() {
  return new Promise(resolve =>
    chrome.storage.sync.get(['mantis_url', 'api_token', 'agent_name', 'templates'], resolve)
  );
}

function getEmailData() {
  return new Promise(resolve => {
    const fallback = { subject: '', body: '', sender: '', client: 'unknown' };
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) { resolve(fallback); return; }
      try {
        chrome.tabs.sendMessage(tab.id, { action: 'getEmailData' }, response => {
          void chrome.runtime.lastError;
          resolve(response || fallback);
        });
      } catch {
        resolve(fallback);
      }
    });
  });
}

function setStatus(id, msg, type = '') {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `form-status ${type}`;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const config  = await getConfig();
  const content = $('content');

  if (!config.mantis_url || !config.api_token) {
    content.innerHTML = `
      <div class="warn">
        Configurá la URL de MantisBT y el API token en
        <a href="../settings/settings.html" target="_blank">Settings</a> primero.
      </div>`;
    return;
  }

  const email = await getEmailData();
  const match = email.subject.match(CASE_PATTERN);

  if (match) {
    $('mode-badge').textContent = 'nota';
    $('mode-badge').className   = 'mode-badge note';
    await renderNoteMode(content, config, email, match[1]);
  } else {
    $('mode-badge').textContent = 'nuevo caso';
    $('mode-badge').className   = 'mode-badge create';
    await renderCreateMode(content, config, email);
  }
});

// ── CREATE mode ───────────────────────────────────────────────────────────────

async function renderCreateMode(container, config, email) {
  const tpl = $('tpl-create').content.cloneNode(true);
  container.innerHTML = '';
  container.appendChild(tpl);

  if (email.sender) {
    $('email-sender-pill').textContent = email.sender;
  } else {
    $('email-sender-pill').style.display = 'none';
  }
  $('f-title').value       = email.subject || '';
  $('f-description').value = email.body    || '';

  const projectSelect  = $('f-project');
  const categorySelect = $('f-category');

  try {
    const projects = await sendToBackground({
      action: 'getProjects',
      url: config.mantis_url,
      token: config.api_token
    });

    projectSelect.innerHTML = projects.length
      ? projects.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('')
      : '<option value="">Sin proyectos</option>';

    if (projects.length) {
      await loadCategories(config, projects[0].id, categorySelect);
    }

    projectSelect.addEventListener('change', async () => {
      categorySelect.disabled = true;
      categorySelect.innerHTML = '<option>Cargando…</option>';
      await loadCategories(config, projectSelect.value, categorySelect);
    });

  } catch (err) {
    projectSelect.innerHTML = `<option value="">Error: ${escHtml(err.message)}</option>`;
  }

  $('form-create').addEventListener('submit', async e => {
    e.preventDefault();
    await handleCreate(config);
  });
}

async function loadCategories(config, projectId, select) {
  try {
    const cats = await sendToBackground({
      action: 'getCategories',
      url: config.mantis_url,
      token: config.api_token,
      projectId
    });
    select.innerHTML = cats.length
      ? cats.map(c => `<option value="${escHtml(c.name)}">${escHtml(c.name)}</option>`).join('')
      : '<option value="">Sin categorías</option>';
    select.disabled = false;
  } catch {
    select.innerHTML = '<option value="">Error</option>';
    select.disabled  = true;
  }
}

async function handleCreate(config) {
  const btn = $('btn-create');
  btn.disabled = true;
  setStatus('create-status', 'Creando…');

  const payload = {
    summary:     $('f-title').value.trim(),
    description: $('f-description').value.trim(),
    project_id:  $('f-project').value,
    category:    $('f-category').value,
    severity:    $('f-severity').value,
    priority:    $('f-priority').value
  };

  if (!payload.summary || !payload.project_id || !payload.category) {
    setStatus('create-status', 'Completá los campos requeridos', 'err');
    btn.disabled = false;
    return;
  }

  try {
    const issue  = await sendToBackground({
      action: 'createIssue',
      url: config.mantis_url,
      token: config.api_token,
      payload
    });
    const caseId  = issue.id;
    const caseUrl = `${config.mantis_url}/view.php?id=${caseId}`;

    setStatus('create-status', `✓ Caso #${caseId} creado`, 'ok');
    btn.textContent = `✓ Caso #${caseId}`;

    const actions = btn.closest('.form-actions');
    const link    = document.createElement('a');
    link.href      = caseUrl;
    link.target    = '_blank';
    link.textContent = '↗ Abrir';
    link.style.cssText = 'font-size:11px;color:#5b6af0;text-decoration:none;';
    actions.appendChild(link);

  } catch (err) {
    setStatus('create-status', `✗ ${err.message}`, 'err');
    btn.disabled = false;
  }
}

// ── NOTE mode ─────────────────────────────────────────────────────────────────

async function renderNoteMode(container, config, email, caseId) {
  const tpl = $('tpl-note').content.cloneNode(true);
  container.innerHTML = '';
  container.appendChild(tpl);

  $('note-case-num').textContent = `CASE-${caseId}`;
  $('n-body').value = email.body || '';

  try {
    const issue = await sendToBackground({
      action: 'getIssue',
      url: config.mantis_url,
      token: config.api_token,
      issueId: caseId
    });
    if (issue) {
      $('note-case-summary').textContent = issue.summary || '—';
    }
  } catch {
    $('note-case-summary').textContent = 'No se pudo cargar el caso';
  }

  $('btn-add-note').addEventListener('click', () => handleAddNote(config, caseId));
}

async function handleAddNote(config, caseId) {
  const btn = $('btn-add-note');
  btn.disabled = true;
  setStatus('note-status', 'Enviando…');

  const text      = $('n-body').value.trim();
  const viewState = parseInt($('n-view-state').value, 10);

  if (!text) {
    setStatus('note-status', 'La nota no puede estar vacía', 'err');
    btn.disabled = false;
    return;
  }

  try {
    await sendToBackground({
      action: 'addNote',
      url: config.mantis_url,
      token: config.api_token,
      payload: { issue_id: caseId, text, view_state: viewState }
    });

    setStatus('note-status', '✓ Nota agregada', 'ok');
    btn.textContent = '✓ Enviado';

    const caseUrl = `${config.mantis_url}/view.php?id=${caseId}`;
    const actions = btn.closest('.form-actions');
    const link    = document.createElement('a');
    link.href      = caseUrl;
    link.target    = '_blank';
    link.textContent = '↗ Ver caso';
    link.style.cssText = 'font-size:11px;color:#5b6af0;text-decoration:none;';
    actions.appendChild(link);

  } catch (err) {
    setStatus('note-status', `✗ ${err.message}`, 'err');
    btn.disabled = false;
  }
}
