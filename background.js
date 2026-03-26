// background.js — Service Worker
// Centraliza todos los fetch a MantisBT para evitar CORS desde popup/settings

import { getProjects, getCategories, createIssue, getIssue, addNote, testConnection } from './mantis-api.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[MantisBT] Extension installed');
});

// ── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg).then(sendResponse).catch(err => {
    sendResponse({ ok: false, error: err.message });
  });
  return true; // keep channel open for async response
});

async function handleMessage(msg) {
  const { action, url, token } = msg;

  switch (action) {
    case 'testConnection': {
      const data = await testConnection(url, token);
      return { ok: true, data };
    }
    case 'getProjects': {
      const data = await getProjects(url, token);
      return { ok: true, data };
    }
    case 'getCategories': {
      const data = await getCategories(url, token, msg.projectId);
      return { ok: true, data };
    }
    case 'createIssue': {
      const data = await createIssue(url, token, msg.payload);
      return { ok: true, data };
    }
    case 'getIssue': {
      const data = await getIssue(url, token, msg.issueId);
      return { ok: true, data };
    }
    case 'addNote': {
      const data = await addNote(url, token, msg.payload);
      return { ok: true, data };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
