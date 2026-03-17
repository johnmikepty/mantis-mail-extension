# Agent Context — Mail to MantisBT

## Project Summary
Chrome Extension (Manifest V3) that connects webmail clients (Outlook 365, Gmail) with MantisBT.
Allows users to create issues, send templated replies, and add notes to existing cases — all from the inbox.

## Stack
- Vanilla JavaScript + HTML/CSS (no framework)
- Chrome Extensions API (MV3)
- MantisBT REST API v2
- Chrome Storage API (sync) for user config

## Key Files
- `manifest.json` — Extension entry point, permissions, content script registration
- `background.js` — Service worker. Handles badge updates and messaging between content/popup
- `content.js` — Injected into webmail pages. Extracts subject, body, sender from DOM
- `popup/popup.js` — Main UI logic. Two modes: CREATE (new case) and NOTE (add to existing)
- `settings/settings.js` — Config persistence (URL, token, agent name, templates CRUD)

## Two Operating Modes
1. **CREATE mode** — Email subject has no `[CASE-XXXX]` pattern → show new issue form pre-filled
2. **NOTE mode** — Email subject contains `[CASE-XXXX]` → show "Add note to case #XXXX" form

## MantisBT API Endpoints Used
- `GET /api/rest/projects` — Load projects for dropdown
- `GET /api/rest/projects/{id}/categories` — Load categories per project
- `POST /api/rest/issues` — Create new issue
- `POST /api/rest/issues/{id}/notes` — Add note to existing issue
- Auth: `Authorization: YOUR_API_TOKEN` header

## DOM Extraction — Supported Clients
- **Outlook 365:** Subject in `[data-automation-id="subjectLine"]`, body in `[data-automation-id="UniqueMessageBody"]`, sender in `.from-container`
- **Gmail:** Subject in `h2.hP`, body in `.a3s.aiL`, sender in `.gD`
- **Fallback:** Empty fields, user fills manually

## Template Variable Resolution
Templates are stored in Chrome Storage as plain strings.
At render time, replace: `{{case_id}}`, `{{case_url}}`, `{{project}}`, `{{category}}`, `{{priority}}`, `{{reporter}}`, `{{agent_name}}`, `{{date}}`

## Chrome Storage Schema
```json
{
  "mantis_url": "https://bugs.example.com",
  "api_token": "USER_TOKEN",
  "agent_name": "John Doe",
  "templates": [
    {
      "id": "uuid",
      "name": "Template name",
      "subject": "Re: [CASE-{{case_id}}] ...",
      "body": "Dear {{reporter}}, ..."
    }
  ]
}
```

## Development Guidelines
- No build step. Load unpacked directly in Chrome.
- All async Chrome API calls use Promise wrappers (no callbacks).
- MantisBT API errors must show user-facing messages in the popup, never silent fails.
- Content script must not break if DOM selectors don't match — always try/catch extraction.

## Session Protocol
- Read CONTEXT.md + BUG_TRACKER.md at the start of each session
- Update BUG_TRACKER.md before closing any session where a bug was found or fixed
- Update CONTEXT.md if architecture decisions change
