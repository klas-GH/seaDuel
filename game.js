/* seaDuel v1.3.0 - inflate embedded engine */
(async function(){
  try {
    var el = document.getElementById("sd-engine-gz");
    if (!el) throw new Error("engine blob missing");
    var bin = Uint8Array.from(atob(el.textContent.trim()), function(c){ return c.charCodeAt(0); });
    var stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
    var code = await new Response(stream).text();
    var s = document.createElement("script");
    s.textContent = code;
    document.head.appendChild(s);
  } catch (e) {
    console.error(e);
    document.body.insertAdjacentHTML("beforeend",
      '<div style="position:fixed;inset:0;background:#031b30;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;z-index:9999;text-align:center"><div><h1>⚓ seaDuel</h1><p>Load failed</p><pre style="opacity:.7;font-size:12px">'+String(e)+'</pre></div></div>');
  }
})();
