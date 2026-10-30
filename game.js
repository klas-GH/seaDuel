/* seaDuel v1.3.0 multi-part loader */
(function(){
  function run(){
    if (typeof window.__SD_P1 !== 'string' || typeof window.__SD_P2 !== 'string') {
      return setTimeout(run, 20);
    }
    var s = document.createElement('script');
    s.textContent = window.__SD_P1 + window.__SD_P2;
    document.head.appendChild(s);
  }
  run();
})();
