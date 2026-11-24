/* ==========================================================
   THEME — dark / light with persistence and OS detection.
   The flash-prevention snippet lives in <head> in index.html.
   ========================================================== */
(function () {
  'use strict';

  var KEY = 'portfolio-theme';
  var root = document.documentElement;
  var mq = window.matchMedia('(prefers-color-scheme: light)');

  function stored() {
    try { var v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch (e) { return null; }
  }

  function current() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

  function paint(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f2efe8' : '#0d0d0c');
    var btn = document.getElementById('themeToggle');
    if (btn) {
      var toLight = theme === 'dark';
      btn.setAttribute('aria-label', toLight ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-pressed', String(theme === 'light'));
      btn.title = toLight ? 'Light mode' : 'Dark mode';
    }
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function set(theme, persist) {
    if (persist) { try { localStorage.setItem(KEY, theme); } catch (e) {} }
    // Smooth GPU cross-fade where supported; instant (and cheap) elsewhere.
    if (document.startViewTransition && !reduce && persist !== undefined && document.body) {
      document.startViewTransition(function () { paint(theme); });
    } else {
      paint(theme);
    }
  }

  function init() {
    paint(current());
    var btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', function () { set(current() === 'dark' ? 'light' : 'dark', true); });

    // Follow the OS only while the visitor has not chosen explicitly.
    var onChange = function (e) { if (!stored()) set(e.matches ? 'light' : 'dark', false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }

  window.Theme = { set: set, current: current, hasStored: function () { return !!stored(); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
