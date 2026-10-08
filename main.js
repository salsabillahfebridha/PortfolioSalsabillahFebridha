(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Nav Desktop */
  var nav = $('.nav');
  var progress = $('.progress');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('is-stuck', y > 12);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* Nav mobile */
  var toggle = $('.nav-toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Scroll Reveal */
  var revealables = $$('[data-reveal]');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          ro.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      // Stagger siblings that share a parent
      revealables.forEach(function (el) {
        if (!el.style.getPropertyValue('--d')) {
          var sibs = Array.prototype.filter.call(el.parentNode.children, function (n) {
            return n.hasAttribute && n.hasAttribute('data-reveal');
          });
          var i = sibs.indexOf(el);
          if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
        }
        ro.observe(el);
      });
    }
  }

  /* Scroll spy */
  var spyLinks = $$('[data-spy] a[href^="#"]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    var targets = [];
    spyLinks.forEach(function (a) {
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (t) { map[t.id] = a; targets.push(t); }
    });
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var best = null, bestVal = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestVal) { bestVal = visible[id]; best = id; }
      });
      spyLinks.forEach(function (a) { a.classList.remove('is-active'); });
      if (best && map[best]) map[best].classList.add('is-active');
    }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.15, 0.4, 0.75, 1] });
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* Headline rotator */
  var rotator = $('[data-rotator]');
  if (rotator && !reduced) {
    var words = $$('span', rotator);
    if (words.length > 1) {
      var idx = 0;
      words[0].classList.add('is-in');
      setInterval(function () {
        var cur = words[idx];
        idx = (idx + 1) % words.length;
        var next = words[idx];
        cur.classList.remove('is-in');
        cur.classList.add('is-out');
        next.classList.remove('is-out');
       
        void next.offsetWidth;
        next.classList.add('is-in');
        setTimeout(function () { cur.classList.remove('is-out'); }, 520);
      }, 2600);
    }
  } else if (rotator) {
    var first = $('span', rotator);
    if (first) first.classList.add('is-in');
  }

  /* Count-up statistics */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        co.unobserve(el);
        var target = parseFloat(el.getAttribute('data-count'));
        var dec = (el.getAttribute('data-decimals') | 0);
        var suffix = el.getAttribute('data-suffix') || '';
        var prefix = el.getAttribute('data-prefix') || '';
        var start = performance.now();
        var dur = 1150;
        (function step(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* Card pointer sheen */
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (ev) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });
    });
  }

  //* Work filtering */
  var filterBar = document.querySelector('[data-filters]');

  if (filterBar) {
    filterBar.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.filter');
      if (!btn) return;

      var want = btn.getAttribute('data-filter');

      document.querySelectorAll('.filter').forEach(function (b) {
        var isActive = b === btn;
        b.classList.toggle('is-on', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });

      var cards = document.querySelectorAll('.card[data-cat]');
      cards.forEach(function (c) {
        var show = want === 'all' || c.getAttribute('data-cat') === want;

        c.hidden = !show;

        if (show) {
          c.classList.remove('is-in');
          void c.offsetWidth;
          c.classList.add('is-in');
        }
      });
    });
  }

  /* Swap a placeholder square for a real shot */
  $$('figure.shot img, img[data-slot]').forEach(function (img) {
    var host = img.closest('figure.shot') || img.parentElement;
    if (!host) return;
    var fill = function () {
      if (img.naturalWidth > 0) host.setAttribute('data-filled', '');
    };
    if (img.complete) fill();
    img.addEventListener('load', fill);
  });

  /* Magnetic buttons */
  if (window.matchMedia('(hover: hover)').matches && !reduced) {
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        var x = ev.clientX - (r.left + r.width / 2);
        var y = ev.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + x * 0.18 + 'px,' + y * 0.26 + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* Tab panels */
  $$('[data-tabs]').forEach(function (bar) {
    bar.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-tab]');
      if (!btn) return;
      var name = btn.getAttribute('data-tab');
      $$('[data-tab]', bar).forEach(function (b) {
        b.classList.toggle('is-on', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      $$('[data-panel]').forEach(function (p) {
        p.hidden = p.getAttribute('data-panel') !== name;
      });
    });
  });

  /* Year stamp in the footer */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
