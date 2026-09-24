// Tema claro/oscuro: se guarda la elección en el navegador.
(function () {
  var root = document.documentElement;
  function current() {
    return root.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function paintIcons() {
    var icon = current() === 'dark' ? 'fa-sun' : 'fa-moon';
    document.querySelectorAll('.nav-dark-toggle i').forEach(function (i) {
      i.className = 'fas ' + icon;
    });
  }
  document.querySelectorAll('.nav-dark-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      paintIcons();
    });
  });
  paintIcons();
})();

// Foto y logos: si falta la imagen, se muestra un reemplazo en lugar de un ícono roto.
document.querySelectorAll('img[data-fallback]').forEach(function (img) {
  function swap() {
    var div = document.createElement('div');
    div.className = img.getAttribute('data-fallback-class') || 'logo-fallback';
    var fb = img.getAttribute('data-fallback');
    if (fb.indexOf('fa-') === 0) div.innerHTML = '<i class="fas ' + fb + '" aria-hidden="true"></i>';
    else div.textContent = fb;
    div.setAttribute('role', 'img');
    div.setAttribute('aria-label', img.alt);
    img.replaceWith(div);
  }
  if (img.complete && img.naturalWidth === 0) swap();
  else img.addEventListener('error', swap);
});

// Animaciones al hacer scroll.
if (window.AOS) AOS.init({ duration: 600, once: true, offset: 40 });

// Texto que se escribe solo en la portada.
if (window.Typed && document.getElementById('typed-output')) {
  new Typed('#typed-output', {
    strings: [
      'Support Engineer en Vana',
      'Causa raíz de incidentes en producción',
      'Soporte de producción en 4 países',
      'Desarrollo de software y soporte cloud',
      'Robótica, IoT y fabricación digital'
    ],
    typeSpeed: 45, backSpeed: 22, backDelay: 1800, loop: true
  });
}

// Contadores animados en "cifras destacadas".
(function () {
  var counters = document.querySelectorAll('.countup-number');
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target, end = +el.getAttribute('data-end'), start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1400, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: .5 });
  counters.forEach(function (c) { c.textContent = '0'; io.observe(c); });
})();

// Secciones plegables (clic en el título).
document.querySelectorAll('.section-toggle').forEach(function (h) {
  var target = document.getElementById(h.getAttribute('data-target'));
  if (!target) return;
  h.setAttribute('role', 'button');
  h.setAttribute('tabindex', '0');
  h.setAttribute('aria-expanded', 'true');
  function toggle() {
    var closing = !target.classList.contains('closed');
    if (closing) target.style.maxHeight = target.scrollHeight + 'px';
    requestAnimationFrame(function () {
      target.classList.toggle('closed', closing);
      target.style.maxHeight = closing ? '' : target.scrollHeight + 'px';
    });
    h.classList.toggle('collapsed', closing);
    h.setAttribute('aria-expanded', String(!closing));
  }
  target.addEventListener('transitionend', function () {
    if (!target.classList.contains('closed')) target.style.maxHeight = 'none';
  });
  h.addEventListener('click', toggle);
  h.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

// Barra de progreso, botón "volver arriba" y sección activa en el menú.
(function () {
  var bar = document.getElementById('scrollProgress');
  var toTop = document.getElementById('backToTop');
  var ids = ['about', 'skills', 'experience', 'education', 'certs', 'projects', 'volunteer', 'contact'];
  var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var links = document.querySelectorAll('.sticky-nav .nav-link[href^="#"], .dot-nav a');

  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', h.scrollTop > 500);

    var active = null;
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top < 140) active = s.id;
    });
    links.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + active);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0 }); });

  // Cerrar el menú en celular al elegir una opción.
  document.querySelectorAll('#navbarMain .nav-link').forEach(function (a) {
    a.addEventListener('click', function () {
      var menu = document.getElementById('navbarMain');
      if (menu.classList.contains('show') && window.bootstrap) bootstrap.Collapse.getOrCreateInstance(menu).hide();
    });
  });
})();

// Formulario de contacto: usa Formspree si está configurado, si no abre el correo.
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var status = document.getElementById('formStatus');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var action = form.getAttribute('action') || '';
    if (action.indexOf('TU_ID_FORMSPREE') !== -1) {
      var to = form.getAttribute('data-mailto');
      var subject = encodeURIComponent('Contacto desde tu CV — ' + data.get('name'));
      var body = encodeURIComponent(data.get('message') + '\n\n' + data.get('name') + ' <' + data.get('_replyto') + '>');
      location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
      return;
    }
    status.textContent = 'Enviando…';
    fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error();
        form.reset();
        status.textContent = '¡Gracias! Tu mensaje fue enviado.';
      })
      .catch(function () {
        status.textContent = 'No se pudo enviar. Escribime directo al correo.';
      });
  });
})();

document.getElementById('footer-year').textContent = new Date().getFullYear();
