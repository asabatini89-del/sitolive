// Genera le illustrazioni astratte del sistema visivo LiVE (SVG deterministici).
// Uso: node scripts/gen-art.mjs  → scrive in src/assets/img/art/
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('src/assets/img/art');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  red: '#941F20', redDeep: '#6E1718', redBright: '#C23B37', redSoft: '#E66B63',
  ink: '#17222B', inkDeep: '#0B1116', slate: '#59666F', grey: '#CAD0D2', paper: '#F6F7F7', white: '#FFFFFF',
};

// PRNG deterministico (mulberry32) per risultati ripetibili
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>\n`;
const write = (name, content) => fs.writeFileSync(path.join(OUT, name), content);

// 1. Onde — campo di linee sinusoidali in prospettiva (firma visiva dell'hero)
function waves({ w = 1600, h = 900, bg = C.ink, lines = 46, seed = 3, tilt = -12, far = C.red, near = C.redBright } = {}) {
  const r = rng(seed);
  const ph = [r() * 6, r() * 6, r() * 6];
  let body = `<rect width="${w}" height="${h}" fill="${bg}"/><g transform="rotate(${tilt} ${w / 2} ${h / 2})">`;
  for (let i = 0; i < lines; i++) {
    const d = i / (lines - 1);
    const pts = [];
    for (let x = -200; x <= w + 200; x += 20) {
      const u = x / w;
      const z = Math.sin(u * 5.2 + ph[0] + d * 2.1) * 0.55 + Math.sin(u * 11.3 - ph[1] + d * 3.7) * 0.22 + Math.sin(u * 2.1 + ph[2] - d * 1.3) * 0.45;
      const y = h * (0.02 + Math.pow(d, 1.25) * 1.02) + z * (70 + d * 150);
      pts.push(`${f(x)},${f(y)}`);
    }
    const a = 0.18 + Math.pow(d, 1.1) * 0.8;
    body += `<polyline points="${pts.join(' ')}" fill="none" stroke="${d > 0.6 ? near : far}" stroke-opacity="${f(a * 100) / 100}" stroke-width="${f(0.6 + d * 1.6)}"/>`;
  }
  return svg(w, h, body + '</g>');
}

// 2. Livelli — tre piani isometrici sovrapposti (tre livelli di supporto)
function layers({ w = 1200, h = 900, bg = C.paper } = {}) {
  const iso = (cx, cy, s) => `${cx},${cy - s * 0.5} ${cx + s},${cy} ${cx},${cy + s * 0.5} ${cx - s},${cy}`;
  let body = `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  const cfg = [
    { y: 300, fill: C.red, op: 1, label: '01' },
    { y: 450, fill: C.ink, op: 0.92, label: '02' },
    { y: 600, fill: C.slate, op: 0.85, label: '03' },
  ];
  // linee di connessione verticali
  for (const dx of [-330, 0, 330]) body += `<line x1="${600 + dx}" y1="300" x2="${600 + dx}" y2="600" stroke="${C.grey}" stroke-width="2" stroke-dasharray="4 8"/>`;
  [...cfg].reverse().forEach((l) => {
    body += `<polygon points="${iso(600, l.y + 18, 330)}" fill="${C.inkDeep}" opacity="0.10"/>`;
    body += `<polygon points="${iso(600, l.y, 330)}" fill="${l.fill}" opacity="${l.op}"/>`;
    // griglia sul piano
    for (let k = 1; k < 6; k++) {
      const t = k / 6;
      body += `<line x1="${f(600 - 330 + 330 * t)}" y1="${f(l.y - 165 * t)}" x2="${f(600 + 330 * t)}" y2="${f(l.y + 165 - 165 * t)}" stroke="#fff" stroke-opacity="0.14"/>`;
      body += `<line x1="${f(600 - 330 + 330 * t)}" y1="${f(l.y + 165 * t)}" x2="${f(600 + 330 * t)}" y2="${f(l.y - 165 + 165 * t)}" stroke="#fff" stroke-opacity="0.14"/>`;
    }
  });
  return svg(w, h, body);
}

// 3. Barre — colonne dati astratte (business intelligence / performance)
function bars({ w = 1200, h = 900, bg = C.paper, seed = 11 } = {}) {
  const r = rng(seed);
  let body = `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  for (let y = 150; y <= 750; y += 100) body += `<line x1="80" x2="${w - 80}" y1="${y}" y2="${y}" stroke="${C.grey}" stroke-width="1"/>`;
  const n = 18, bw = (w - 160) / n;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const v = 0.2 + (i / n) * 0.55 + r() * 0.2;
    const bh = v * 600;
    const x = 80 + i * bw + bw * 0.18;
    const hl = i === n - 3;
    body += `<rect x="${f(x)}" y="${f(750 - bh)}" width="${f(bw * 0.64)}" height="${f(bh)}" fill="${hl ? C.red : i % 3 === 0 ? C.ink : C.slate}" opacity="${hl ? 1 : 0.18 + (i / n) * 0.6}"/>`;
    pts.push([x + bw * 0.32, 750 - bh - 40 - r() * 30]);
  }
  body += `<polyline points="${pts.map((p) => p.map(f).join(',')).join(' ')}" fill="none" stroke="${C.red}" stroke-width="3"/>`;
  pts.forEach((p, i) => (body += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${i === n - 3 ? 9 : 4}" fill="${i === n - 3 ? C.red : C.white}" stroke="${C.red}" stroke-width="2.5"/>`));
  return svg(w, h, body);
}

// 4. Orbite — anelli concentrici con nodi (sistema di competenze)
function orbit({ w = 1200, h = 900, bg = C.redDeep, seed = 5 } = {}) {
  const r = rng(seed);
  const cx = w * 0.62, cy = h * 0.5;
  let defs = `<radialGradient id="g" cx="${cx}" cy="${cy}" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.redBright}" stop-opacity=".55"/><stop offset="1" stop-color="${C.redDeep}" stop-opacity="0"/></radialGradient>`;
  let body = `<rect width="${w}" height="${h}" fill="${bg}"/><rect width="${w}" height="${h}" fill="url(#g)"/>`;
  [120, 210, 300, 390, 480].forEach((rad, i) => {
    body += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="#fff" stroke-opacity="${0.32 - i * 0.05}" ${i % 2 ? 'stroke-dasharray="2 10"' : ''}/>`;
    const k = 2 + i;
    for (let j = 0; j < k; j++) {
      const a = r() * Math.PI * 2;
      body += `<circle cx="${f(cx + Math.cos(a) * rad)}" cy="${f(cy + Math.sin(a) * rad)}" r="${f(3 + r() * 6)}" fill="#fff" fill-opacity="${f(0.5 + r() * 0.5)}"/>`;
    }
  });
  body += `<circle cx="${cx}" cy="${cy}" r="44" fill="#fff"/>`;
  return svg(w, h, body, defs);
}

// 5. Matrice di punti — densità crescente (dati → decisioni)
function dots({ w = 1200, h = 900, bg = C.ink, seed = 8 } = {}) {
  const r = rng(seed);
  let body = `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  const step = 30;
  for (let y = step; y < h; y += step) {
    for (let x = step; x < w; x += step) {
      const u = x / w, v = y / h;
      const field = Math.exp(-((u - 0.72) ** 2 / 0.06 + (v - 0.45) ** 2 / 0.12));
      const rad = 1 + field * 7 * (0.7 + r() * 0.3);
      const hot = field > 0.55;
      body += `<circle cx="${x}" cy="${y}" r="${f(rad)}" fill="${hot ? C.redBright : C.slate}" fill-opacity="${f(hot ? 0.9 : 0.25 + field * 0.5)}"/>`;
    }
  }
  return svg(w, h, body);
}

// 6. Gradini — scala di crescita (carriere)
function steps({ w = 1200, h = 900, bg = C.paper } = {}) {
  let body = `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  const n = 8, sw = 120, sh = 80, x0 = 120, y0 = 800;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * sw, y = y0 - (i + 1) * sh;
    const last = i === n - 1;
    body += `<rect x="${x}" y="${y}" width="${sw - 8}" height="${(i + 1) * sh}" fill="${last ? C.red : C.ink}" opacity="${last ? 1 : 0.12 + i * 0.1}"/>`;
    body += `<circle cx="${x + (sw - 8) / 2}" cy="${y - 26}" r="7" fill="${last ? C.red : C.slate}"/>`;
  }
  body += `<path d="M${x0 + 56} ${y0 - sh - 26} ${Array.from({ length: n - 1 }, (_, i) => `L${x0 + (i + 1) * sw + 56} ${y0 - (i + 2) * sh - 26}`).join(' ')}" fill="none" stroke="${C.red}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`;
  return svg(w, h, body);
}

// 7. Curve di livello — topografia (strategia, scenari)
function contour({ w = 1200, h = 900, bg = C.paper, seed = 21 } = {}) {
  const r = rng(seed);
  const peaks = [[0.7, 0.45, 1], [0.3, 0.7, 0.7], [0.45, 0.2, 0.5]].map(([x, y, s]) => [x * w, y * h, s]);
  let body = `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  peaks.forEach(([px, py, s], pi) => {
    for (let k = 1; k <= 12; k++) {
      const base = k * 32 * s + 10;
      const pts = [];
      const off = r() * 6;
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const rad = base * (1 + 0.16 * Math.sin(t * 3 + off) + 0.08 * Math.sin(t * 5 - off * 2));
        pts.push(`${f(px + Math.cos(t) * rad * 1.25)},${f(py + Math.sin(t) * rad)}`);
      }
      const accent = pi === 0 && k === 4;
      body += `<polygon points="${pts.join(' ')}" fill="none" stroke="${accent ? C.red : C.slate}" stroke-opacity="${accent ? 1 : f(0.62 - k * 0.035)}" stroke-width="${accent ? 3 : 1.4}"/>`;
    }
  });
  body += `<circle cx="${peaks[0][0]}" cy="${peaks[0][1]}" r="10" fill="${C.red}"/>`;
  return svg(w, h, body);
}

// 8. Rete — nodi e connessioni (organizzazione, persone)
function network({ w = 1200, h = 900, bg = C.ink, seed = 34 } = {}) {
  const r = rng(seed);
  const nodes = Array.from({ length: 38 }, () => [80 + r() * (w - 160), 80 + r() * (h - 160), r()]);
  let body = `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const [x1, y1] = nodes[i], [x2, y2] = nodes[j];
      const d = Math.hypot(x2 - x1, y2 - y1);
      if (d < 230) body += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${C.grey}" stroke-opacity="${f((1 - d / 230) * 0.35)}"/>`;
    }
  nodes.forEach(([x, y, s], i) => {
    const hub = s > 0.86;
    body += `<circle cx="${f(x)}" cy="${f(y)}" r="${hub ? 11 : f(3 + s * 4)}" fill="${hub ? C.redBright : C.white}" fill-opacity="${hub ? 1 : 0.7}"/>`;
    if (hub) body += `<circle cx="${f(x)}" cy="${f(y)}" r="26" fill="none" stroke="${C.redBright}" stroke-opacity=".5"/>`;
  });
  return svg(w, h, body);
}

write('waves.svg', waves());
write('waves-red.svg', waves({ bg: C.redDeep, seed: 9, lines: 40, tilt: -8, far: C.redSoft, near: '#F3B3AC' }));
write('layers.svg', layers());
write('bars.svg', bars());
write('orbit.svg', orbit());
write('dots.svg', dots());
write('steps.svg', steps());
write('contour.svg', contour());
write('network.svg', network());
console.log('Illustrazioni generate in', OUT);
