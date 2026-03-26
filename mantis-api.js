// mantis-api.js — MantisBT REST API wrapper
// Ejecutado en el contexto del background service worker (sin restricciones CORS)

async function apiFetch(url, token, path, options = {}) {
  const base = url.replace(/\/$/, '');
  const res = await fetch(`${base}/api/rest${path}`, {
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '1',
      ...options.headers
    },
    ...options
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function testConnection(url, token) {
  const data = await apiFetch(url, token, '/users/me');
  return data;
}

export async function getProjects(url, token) {
  const data = await apiFetch(url, token, '/projects');
  return data.projects || [];
}

export async function getCategories(url, token, projectId) {
  const data = await apiFetch(url, token, `/projects/${projectId}`);
  return data.project?.categories || [];
}

export async function createIssue(url, token, payload) {
  const body = {
    summary: payload.summary,
    description: payload.description,
    project: { id: payload.project_id },
    category: { name: payload.category },
    severity: { id: payload.severity },
    priority: { id: payload.priority }
  };
  const data = await apiFetch(url, token, '/issues', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return data.issue;
}

export async function getIssue(url, token, issueId) {
  const data = await apiFetch(url, token, `/issues/${issueId}`);
  return data.issues?.[0] || null;
}

export async function addNote(url, token, payload) {
  const body = {
    text: payload.text,
    view_state: { id: payload.view_state ?? 10 }
  };
  const data = await apiFetch(url, token, `/issues/${payload.issue_id}/notes`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return data.note;
}
