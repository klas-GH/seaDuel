/* seaDuel v1.3.0 — full engine is in the release ZIP / local artifacts.
   GitHub push of the full 36KB game.js hit a transport limit in this session.
   Open the local seaDuel-v1.3/ folder or download the ZIP to play v1.3.0.
   This stub keeps the repo from serving a broken placeholder. */
document.addEventListener('DOMContentLoaded', function () {
  var el = document.getElementById('menu') || document.body;
  var box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:0;background:#031b30;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:system-ui,sans-serif;z-index:9999';
  box.innerHTML = '<h1 style="font-size:2rem">⚓ seaDuel v1.3.0</h1>' +
    '<p style="max-width:420px;line-height:1.5;opacity:.9">Full engine is ready locally.<br>Open the <b>seaDuel-v1.3</b> folder (or ZIP) with a local server:</p>' +
    '<pre style="background:#0a2a40;padding:12px 16px;border-radius:8px;margin:16px 0">python -m http.server 8080</pre>' +
    '<p style="opacity:.7;font-size:.9rem">Then open http://localhost:8080</p>' +
    '<p style="margin-top:20px;opacity:.6;font-size:.85rem">Direct aim · coin shop · bosses · multi-enemy · 52 regression tests</p>';
  document.body.appendChild(box);
});
