(() => {
  const hero = document.getElementById('hero');
  const light = document.getElementById('marqueeHover');
  const focus = light.cloneNode(true);
  focus.id = 'heroFocus';
  focus.classList.add('hero-focus');
  focus.setAttribute('aria-hidden', 'true');
  hero.appendChild(focus);
  const focusRows = [...focus.querySelectorAll('.hero-marquee-hover-row')];
  const turbulence = document.getElementById('noiseTurb');
  const rows = [...hero.querySelectorAll('.hero-marquee-row')];
  const litRows = [...light.querySelectorAll('.hero-marquee-hover-row')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = rows.map((row, i) => ({
    row, spans: [...row.children, ...litRows[i].children, ...focusRows[i].children],
    x: 0, direction: i % 2 ? 1 : -1, velocity: i % 2 ? 28 : -28
  }));
  states.forEach(s => s.spans.forEach(el => { el.style.animation = 'none'; }));
  let rect, width = 1, centers = [], frame = 0, last = 0, visible = true;
  let targetX = 0, targetY = 0, x = 0, y = 0, inside = false, selected = -1;
  let press = null, waves = [], hold = 0, holdX = 0, holdY = 0;

  function measure() {
    rect = hero.getBoundingClientRect();
    width = rows[0].firstElementChild.getBoundingClientRect().width || 1;
    centers = rows.map(row => {
      const r = row.getBoundingClientRect();
      return (r.top + r.bottom) / 2 - rect.top;
    });
  }
  function wake() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function point(event) {
    rect = hero.getBoundingClientRect();
    targetX = event.clientX - rect.left;
    targetY = event.clientY - rect.top;
    if (!inside) { x = targetX; y = targetY; }
    inside = true;
    selected = centers.reduce((best, cy, i) => Math.abs(cy - targetY) < Math.abs(centers[best] - targetY) ? i : best, 0);
  }
  function cancel() {
    if (press && hero.hasPointerCapture(press.id)) hero.releasePointerCapture(press.id);
    press = null;
    inside = false;
    selected = -1;
    hero.classList.remove('is-holding');
  }
  hero.addEventListener('pointermove', event => {
    if (press && event.pointerId !== press.id) return;
    if (press) {
      const dx = event.clientX - press.clientX;
      const dy = event.clientY - press.clientY;
      press.moved = Math.max(press.moved, Math.hypot(dx, dy));
      if (event.pointerType === 'touch' && press.axis === 'pending' && press.moved > 8) {
        if (Math.abs(dy) >= Math.abs(dx)) { cancel(); return; }
        press.axis = 'horizontal';
      }
      if (press.axis !== 'pending') press.dragX = dx;
    }
    if (event.pointerType === 'mouse' || press) point(event);
    if (press) { selected = press.row; holdX = targetX; holdY = targetY; }
    wake();
  }, { passive: true });
  hero.addEventListener('pointerdown', event => {
    if (!event.isPrimary && press && event.pointerType === 'touch') { cancel(); return; }
    if (event.button !== 0 || !event.isPrimary || event.target.closest('a, button') || press) return;
    point(event);
    press = { id: event.pointerId, time: performance.now(), x: targetX, y: targetY,
      row: selected, clientX: event.clientX, clientY: event.clientY,
      originX: states[selected].x, dragX: 0, moved: 0, axis: event.pointerType === 'touch' ? 'pending' : 'horizontal' };
    hero.setPointerCapture(event.pointerId);
    holdX = targetX;
    holdY = targetY;
    hero.classList.add('is-holding');
    wake();
  }, { passive: true });
  window.addEventListener('pointerup', event => {
    if (!press || event.pointerId !== press.id) return;
    const duration = performance.now() - press.time;
    if (duration < 260 && press.moved < 12 && Math.hypot(event.clientX - press.clientX, event.clientY - press.clientY) < 12 && !reduced.matches) {
      waves.push({ time: performance.now(), x: press.x, y: press.y });
      // Bound rendering work while retaining several independent tap waves.
      if (waves.length > 8) waves.shift();
    }
    if (hero.hasPointerCapture(press.id)) hero.releasePointerCapture(press.id);
    press = null;
    selected = -1;
    hero.classList.remove('is-holding');
    if (event.pointerType !== 'mouse') { inside = false; selected = -1; }
    wake();
  });
  hero.addEventListener('pointerleave', () => { if (!press) cancel(); });
  hero.addEventListener('lostpointercapture', () => { if (press) cancel(); });
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('blur', cancel);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancel(); waves = []; cancelAnimationFrame(frame); frame = 0; last = 0; }
    else wake();
  });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) { measure(); wake(); }
    else { cancel(); waves = []; cancelAnimationFrame(frame); frame = 0; last = 0; }
  });
  observer.observe(hero);
  window.addEventListener('resize', () => { measure(); wake(); });
  reduced.addEventListener('change', () => { cancel(); waves = []; wake(); });
  document.fonts.ready.then(() => { measure(); wake(); });

  function draw(time) {
    frame = 0;
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 1 / 60;
    last = time;
    const ease = 1 - Math.exp(-dt / 0.13);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    const held = press && time - press.time >= 260;
    hold += ((held ? 1 : 0) - hold) * (1 - Math.exp(-dt / (held ? 0.7 : 0.45)));

    states.forEach((s, i) => {
      if (press && press.row === i) {
        const goal = press.originX + press.dragX;
        const delta = ((goal - s.x + width / 2) % width + width) % width - width / 2;
        const step = reduced.matches ? delta : delta * (1 - Math.exp(-dt / 0.055));
        s.x += step;
        s.velocity = Math.max(-120, Math.min(120, step / dt));
      } else if (!reduced.matches) {
        s.velocity += (s.direction * 28 - s.velocity) * (1 - Math.exp(-dt * 2.5));
        s.x += s.velocity * dt;
      }
      s.x = ((s.x % width) + width) % width - width;
      s.spans.forEach(el => { el.style.transform = `translateX(${s.x.toFixed(2)}px)`; });
    });

    // The mask lights glyphs only; empty space never becomes a visible ring.
    const offsetX = rect.width * 0.2, offsetY = rect.height * 0.2;
    const masks = [
      `radial-gradient(ellipse 420px 200px at ${rect.width * 0.9}px ${rect.height * 0.55}px, rgba(0,0,0,0.08), transparent 100%)`
    ];
    const focusMask = `radial-gradient(ellipse 390px 190px at ${x + offsetX}px ${y + offsetY}px, rgba(0,0,0,0.65), rgba(0,0,0,0.22) 45%, transparent 100%)`;
    focus.style.maskImage = focusMask;
    focus.style.webkitMaskImage = focusMask;
    focus.style.opacity = inside ? '1' : '0';
    if (inside && !reduced.matches && turbulence) {
      turbulence.setAttribute('baseFrequency', `${0.012 + Math.sin(time * 0.00038) * 0.0006} ${0.008 + Math.cos(time * 0.00026) * 0.0004}`);
    }
    if (hold > 0.005) {
      const radius = 180 + hold * Math.hypot(rect.width, rect.height) * 0.65;
      masks.push(`radial-gradient(circle ${radius}px at ${holdX + offsetX}px ${holdY + offsetY}px, rgba(0,0,0,${hold * 0.48}), transparent 100%)`);
    }
    waves = waves.filter(wave => time - wave.time < 2400);
    waves.forEach(wave => {
      const t = Math.min((time - wave.time) / 2400, 1);
      const reach = Math.hypot(Math.max(wave.x, rect.width - wave.x), Math.max(wave.y, rect.height - wave.y));
      const band = 190 + t * 190;
      const r = t * (reach * 1.2 + 450);
      const alpha = Math.sin(Math.PI * t) * (1 - t * 0.5) * 0.60 / Math.sqrt(waves.length);
      // A smoothly changing, irregular light front instead of a perfect circle.
      // Distort only the illumination mask, keeping the underlying glyphs crisp.
      const phase = wave.time * 0.007;
      const points = Array.from({length: 48}, (_, i) => {
        const angle = i / 48 * Math.PI * 2;
        const noise = Math.sin(angle * 3 + phase + t * 0.8) * 0.065
          + Math.sin(angle * 5 - phase * 0.7 - t * 0.6) * 0.04
          + Math.sin(angle * 9 + phase * 0.3) * 0.018;
        const radius = r * (1 + noise);
        return [wave.x + offsetX + Math.cos(angle) * radius * 1.12,
          wave.y + offsetY + Math.sin(angle) * radius * 0.94];
      });
      const path = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ') + ' Z';
      const w = rect.width * 1.4, h = rect.height * 1.4;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><feGaussianBlur stdDeviation="${band * 0.28}"/></filter></defs><path d="${path}" fill="none" stroke="white" stroke-width="${band}" stroke-linejoin="round" opacity="${alpha}" filter="url(#soft)"/></svg>`;
      masks.push(`url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
    });
    light.style.maskImage = masks.join(',');
    light.style.webkitMaskImage = masks.join(',');
    light.style.opacity = '1';
    if (!reduced.matches || press || waves.length || hold > 0.005 || Math.abs(x-targetX)+Math.abs(y-targetY)>0.2) wake();
    else last = 0;
  }
  measure();
  wake();
})();
