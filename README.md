# Mail to MantisBT — Chrome Extension

Chrome extension that bridges your webmail client with MantisBT, allowing you to create issues, send templated replies, and keep cases updated directly from your inbox.

## Features

- **Create cases from emails** — Opens a pre-filled form with the email subject as title and body as description
- **Auto-detect existing cases** — Recognizes `[CASE-XXXX]` in email subjects and switches to "Add Note" mode automatically
- **Templated replies** — Generate and send email responses using configurable templates with dynamic variables (`{{case_id}}`, `{{project}}`, `{{date}}`, etc.)
- **Note sync** — Adds the reply content as a note to the MantisBT case after sending
- **Follow-up tracking** — When a reply arrives referencing a known case number, prompts to attach it as a note with one click
- **Multi-client support** — Works with Outlook 365, Gmail, and other webmail clients

## Supported Mail Clients

| Client | Create Case | Detect Case | Insert Reply Draft |
|---|---|---|---|
| Outlook 365 (web) | ✅ | ✅ | ✅ |
| Gmail | ✅ | ✅ | ✅ |
| Other webmail | ✅ (manual fill) | ✅ | ❌ |

## Setup

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this folder
5. Click the extension icon → **Settings**
6. Enter your MantisBT URL and API Token
7. Configure your reply templates

## Configuration

In the Settings page you can configure:

- **MantisBT URL** — e.g. `https://bugs.yourcompany.com`
- **API Token** — generated from your MantisBT profile
- **Agent name** — used in template variables
- **Reply templates** — CRUD editor with support for variables

### Available Template Variables

| Variable | Description |
|---|---|
| `{{case_id}}` | MantisBT issue ID |
| `{{case_url}}` | Direct link to the case |
| `{{project}}` | Project name |
| `{{category}}` | Issue category |
| `{{priority}}` | Issue priority |
| `{{reporter}}` | Email sender |
| `{{agent_name}}` | Your configured name |
| `{{date}}` | Current date |

## Project Structure

```
mantis-mail-extension/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker
├── content.js             # DOM extraction for webmail clients
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── settings/
│   ├── settings.html
│   └── settings.js
├── icons/
└── notes/
    ├── AGENT.md           # AI agent context and guidelines
    ├── CONTEXT.md         # Project context and architecture decisions
    └── BUG_TRACKER.md     # Known bugs and fixes
```

## Tech Stack

- Vanilla JavaScript (no framework)
- Chrome Extensions Manifest V3
- MantisBT REST API
- Chrome Storage API

## License

MIT
