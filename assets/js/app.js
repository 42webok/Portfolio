/* ==========================================================
   APP — loads assets/data/portfolio.json and renders the page.
   All content is inserted with textContent / setAttribute (never
   innerHTML) so values from the JSON cannot inject markup.
   ========================================================== */
(function () {
  'use strict';

  var DATA_URL = 'assets/data/portfolio.json';
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  var SOCIALS = {
    github:   { icon: 'github',   label: 'GitHub' },
    linkedin: { icon: 'linkedin', label: 'LinkedIn' },
    fiverr:   { icon: 'fiverr',   label: 'Fiverr' },
    upwork:   { icon: 'upwork',   label: 'Upwork' },
    whatsapp: { icon: 'whatsapp', label: 'WhatsApp' }
  };

  /* ---------- helpers ---------- */

  /** Tiny safe element factory. */
  function h(tag, props, children) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style') Object.keys(v).forEach(function (p) { node.style.setProperty(p, v[p]); });
      else node.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return node;
  }

  /** Only allow http(s), mailto, tel or same-site relative URLs. */
  function safeUrl(u) {
    if (typeof u !== 'string' || !u.trim()) return '';
    try {
      var url = new URL(u.trim(), window.location.href);
      return ['http:', 'https:', 'mailto:', 'tel:'].indexOf(url.protocol) > -1 ? u.trim() : '';
    } catch (e) { return ''; }
  }

  function isExternal(u) { return /^https?:/i.test(u) && new URL(u, location.href).origin !== location.origin; }

  function link(href, props, children) {
    var p = props || {};
    p.href = href;
    if (isExternal(href)) { p.target = '_blank'; p.rel = 'noopener noreferrer'; }
    return h('a', p, children);
  }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function str(v) { return typeof v === 'string' ? v : ''; }
  function setText(sel, value) { var n = $(sel); if (n) n.textContent = str(value); }

  function initials(name) {
    var parts = str(name).trim().split(/\s+/).filter(Boolean);
    return ((parts[0] || '')[0] || '').toUpperCase() + ((parts[1] || '')[0] || '').toUpperCase() || '·';
  }

  function whatsappUrl(v) {
    v = str(v).trim();
    if (!v) return '';
    if (/^\+?[\d\s-]{6,}$/.test(v)) return 'https://wa.me/' + v.replace(/\D/g, '');
    return safeUrl(v);
  }

  function socialLinks(data) {
    var out = [];
    Object.keys(SOCIALS).forEach(function (key) {
      var raw = data.socials && data.socials[key];
      var url = key === 'whatsapp' ? whatsappUrl(raw) : safeUrl(raw);
      if (url) out.push({ key: key, url: url, label: SOCIALS[key].label, icon: SOCIALS[key].icon });
    });
    return out;
  }

  function skillColor(data, iconName) {
    var s = arr(data.skills).filter(function (x) { return x.icon === iconName; })[0];
    return s && s.color ? s.color : '';
  }

  function reveal(node, i) {
    node.setAttribute('data-reveal', '');
    if (i != null) node.style.setProperty('--i', Math.min(i, 8));
    return node;
  }

  /* ---------- render: global ---------- */

  function renderSocials(container, data, withLabel) {
    clear(container);
    socialLinks(data).forEach(function (s) {
      var a = link(s.url, { 'aria-label': s.label, title: s.label });
      a.appendChild(window.Icons.brand(s.icon));
      container.appendChild(withLabel ? h('li', {}, [a]) : h('li', {}, [a]));
    });
  }

  function renderSectionHeads(data) {
    document.querySelectorAll('[data-section]').forEach(function (head) {
      var key = head.getAttribute('data-section');
      var s = (data.sections && data.sections[key]) || {};
      clear(head);
      head.appendChild(h('p', { class: 'eyebrow', text: str(s.eyebrow) }));
      var titleText = str(s.title);
      var h2 = h('h2', { class: 'section__title', id: key + 'Title', 'aria-label': titleText });
      titleText.split(/\s+/).filter(Boolean).forEach(function (w, n, all) {
        h2.appendChild(h('span', { class: 'split-word', 'aria-hidden': 'true', style: { '--w': Math.min(n, 12) } }, [h('span', { text: w })]));
        if (n < all.length - 1) h2.appendChild(document.createTextNode(' '));
      });
      head.appendChild(h2);
      if (s.subtitle) head.appendChild(h('p', { class: 'section__sub', text: s.subtitle }));
      reveal(head);
    });
  }

  function renderNav(data) {
    var items = arr(data.navigation);
    var desktop = $('#navLinks'), mobile = $('#mobileLinks'), foot = $('#footNav');
    [desktop, mobile, foot].forEach(clear);
    items.forEach(function (it, i) {
      var href = '#' + str(it.target);
      desktop.appendChild(h('a', { class: 'nav__link', href: href, 'data-nav-link': '', text: str(it.label) }));
      var m = h('a', { href: href, 'data-nav-link': '', style: { '--i': i } }, [h('span', { text: str(it.label) })]);
      m.appendChild(window.Icons.lucide('arrow-up-right'));
      mobile.appendChild(m);
      foot.appendChild(h('a', { href: href, text: str(it.label) }));
    });
    var ms = $('#mobileSocials');
    clear(ms);
    var ul = h('ul', { class: 'socials' });
    renderSocials(ul, data);
    ms.appendChild(ul);
  }

  function renderBrand(data) {
    var name = str(data.personal.name);
    var mark = initials(name);
    ['#logoMark', '#footMark'].forEach(function (s) { setText(s, mark); });
    ['#logoText', '#footName', '#footCopyName', '#loaderMark', '#footWordmark'].forEach(function (s) { setText(s, name); });
    setText('#loaderRole', data.personal.title);
    setText('#footTagline', data.footer && data.footer.tagline);
    setText('#year', new Date().getFullYear());
  }

  function renderFooter(data) {
    var f = data.footer || {}, p = data.personal;
    setText('#footCtaLabel', f.ctaLabel);
    var title = $('#footCtaTitle');
    var text = str(f.ctaTitle), hl = str(f.ctaHighlight);
    clear(title);
    var at = hl ? text.indexOf(hl) : -1;
    if (at > -1) {
      title.appendChild(document.createTextNode(text.slice(0, at)));
      title.appendChild(h('em', { text: hl }));
      title.appendChild(document.createTextNode(text.slice(at + hl.length)));
    } else { title.textContent = text; }

    var mail = $('#footMail'), email = str(p.email);
    if (email) { mail.setAttribute('href', safeUrl('mailto:' + email)); setText('#footMailText', email); }

    var soc = $('#footSocials');
    clear(soc);
    socialLinks(data).forEach(function (s) {
      soc.appendChild(link(s.url, {}, [window.Icons.brand(s.icon), h('span', { text: s.label })]));
    });

    var info = $('#footInfo');
    clear(info);
    if (str(p.location)) info.appendChild(h('span', { text: p.location }));
    if (str(p.title)) info.appendChild(h('span', { text: p.title }));
    if (str(p.phone)) info.appendChild(h('span', { text: p.phone }));
  }

  function renderMarquee(data) {
    var track = $('#marqueeTrack');
    clear(track);
    var skills = arr(data.skills);
    for (var round = 0; round < 2; round++) {
      skills.forEach(function (s) {
        track.appendChild(h('span', { class: 'marquee__item' }, [window.Icons.icon(s.icon, { color: s.color }), h('span', { text: str(s.name) })]));
      });
    }
  }

  function renderStatus(data) {
    var p = data.personal;
    var text = p.availability ? str(p.availabilityText) : str(p.unavailableText);
    [['#heroStatus', '#heroStatusText'], ['#contactStatus', '#contactStatusText'], ['#footStatus', '#footStatusText']].forEach(function (pair) {
      var wrap = $(pair[0]);
      if (!wrap) return;
      wrap.classList.toggle('is-off', !p.availability);
      setText(pair[1], text);
    });
  }

  /* ---------- render: hero ---------- */

  function renderHero(data) {
    var hero = data.hero || {}, p = data.personal;
    setText('#heroEyebrow', hero.eyebrow);
    setText('#heroDesc', hero.description);
    setText('#heroRole', p.title);

    var title = $('#heroTitle');
    clear(title);
    var headline = str(hero.headline);
    title.setAttribute('aria-label', headline);
    var words = headline.split(/\s+/).filter(Boolean);
    var hl = str(hero.highlight).split(/\s+/).filter(Boolean);
    var start = -1;
    for (var i = 0; i + hl.length <= words.length && hl.length; i++) {
      if (words.slice(i, i + hl.length).join(' ') === hl.join(' ')) { start = i; break; }
    }
    words.forEach(function (w, idx) {
      var accent = start > -1 && idx >= start && idx < start + hl.length;
      var outer = h('span', { class: 'word' + (accent ? ' is-accent' : ''), style: { '--i': idx }, 'aria-hidden': 'true' }, [h('span', { text: w })]);
      title.appendChild(outer);
      if (idx < words.length - 1) title.appendChild(document.createTextNode(' '));
    });

    var pc = hero.primaryCta || {}, sc = hero.secondaryCta || {};
    setText('#heroPrimaryLabel', pc.label);
    setText('#heroSecondaryLabel', sc.label);
    if (pc.target) $('#heroPrimary').setAttribute('href', '#' + pc.target);
    if (sc.target) $('#heroSecondary').setAttribute('href', '#' + sc.target);

    renderSocials($('#heroSocials'), data);

    // portrait
    var img = $('#profileImg'), fb = $('#profileFallback');
    fb.textContent = initials(p.name);
    img.alt = str(p.profileAlt) || str(p.name);
    img.addEventListener('error', function () { img.hidden = true; fb.hidden = false; });
    var src = str(p.profileImage);
    if (src) img.src = src; else { img.hidden = true; fb.hidden = false; }

    // floating tech chips
    var ft = $('#floatTech');
    clear(ft);
    arr(hero.floatingTech).slice(0, 4).forEach(function (name) {
      var li = h('li', {}, [window.Icons.brand(name, skillColor(data, name))]);
      ft.appendChild(li);
    });
  }

  /* ---------- render: about ---------- */

  function renderAbout(data) {
    var a = data.about || {};
    setText('#aboutLead', a.lead);
    var paras = $('#aboutParas');
    clear(paras);
    arr(a.paragraphs).forEach(function (t) { paras.appendChild(h('p', { text: str(t) })); });

    var notes = $('#aboutNotes');
    clear(notes);
    [['Development journey', a.journey], ['Problem-solving approach', a.approach], ['Coding philosophy', a.philosophy]].forEach(function (n) {
      if (str(n[1])) notes.appendChild(h('div', { class: 'note' }, [h('h3', { text: n[0] }), h('p', { text: n[1] })]));
    });

    var stats = $('#aboutStats');
    clear(stats);
    arr(a.stats).forEach(function (s, i) {
      var value = h('div', { class: 'stat__value' });
      if (s.auto === 'skills') {
        var n = arr(data.skills).length;
        value.setAttribute('data-count', n);
        value.textContent = String(n);
      } else if (typeof s.value === 'number') {
        value.setAttribute('data-count', s.value);
        value.textContent = String(s.value) + str(s.suffix);
        if (s.suffix) value.setAttribute('data-suffix', s.suffix);
      } else {
        value.textContent = str(s.text);
      }
      if (!value.textContent) return;
      var card = h('li', { class: 'stat card' }, [
        h('span', { class: 'stat__icon' }, [window.Icons.icon(s.icon || 'lucide:target')]),
        value,
        h('div', { class: 'stat__label', text: str(s.label) })
      ]);
      stats.appendChild(reveal(card, i));
    });

    var pillars = $('#aboutPillars');
    clear(pillars);
    arr(a.pillars).forEach(function (p, i) {
      var li = h('li', { class: 'pillar' }, [
        window.Icons.icon(p.icon),
        h('div', {}, [h('h3', { text: str(p.title) }), h('p', { text: str(p.text) })])
      ]);
      pillars.appendChild(reveal(li, i));
    });
  }

  /* ---------- render: skills ---------- */

  function renderSkills(data) {
    var cats = arr(data.skillCategories);
    var catName = {};
    cats.forEach(function (c) { catName[c.id] = c.name; });

    var skills = arr(data.skills).slice().sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    var grid = $('#skillGrid');
    clear(grid);
    skills.forEach(function (s, i) {
      var iconBox = h('span', { class: 'skill__icon' }, [window.Icons.icon(s.icon, { color: s.color })]);
      if (s.color && /^#[0-9a-f]{3,8}$/i.test(s.color)) iconBox.style.setProperty('--brand', s.color);
      var card = h('article', {
        class: 'skill' + (s.featured ? ' skill--featured' : ''),
        'data-category': str(s.category)
      }, [
        iconBox,
        h('div', {}, [
          h('h3', { class: 'skill__name', text: str(s.name) }),
          s.description ? h('p', { class: 'skill__desc', text: str(s.description) }) : null
        ]),
        h('span', { class: 'skill__cat', text: catName[s.category] || str(s.category) })
      ]);
      grid.appendChild(reveal(card, i % 8));
    });

    var used = {};
    skills.forEach(function (s) { used[s.category] = true; });
    var filters = $('#skillFilters');
    clear(filters);
    var buttons = [{ id: 'all', name: 'All' }].concat(cats.filter(function (c) { return used[c.id]; }));
    buttons.forEach(function (c, i) {
      filters.appendChild(h('button', { class: 'filter', type: 'button', 'data-filter': c.id, 'aria-pressed': i === 0 ? 'true' : 'false', text: c.name }));
    });
  }

  /* ---------- render: projects ---------- */

  function imageFallback() {
    return h('div', { class: 'img-fallback', role: 'img', 'aria-label': 'Image unavailable' }, [window.Icons.lucide('image')]);
  }

  function lazyImg(src, alt) {
    var img = h('img', { src: str(src), alt: str(alt), loading: 'lazy', decoding: 'async', width: '1000', height: '560' });
    img.addEventListener('error', function () { if (img.parentNode) img.replaceWith(imageFallback()); });
    return img;
  }

  function renderProjects(data) {
    var projects = arr(data.projects);
    var grid = $('#projectGrid');
    clear(grid);
    projects.forEach(function (p, i) {
      var live = safeUrl(p.liveUrl), git = safeUrl(p.githubUrl);
      var badges = h('div', { class: 'project__badge' });
      if (p.featured) badges.appendChild(h('span', { class: 'tag-featured', text: 'Featured' }));
      if (p.sample) badges.appendChild(h('span', { class: 'badge-sample', text: 'Sample' }));

      var media = h('div', { class: 'project__media' }, [
        p.image ? lazyImg(p.image, p.imageAlt || p.title) : imageFallback(),
        badges,
        h('div', { class: 'project__overlay', 'aria-hidden': 'true' }, [
          h('span', { class: 'project__view' }, [h('span', { text: 'View details' }), window.Icons.lucide('arrow-up-right')])
        ])
      ]);

      var links = h('div', { class: 'project__links' });
      if (live) links.appendChild(link(live, { 'aria-label': 'Live demo of ' + str(p.title), title: 'Live demo' }, [window.Icons.lucide('external-link')]));
      if (git) links.appendChild(link(git, { 'aria-label': 'Source code of ' + str(p.title), title: 'GitHub' }, [window.Icons.brand('github')]));

      var chips = h('ul', { class: 'chips', 'aria-label': 'Technologies' });
      arr(p.technologies).slice(0, 4).forEach(function (t) { chips.appendChild(h('li', { class: 'chip', text: str(t) })); });

      var open = h('button', { class: 'project__open', type: 'button', 'data-project': String(i), text: str(p.title) });
      var card = h('article', {
        class: 'project card' + (p.featured ? ' project--featured' : ''),
        'data-category': str(p.category)
      }, [
        media,
        h('div', { class: 'project__body' }, [
          h('p', { class: 'project__cat', text: str(p.category) }),
          h('h3', { class: 'project__title' }, [open]),
          h('p', { class: 'project__desc', text: str(p.description) }),
          h('div', { class: 'project__foot' }, [chips, links])
        ])
      ]);
      grid.appendChild(reveal(card, i % 6));
    });

    var filters = $('#projectFilters');
    clear(filters);
    var names = ['All Projects'].concat(arr(data.projectCategories));
    names.forEach(function (name, i) {
      filters.appendChild(h('button', { class: 'filter', type: 'button', 'data-filter': i === 0 ? 'all' : name, 'aria-pressed': i === 0 ? 'true' : 'false', text: name }));
    });
  }

  /* ---------- render: timelines ---------- */

  function dateRange(start, end) {
    return [str(start), str(end)].filter(Boolean).join(' – ');
  }

  function renderExperience(data) {
    var list = $('#experienceList');
    clear(list);
    var items = arr(data.experience);
    if (!items.length) { list.closest('.container').appendChild(h('p', { class: 'empty', text: 'Experience details coming soon.' })); return; }
    items.forEach(function (e, i) {
      var meta = h('p', { class: 't-meta' }, [window.Icons.lucide('calendar'), h('span', { text: dateRange(e.start, e.end) })]);
      if (e.type) { meta.appendChild(h('span', { class: 'sep', text: '•' })); meta.appendChild(h('span', { text: str(e.type) })); }
      var head = h('div', { class: 't-head' }, [
        h('div', {}, [
          h('h3', { class: 't-title', text: str(e.title) }),
          h('p', { class: 't-org' }, [window.Icons.lucide('briefcase'), h('span', { text: str(e.company) })])
        ]),
        meta
      ]);
      var card = h('article', { class: 't-card card' }, [head]);
      if (e.sample) head.firstChild.lastChild.appendChild(h('span', { class: 'badge-sample', text: 'Sample' }));
      if (e.description) card.appendChild(h('p', { text: str(e.description) }));
      if (arr(e.responsibilities).length) {
        var ul = h('ul', { class: 't-list' });
        e.responsibilities.forEach(function (r) { ul.appendChild(h('li', { text: str(r) })); });
        card.appendChild(ul);
      }
      if (arr(e.technologies).length) {
        var chips = h('ul', { class: 'chips', 'aria-label': 'Technologies' });
        e.technologies.forEach(function (t) { chips.appendChild(h('li', { class: 'chip', text: str(t) })); });
        card.appendChild(chips);
      }
      list.appendChild(reveal(h('li', { class: 't-item' }, [card]), i));
    });
  }

  function renderEducation(data) {
    var list = $('#educationList');
    clear(list);
    arr(data.education).forEach(function (e, i) {
      var meta = h('p', { class: 't-meta' }, [window.Icons.lucide('calendar'), h('span', { text: dateRange(e.start, e.end) })]);
      var head = h('div', { class: 't-head' }, [
        h('div', {}, [
          h('h3', { class: 't-title', text: str(e.degree) }),
          h('p', { class: 't-org' }, [window.Icons.lucide('graduation-cap'), h('span', { text: str(e.institution) })])
        ]),
        meta
      ]);
      var card = h('article', { class: 't-card card' }, [head]);
      if (e.sample) head.firstChild.lastChild.appendChild(h('span', { class: 'badge-sample', text: 'Sample' }));
      if (e.location) card.appendChild(h('p', { class: 't-meta' }, [window.Icons.lucide('map-pin'), h('span', { text: str(e.location) })]));
      if (e.details) card.appendChild(h('p', { text: str(e.details) }));
      list.appendChild(reveal(h('li', { class: 't-item' }, [card]), i));
    });
  }

  /* ---------- render: services & process ---------- */

  function renderServices(data) {
    var grid = $('#serviceGrid');
    clear(grid);
    arr(data.services).forEach(function (s, i) {
      var card = h('li', { class: 'service card' }, [
        h('span', { class: 'service__icon' }, [window.Icons.icon(s.icon)]),
        h('h3', { text: str(s.title) }),
        h('p', { text: str(s.description) })
      ]);
      grid.appendChild(reveal(card, i % 4));
    });
    setText('#servicesCta', (data.contact && data.contact.ctaLabel) || 'Discuss your requirements');
  }

  function renderProcess(data) {
    var list = $('#processList');
    clear(list);
    arr(data.process).forEach(function (s, i) {
      var step = h('li', { class: 'step' }, [
        h('span', { class: 'step__icon' }, [window.Icons.icon(s.icon)]),
        h('span', { class: 'step__num', text: str(s.number) || String(i + 1).padStart(2, '0') }),
        h('h3', { text: str(s.title) }),
        h('p', { text: str(s.text) })
      ]);
      list.appendChild(reveal(step, i));
    });
  }

  /* ---------- render: resume ---------- */

  function checkPdf(path) {
    var url = safeUrl(path);
    if (!url) return Promise.resolve(false);
    return fetch(url, { method: 'HEAD', cache: 'no-cache' }).then(function (r) {
      var type = (r.headers.get('content-type') || '').toLowerCase();
      return r.ok && (type.indexOf('pdf') > -1 || type.indexOf('octet-stream') > -1);
    }).catch(function () { return false; });
  }

  function renderResume(data) {
    var r = data.resume || {};
    setText('#resumeSummary', r.summary);

    var chips = $('#resumeSkills');
    clear(chips);
    arr(data.skills).forEach(function (s) { chips.appendChild(h('li', { class: 'chip', text: str(s.name) })); });

    var ex = $('#resumeExperience'), ed = $('#resumeEducation');
    clear(ex); clear(ed);
    arr(data.experience).forEach(function (e) {
      ex.appendChild(h('li', {}, [h('strong', { text: str(e.title) + (e.company ? ' · ' + e.company : '') }), h('span', { text: dateRange(e.start, e.end) })]));
    });
    arr(data.education).forEach(function (e) {
      ed.appendChild(h('li', {}, [h('strong', { text: str(e.degree) }), h('span', { text: str(e.institution) + (dateRange(e.start, e.end) ? ' · ' + dateRange(e.start, e.end) : '') })]));
    });

    var action = $('#resumeAction');
    var navBtn = $('#navResume');
    return checkPdf(r.pdf).then(function (ok) {
      clear(action);
      if (ok) {
        var url = safeUrl(r.pdf);
        action.appendChild(h('a', { class: 'btn btn--primary btn--lg', href: url, target: '_blank', rel: 'noopener', 'data-magnetic': '' }, [
          window.Icons.lucide('file-text'), h('span', { text: 'View Resume' })
        ]));
        navBtn.setAttribute('href', url);
        navBtn.setAttribute('target', '_blank');
        navBtn.setAttribute('rel', 'noopener');
      } else {
        action.appendChild(h('p', { class: 'resume__note', text: str(r.fallbackText) || 'My resume is not available for download yet.' }));
        action.appendChild(h('a', { class: 'btn btn--ghost btn--lg', href: '#contact' }, [window.Icons.lucide('mail'), h('span', { text: 'Request my CV' })]));
      }
    });
  }

  /* ---------- render: contact ---------- */

  function renderContact(data) {
    var p = data.personal;
    setText('#contactIntro', data.contact && data.contact.intro);
    var list = $('#contactList');
    clear(list);

    function item(iconNode, label, value, href) {
      var inner = [
        h('span', { class: 'contact__icon' }, [iconNode]),
        h('span', {}, [h('span', { class: 'contact__label', text: label }), h('span', { class: 'contact__value', text: value })])
      ];
      if (href) {
        inner.push(window.Icons.lucide('arrow-up-right'));
        return h('li', {}, [link(href, { class: 'contact__item' }, inner)]);
      }
      return h('li', {}, [h('div', { class: 'contact__item' }, inner)]);
    }

    var email = str(p.email);
    if (email) list.appendChild(item(window.Icons.lucide('mail'), 'Email', email, safeUrl('mailto:' + email)));
    if (str(p.phone)) list.appendChild(item(window.Icons.lucide('phone'), 'Phone', p.phone, safeUrl('tel:' + p.phone.replace(/\s/g, ''))));
    socialLinks(data).forEach(function (s) {
      var shown = s.key === 'whatsapp' ? 'Chat on WhatsApp' : s.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      list.appendChild(item(window.Icons.brand(s.icon), s.label, shown, s.url));
    });
    if (str(p.location)) list.appendChild(item(window.Icons.lucide('map-pin'), 'Location', p.location, ''));
    Array.prototype.forEach.call(list.children, function (li, i) { reveal(li, i); });
  }

  /* ---------- SEO ---------- */

  function setMeta(selector, attr, value) {
    if (!value) return;
    var node = $(selector);
    if (node) node.setAttribute(attr, value);
  }

  function applySeo(data) {
    var seo = data.seo || {};
    var title = str(seo.title) || (str(data.personal.name) + ' — ' + str(data.personal.title));
    document.title = title;
    setMeta('meta[name="description"]', 'content', seo.description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', seo.description);
    setMeta('meta[name="theme-color"]', 'content', seo.themeColor);
    if (seo.keywords) document.head.appendChild(h('meta', { name: 'keywords', content: seo.keywords }));
    if (seo.ogImage) document.head.appendChild(h('meta', { property: 'og:image', content: seo.ogImage }));
    if (safeUrl(seo.url)) {
      document.head.appendChild(h('link', { rel: 'canonical', href: seo.url }));
      document.head.appendChild(h('meta', { property: 'og:url', content: seo.url }));
    }

    var sameAs = socialLinks(data).map(function (s) { return s.url; }).filter(function (u) {
      try { return new URL(u).pathname.replace(/\//g, '').length > 0; } catch (e) { return false; }
    });
    var person = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: str(data.personal.name),
      jobTitle: str(data.personal.title),
      description: str(seo.description)
    };
    if (safeUrl(seo.url)) person.url = seo.url;
    if (sameAs.length) person.sameAs = sameAs;
    if (str(data.personal.location)) person.address = { '@type': 'PostalAddress', addressCountry: data.personal.location };
    $('#ldjson').textContent = JSON.stringify(person);
  }

  function applyDesign(data) {
    var d = data.design || {};
    var root = document.documentElement;
    if (/^#[0-9a-f]{3,8}$/i.test(str(d.accent))) {
      root.style.setProperty('--accent', d.accent);
      root.style.setProperty('--accent-strong', d.accent);
    }
    if (d.animations === false) root.classList.add('no-anim');
    if ((d.defaultTheme === 'light' || d.defaultTheme === 'dark') && window.Theme && !window.Theme.hasStored()) {
      window.Theme.set(d.defaultTheme, false);
    }
  }

  /* ---------- boot ---------- */

  function validate(data) {
    if (!data || typeof data !== 'object') throw new Error('portfolio.json is empty or not an object.');
    if (!data.personal || !str(data.personal.name)) throw new Error('"personal.name" is missing in portfolio.json.');
  }

  function showError(err) {
    var box = $('#appError');
    if (box) {
      clear(box);
      box.appendChild(h('strong', { text: 'The portfolio content could not be loaded.' }));
      box.appendChild(h('span', { text: String(err && err.message ? err.message : err) + ' If you opened this file directly, please serve it through a local server such as VS Code Live Server (file:// cannot load JSON).' }));
      box.hidden = false;
    }
    var loader = $('#loader');
    if (loader) loader.classList.add('is-done');
    document.documentElement.classList.remove('js');
    console.error('[portfolio]', err);
  }

  function boot() {
    window.Icons.hydrate();
    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('Could not fetch ' + DATA_URL + ' (HTTP ' + res.status + ').');
        return res.json().catch(function () { throw new Error(DATA_URL + ' contains invalid JSON. Check for missing commas or quotes.'); });
      })
      .then(function (data) {
        validate(data);
        window.Portfolio = { data: data, safeUrl: safeUrl };
        applyDesign(data);
        applySeo(data);
        renderBrand(data);
        renderNav(data);
        renderSectionHeads(data);
        renderStatus(data);
        renderHero(data);
        renderAbout(data);
        renderSkills(data);
        renderProjects(data);
        renderExperience(data);
        renderServices(data);
        renderProcess(data);
        renderEducation(data);
        renderContact(data);
        renderFooter(data);
        renderMarquee(data);
        window.Icons.hydrate();
        return renderResume(data).then(function () { return data; });
      })
      .then(function (data) {
        window.Icons.hydrate();
        window.__portfolioReady = true;
        document.dispatchEvent(new CustomEvent('portfolio:ready', { detail: { data: data } }));
      })
      .catch(showError);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
