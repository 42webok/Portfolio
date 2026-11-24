/* ==========================================================
   ANIMATIONS — loader, scroll reveals, progress bar, counters.
   Deliberately light: no per-frame pointer tracking, no parallax
   loops. Honours prefers-reduced-motion.
   ========================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('no-anim');
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- loader: 0 -> 100 counter, exits once content is ready ---------- */
  var DURATION = reduce ? 0 : 1100;
  var loaderStart = performance.now();
  var countEl = $('#loaderCount');
  var barEl = $('#loaderBar');
  var loaderDone = false;

  function tickLoader(now) {
    if (loaderDone) return;
    var p = DURATION ? Math.min(1, (now - loaderStart) / DURATION) : 1;
    var eased = 1 - Math.pow(1 - p, 2.2);
    if (countEl) countEl.textContent = Math.round(eased * 100);
    if (barEl) barEl.parentNode.style.setProperty('--p', eased.toFixed(3));
    if (p < 1) requestAnimationFrame(tickLoader);
  }
  requestAnimationFrame(tickLoader);

  function finishLoader(after) {
    var wait = Math.max(0, DURATION - (performance.now() - loaderStart)) + (reduce ? 0 : 150);
    window.setTimeout(function () {
      loaderDone = true;
      if (countEl) countEl.textContent = '100';
      var loader = $('#loader');
      if (loader) loader.classList.add('is-done');
      root.classList.add('is-loaded');
      window.setTimeout(after, reduce ? 0 : 350);
    }, wait);
  }

  /* ---------- reveal on scroll ---------- */
  function startReveals() {
    var title = $('#heroTitle');
    if (title) title.classList.add('is-ready');
    document.querySelectorAll('.hero [data-reveal]').forEach(function (el, i) { el.style.setProperty('--i', i); });
    var targets = document.querySelectorAll('[data-reveal]');
    var process = $('#processList');

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('in-view'); });
      if (process) process.classList.add('in-view');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.classList.add('in-view');
        // Hand transform/opacity back to the component once finished.
        window.setTimeout(function () { el.removeAttribute('data-reveal'); el.classList.remove('in-view'); el.style.removeProperty('--i'); }, 1500);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(function (t) { io.observe(t); });

    if (process) {
      var po = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { process.classList.add('in-view'); po.disconnect(); }
      }, { threshold: 0.3 });
      po.observe(process);
    }
  }

  /* ---------- counters (real numbers only) ---------- */
  function startCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;
    var run = function (el) {
      var end = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = end + suffix; return; }
      var t0 = performance.now(), dur = 1100;
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    };
    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { n.textContent = '0' + (n.getAttribute('data-suffix') || ''); io.observe(n); });
  }

  /* ---------- scroll progress ---------- */
  function startProgress() {
    var bar = $('#scrollProgress');
    if (!bar) return;
    if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) { bar.classList.add('is-native'); return; }
    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- pause marquee when off-screen ---------- */
  function startMarquee() {
    var m = $('.marquee'), track = $('#marqueeTrack');
    if (!m || !track || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (e) { track.style.animationPlayState = e[0].isIntersecting ? 'running' : 'paused'; }).observe(m);
  }

  function init() {
    startProgress();
    finishLoader(function () {
      startReveals();
      startCounters();
      startMarquee();
    });
  }

  if (window.__portfolioReady) init();
  else document.addEventListener('portfolio:ready', init, { once: true });

  // Never leave the loader stuck if content fails to load.
  window.setTimeout(function () {
    var loader = $('#loader');
    if (loader && !window.__portfolioReady) { loaderDone = true; loader.classList.add('is-done'); }
  }, 8000);
})();
