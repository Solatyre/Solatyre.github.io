// ---------- Mobile menu ----------
const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');

function setMenu(open) {
  links.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
}
toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); toggle.focus(); }
});

document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Motion (skipped entirely for reduced-motion users) ----------
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (!reduce) {
  document.documentElement.classList.add('js');
  initScramble();
  initRotator();
  initSplitTitles();
  initReveal();
  initProgress();
  initHeroCanvas();
  if (finePointer) { initCursorGlow(); initTilt(); initMagnets(); }
}

// Decrypt / scramble effect on the name
function initScramble() {
  const el = document.querySelector('.scramble');
  if (!el) return;
  const target = el.dataset.text;
  const chars = '!<>-_\\/[]{}=+*^?#01ABCDEF';
  let frame = 0;
  const queue = [...target].map((ch, i) => ({ ch, start: Math.floor(i * 2), end: Math.floor(i * 2) + 14 + Math.floor(Math.random() * 14) }));
  function tick() {
    let out = '', done = 0;
    for (const q of queue) {
      if (q.ch === ' ' || frame >= q.end) { out += q.ch; done++; }
      else if (frame >= q.start) out += `<span class="glyph">${chars[Math.floor(Math.random() * chars.length)]}</span>`;
      else out += '<span class="glyph">&nbsp;</span>';
    }
    el.innerHTML = out;
    if (done < queue.length) { frame++; requestAnimationFrame(tick); } else { el.textContent = target; }
  }
  setTimeout(tick, 250);
  el.closest('h1').addEventListener('mouseenter', () => { if (frame >= 60) { frame = 0; queue.forEach((q) => { q.end = q.start + 8 + Math.floor(Math.random() * 10); }); tick(); } });
}

// Typing rotator in the headline
function initRotator() {
  const el = document.querySelector('.rotator');
  if (!el) return;
  const words = el.dataset.words.split('|');
  let w = 0, i = words[0].length, deleting = true;
  function step() {
    const word = words[w];
    if (deleting) {
      i--; el.textContent = word.slice(0, i);
      if (i === 0) { deleting = false; w = (w + 1) % words.length; }
      setTimeout(step, 45);
    } else {
      const next = words[w]; i++; el.textContent = next.slice(0, i);
      if (i === next.length) { deleting = true; setTimeout(step, 2200); } else setTimeout(step, 80);
    }
  }
  setTimeout(step, 2600);
}

// Wrap section titles for masked slide-up
function initSplitTitles() {
  document.querySelectorAll('.section h2').forEach((h) => {
    h.innerHTML = h.textContent.split(' ').map((word) => `<span class="split"><span>${word}</span></span>`).join(' ');
    h.querySelectorAll('.split > span').forEach((s, i) => { s.style.transitionDelay = `${i * 90}ms`; });
  });
  document.querySelectorAll('.skill-group li').forEach((li, i) => { li.style.transitionDelay = `${(i % 6) * 70 + 150}ms`; });
}

// Reveal on scroll
function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  const items = document.querySelectorAll('.section-head, .project, .skill-group, .about, .contact');
  items.forEach((el, i) => {
    el.classList.add('reveal');
    if (el.classList.contains('project') || el.classList.contains('skill-group')) el.style.transitionDelay = `${(i % 4) * 110}ms`;
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  items.forEach((el) => io.observe(el));
}

// Scroll progress bar
function initProgress() {
  const bar = document.querySelector('.progress');
  let ticking = false;
  function update() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

// Interactive particle network in the hero
function initHeroCanvas() {
  const canvas = document.querySelector('.hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let w, h, pts = [], running = true;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.floor((w * h) / 11000));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.6 + 0.6,
    }));
  }

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    const link = Math.min(140, w / 7);
    for (const p of pts) {
      // gentle attraction / repulsion around the cursor
      const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
      if (d < 180) { p.vx -= (dx / d) * 0.03; p.vy -= (dy / d) * 0.03; }
      p.vx *= 0.99; p.vy *= 0.99;
      p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) {
          ctx.strokeStyle = `rgba(255,138,61,${(1 - d / link) * 0.35})`;
          ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < 200) {
        ctx.strokeStyle = `rgba(167,139,250,${(1 - md / 200) * 0.6})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(242,238,247,0.8)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
  canvas.parentElement.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

  // Pause when off-screen or the tab is hidden, to save battery
  const io = new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting && !document.hidden; if (running && !was) draw(); });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => { const was = running; running = !document.hidden; if (running && !was) draw(); });
  draw();
}

// Soft glow following the cursor
function initCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  document.documentElement.classList.add('has-pointer');
  let x = -999, y = -999, tx = x, ty = y;
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() {
    x += (tx - x) * 0.12; y += (ty - y) * 0.12;
    glow.style.setProperty('--cx', `${x}px`); glow.style.setProperty('--cy', `${y}px`);
    requestAnimationFrame(loop);
  })();
}

// 3D tilt + spotlight on project cards
function initTilt() {
  document.querySelectorAll('.project').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.classList.add('tilting');
      card.style.setProperty('--mx', `${px * 100}%`); card.style.setProperty('--my', `${py * 100}%`);
      card.style.transform = `rotateX(${(0.5 - py) * 10}deg) rotateY(${(px - 0.5) * 12}deg) translateZ(0)`;
    });
    card.addEventListener('pointerleave', () => { card.classList.remove('tilting'); card.style.transform = ''; });
  });
}

// Buttons that lean towards the cursor
function initMagnets() {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.classList.add('magnet');
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}
