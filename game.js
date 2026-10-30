/* seaDuel v1.5.1 inflate */
(async function(){
  try {
    var names = ['engine.f0','engine.f1','engine.f2','engine.f3','engine.f4','engine.f5'];
    var parts = await Promise.all(names.map(function(n){ return fetch(n).then(function(r){ return r.text(); }); }));
    var bin = Uint8Array.from(atob(parts.join('').trim()), function(c){ return c.charCodeAt(0); });
    var stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
    var code = await new Response(stream).text();
    var s = document.createElement('script');
    s.textContent = code;
    document.head.appendChild(s);
  } catch (e) {
    console.error(e);
    document.body.insertAdjacentHTML('beforeend',
      '<div style="position:fixed;inset:0;background:#031b30;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;z-index:9999;text-align:center"><div><h1>⚓ seaDuel v1.5.1</h1><p>Load failed</p><pre style="opacity:.7;font-size:12px">'+String(e)+'</pre></div></div>');
  }
})();
