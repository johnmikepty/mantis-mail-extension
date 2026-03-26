# Bug Tracker — Mail to MantisBT

## Protocol
- Ctrl+F by error message or symptom before opening a new entry
- If found → apply documented fix
- If not found → diagnose, fix, and add entry before closing the session

## Format
```
### BUG-XXX — Short description
**Symptom:** What the user sees or what the log shows
**Cause:** Root cause
**Fix:** What was changed and in which file
**Files modified:** list
**Status:** fixed | open | wontfix
**Date:** YYYY-MM-DD
```

---

## Bug Log

---

### BUG-003 — MantisBT: tabla `mantis_api_token_table` no existe
**Symptom:** `APPLICATION ERROR #401 — Table 'mantis.mantis_api_token_table' doesn't exist in engine` al intentar generar un API token desde el perfil de usuario.  
**Cause:** La instancia de MantisBT estaba desactualizada o la DB no fue inicializada correctamente. La tabla `mantis_api_token_table` fue introducida en MantisBT **2.4.0**.  
**Fix:** Levantar MantisBT desde el código fuente del fork `johnmikepty/mantisbt` usando Docker (Dockerfile custom con php:8.1-apache + composer) y correr el wizard `admin/install.php`. El installer crea todas las tablas incluyendo `mantis_api_token_table`.  
**Files modified:** `C:\git-personal\mantis-docker\Dockerfile`, `docker-compose.yml`, `apache.conf` (creados)  
**Status:** fixed  
**Date:** 2026-03-26

---

### BUG-001 — Extension fails to load: missing icons
**Symptom:** `Could not load icon 'icons/icon16.png' specified in 'icons'. Could not load manifest.`  
**Cause:** `manifest.json` declaraba los íconos en `icons/` pero la carpeta estaba vacía — los archivos PNG nunca fueron generados.  
**Fix:** Generar los tres íconos (16, 48, 128px) con Python/Pillow y copiarlos a `icons/`.  
**Files modified:** `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` (creados)  
**Status:** fixed  
**Date:** 2026-03-17

---

### BUG-002 — Popup se queda en "Cargando…" indefinidamente
**Symptom:** El popup abre pero muestra el spinner y nunca renderiza el formulario.  
**Cause 1:** `popup.html` cargaba `popup.js` con `<script src="...">` en lugar de `<script type="module">`. Como `popup.js` usa `import` (ES modules), el script fallaba silenciosamente.  
**Cause 2:** `chrome.tabs.sendMessage` lanza error cuando el content script no está inyectado en la pestaña activa (ej: `chrome://extensions/`). El error no era capturado, dejando la Promise sin resolver y bloqueando el render.  
**Fix:**  
- Cambiar a `<script type="module" src="popup.js">` en `popup.html`  
- Agregar `void chrome.runtime.lastError` dentro del callback de `sendMessage` y wrap en `try/catch` para resolver la Promise con el fallback vacío en caso de error  
**Files modified:** `popup/popup.html`, `popup/popup.js`  
**Status:** fixed  
**Date:** 2026-03-17
