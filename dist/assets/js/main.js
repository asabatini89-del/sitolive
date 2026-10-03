/* ==========================================================================
   LiVE — Interazioni del sito
   Header, menu mobile, rivelazioni allo scroll, contatori, carosello casi,
   diagramma dei livelli, sistema di competenze, filtri casi, modulo contatti.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* -- Header ------------------------------------------------------------- */
  var header = $("[data-header]");
  if (header) {
    var lastY = window.scrollY;
    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
      var goingDown = y > lastY && y > 420;
      header.classList.toggle("is-hidden", goingDown && !header.classList.contains("is-open"));
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var toggle = $(".nav-toggle", header);
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = !header.classList.contains("is-open");
        header.classList.toggle("is-open", open);
        document.body.classList.toggle("nav-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && header.classList.contains("is-open")) toggle.click();
      });
    }
  }

  /* -- Rivelazioni allo scroll ------------------------------------------- */
  var revealTargets = $$("[data-reveal], .numbered, .path, .statement");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* -- Contatori ---------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var from = parseFloat(el.getAttribute("data-from") || "0");
    if (reduced) { el.textContent = prefix + target + suffix; return; }
    var dur = 1600;
    var t0 = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + Math.round(from + (target - from) * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* -- Carosello (rail) --------------------------------------------------- */
  $$("[data-rail]").forEach(function (wrap) {
    var rail = $(".rail", wrap);
    var prev = $(".rail-btn--prev", wrap);
    var next = $(".rail-btn--next", wrap);
    var bar = $(".rail-progress span", wrap);
    if (!rail) return;
    function update() {
      var max = rail.scrollWidth - rail.clientWidth;
      var ratio = max > 0 ? rail.scrollLeft / max : 0;
      var visible = rail.clientWidth / rail.scrollWidth;
      if (bar) {
        bar.style.width = (visible * 100).toFixed(2) + "%";
        bar.style.left = (ratio * (1 - visible) * 100).toFixed(2) + "%";
      }
      if (prev) prev.disabled = rail.scrollLeft < 8;
      if (next) next.disabled = rail.scrollLeft > max - 8;
    }
    function by(dir) {
      var card = rail.firstElementChild;
      var stepW = card ? card.getBoundingClientRect().width + 24 : rail.clientWidth * 0.8;
      rail.scrollBy({ left: dir * stepW, behavior: reduced ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { by(-1); });
    if (next) next.addEventListener("click", function () { by(1); });
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* -- Diagramma tre livelli --------------------------------------------- */
  $$("[data-levels]").forEach(function (root) {
    var items = $$(".level-item", root);
    var planes = $$(".levels__plane", root);
    var auto = 0;
    var timer = null;
    function activate(n) {
      root.setAttribute("data-active", n);
      items.forEach(function (it) { it.classList.toggle("is-active", it.getAttribute("data-level") === String(n)); });
      planes.forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-level") === String(n)); });
    }
    function cycle() {
      auto = (auto % items.length) + 1;
      activate(auto);
    }
    items.concat(planes).forEach(function (el) {
      el.addEventListener("mouseenter", function () { clearInterval(timer); activate(el.getAttribute("data-level")); });
      el.addEventListener("focus", function () { clearInterval(timer); activate(el.getAttribute("data-level")); });
    });
    activate(1);
    if (!reduced) {
      var vis = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          clearInterval(timer);
          if (e.isIntersecting) timer = setInterval(cycle, 3200);
        });
      }, { threshold: 0.4 });
      vis.observe(root);
      root.addEventListener("mouseleave", function () { clearInterval(timer); timer = setInterval(cycle, 3200); });
    }
  });

  /* -- Sistema di competenze (radiale) ----------------------------------- */
  $$("[data-system]").forEach(function (root) {
    var nodes = $$(".system__node", root);
    var spokes = $$(".system__spoke", root);
    var panel = $(".system__panel", root);
    var data = {};
    $$("template[data-area]", root).forEach(function (tpl) { data[tpl.getAttribute("data-area")] = tpl; });
    var current = null;
    function show(id) {
      if (id === current || !data[id]) return;
      current = id;
      nodes.forEach(function (n) {
        var on = n.getAttribute("data-area") === id;
        n.classList.toggle("is-active", on);
        n.setAttribute("aria-pressed", String(on));
      });
      spokes.forEach(function (s) { s.classList.toggle("is-active", s.getAttribute("data-area") === id); });
      var body = $("[data-panel-body]", panel);
      panel.classList.add("is-swapping");
      setTimeout(function () {
        body.innerHTML = "";
        body.appendChild(data[id].content.cloneNode(true));
        panel.classList.remove("is-swapping");
      }, reduced ? 0 : 180);
    }
    nodes.forEach(function (n) {
      var id = n.getAttribute("data-area");
      n.addEventListener("click", function () { show(id); });
      n.addEventListener("mouseenter", function () { show(id); });
      n.addEventListener("focus", function () { show(id); });
      n.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(id); }
      });
    });
    if (nodes[0]) show(nodes[0].getAttribute("data-area"));
  });

  /* -- Filtri casi -------------------------------------------------------- */
  $$("[data-filter-group]").forEach(function (group) {
    var targetSel = group.getAttribute("data-filter-group");
    var cards = $$(targetSel + " [data-areas]");
    var buttons = $$(".filter", group);
    var live = $("[data-filter-status]");
    buttons.forEach(function (btn) {
      var key = btn.getAttribute("data-filter");
      var count = key === "all" ? cards.length : cards.filter(function (c) { return c.getAttribute("data-areas").split(" ").indexOf(key) > -1; }).length;
      var badge = document.createElement("span");
      badge.className = "filter__count";
      badge.textContent = count;
      btn.appendChild(badge);
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        var shown = 0;
        cards.forEach(function (c) {
          var match = key === "all" || c.getAttribute("data-areas").split(" ").indexOf(key) > -1;
          c.hidden = !match;
          if (match) shown++;
        });
        if (live) live.textContent = shown + (shown === 1 ? " caso visualizzato" : " casi visualizzati");
      });
    });
  });

  /* -- Modulo contatti ---------------------------------------------------- */
  /* Senza backend il modulo prepara un'email precompilata verso info@.
     Per l'invio diretto collegare l'attributo action a un servizio (vedi README). */
  $$("form[data-contact]").forEach(function (form) {
    var status = $(".form-status", form);
    form.addEventListener("submit", function (e) {
      if (form.getAttribute("action")) return;
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        if (status) { status.className = "form-status is-error"; status.textContent = "Controlla i campi evidenziati."; }
        return;
      }
      var f = new FormData(form);
      var to = form.getAttribute("data-contact") || "info@liveintangibles.it";
      var subject = "[Sito LiVE] " + (f.get("oggetto") || "Richiesta di contatto");
      var body = [
        "Nome: " + (f.get("nome") || ""),
        "Azienda: " + (f.get("azienda") || ""),
        "Email: " + (f.get("email") || ""),
        "Area di interesse: " + (f.get("area") || ""),
        "",
        f.get("messaggio") || ""
      ].join("\n");
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      if (status) { status.className = "form-status is-ok"; status.textContent = "Si sta aprendo il tuo programma di posta con il messaggio già compilato."; }
    });
  });

  /* -- Apertura dell'accordion indicato dall'ancora --------------------- */
  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === "DETAILS") {
      el.open = true;
      setTimeout(function () { el.scrollIntoView({ block: "start" }); }, 50);
    }
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  /* -- Indice con sezione corrente (design system) ---------------------- */
  $$("[data-scrollspy]").forEach(function (nav) {
    var links = $$("a[href^='#']", nav);
    var map = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    if (!("IntersectionObserver" in window)) return;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a, i) { a.classList.toggle("is-current", map[i] === e.target); });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    map.forEach(function (s) { if (s) spy.observe(s); });
  });

  /* -- Anno corrente ------------------------------------------------------ */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
