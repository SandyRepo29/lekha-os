/* ============================================================
   LEKHA OS — Landing interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---- Year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Nav: scrolled state ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById('navToggle');
  var mobile = document.getElementById('navMobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      var open = mobile.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobile.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Animated counters ---- */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    var dur = 1500;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      var val = target * eased;
      el.textContent = target >= 1000
        ? Math.floor(val).toLocaleString('en-IN')
        : Math.floor(val).toString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target >= 1000 ? target.toLocaleString('en-IN') : target.toString();
    }
    requestAnimationFrame(step);
  }

  /* ---- Ring / bars / progress activation (inside hero mock) ---- */
  function activateMockViz() {
    document.querySelectorAll('.ring[data-ring]').forEach(function (ring) {
      var pct = parseFloat(ring.getAttribute('data-ring'));
      var circ = 2 * Math.PI * 52; // r = 52
      var off = circ - (pct / 100) * circ;
      ring.style.setProperty('--off', off);
      var fg = ring.querySelector('.ring__fg');
      if (fg) { fg.style.strokeDasharray = circ; fg.style.strokeDashoffset = circ; }
      requestAnimationFrame(function () { ring.classList.add('run'); });
    });
    ['.mcard--risk', '.mcard--audit'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (c) { c.classList.add('run'); });
    });
  }

  /* ---- Intersection-based reveal ---- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var counted = false;

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(function () { el.classList.add('in'); }, delay);

        // fire counters within this element
        el.querySelectorAll('.counter').forEach(function (c) {
          if (!c.dataset.done) { c.dataset.done = '1'; animateCounter(c); }
        });
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    // Activate hero mock viz shortly after load
    setTimeout(activateMockViz, 500);
  } else {
    // Reduced motion / no IO: show everything immediately
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    document.querySelectorAll('.counter').forEach(function (c) {
      var t = parseFloat(c.getAttribute('data-target'));
      c.textContent = t >= 1000 ? t.toLocaleString('en-IN') : t.toString();
    });
    activateMockViz();
  }

  /* ---- Subtle parallax tilt on hero mock ---- */
  if (!reduce) {
    var mock = document.querySelector('.mock');
    var visual = document.querySelector('.hero__visual');
    if (mock && visual) {
      visual.addEventListener('mousemove', function (e) {
        var r = visual.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        mock.style.transform = 'rotateY(' + (-9 + x * 6) + 'deg) rotateX(' + (4 - y * 6) + 'deg)';
      });
      visual.addEventListener('mouseleave', function () {
        mock.style.transform = '';
      });
    }
  }
})();
