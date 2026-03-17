# Project Context — Mail to MantisBT

## Status
**Phase:** Initial setup
**Last updated:** 2026-03-17

## Architecture Decisions

### Why Manifest V3
MV3 is the current Chrome standard. MV2 is deprecated and being phased out. No background pages — service worker only.

### Why Vanilla JS (no React/Vue)
Extensions don't benefit from component frameworks for a popup this size. Vanilla keeps the bundle zero-dependency, faster to load, and easier to debug in the extensions panel.

### Why Chrome Storage API (not localStorage)
`chrome.storage.sync` persists across devices if the user is signed into Chrome. `localStorage` is scoped to the extension's origin but doesn't sync. For a config like API tokens and templates, sync storage is the right choice.

### Template system design
Templates are stored as JSON objects in `chrome.storage.sync`. Each template has a unique UUID generated client-side. CRUD is handled entirely in the settings page. No backend needed.

### Reply injection approach
For Outlook 365 and Gmail, the extension clicks the native "Reply" button programmatically, waits for the compose area to appear, then injects the rendered template into the DOM. This avoids `mailto:` links which don't work reliably in webmail.

## Roadmap

### Phase 1 — Core (Week 1)
- [ ] manifest.json with correct permissions
- [ ] content.js: DOM extraction for Outlook 365
- [ ] popup: CREATE mode (new issue form)
- [ ] MantisBT API integration: create issue
- [ ] Settings: URL + token storage

### Phase 2 — Full features (Week 2)
- [ ] content.js: DOM extraction for Gmail
- [ ] popup: NOTE mode (detect [CASE-XXXX], add note)
- [ ] Reply template generation and injection
- [ ] Note created from reply content
- [ ] Settings: template CRUD editor
- [ ] UI polish

### Phase 3 — Polish & publish
- [ ] Chrome Web Store listing
- [ ] Icons (16, 48, 128px)
- [ ] Error handling and edge cases
- [ ] README screenshots

## Known Limitations
- Outlook 365 DOM selectors may break on Microsoft updates — needs periodic maintenance
- `chrome.storage.sync` has a 8KB per-item limit — templates must be kept concise
- Reply injection only works on Outlook 365 and Gmail (other clients get manual copy)
