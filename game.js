/* seaDuel v1.3.0 loader — concatenates engine parts */
(async function(){
  try {
    var n = 11;
    var parts = [];
    for (var i = 0; i < n; i++) {
      var t = await (await fetch('engine.p' + i + '.js')).text();
      parts.push(t);
    }
    var code = parts.join('');
    var s = document.createElement('script');
    s.textContent = code;
    document.head.appendChild(s);
  } catch (e) {
    console.error(e);
    document.body.insertAdjacentHTML('beforeend',
      '<div style="position:fixed;inset:0;background:#031b30;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;z-index:9999;text-align:center"><div><h1>⚓ seaDuel</h1><p>Load failed</p><pre style="opacity:.7;font-size:12px">'+String(e)+'</pre></div></div>');
  }
})();
