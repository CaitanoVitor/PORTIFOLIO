
/*  Utilitários simples (responsabilidade única por função)  */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* =========================
   Ano no rodapé
   ========================= */
(function setYear() {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* =========================
   Nav móvel (abrir/fechar)
   ========================= */
(function mobileNav() {
  const btn = $('.nav__toggle');
  const menu = $('#primary-nav');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const opened = menu.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(opened));
  });

  // Fechar ao clicar em link
  menu.addEventListener('click', (e) => {
    if (e.target.matches('a')) {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* =========================
   Scroll suave com compensação do header sticky
   ========================= */
(function smoothAnchors() {
  const header = $('.site-header');

  function getOffsetTop(el) {
    const headerH = header ? header.getBoundingClientRect().height : 0;
    return el.getBoundingClientRect().top + window.scrollY - (headerH + 10);
  }

  $$('.nav__menu a, .hero__cta a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    a.addEventListener('click', (e) => {
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: getOffsetTop(target), behavior: 'smooth' });
      history.pushState(null, '', href);
    });
  });
})();

/* =========================
   Filtro de projetos
   ========================= */
(function projectFilters() {
  const chips = $$('.chip');
  const cards = $$('.card');

  function apply(filter) {
    cards.forEach(card => {
      const tags = (card.dataset.tags || '').toLowerCase();
      const show = filter === 'all' || tags.includes(filter);
      card.style.display = show ? '' : 'none';
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
      });
      apply(chip.dataset.filter);
    });
  });
})();

/* =========================
   Reveal on scroll
   ========================= */
(function revealOnScroll() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible')); return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
})();

/* =========================
   Modais acessíveis (foco gerenciado + Esc)
   ========================= */
(function modals() {
  const map = {
    bolso: $('#modal-bolso'),
    bikcraft: $('#modal-bikcraft'),
    dindin: $('#modal-dindin'),
    spotify: $('#modal-spotify'),
    forca: $('#modal-forca'),
  };

  const FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  function trapFocus(modal, e) {
    const fEls = $$(FOCUSABLE, modal);
    if (!fEls.length) return;
    const first = fEls[0];
    const last = fEls[fEls.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
      }
    }
  }

  function openModal(id) {
    const modal = map[id];
    if (!modal) return;

    lastFocused = document.activeElement;
    modal.hidden = false;
    modal.dataset.open = 'true';

    // Foco no primeiro elemento focável
    const first = $(FOCUSABLE, modal) || $('.modal__close', modal);
    first?.focus();

    function onKey(e) {
      if (e.key === 'Escape') closeModal(modal);
      trapFocus(modal, e);
    }

    modal.addEventListener('keydown', onKey);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
  }

  function closeModal(modal) {
    modal.hidden = true;
    modal.dataset.open = 'false';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  $$('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modal));
  });
  $$('.modal__close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
  });
})();

/* =========================
   Fundo de estrelas (canvas)
   ========================= */
(function starfield() {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let w, h, anim;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    genStars();
    draw();
  }

  function genStars() {
    const density = Math.min(220, Math.floor((w * h) / 8000));
    stars = Array.from({ length: density }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.2,
      s: Math.random() * 0.35 + 0.05, // velocidade
      a: Math.random() * 0.7 + 0.3   // brilho
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    for (const st of stars) {
      ctx.globalAlpha = st.a;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick() {
    for (const st of stars) {
      st.y += st.s;
      if (st.y > h) { st.y = -2; st.x = Math.random() * w; }
    }
    draw();
    anim = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(anim);
    resize();
    if (!prefersReduced) anim = requestAnimationFrame(tick);
  });

  resize();
  if (!prefersReduced) anim = requestAnimationFrame(tick);
})();
