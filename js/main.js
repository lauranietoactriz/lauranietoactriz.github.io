/* Laura Nieto — Actriz · interacciones de la web */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;

  /* ---------- Idioma ---------- */
  var TITLES = { es: 'Laura Nieto — Actriz', en: 'Laura Nieto — Actress' };

  function applyLang(lang) {
    doc.lang = lang;
    document.title = TITLES[lang];
    // Textos alternativos y etiquetas accesibles
    document.querySelectorAll('[data-alt-en]').forEach(function (el) {
      if (!el.dataset.altEs) el.dataset.altEs = el.getAttribute('alt') || '';
      el.setAttribute('alt', lang === 'en' ? el.dataset.altEn : el.dataset.altEs);
    });
    document.querySelectorAll('[data-aria-en]').forEach(function (el) {
      if (!el.dataset.ariaEs) el.dataset.ariaEs = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', lang === 'en' ? el.dataset.ariaEn : el.dataset.ariaEs);
    });
  }

  applyLang(doc.lang === 'en' ? 'en' : 'es');

  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-set-lang');
      applyLang(lang);
      try { localStorage.setItem('lang', lang); } catch (e) {}
      // Mantener la URL limpia y compartible (?lang=en solo en inglés)
      try {
        var url = new URL(location.href);
        if (lang === 'en') url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang');
        history.replaceState(null, '', url);
      } catch (e) {}
    });
  });

  /* ---------- Año en el pie ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Cabecera al hacer scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    doc.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Escena clara / oscura y enlace activo ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-scene]')).filter(function (s) { return s !== body; });
  var navLinks = {};
  document.querySelectorAll('.nav a').forEach(function (a) { navLinks[a.getAttribute('href').slice(1)] = a; });

  if ('IntersectionObserver' in window) {
    var sceneObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var s = entry.target;
        body.setAttribute('data-scene', s.getAttribute('data-scene'));
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', s.getAttribute('data-scene') === 'dark' ? '#0E0B0A' : '#F2EDE5');
        Object.keys(navLinks).forEach(function (id) { navLinks[id].classList.toggle('is-active', id === s.id); });
      });
    }, { rootMargin: '-48% 0px -48% 0px' });
    sections.forEach(function (s) { sceneObserver.observe(s); });

    /* ---------- Revelado al hacer scroll ---------- */
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Videobook ---------- */
  document.querySelectorAll('.player').forEach(function (player) {
    var cover = player.querySelector('.player__cover');
    var video = player.querySelector('video');
    cover.addEventListener('click', function () {
      var embed = player.getAttribute('data-embed');
      if (embed) {
        var iframe = document.createElement('iframe');
        iframe.src = embed;
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.title = 'Videobook — Laura Nieto';
        if (video) video.remove();
        player.appendChild(iframe);
      } else if (video) {
        video.controls = true;
        video.preload = 'auto';
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
        video.focus();
      }
      player.classList.add('is-playing');
    });
  });

  /* ---------- Visor de fotos ---------- */
  var box = document.querySelector('.lightbox');
  if (!box || typeof box.showModal !== 'function') return;

  var boxImg = box.querySelector('.lightbox__img');
  var boxText = box.querySelector('.lightbox__text');
  var boxCount = box.querySelector('.lightbox__count');
  var items = [];
  var index = 0;
  var opener = null;

  function captionFor(btn) {
    var c = btn.getAttribute('data-caption') || '';
    if (c.indexOf('|') > -1) c = c.split('|')[doc.lang === 'en' ? 1 : 0];
    return c;
  }

  function show(i) {
    index = (i + items.length) % items.length;
    var btn = items[index];
    var img = btn.querySelector('img');
    boxImg.classList.add('is-loading');
    boxImg.onload = function () { boxImg.classList.remove('is-loading'); };
    boxImg.sizes = '100vw';
    boxImg.srcset = img.getAttribute('srcset') || '';
    boxImg.src = img.currentSrc || img.src;
    boxImg.alt = img.alt;
    if (boxImg.complete) boxImg.classList.remove('is-loading');
    boxText.textContent = captionFor(btn);
    boxCount.textContent = (index + 1) + ' / ' + items.length;
    // Precargar la siguiente
    var next = items[(index + 1) % items.length];
    if (next) { var pre = new Image(); pre.sizes = '100vw'; pre.srcset = next.querySelector('img').getAttribute('srcset') || ''; }
  }

  function open(btn) {
    var group = btn.getAttribute('data-gallery');
    items = Array.prototype.slice.call(document.querySelectorAll('.zoom[data-gallery="' + group + '"]'));
    opener = btn;
    box.classList.toggle('is-single', items.length < 2);
    show(items.indexOf(btn));
    box.showModal();
    doc.style.overflow = 'hidden';
  }

  box.addEventListener('close', function () {
    doc.style.overflow = '';
    boxImg.removeAttribute('srcset');
    boxImg.removeAttribute('src');
    if (opener) opener.focus({ preventScroll: true });
  });

  document.querySelectorAll('.zoom[data-gallery]').forEach(function (btn) {
    btn.addEventListener('click', function () { open(btn); });
  });

  box.querySelector('.lightbox__close').addEventListener('click', function () { box.close(); });
  box.querySelector('.lightbox__prev').addEventListener('click', function () { show(index - 1); });
  box.querySelector('.lightbox__next').addEventListener('click', function () { show(index + 1); });

  // Cerrar al pulsar fuera de la foto
  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.classList.contains('lightbox__figure')) box.close();
  });

  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
  });

  // Deslizar en móvil
  var touchX = null, touchY = null;
  box.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) box.close();
    touchX = touchY = null;
  });
})();
