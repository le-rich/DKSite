(() => {
  const key = 'dirk-page-arrival';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const normalize = path => path.replace(/\/index\.html$/, '/');
  const destinationKey = url => normalize(url.pathname) + url.search + url.hash;
  let arriving = false, busy = false, frame = 0, escapeTimer = 0;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    sessionStorage.removeItem(key);
    arriving = !!saved && saved.destination === destinationKey(new URL(location.href))
      && Date.now() - saved.time < 10000 && !reduced.matches;
  } catch { /* Storage is optional; normal navigation remains available. */ }

  function reset() {
    cancelAnimationFrame(frame);
    clearTimeout(escapeTimer);
    root.classList.remove('page-transitioning');
    root.style.removeProperty('--page-veil');
    busy = false;
  }
  if (arriving) {
    root.classList.add('page-transitioning');
    // Never leave the destination hidden if rendering or initialization fails.
    escapeTimer = setTimeout(reset, 2200);
  }
  window.addEventListener('pageshow', event => { if (event.persisted) reset(); });

  function animate(enter, done) {
    busy = true;
    root.classList.add('page-transitioning');
    const duration = enter ? 850 : 520;
    const start = performance.now();
    root.style.setProperty('--page-veil', enter ? '1' : '0');
    function draw(now) {
      const p = Math.min((now - start) / duration, 1);
      // Smooth acceleration and deceleration avoid an abrupt flash at either end.
      const eased = p * p * (3 - 2 * p);
      root.style.setProperty('--page-veil', (enter ? 1 - eased : eased).toFixed(4));
      if (p < 1) frame = requestAnimationFrame(draw);
      else if (enter) { reset(); done?.(); }
      else done?.();
    }
    frame = requestAnimationFrame(draw);
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reduced.matches) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (normalize(url.pathname) === normalize(location.pathname) && url.search === location.search) return;
    if (!/(?:\/|\/index\.html|\/careers\.html)$/.test(url.pathname)) return;
    if (busy) { event.preventDefault(); return; }
    try { sessionStorage.setItem(key, JSON.stringify({ destination: destinationKey(url), time: Date.now() })); }
    catch { return; }
    event.preventDefault();
    let navigated = false;
    const navigate = () => {
      if (navigated) return;
      navigated = true;
      location.assign(url.href);
      // Restore the old page if navigation is canceled or fails.
      escapeTimer = setTimeout(reset, 1600);
    };
    escapeTimer = setTimeout(navigate, 900);
    animate(false, navigate);
  });
  document.addEventListener('DOMContentLoaded', () => {
    if (arriving && !reduced.matches) {
      // Keep the veil in place while the first layout and font metrics settle.
      Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 160))])
        .then(() => requestAnimationFrame(() => requestAnimationFrame(() => animate(true))));
    } else reset();
  }, { once: true });
})();
