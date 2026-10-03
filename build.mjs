// Build statico del sito LiVE — nessuna dipendenza esterna.
// Assembla src/pages/*.html con i partial condivisi e copia gli asset in dist/.
// Uso: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
const partial = (name) => read(`partials/${name}.html`);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// Ogni pagina inizia con: <!--meta { "title": ..., "description": ..., "nav": ..., ... } -->
function parsePage(src, file) {
  const m = src.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Metadati mancanti in ${file}`);
  return { meta: JSON.parse(m[1]), body: src.slice(m[0].length) };
}

const logo = (id) => partial('logo').trim().replaceAll('{{id}}', id);

function render(file) {
  const { meta, body } = parsePage(read(`pages/${file}`), file);
  const extraHead = (meta.css || []).map((c) => `<link rel="stylesheet" href="assets/css/${c}">`).join('\n') + (meta.head || '');
  const extraScripts = (meta.js || []).map((j) => `<script src="assets/js/${j}" defer></script>`).join('\n');
  let header = partial('header')
    .replace('{{headerClass}}', meta.darkHero === false ? '' : ' is-on-dark')
    .replace('{{logo:header}}', logo('h'));
  if (meta.nav) header = header.replaceAll(`data-nav="${meta.nav}"`, `data-nav="${meta.nav}" aria-current="page"`);

  const html = [
    partial('head')
      .replaceAll('{{title}}', meta.title)
      .replaceAll('{{description}}', meta.description)
      .replace('{{extraHead}}', extraHead),
    `<body class="page-${file.replace('.html', '')}">`,
    partial('icons'),
    header,
    `<main id="main">`,
    body.replaceAll('{{logo:inline}}', logo('i')).replaceAll('{{logo:inline2}}', logo('i2')),
    `</main>`,
    partial('footer').replace('{{logo:footer}}', logo('f')).replace('{{extraScripts}}', extraScripts),
    `</body>`,
    `</html>`,
  ].join('\n');
  fs.writeFileSync(path.join(DIST, file), html);
  return file;
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
const pages = fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
pages.forEach(render);
console.log(`Build completata: ${pages.length} pagine → ${path.relative(ROOT, DIST)}/`);
