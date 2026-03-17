// popup.js — Main popup logic
// Modes: CREATE (new issue) | NOTE (add note to existing case)

const CASE_PATTERN = /\[CASE-(\d+)\]/i;

async function getConfig() {
  return new Promise(resolve => chrome.storage.sync.get(['mantis_url', 'api_token', 'agent_name', 'templates'], resolve));
}

async function getEmailData() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tab.id, { action: 'getEmailData' }, response => {
      resolve(response || { subject: '', body: '', sender: '', client: 'unknown' });
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const config = await getConfig();
  const content = document.getElementById('content');

  if (!config.mantis_url || !config.api_token) {
    content.innerHTML = `<p class="warn">Configure your MantisBT URL and API token in <a href="../settings/settings.html" target="_blank">Settings</a> first.</p>`;
    return;
  }

  const email = await getEmailData();
  const match = email.subject.match(CASE_PATTERN);

  if (match) {
    renderNoteMode(content, config, email, match[1]);
  } else {
    renderCreateMode(content, config, email);
  }
});

function renderCreateMode(container, config, email) {
  // TODO: render new issue form pre-filled with email data
  container.innerHTML = `<p>CREATE mode — coming in Phase 1</p><pre>${JSON.stringify(email, null, 2)}</pre>`;
}

function renderNoteMode(container, config, email, caseId) {
  // TODO: render add-note form for case #caseId
  container.innerHTML = `<p>NOTE mode — Case #${caseId}</p><pre>${JSON.stringify(email, null, 2)}</pre>`;
}
