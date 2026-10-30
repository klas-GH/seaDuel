/* seaDuel v1.4.0 — inflate engine */
(async function(){
  try {
    var a = await (await fetch('engine.b64.a')).text();
    var b = await (await fetch('engine.b64.b')).text();
    var bin = Uint8Array.from(atob((a+b).trim()), function(c){ return c.charCodeAt(0); });
    var stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
    var code = await new Response(stream).text();
    var s = document.createElement('script');
    s.textContent = code;
    document.head.appendChild(s);
  } catch (e) {
    console.error(e);
    document.body.insertAdjacentHTML('beforeend',
      '<div style="position:fixed;inset:0;background:#031b30;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;z-index:9999;text-align:center"><div><h1>⚓ seaDuel v1.4</h1><p>Engine failed to load.</p><pre style="opacity:.7;font-size:12px">'+String(e)+'</pre><p style="opacity:.6;margin-top:12px">Use local ZIP: seaDuel-v1.4/</p></div></div>');
  }
})();
