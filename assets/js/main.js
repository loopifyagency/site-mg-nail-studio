/* ==========================================================================
   MG Nail Studio — animations
   GSAP + ScrollTrigger + SplitText + DrawSVG, Lenis (défilement doux).
   Règles : courbes expo/power3, transform + opacity en priorité,
   prefers-reduced-motion respecté, contenu visible sans JS.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const safe = (name, fn) => { try { return fn(); } catch (err) { console.error('[MG Nail Studio]', name, err); } };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------------------------------------------------------------------
     Contenu vivant : année, horaires, « ouvert maintenant »
     --------------------------------------------------------------------- */
  const SCHEDULE = { 0: null, 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 14] };
  const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function parisNow() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    return { day: WEEKDAY_INDEX[get('weekday')], minutes: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
  }

  function initOpeningStatus() {
    const { day, minutes } = parisNow();
    const today = SCHEDULE[day];
    let label;
    let open = false;
    if (today && minutes >= today[0] * 60 && minutes < today[1] * 60) {
      open = true;
      label = `Ouvert maintenant · jusqu’à ${today[1]} h`;
    } else if (today && minutes < today[0] * 60) {
      label = `Fermé pour l’instant · ouvre à ${today[0]} h`;
    } else {
      let next = null;
      for (let d = 1; d <= 7 && !next; d++) {
        const idx = (day + d) % 7;
        if (SCHEDULE[idx]) next = { idx, d };
      }
      const when = next.d === 1 ? 'demain' : DAY_NAMES[next.idx];
      label = `Fermé pour l’instant · rouvre ${when} à ${SCHEDULE[next.idx][0]} h`;
    }
    $$('[data-open-status]').forEach((el) => {
      $('.status__text', el).textContent = label;
      el.classList.toggle('is-open', open);
    });
    $$('.hours tr').forEach((tr) => tr.classList.toggle('is-today', Number(tr.dataset.day) === day));
  }

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  safe('status', initOpeningStatus);

  /* ---------------------------------------------------------------------
     Fleurs de pampa : tracés générés (géométrie pure, graine fixe)
     --------------------------------------------------------------------- */
  const PLUME_TONES = {
    light: ['#C7A283', '#D6B397', '#B88F78', '#E3A99D', '#EBC9BF', '#CDB394', '#FFFFFF'],
    dark: ['#E6B0A6', '#F4D9D1', '#D6BFA3', '#FBF6EF', '#C98E86', '#EBDDCB'],
    rose: ['#FBF6EF', '#F4D9D1', '#D6BFA3', '#A8705F', '#FFFFFF', '#8E5B50']
  };

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildPlume(svg) {
    const opts = Object.fromEntries((svg.dataset.plume || '').split(';').filter(Boolean).map((kv) => kv.split(':')));
    const rand = mulberry32(Number(opts.seed) || 1);
    const lean = Number(opts.lean) || 0;
    const count = Number(opts.n) || 130;
    const palette = PLUME_TONES[opts.tone] || PLUME_TONES.light;
    const NS = 'http://www.w3.org/2000/svg';
    const H = 640;
    const P = [[120, H], [118 + lean * 0.3, 470], [120 + lean * 1.3, 330], [120 + lean * 2.6, 118]];
    const bez = (t) => {
      const u = 1 - t;
      return [0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]);
    };
    const tan = (t) => {
      const u = 1 - t;
      return [0, 1].map((k) => 3 * u * u * (P[1][k] - P[0][k]) + 6 * u * t * (P[2][k] - P[1][k]) + 3 * t * t * (P[3][k] - P[2][k]));
    };

    const g = document.createElementNS(NS, 'g');
    const stem = document.createElementNS(NS, 'path');
    stem.setAttribute('d', `M${P[0]} C${P[1]} ${P[2]} ${P[3]}`);
    stem.setAttribute('stroke', palette[2]);
    stem.setAttribute('stroke-width', '2.4');
    stem.classList.add('stem');
    g.appendChild(stem);

    const strands = document.createElementNS(NS, 'g');
    strands.classList.add('strands');
    for (let i = 0; i < count; i++) {
      const u = rand();
      const t = 0.42 + 0.58 * u;
      const [x, y] = bez(t);
      const [dx, dy] = tan(t);
      const stemAngle = Math.atan2(dy, dx);
      const side = rand() < 0.5 ? -1 : 1;
      const spread = ((12 + rand() * 38) * (1 - 0.5 * u) * Math.PI) / 180;
      const angle = stemAngle + side * spread;
      const envelope = Math.sin(Math.PI * Math.pow(u, 0.72));
      const len = 108 * (0.18 + 0.82 * envelope) * (0.66 + 0.34 * rand());
      const ex = x + Math.cos(angle) * len;
      const ey = y + Math.sin(angle) * len;
      const cx = x + Math.cos(angle) * len * 0.5;
      const cy = y + Math.sin(angle) * len * 0.5 - len * (0.14 + rand() * 0.2);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
      path.setAttribute('stroke', palette[Math.floor(rand() * palette.length)]);
      path.setAttribute('stroke-width', (0.7 + rand() * 0.9).toFixed(2));
      path.setAttribute('opacity', (0.4 + rand() * 0.55).toFixed(2));
      strands.appendChild(path);
    }
    g.appendChild(strands);
    svg.appendChild(g);
  }

  $$('svg[data-plume]').forEach((svg) => safe('plume', () => buildPlume(svg)));

  /* ---------------------------------------------------------------------
     Sans GSAP : on rend la main (contenu visible, pas de loader)
     --------------------------------------------------------------------- */
  const hasLibs = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && typeof SplitText !== 'undefined';
  const loaderEl = $('#loader');

  const initCarousel = createCarousel();
  const initFan = createFan();

  if (!hasLibs) {
    if (loaderEl) loaderEl.remove();
    safe('fan', () => initFan(null));
    safe('carousel', () => initCarousel(null));
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const EASE = 'expo.out';

  /* ---------------------------------------------------------------------
     Défilement doux (Lenis) relié à ScrollTrigger
     --------------------------------------------------------------------- */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  const scrollToTarget = (target, instant) => {
    if (lenis) lenis.scrollTo(target, { duration: instant ? 0 : 1.7, immediate: !!instant, force: true, easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) });
    else target.scrollIntoView && target.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  /* ---------------------------------------------------------------------
     Aides
     --------------------------------------------------------------------- */
  // Les masques SplitText coupent jambages et accents : on leur laisse de l’air.
  const breathe = (split) => {
    (split.masks || []).forEach((m) => { m.style.paddingBlock = '.14em'; m.style.marginBlock = '-.14em'; });
  };

  function splitReveal(el, { type = 'lines', trigger, from = {}, stagger = 0.09, duration = 1.3, start = 'top 86%' } = {}) {
    if (!el) return;
    SplitText.create(el, {
      type: type === 'chars' ? 'lines,words,chars' : type === 'words' ? 'lines,words' : 'lines',
      mask: 'lines',
      linesClass: 'sl',
      aria: 'auto',
      autoSplit: true,
      onSplit(self) {
        breathe(self);
        const targets = type === 'chars' ? self.chars : type === 'words' ? self.words : self.lines;
        return gsap.from(targets, {
          yPercent: 115, ...from, duration, ease: EASE, stagger,
          scrollTrigger: { trigger: trigger || el, start, once: true }
        });
      }
    });
  }

  function magnetic(el) {
    const label = $('.btn__label', el) || el;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    const lx = gsap.quickTo(label, 'x', { duration: 0.6, ease: 'power3.out' });
    const ly = gsap.quickTo(label, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * 0.28); yTo(dy * 0.4); lx(dx * 0.12); ly(dy * 0.18);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); lx(0); ly(0); });
  }

  function tilt(el, { max = 9 } = {}) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      gsap.to(el, { rotationX: (0.5 - py) * max, rotationY: (px - 0.5) * max * 1.3, transformPerspective: 900, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      el.classList.add('is-tilting');
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { rotationX: 0, rotationY: 0, duration: 1, ease: EASE, overwrite: 'auto' });
      el.classList.remove('is-tilting');
    });
  }

  /* ---------------------------------------------------------------------
     En-tête, menu, progression, ancres
     --------------------------------------------------------------------- */
  const header = $('#site-header');
  const burger = $('#burger');
  const menu = $('#menu');
  let menuOpen = false;

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    const links = $$('.menu__nav li a', menu);
    const foot = $('.menu__foot', menu);
    const bg = $('.menu__bg', menu);
    const hidden = 'circle(0px at calc(100% - 2.6rem) 2.4rem)';
    const shown = 'circle(150vmax at calc(100% - 2.6rem) 2.4rem)';
    gsap.killTweensOf([bg, links, foot]);
    if (open) {
      menu.classList.add('is-open');
      menu.removeAttribute('inert');
      menu.setAttribute('aria-hidden', 'false');
      if (lenis) lenis.stop();
      gsap.fromTo(bg, { clipPath: hidden }, { clipPath: shown, duration: reduceMotion ? 0 : 1, ease: 'expo.inOut' });
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: reduceMotion ? 0 : 1.1, ease: EASE, stagger: 0.06, delay: 0.25 });
      gsap.fromTo(foot, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: reduceMotion ? 0 : 0.8, ease: EASE, delay: 0.6 });
      links[0] && links[0].focus({ preventScroll: true });
    } else {
      menu.setAttribute('inert', '');
      menu.setAttribute('aria-hidden', 'true');
      gsap.to(links, { yPercent: -110, duration: reduceMotion ? 0 : 0.5, ease: 'power3.in', stagger: 0.03 });
      gsap.to(foot, { opacity: 0, duration: 0.25 });
      gsap.to(bg, { clipPath: hidden, duration: reduceMotion ? 0 : 0.9, ease: 'expo.inOut', delay: reduceMotion ? 0 : 0.15, onComplete: () => { menu.classList.remove('is-open'); if (lenis && !root.classList.contains('is-loading')) lenis.start(); } });
    }
  }

  burger.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    const go = () => { scrollToTarget(target); history.replaceState(null, '', id); };
    if (menuOpen) { setMenu(false); setTimeout(go, 500); } else go();
  });

  $('#totop').addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 2, easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) });
    else window.scrollTo(0, 0);
  });

  /* ---------------------------------------------------------------------
     Loader : l’enseigne s’allume, le rideau festonné se lève
     --------------------------------------------------------------------- */
  const pageReady = Promise.race([
    Promise.all([
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true }))
    ]),
    new Promise((r) => setTimeout(r, 4500))
  ]);

  let introFn = null;
  let loaderDone = false;

  const finishLoading = () => {
    if (loaderDone) return;
    loaderDone = true;
    if (loaderEl) loaderEl.remove();
    root.classList.remove('is-loading');
    if (lenis && !menuOpen) lenis.start();
    ScrollTrigger.refresh();
  };
  setTimeout(finishLoading, 9000); // filet de sécurité

  function runLoader() {
    if (!loaderEl || reduceMotion) { return Promise.resolve(); }
    root.classList.add('is-loading');
    const m = $('.neon-m', loaderEl);
    const g = $('.neon-g', loaderEl);
    const word = $('.loader__word', loaderEl);
    const neon = $('.loader__neon', loaderEl);
    const countEl = $('#loader-count');
    const state = { v: 0 };
    gsap.set([m, g], { drawSVG: '0%' });
    gsap.set(word, { opacity: 0, y: 12 });

    const tl = gsap.timeline();
    tl.to(m, { drawSVG: '100%', duration: 0.85, ease: 'power2.inOut' }, 0.1)
      .to(g, { drawSVG: '100%', duration: 0.95, ease: 'power2.inOut' }, 0.35)
      .to(word, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 1.05)
      .to(neon, { opacity: 0.45, duration: 0.06 }, 1.3).to(neon, { opacity: 1, duration: 0.06 })
      .to(neon, { opacity: 0.7, duration: 0.05 }).to(neon, { opacity: 1, duration: 0.08 })
      .to(state, { v: 92, duration: 1.5, ease: 'power1.inOut', onUpdate: () => { countEl.textContent = Math.round(state.v); } }, 0);
    return new Promise((resolve) => tl.eventCallback('onComplete', () => resolve(state)))
      .then((st) => pageReady.then(() => st))
      .then((st) => new Promise((resolve) => {
        gsap.to(st, { v: 100, duration: 0.35, ease: 'power2.out', onUpdate: () => { countEl.textContent = Math.round(st.v); }, onComplete: resolve });
      }));
  }

  function liftCurtain() {
    if (!loaderEl || reduceMotion) { finishLoading(); if (introFn) introFn(); return; }
    const tl = gsap.timeline({ onComplete: finishLoading });
    tl.to($('.loader__inner', loaderEl), { opacity: 0, y: -24, duration: 0.5, ease: 'power3.in' }, 0)
      .to(loaderEl, { y: () => -(window.innerHeight + 40), duration: 1.25, ease: 'expo.inOut' }, 0.3);
    if (introFn) tl.add(introFn, 0.85);
  }

  /* ---------------------------------------------------------------------
     Construction de la page (après polices + chargement)
     --------------------------------------------------------------------- */
  const startedLoader = runLoader();

  pageReady.then(() => {
    safe('fan', () => initFan(gsap));
    safe('carousel', () => initCarousel(gsap));
    safe('motion', buildMotion);
    ScrollTrigger.refresh();
    return startedLoader;
  }).then(liftCurtain).catch((err) => { console.error(err); finishLoading(); });

  function buildMotion() {
    const mm = gsap.matchMedia();

    mm.add({
      motion: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
      wide: '(min-width: 900px)',
      fine: '(hover: hover) and (pointer: fine)'
    }, (ctx) => {
      const { motion, wide, fine } = ctx.conditions;

      /* ----- En-tête : masquée vers le bas, revient vers le haut ----- */
      if (motion) {
        let hidden = false;
        ScrollTrigger.create({
          start: 0, end: 'max',
          onUpdate(self) {
            if (menuOpen) return;
            const y = self.scroll();
            const shouldHide = y > 160 && self.direction === 1;
            const shouldShow = y <= 160 || self.direction === -1;
            if (shouldHide && !hidden) { hidden = true; gsap.to(header, { yPercent: -160, duration: 0.7, ease: 'power3.out', overwrite: 'auto' }); }
            else if (shouldShow && hidden) { hidden = false; gsap.to(header, { yPercent: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' }); }
          }
        });
        gsap.to('.progress__bar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
      }

      /* ----- Bouton flottant (mobile) : visible après le hero, masqué sur l’appel à l’action ----- */
      const fab = $('#fab');
      ScrollTrigger.create({
        trigger: '.hero', start: 'bottom 70%', end: 'max',
        onEnter: () => fab.classList.add('is-visible'),
        onLeaveBack: () => fab.classList.remove('is-visible')
      });
      ScrollTrigger.create({ trigger: '.cta', start: 'top 70%', end: 'bottom 30%', onToggle: (self) => fab.classList.toggle('is-away', self.isActive) });

      /* ----- Interactions au pointeur ----- */
      if (motion && fine) {
        $$('[data-magnetic]').forEach(magnetic);
        $$('[data-tilt]').forEach((el) => tilt(el, { max: el.classList.contains('tile') ? 7 : 9 }));
      }

      if (!motion) {
        // Mouvement réduit : tout visible, compteurs à leur valeur finale.
        $$('.nailrow').forEach((n) => n.classList.add('is-on'));
        return;
      }

      /* =================================================================
         HERO
         ================================================================= */
      const hero = $('.hero');
      const heroSplit = SplitText.create('[data-hero-title]', { type: 'lines,words', mask: 'lines', linesClass: 'sl', aria: 'auto' });
      breathe(heroSplit);
      gsap.set(heroSplit.words, { yPercent: 118, rotate: 5 });
      gsap.set('[data-hero-in]', { opacity: 0, y: 28 });
      gsap.set('[data-hero-photo]', { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 12 });
      gsap.set('[data-hero-photo] img', { scale: 1.32 });
      gsap.set('.hero__dots circle', { scale: 0, transformOrigin: '50% 50%' });
      gsap.set('.spin-badge', { scale: 0, rotate: -90 });
      gsap.set('.scroll-cue', { opacity: 0 });
      gsap.set('.hero__sun', { scale: 0.6, opacity: 0 });
      const plumes = $$('.hero .pampas');
      plumes.forEach((p) => { gsap.set($$('.stem', p), { drawSVG: '0%' }); gsap.set($$('.strands path', p), { drawSVG: '0%' }); });

      introFn = () => {
        const tl = gsap.timeline({ defaults: { ease: EASE } });
        tl.to('.hero__sun', { scale: 1, opacity: 1, duration: 2.2 }, 0)
          .to(heroSplit.words, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.075 }, 0.1)
          .to('[data-hero-photo]', { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, duration: 1.7, stagger: 0.14 }, 0.25)
          .to('[data-hero-photo] img', { scale: 1.12, duration: 2.6, stagger: 0.14 }, 0.25)
          .to('[data-hero-in]', { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.7)
          .to('.hero__dots circle', { scale: 1, duration: 1.1, stagger: 0.07, ease: 'back.out(2.2)' }, 1)
          .to('.spin-badge', { scale: 1, rotate: 0, duration: 1.4, ease: 'back.out(1.4)' }, 1.1)
          .to('.scroll-cue', { opacity: 1, duration: 1 }, 1.6)
          .call(() => gsap.fromTo('[data-hero-photo] img', { scale: 1.12 }, { scale: 1.2, duration: 16, ease: 'sine.inOut', yoyo: true, repeat: -1 }), null, 2.8);
        plumes.forEach((p, i) => {
          tl.to($$('.stem', p), { drawSVG: '100%', duration: 1.6, ease: 'power2.inOut' }, 0.3 + i * 0.15)
            .to($$('.strands path', p), { drawSVG: '100%', duration: 1.4, stagger: { each: 0.006, from: 'random' }, ease: 'power2.out' }, 0.7 + i * 0.15);
        });
        return tl;
      };

      // Parallax multicouche (data-speed > 0 : avant-plan, < 0 : arrière-plan)
      $$('[data-speed]', hero).forEach((el) => {
        const speed = parseFloat(el.dataset.speed);
        gsap.to(el, {
          y: () => -speed * hero.offsetHeight, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
        });
      });

      // Parallax à la souris
      if (fine) {
        const layers = [
          { sel: '.hero__photo--main img', k: 14 }, { sel: '.hero__photo--left img', k: -22 },
          { sel: '.hero__photo--top img', k: 18 }, { sel: '.hero__dots', k: -34, rot: true }, { sel: '.pampas--front', k: -26 }
        ].map((l) => { const el = $(l.sel); return el && { x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }), k: l.k }; }).filter(Boolean);
        hero.addEventListener('pointermove', (e) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          layers.forEach((l) => l.x(nx * l.k));
        });
      }

      // Balancement des fleurs séchées
      $$('.pampas').forEach((p, i) => {
        gsap.fromTo(p, { rotation: -1.6 - (i % 3) * 0.5 }, { rotation: 1.6 + (i % 3) * 0.5, duration: 3.4 + (i % 4) * 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });

      /* =================================================================
         TITRES — chaque section a sa propre mise en scène
         ================================================================= */
      splitReveal($('#story-title'), { type: 'lines', duration: 1.5 });
      splitReveal($('#services-title'), { type: 'words', stagger: 0.07, trigger: '.services', start: 'top 60%', from: { rotate: 4 } });
      splitReveal($('#swatch-title'), { type: 'lines', from: { rotate: 3 } });
      splitReveal($('#gallery-title'), { type: 'chars', stagger: 0.035, duration: 1.1 });
      splitReveal($('#reviews-title'), { type: 'words', stagger: 0.06 });
      splitReveal($('#cta-title'), { type: 'words', stagger: 0.08, from: { rotate: -4, scale: 0.9 }, duration: 1.5 });
      splitReveal($('#find-title'), { type: 'lines', from: { yPercent: 0, xPercent: -30, opacity: 0 } });

      /* =================================================================
         MARQUEE — réagit à la vitesse du défilement
         ================================================================= */
      const marqueeTweens = [];
      $$('[data-marquee]').forEach((row) => {
        const track = $('.marquee__track', row);
        const list = $('.marquee__list', track);
        const dir = Number(row.dataset.marquee);
        const copies = Math.max(1, Math.ceil((window.innerWidth * 1.2) / list.offsetWidth));
        for (let i = 0; i < copies; i++) { const c = list.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); }
        const dist = () => list.offsetWidth;
        const tween = gsap.fromTo(track, { x: dir < 0 ? 0 : () => -dist() }, { x: dir < 0 ? () => -dist() : 0, duration: 34, ease: 'none', repeat: -1, paused: true });
        tween.totalTime(tween.duration() * 1000);
        marqueeTweens.push(tween);
      });
      if (marqueeTweens.length) {
        let boost = 1; let sign = 1; let live = false;
        ScrollTrigger.create({
          trigger: '.marquee', start: 'top bottom', end: 'bottom top',
          onToggle: (self) => { live = self.isActive; marqueeTweens.forEach((t) => t.paused(!live)); },
          onUpdate(self) {
            boost = Math.max(boost, 1 + Math.min(Math.abs(self.getVelocity()) / 380, 8));
            sign = self.direction;
          }
        });
        gsap.ticker.add(() => {
          if (!live) return;
          boost += (1 - boost) * 0.05;
          marqueeTweens.forEach((t) => t.timeScale(sign * boost));
        });
      }

      /* =================================================================
         SAVOIR-FAIRE — section pinnée, storytelling en 4 temps
         ================================================================= */
      (() => {
        const pin = $('.story__pin');
        const steps = $$('.step');
        const shots = $$('.story__shot');
        const dots = $$('.story__rail-dot');
        const fill = $('.story__rail-fill');
        const n = steps.length;
        gsap.set(steps.slice(1), { autoAlpha: 0, y: 40 });
        gsap.set(shots.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
        gsap.set($$('img', pin).filter((img) => shots.includes(img.closest('.story__shot'))), { scale: 1.2 });
        dots[0].classList.add('is-on');

        const imgs = $$('img', pin).filter((img) => shots.includes(img.closest('.story__shot')));
        const at = (i) => i - 0.1;
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${window.innerHeight * (wide ? 3.4 : 3)}`, pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true },
          onUpdate() {
            const t = tl.time();
            const active = steps.reduce((a, _, i) => (i && t >= at(i) + 0.3 ? i : a), 0);
            dots.forEach((d, k) => d.classList.toggle('is-on', k <= active));
          }
        });
        tl.to({}, { duration: 0.25 });
        steps.forEach((step, i) => {
          if (!i) return;
          tl.to(steps[i - 1], { autoAlpha: 0, y: -36, duration: 0.3, ease: 'power2.in' }, at(i))
            .fromTo(step, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, at(i) + 0.22)
            .fromTo(shots[i], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power3.inOut' }, at(i))
            .to(fill, { scaleX: i / (n - 1), duration: 0.55, ease: 'power2.inOut' }, at(i));
        });
        tl.to({}, { duration: 0.45 });
        // Ken Burns : chaque photo se resserre lentement pendant tout le défilement
        tl.to(imgs, { scale: 1.02, duration: tl.duration(), ease: 'none' }, 0);
        gsap.from('.pampas--story', { yPercent: 40, opacity: 0, duration: 1.6, ease: EASE, scrollTrigger: { trigger: pin, start: 'top 60%', once: true } });
      })();

      /* =================================================================
         PRESTATIONS — défilement horizontal piloté par le scroll vertical
         ================================================================= */
      if (wide) {
        const pinEl = $('.services__pin');
        const track = $('[data-track]');
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const horizontal = gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: pinEl, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true }
        });
        $$('.panel--card').forEach((card) => {
          const ill = $('.ill', card);
          gsap.from(ill, { rotation: -14, scale: 0.7, opacity: 0, duration: 1.3, ease: 'back.out(1.5)', scrollTrigger: { trigger: card, containerAnimation: horizontal, start: 'left 88%', toggleActions: 'play none none reverse' } });
          gsap.from($$('h3, p, .tag', card), { y: 30, opacity: 0, duration: 1, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: card, containerAnimation: horizontal, start: 'left 85%', toggleActions: 'play none none reverse' } });
        });
      }

      /* =================================================================
         NUANCIER — l’éventail s’ouvre à l’arrivée
         ================================================================= */
      ScrollTrigger.create({
        trigger: '#fan', start: 'top 80%', once: true,
        onEnter: () => { const f = $('#fan'); f.classList.add('is-open'); setTimeout(() => f.classList.add('is-ready'), 1800); }
      });

      /* =================================================================
         CHIFFRES — compteurs dans une phrase, ongles qui se remplissent
         ================================================================= */
      const sentence = $('[data-numbers]');
      const counters = $$('[data-count]', sentence);
      // On fige la largeur finale des chiffres : la phrase ne se reflue pas pendant le comptage.
      counters.forEach((b) => {
        b.style.display = 'inline-block';
        b.style.minWidth = `${Math.ceil(b.getBoundingClientRect().width)}px`;
        b.style.textAlign = 'right';
        b.textContent = '0';
      });
      gsap.set($$('.num', sentence), { scale: 0.6, opacity: 0, transformOrigin: '50% 100%' });
      SplitText.create(sentence, {
        type: 'lines', mask: 'lines', linesClass: 'sl', aria: 'none', autoSplit: true,
        onSplit(self) {
          breathe(self);
          return gsap.from(self.lines, { yPercent: 110, duration: 1.3, ease: EASE, stagger: 0.12, scrollTrigger: { trigger: sentence, start: 'top 80%', once: true } });
        }
      });
      ScrollTrigger.create({
        trigger: sentence, start: 'top 78%', once: true,
        onEnter() {
          gsap.to($$('.num', sentence), { scale: 1, opacity: 1, duration: 1.1, ease: 'back.out(1.8)', stagger: 0.18, delay: 0.3 });
          counters.forEach((b, i) => {
            const target = Number(b.dataset.count); const o = { v: 0 };
            gsap.to(o, { v: target, duration: 2.2, delay: 0.5 + i * 0.2, ease: 'power3.out', onUpdate: () => { b.textContent = Math.round(o.v); } });
          });
        }
      });
      ScrollTrigger.create({ trigger: '.numbers__nails', start: 'top 85%', once: true, onEnter: () => $$('.nailrow').forEach((n, i) => setTimeout(() => n.classList.add('is-on'), i * 350)) });
      gsap.from('.numbers__caption', { opacity: 0, y: 20, duration: 1.2, ease: EASE, scrollTrigger: { trigger: '.numbers__caption', start: 'top 92%', once: true } });

      /* =================================================================
         GALERIE — révélations par masque, image qui bouge dans son cadre
         ================================================================= */
      $$('.tile').forEach((tile) => {
        const frame = $('.tile__frame', tile) || tile;
        const img = $('img', tile);
        const kind = tile.dataset.reveal;
        const fromClip = kind === 'circle' ? 'circle(0% at 50% 62%)' : 'inset(0% 0% 100% 0%)';
        const toClip = kind === 'circle' ? 'circle(78% at 50% 50%)' : 'inset(0% 0% 0% 0%)';
        gsap.fromTo(frame, { clipPath: fromClip }, { clipPath: toClip, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: tile, start: 'top 88%', once: true } });
        if (img) {
          gsap.fromTo(img, { yPercent: -4, scale: 1.02 }, { yPercent: 4, scale: 1.12, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true } });
        }
      });
      gsap.from('.gallery__head p', { opacity: 0, y: 24, duration: 1.2, ease: EASE, scrollTrigger: { trigger: '.gallery__head', start: 'top 80%', once: true } });

      /* =================================================================
         CTA et pied de page : lettres qui réagissent
         ================================================================= */
      const phone = $('[data-phone]');
      const phoneSplit = SplitText.create(phone, { type: 'chars', charsClass: 'ch', aria: 'none' });
      gsap.from(phoneSplit.chars, { yPercent: 70, opacity: 0, rotate: 8, duration: 1.3, ease: EASE, stagger: 0.04, scrollTrigger: { trigger: phone, start: 'top 90%', once: true } });
      if (fine) {
        phone.addEventListener('pointerenter', () => gsap.to(phoneSplit.chars, { yPercent: -14, duration: 0.38, ease: 'power2.out', stagger: { each: 0.035, yoyo: true, repeat: 1 }, overwrite: 'auto' }));
      }
      gsap.from('.cta__script, .cta__lead, .cta__actions', { opacity: 0, y: 30, duration: 1.2, ease: EASE, stagger: 0.14, scrollTrigger: { trigger: '.cta__inner', start: 'top 70%', once: true } });
      $$('.pampas--cta-l, .pampas--cta-r').forEach((p) => {
        gsap.from(p, { yPercent: 45, duration: 2, ease: EASE, scrollTrigger: { trigger: '.cta', start: 'top 80%', once: true } });
      });

      gsap.from('.hours tr', { opacity: 0, x: -24, duration: 1, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: '.hours', start: 'top 85%', once: true } });
      gsap.fromTo('.map', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: '.map', start: 'top 85%', once: true } });
      gsap.from('.find__address, .find__tel, .status--block, .find__note, .find__info > .btn', { opacity: 0, y: 24, duration: 1, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: '.find__address', start: 'top 88%', once: true } });

      const giant = SplitText.create('[data-giant]', { type: 'chars', charsClass: 'ch', aria: 'none' });
      gsap.from(giant.chars, { yPercent: 110, opacity: 0, duration: 1.6, ease: EASE, stagger: 0.05, scrollTrigger: { trigger: '.footer__giant', start: 'top 100%', once: true } });
      if (fine) {
        giant.chars.forEach((ch) => ch.addEventListener('pointerenter', () => gsap.to(ch, { yPercent: -12, duration: 0.45, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' })));
      }
    });
  }

  /* =====================================================================
     NUANCIER : éventail de teintes (radiogroup accessible)
     ===================================================================== */
  function createFan() {
    return function (g) {
      const fan = $('#fan');
      const tips = $$('.tip', fan);
      const tint = $('.swatches__tint');
      const nameEl = $('#swatch-name');
      const moodEl = $('#swatch-mood');
      const readout = $('.swatches__readout');
      const angles = [-45, -27, -9, 9, 27, 45];
      const glitterBtn = $('#toggle-glitter');
      const frenchBtn = $('#toggle-french');

      tips.forEach((tip, i) => {
        tip.style.setProperty('--c', tip.dataset.color);
        tip.style.setProperty('--a', `${angles[i] ?? 0}deg`);
        tip.style.setProperty('--i', i);
        tip.style.zIndex = String(i + 1);
      });
      if (!g || reduceMotion) { fan.classList.add('is-open', 'is-ready'); }

      function select(tip, { focus = false, first = false } = {}) {
        tips.forEach((t) => {
          const on = t === tip;
          t.classList.toggle('is-selected', on);
          t.setAttribute('aria-checked', String(on));
          t.tabIndex = on ? 0 : -1;
        });
        if (focus) tip.focus();
        const apply = () => { nameEl.textContent = tip.dataset.name; moodEl.textContent = tip.dataset.mood; };
        if (g && !first && !reduceMotion) {
          g.timeline().to(readout, { opacity: 0, y: 10, duration: 0.18, ease: 'power2.in' }).add(apply).to(readout, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
          g.to(tint, { backgroundColor: tip.dataset.tint, duration: 1, ease: 'power2.out', overwrite: 'auto' });
        } else { apply(); tint.style.backgroundColor = tip.dataset.tint; }
      }

      tips.forEach((tip, i) => {
        tip.addEventListener('click', () => select(tip));
        tip.addEventListener('keydown', (e) => {
          const k = e.key;
          if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(k)) {
            e.preventDefault();
            const step = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1;
            select(tips[(i + step + tips.length) % tips.length], { focus: true });
          }
        });
      });
      const initial = tips.find((t) => t.getAttribute('aria-checked') === 'true') || tips[0];
      select(initial, { first: true });

      const toggle = (btn, cls) => btn.addEventListener('click', () => {
        const on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        fan.classList.toggle(cls, on);
      });
      toggle(glitterBtn, 'is-glitter');
      toggle(frenchBtn, 'is-french');
    };
  }

  /* =====================================================================
     AVIS : pile de cartes postales (flèches, glisser, clavier, lecture auto)
     ===================================================================== */
  function createCarousel() {
    return function (g) {
      const stage = $('#rev-stage');
      const cards = $$('[data-review]', stage);
      const n = cards.length;
      const countEl = $('#rev-count');
      const bar = $('#rev-bar');
      const section = $('#avis');
      const instant = !g || reduceMotion;
      const POSES = [
        { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 },
        { x: '3.5%', y: 16, rotation: 2.4, scale: 0.965, opacity: 1 },
        { x: '-3%', y: 30, rotation: -2.6, scale: 0.93, opacity: 1 },
        { x: 0, y: 40, rotation: 0, scale: 0.9, opacity: 0 }
      ];
      let idx = 0; let autoplay = null; let hovering = false; let dragging = false; let inView = false; let userPaused = false;

      const poseFor = (k) => POSES[Math.min((k - idx + n) % n, 3)];
      const zFor = (k) => 10 - Math.min((k - idx + n) % n, 4);

      function sync(animate, skip = []) {
        cards.forEach((c, k) => {
          const rel = (k - idx + n) % n;
          c.setAttribute('aria-hidden', rel === 0 ? 'false' : 'true');
          if (!g) { c.style.display = rel === 0 ? '' : 'none'; return; }
          if (skip.includes(c)) return;
          g.set(c, { zIndex: zFor(k) });
          if (animate && !instant) g.to(c, { ...poseFor(k), duration: 1.1, ease: 'expo.out', overwrite: 'auto' });
          else g.set(c, poseFor(k));
        });
        countEl.textContent = `${idx + 1} / ${n}`;
      }

      function go(to, dir) {
        const prev = idx;
        idx = (to + n) % n;
        const out = cards[prev];
        const incoming = cards[idx];
        if (!g || instant) { sync(false); return; }
        sync(true, [dir > 0 ? out : incoming]);
        if (dir > 0) {
          g.set(out, { zIndex: 20 });
          g.to(out, { x: '-112%', rotation: -9, opacity: 0, duration: 0.8, ease: 'power3.in', overwrite: 'auto', onComplete: () => g.set(out, { ...poseFor(prev), zIndex: zFor(prev) }) });
        } else {
          g.set(incoming, { zIndex: 21 });
          g.fromTo(incoming, { x: '-112%', rotation: -9, opacity: 0, y: 0, scale: 1 }, { ...POSES[0], duration: 1.1, ease: 'expo.out', overwrite: 'auto' });
        }
        restart();
      }

      const next = () => go(idx + 1, 1);
      const prevCard = () => go(idx - 1, -1);

      function restart() {
        if (!g || instant) return;
        if (autoplay) autoplay.kill();
        g.set(bar, { scaleX: 0 });
        autoplay = g.to(bar, { scaleX: 1, duration: 9, ease: 'none', onComplete: next });
        refreshPause();
      }
      function refreshPause() {
        if (!autoplay) return;
        autoplay.paused(hovering || dragging || !inView || userPaused || document.hidden);
      }

      sync(false);
      if (!g) { $('#rev-prev').addEventListener('click', prevCard); $('#rev-next').addEventListener('click', next); return; }

      $('#rev-prev').addEventListener('click', () => { userPaused = true; prevCard(); });
      $('#rev-next').addEventListener('click', () => { userPaused = true; next(); });
      section.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { userPaused = true; next(); }
        if (e.key === 'ArrowLeft') { userPaused = true; prevCard(); }
      });
      stage.addEventListener('pointerenter', () => { hovering = true; refreshPause(); });
      stage.addEventListener('pointerleave', () => { hovering = false; refreshPause(); });
      document.addEventListener('visibilitychange', refreshPause);
      ScrollTrigger.create({ trigger: section, start: 'top 80%', end: 'bottom 20%', onToggle: (s) => { inView = s.isActive; refreshPause(); } });

      // Glisser pour changer d’avis
      let startX = 0; let dx = 0; let pointerId = null;
      stage.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        pointerId = e.pointerId; startX = e.clientX; dx = 0; dragging = true; refreshPause();
        stage.classList.add('is-drag');
        stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pointerId) return;
        dx = e.clientX - startX;
        g.set(cards[idx], { x: dx, rotation: dx * 0.025 });
      });
      const end = (e) => {
        if (!dragging || (e && e.pointerId !== pointerId)) return;
        dragging = false; stage.classList.remove('is-drag');
        if (Math.abs(dx) > 70) { userPaused = true; dx < 0 ? next() : prevCard(); }
        else { g.to(cards[idx], { ...POSES[0], duration: 0.9, ease: 'expo.out' }); refreshPause(); }
      };
      stage.addEventListener('pointerup', end);
      stage.addEventListener('pointercancel', end);

      restart();
    };
  }
})();
