/* ==========================================================================
   LiVE — Grafiche generative
   - waveField: campo di onde in prospettiva (firma visiva, eredita l'onda
     rossa del sito attuale)
   - particleField: particelle luminose "bokeh" (evoluzione dello sfondo
     della sezione competenze)
   Rispetta prefers-reduced-motion (disegna un fotogramma statico) e si
   ferma quando il canvas esce dallo schermo.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupCanvas(canvas, onResize) {
    var ctx = canvas.getContext("2d");
    var state = { w: 0, h: 0, dpr: 1 };
    function resize() {
      var rect = canvas.getBoundingClientRect();
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = Math.max(1, rect.width);
      state.h = Math.max(1, rect.height);
      canvas.width = Math.round(state.w * state.dpr);
      canvas.height = Math.round(state.h * state.dpr);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      if (onResize) onResize(state);
    }
    resize();
    var ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return { ctx: ctx, state: state };
  }

  function loop(canvas, draw) {
    var raf = 0;
    var running = false;
    var t0 = performance.now();
    function frame(now) {
      draw((now - t0) / 1000);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    if (reduced) { draw(4); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  }

  /* -- Campo di onde ------------------------------------------------------ */
  function waveField(canvas, opts) {
    opts = opts || {};
    var lines = opts.lines || 54;
    var tilt = opts.tilt != null ? opts.tilt : -0.2;
    var far = opts.far || [148, 31, 32];
    var near = opts.near || [230, 107, 99];
    var speed = opts.speed || 0.22;
    var c = setupCanvas(canvas);
    var ctx = c.ctx, s = c.state;
    var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    window.addEventListener("pointermove", function (e) {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    }, { passive: true });

    function draw(t) {
      var w = s.w, h = s.h;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(tilt);
      ctx.translate(-w / 2, -h / 2);
      var tt = t * speed;
      var step = Math.max(10, w / 110);
      var mx = (mouse.x - 0.5) * 1.2;
      var my = (mouse.y - 0.5);
      for (var i = 0; i < lines; i++) {
        var d = i / (lines - 1);
        var col = [
          Math.round(far[0] + (near[0] - far[0]) * d),
          Math.round(far[1] + (near[1] - far[1]) * d),
          Math.round(far[2] + (near[2] - far[2]) * d)
        ];
        var alpha = 0.06 + Math.pow(d, 1.25) * 0.7;
        ctx.strokeStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + alpha.toFixed(3) + ")";
        ctx.lineWidth = 0.5 + d * 1.5;
        ctx.beginPath();
        for (var x = -w * 0.25; x <= w * 1.25; x += step) {
          var u = x / w;
          var z =
            Math.sin(u * 5.0 + tt * 2.1 + d * 2.3 + mx) * 0.55 +
            Math.sin(u * 11.0 - tt * 1.4 + d * 3.9) * 0.18 +
            Math.sin(u * 2.2 + tt * 0.9 - d * 1.6 + my) * 0.5;
          var y = h * (0.12 + Math.pow(d, 1.3) * 1.0) + z * (h * 0.07 + d * h * 0.16);
          if (x === -w * 0.25) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    loop(canvas, draw);
  }

  /* -- Campo di particelle ------------------------------------------------ */
  function particleField(canvas, opts) {
    opts = opts || {};
    var count = opts.count || 140;
    var palette = opts.palette || [[194, 59, 55], [148, 31, 32], [230, 107, 99], [110, 23, 24]];
    var focus = opts.focus || { x: 0.78, y: 0.5 };
    var sprites = palette.map(function (c) {
      var size = 64;
      var sc = document.createElement("canvas");
      sc.width = sc.height = size;
      var g = sc.getContext("2d");
      var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, "rgba(" + c + ",1)");
      grd.addColorStop(0.35, "rgba(" + c + ",0.55)");
      grd.addColorStop(1, "rgba(" + c + ",0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      return sc;
    });
    var parts = [];
    function seed(st) {
      parts = [];
      var n = Math.round(count * Math.min(1.4, Math.max(0.5, st.w / 1400)));
      for (var i = 0; i < n; i++) {
        // distribuzione ad arco attorno al punto focale
        var a = Math.random() * Math.PI * 2;
        var r = Math.pow(Math.random(), 0.6) * Math.min(st.w, st.h) * 0.75;
        parts.push({
          x: focus.x * st.w + Math.cos(a) * r * 1.3,
          y: focus.y * st.h + Math.sin(a) * r,
          z: Math.random(),
          r: 4 + Math.pow(Math.random(), 3) * 46,
          s: sprites[(Math.random() * sprites.length) | 0],
          vx: (Math.random() - 0.5) * 0.18,
          vy: -0.05 - Math.random() * 0.22,
          ph: Math.random() * Math.PI * 2
        });
      }
    }
    var c = setupCanvas(canvas, seed);
    var ctx = c.ctx, s = c.state;
    function draw(t) {
      ctx.clearRect(0, 0, s.w, s.h);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!reduced) {
          p.x += p.vx * (0.4 + p.z);
          p.y += p.vy * (0.4 + p.z);
          if (p.y < -60) { p.y = s.h + 60; }
          if (p.x < -60) p.x = s.w + 60; else if (p.x > s.w + 60) p.x = -60;
        }
        var flick = 0.55 + 0.45 * Math.sin(t * 0.8 + p.ph);
        ctx.globalAlpha = (0.18 + p.z * 0.55) * flick;
        var size = p.r * (0.6 + p.z * 0.8);
        ctx.drawImage(p.s, p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    loop(canvas, draw);
  }

  function init() {
    document.querySelectorAll("canvas[data-fx]").forEach(function (cv) {
      try {
        var type = cv.getAttribute("data-fx");
        if (type === "waves") waveField(cv, { tilt: parseFloat(cv.dataset.tilt || "-0.2") });
        if (type === "waves-light") waveField(cv, { far: [202, 208, 210], near: [148, 31, 32], lines: 40, tilt: -0.12 });
        if (type === "particles") particleField(cv, {});
      } catch (err) {
        /* in assenza di canvas resta lo sfondo statico */
      }
    });
  }

  window.LiveFX = { waveField: waveField, particleField: particleField };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
