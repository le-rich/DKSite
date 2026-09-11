// Shared grid reflection; independent of the hero interactions.
(() => {
  const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const sheen = document.createElement('div');
  sheen.className = 'grid-sheen';
  sheen.setAttribute('aria-hidden', 'true');
  document.body.append(sheen);

  let x = 0, y = 0, targetX = 0, targetY = 0;
  let frame = 0, previousTime = 0, positioned = false;

  function draw(time) {
    const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
    previousTime = time;
    const follow = 1 - Math.exp(-elapsed / 130);
    x += (targetX - x) * follow;
    y += (targetY - y) * follow;
    sheen.style.setProperty('--sheen-x', `${x.toFixed(2)}px`);
    sheen.style.setProperty('--sheen-y', `${y.toFixed(2)}px`);
    frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.2
      ? requestAnimationFrame(draw) : 0;
    if (!frame) previousTime = 0;
  }

  function hide() {
    sheen.classList.remove('is-active');
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    positioned = false;
  }

  document.addEventListener('pointermove', event => {
    if (!enabled.matches || event.pointerType !== 'mouse') return;
    targetX = event.clientX;
    targetY = event.clientY;
    if (!positioned) {
      x = targetX;
      y = targetY;
      positioned = true;
    }
    sheen.classList.add('is-active');
    if (!frame) frame = requestAnimationFrame(draw);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  enabled.addEventListener('change', hide);
})();
