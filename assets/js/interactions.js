/* ==========================================================
   INTERACTIONS — navigation, filters, project modal, contact form
   ========================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('no-anim');

  /* ---------- navigation ---------- */
  function initNav() {
    var nav = $('#nav');
    var burger = $('#navBurger');
    var menu = $('#mobileMenu');

    // transparent -> solid
    var ticking = false;
    function onScroll() {
      nav.classList.toggle('is-solid', window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    // active section indicator (sections without a nav entry inherit the previous one)
    var sections = $$('main section[id]');
    var navTargets = {};
    $$('#navLinks [data-nav-link]').forEach(function (a) { navTargets[a.getAttribute('href').slice(1)] = true; });
    function setActive(id) {
      $$('[data-nav-link]').forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    function detect() {
      var line = window.innerHeight * 0.35;
      var idx = 0;
      sections.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) idx = i; });
      while (idx > 0 && !navTargets[sections[idx].id]) idx--;
      setActive(sections[idx].id);
    }
    var t2 = false;
    window.addEventListener('scroll', function () { if (!t2) { t2 = true; requestAnimationFrame(function () { detect(); t2 = false; }); } }, { passive: true });
    window.addEventListener('resize', detect);
    detect();

    // mobile menu
    function setMenu(open) {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('is-locked', open);
      if (open) nav.classList.add('is-solid'); else onScroll();
    }
    setMenu(false);
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

    // back to top
    $('#toTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  }

  /* ---------- filtering (shared by skills and projects) ---------- */
  function filterGroup(buttons, items, onChange) {
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('aria-pressed') === 'true') return;
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var key = btn.getAttribute('data-filter');
        var match = function (it) { return key === 'all' || it.getAttribute('data-category') === key; };

        // let the reveal system step aside so the filter animation owns transform/opacity
        items.forEach(function (it) { it.removeAttribute('data-reveal'); it.classList.remove('in-view'); it.style.removeProperty('--i'); });

        if (reduce) {
          items.forEach(function (it) { it.classList.toggle('is-hidden', !match(it)); });
          if (onChange) onChange(items.filter(match).length);
          return;
        }
        items.forEach(function (it) { if (!match(it) && !it.classList.contains('is-hidden')) it.classList.add('is-leaving'); });
        window.setTimeout(function () {
          var n = 0;
          items.forEach(function (it) {
            it.classList.remove('is-leaving', 'is-entering');
            if (match(it)) {
              var wasHidden = it.classList.contains('is-hidden');
              it.classList.remove('is-hidden');
              if (wasHidden) {
                it.style.setProperty('--i', n);
                it.classList.add('is-entering');
                window.setTimeout(function () { it.classList.remove('is-entering'); }, 900);
              }
              n++;
            } else {
              it.classList.add('is-hidden');
            }
          });
          if (onChange) onChange(n);
        }, 230);
      });
    });
  }

  function initFilters() {
    filterGroup($$('#skillFilters .filter'), $$('#skillGrid .skill'));
    filterGroup($$('#projectFilters .filter'), $$('#projectGrid .project'), function (count) {
      $('#projectEmpty').hidden = count > 0;
    });
  }

  /* ---------- project modal ---------- */
  var PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10"><rect width="16" height="10" fill="#555" opacity=".25"/></svg>');

  function initModal(data) {
    var dlg = $('#projectModal');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var projects = data.projects || [];
    var shots = [], idx = 0;
    var img = $('#modalImg'), prev = $('#modalPrev'), next = $('#modalNext'), thumbs = $('#modalThumbs');
    var safeUrl = window.Portfolio.safeUrl;

    img.addEventListener('error', function () { if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER; });

    function show(i) {
      idx = (i + shots.length) % shots.length;
      img.src = shots[idx].src;
      img.alt = shots[idx].alt;
      $$('button', thumbs).forEach(function (b, n) { b.setAttribute('aria-current', String(n === idx)); });
    }

    function open(i) {
      var p = projects[i];
      if (!p) return;
      var list = Array.isArray(p.screenshots) ? p.screenshots.filter(function (s) { return s && s.src; }) : [];
      if (!list.length && p.image) list = [{ src: p.image, alt: p.imageAlt || p.title }];
      shots = list.map(function (s) { return { src: String(s.src), alt: String(s.alt || p.title || '') }; });
      if (!shots.length) shots = [{ src: PLACEHOLDER, alt: '' }];

      $('#modalCat').textContent = p.category || '';
      $('#modalTitle').textContent = p.title || '';
      $('#modalDesc').textContent = p.description || '';
      $('#modalDetails').textContent = p.details || '';
      $('#modalDetails').hidden = !p.details;

      var tech = $('#modalTech');
      tech.textContent = '';
      (p.technologies || []).forEach(function (t) { var li = document.createElement('li'); li.className = 'chip'; li.textContent = t; tech.appendChild(li); });

      thumbs.textContent = '';
      thumbs.hidden = shots.length < 2;
      prev.hidden = next.hidden = shots.length < 2;
      shots.forEach(function (s, n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Show screenshot ' + (n + 1));
        var t = document.createElement('img');
        t.src = s.src; t.alt = ''; t.loading = 'lazy';
        t.addEventListener('error', function () { t.src = PLACEHOLDER; });
        b.appendChild(t);
        b.addEventListener('click', function () { show(n); });
        thumbs.appendChild(b);
      });

      var links = $('#modalLinks');
      links.textContent = '';
      var live = safeUrl(p.liveUrl), git = safeUrl(p.githubUrl);
      function addLink(url, label, primary, iconName, brand) {
        var a = document.createElement('a');
        a.className = 'btn ' + (primary ? 'btn--primary' : 'btn--ghost');
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.appendChild(brand ? window.Icons.brand(iconName) : window.Icons.lucide(iconName));
        var s = document.createElement('span'); s.textContent = label; a.appendChild(s);
        links.appendChild(a);
      }
      if (live) addLink(live, 'Live Demo', true, 'external-link', false);
      if (git) addLink(git, 'GitHub', false, 'github', true);
      links.hidden = !(live || git);

      show(0);
      document.body.classList.add('is-locked');
      dlg.showModal();
    }

    $('#projectGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-project]');
      if (btn) open(parseInt(btn.getAttribute('data-project'), 10));
    });
    $('#modalClose').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { document.body.classList.remove('is-locked'); });
    prev.addEventListener('click', function () { show(idx - 1); });
    next.addEventListener('click', function () { show(idx + 1); });
    dlg.addEventListener('keydown', function (e) {
      if (shots.length < 2) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- contact form ---------- */
  function initForm(data) {
    var form = $('#contactForm');
    var status = $('#formStatus');
    var cfg = (data.contact && data.contact.form) || {};
    var safeUrl = window.Portfolio.safeUrl;

    var rules = {
      name: function (v) {
        if (!v) return 'Please enter your name.';
        if (v.length < 2) return 'Your name should be at least 2 characters.';
        return '';
      },
      email: function (v) {
        if (!v) return 'Please enter your email address.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'That email does not look right. Try name@example.com.';
        return '';
      },
      subject: function (v) {
        if (!v) return 'Please add a subject.';
        if (v.length < 3) return 'The subject should be at least 3 characters.';
        return '';
      },
      message: function (v) {
        if (!v) return 'Please tell me about your project.';
        if (v.length < 10) return 'Please write at least 10 characters so I can understand your request.';
        return '';
      }
    };

    function check(input) {
      var msg = rules[input.name](input.value.trim());
      var field = input.closest('.field');
      field.classList.toggle('has-error', !!msg);
      $('#' + input.id + '-err').textContent = msg;
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      return !msg;
    }

    var inputs = $$('input, textarea', form);
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value || input.closest('.field').classList.contains('has-error')) check(input); });
      input.addEventListener('input', function () { if (input.closest('.field').classList.contains('has-error')) check(input); });
    });

    function say(text, kind) {
      status.textContent = text;
      status.className = 'form__status' + (kind ? ' is-' + kind : '');
    }

    /* ------------------------------------------------------------------
       INTEGRATION POINT
       This site is frontend-only. When contact.form.endpoint in
       portfolio.json is empty, the form opens the visitor's email app
       with the message pre-filled (nothing is sent automatically).
       To send messages from the site itself, put a service URL such as a
       Formspree / Getform / EmailJS-compatible endpoint, or your own
       Laravel route, in "contact.form.endpoint". See README.md.
       ------------------------------------------------------------------ */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      inputs.forEach(function (i) { if (!check(i) && !firstBad) firstBad = i; });
      if (firstBad) { say('Please fix the highlighted fields and try again.', 'err'); firstBad.focus(); return; }

      var payload = {};
      inputs.forEach(function (i) { payload[i.name] = i.value.trim(); });
      var endpoint = safeUrl(cfg.endpoint);

      if (endpoint) {
        say('Sending…');
        fetch(endpoint, {
          method: (cfg.method || 'POST').toUpperCase(),
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          say('Thank you! Your message has been sent.', 'ok');
        }).catch(function () {
          say('Sorry, the message could not be sent. Please email me directly instead.', 'err');
        });
        return;
      }

      var to = (data.personal && data.personal.email) || '';
      var subject = (cfg.subjectPrefix || '') + payload.subject;
      var body = payload.message + '\n\n— ' + payload.name + ' (' + payload.email + ')';
      window.location.href = 'mailto:' + encodeURIComponent(to).replace('%40', '@') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      say('Your email app should open with the message ready. Nothing is sent until you press send there.', 'ok');
    });
  }

  function init(data) {
    initNav();
    initFilters();
    initModal(data);
    initForm(data);
  }

  document.addEventListener('portfolio:ready', function (e) { init(e.detail.data); }, { once: true });
})();
