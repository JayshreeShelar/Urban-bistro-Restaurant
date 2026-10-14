/* Urban Bistro - main.js (no dependencies; works from file:// too) */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---- Image fallback (inline, no extra file needed) ---- */
  const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#1b1815"/><circle cx="400" cy="290" r="52" fill="none" stroke="#f26b21" stroke-width="3"/><path d="M372 290h56M400 262v56" stroke="#f26b21" stroke-width="3" stroke-linecap="round"/></svg>');
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement && !t.dataset.fb) { t.dataset.fb = '1'; t.src = FALLBACK; }
  }, true);

  /* ---- Header: solid on scroll ---- */
  const header = $('.header');
  const toTop = $('.to-top');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (toTop) toTop.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---- Mobile menu ---- */
  const burger = $('.burger');
  const mobile = $('.mobile');
  if (burger && mobile) {
    const setOpen = (open) => {
      mobile.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('lock', open);
    };
    burger.addEventListener('click', () => setOpen(!mobile.classList.contains('open')));
    $$('a', mobile).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.matchMedia('(min-width:1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ---- Hero slider (3 banners, auto-change) ---- */
  const hero = $('.hero');
  if (hero) {
    const slides = $$('.slide', hero);
    const dots = $$('.dot', hero);
    const counter = $('.counter b', hero);
    const DURATION = 6500;
    let i = 0, timer = null, paused = false, remaining = DURATION, started = 0;
    hero.style.setProperty('--dur', DURATION + 'ms');

    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('active', k === i); s.setAttribute('aria-hidden', String(k !== i)); });
      dots.forEach((d, k) => { d.classList.remove('active'); d.setAttribute('aria-current', String(k === i)); });
      void hero.offsetWidth; // restart progress animation
      if (dots[i]) dots[i].classList.add('active');
      if (counter) counter.textContent = String(i + 1).padStart(2, '0');
      remaining = DURATION;
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      if (paused) return;
      started = Date.now();
      timer = setTimeout(() => go(i + 1), remaining);
    };
    const pause = () => { if (paused) return; paused = true; hero.classList.add('paused'); remaining -= Date.now() - started; clearTimeout(timer); };
    const resume = () => { if (!paused) return; paused = false; hero.classList.remove('paused'); schedule(); };

    $('.arrow-prev', hero)?.addEventListener('click', () => go(i - 1));
    $('.arrow-next', hero)?.addEventListener('click', () => go(i + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
    hero.addEventListener('mouseenter', pause);
    hero.addEventListener('mouseleave', resume);
    hero.addEventListener('focusin', pause);
    hero.addEventListener('focusout', resume);
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));

    let sx = 0;
    hero.addEventListener('touchstart', (e) => { sx = e.changedTouches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
    }, { passive: true });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) paused = true;
    go(0);
  }

  /* ---- Scroll reveal ---- */
  // After the fade-in finishes, the reveal classes are removed so they never
  // interfere with hover effects (lift, zoom, glow) on cards and tiles.
  const reveals = $$('.reveal');
  const settle = (el) => setTimeout(() => { el.classList.remove('reveal', 'in'); el.style.removeProperty('--d'); }, 1300);
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) reveals.forEach((el) => { el.classList.add('in'); settle(el); });
    else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          settle(en.target);
          io.unobserve(en.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach((el) => {
        const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal')) : [];
        el.style.setProperty('--d', (Math.min(sibs.indexOf(el), 5) * 0.08) + 's');
        io.observe(el);
      });
    }
  }

  /* ---- Filters (menu + gallery) ---- */
  const chips = $$('.chip[data-filter]');
  const items = $$('[data-category]');
  if (chips.length && items.length) {
    const valid = chips.map((c) => c.dataset.filter);
    const setFilter = (f) => {
      items.forEach((el) => { el.hidden = !(f === 'all' || el.dataset.category === f); });
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
    };
    chips.forEach((c) => c.addEventListener('click', () => {
      setFilter(c.dataset.filter);
      if ($('.menu-cat')) history.replaceState(null, '', c.dataset.filter === 'all' ? location.pathname : '#' + c.dataset.filter);
    }));
    const h = location.hash.replace('#', '');
    setFilter($('.menu-cat') && valid.includes(h) ? h : 'all');
  }

  /* ---- Lightbox ---- */
  const lb = $('.lightbox');
  if (lb) {
    const img = $('img', lb), cap = $('.cap', lb), cnt = $('.count', lb);
    let list = [], idx = 0, last = null;
    const show = (n) => {
      idx = (n + list.length) % list.length;
      const im = $('img', list[idx]);
      img.src = im.dataset.full || im.src; img.alt = im.alt;
      cap.textContent = im.alt; cnt.textContent = (idx + 1) + ' / ' + list.length;
    };
    const open = (el) => {
      list = $$('.shot').filter((s) => !s.hidden);
      last = document.activeElement;
      lb.classList.add('open'); document.body.classList.add('lock');
      show(list.indexOf(el)); $('.lb-close', lb).focus();
    };
    const close = () => { lb.classList.remove('open'); document.body.classList.remove('lock'); img.src = ''; if (last) last.focus(); };
    $$('.shot').forEach((s) => $('button', s).addEventListener('click', () => open(s)));
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
    $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    let tx = 0;
    lb.addEventListener('touchstart', (e) => { tx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) show(d < 0 ? idx + 1 : idx - 1); }, { passive: true });
  }

  /* ---- Contact form (frontend demo validation) ---- */
  const form = $('#contact-form');
  if (form) {
    const ok = $('#form-success'), nameOut = $('#success-name'), sum = $('#form-error-summary');
    const rules = {
      name: (v) => (v.length < 2 ? 'Please enter your name.' : ''),
      email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Please enter a valid email address.' : ''),
      subject: (v) => (v.length < 3 ? 'Please add a subject.' : ''),
      message: (v) => (v.length < 10 ? 'Your message should be at least 10 characters.' : ''),
    };
    const fields = $$('input[name],textarea[name]', form).filter((f) => rules[f.name]);
    const check = (f) => {
      const msg = rules[f.name](f.value.trim());
      const e = $('#' + f.id + '-error');
      f.setAttribute('aria-invalid', String(!!msg));
      if (e) { e.textContent = msg; e.hidden = !msg; }
      return !msg;
    };
    fields.forEach((f) => {
      f.addEventListener('blur', () => check(f));
      f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      ok.hidden = true;
      const res = fields.map(check);
      if (res.includes(false)) { sum.hidden = false; fields[res.indexOf(false)].focus(); return; }
      sum.hidden = true;
      nameOut.textContent = form.elements.name.value.trim();
      form.reset();
      ok.hidden = false;
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---- Footer year ---- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
