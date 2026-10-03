# LiVE — Sito web e design system

Nuovo sito di **LiVE – Laboratorio Intangibles e Valore Economico** (consulenza strategica, spin-off dell’Università Politecnica delle Marche), con il relativo sistema di design.

Ispirazione: lo stile editoriale delle grandi società di consulenza (titoli serif, ampio spazio bianco, griglie rigorose), con i colori del marchio LiVE:

| Ruolo | Colore | Token |
|---|---|---|
| Rosso LiVE (primario) | `#941F20` | `--live-red-700` |
| Inchiostro (struttura) | `#17222B` | `--live-ink-900` |
| Ardesia (supporto) | `#59666F` | `--live-slate-600` |
| Argento (dettaglio) | `#CAD0D2` | `--live-grey-300` |

## Pagine

| File | Contenuto |
|---|---|
| `index.html` | Home: hero con onde generative animate, card in evidenza, numeri chiave, tre livelli di supporto (diagramma interattivo), competenze, “dai dati alle decisioni”, casi, clienti, missione |
| `chi-siamo.html` | Origini accademiche, significato del nome L·i·V·E, missione, matrice delle modalità di intervento, modalità operative |
| `competenze.html` | Sistema di competenze radiale interattivo, dettaglio delle 6 aree, aspetti operativi, tecnologie |
| `casi.html` | 10 use case filtrabili per area, con output e loghi clienti; muro dei clienti |
| `carriere.html` | Cosa offre LiVE, percorso di crescita (da tirocinio a partner), candidatura |
| `contatti.html` | Modulo di contatto e recapiti |
| `design-system.html` | Linee guida: principi, logo, colore e accessibilità, tipografia, griglia, icone, componenti, grafiche, dataviz, movimento, tono di voce, token |
| `privacy.html` | Segnaposto per l’informativa privacy (testo da inserire) |

## Struttura

```
src/
  pages/        pagine (ognuna inizia con un blocco <!--meta {...} -->)
  partials/     head, header, footer, logo, sprite delle icone
  assets/
    css/        tokens.css (design token), fonts.css, main.css, design-system.css
    js/         main.js (interazioni), fx.js (grafiche generative su canvas)
    fonts/      Source Serif 4 e Instrument Sans (self-hosted, SIL OFL)
    img/logo/   logo vettoriale (rosso, bianco, senza payoff, monogramma) + versione storica
    img/art/    illustrazioni astratte generate da scripts/gen-art.mjs
    img/clients loghi clienti (dal company profile 2026)
scripts/gen-art.mjs   generatore delle illustrazioni SVG
build.mjs             build statico senza dipendenze
dist/                 sito pronto da pubblicare (generato)
```

## Comandi

Richiede solo Node.js 18+ (nessuna dipendenza da installare).

```bash
node build.mjs              # genera dist/ dalle sorgenti
npx serve dist              # anteprima locale (oppure apri dist/index.html)
node scripts/gen-art.mjs    # rigenera le illustrazioni in src/assets/img/art/
```

Per pubblicare basta caricare il contenuto di `dist/` su qualsiasi hosting statico (Netlify, Vercel, GitHub Pages, hosting tradizionale).

## Note tecniche

- **Nessun framework**: HTML, CSS e JavaScript vanilla; funziona anche aprendo i file dal disco.
- **Accessibilità**: contrasti verificati WCAG AA/AAA (tabella nel design system), navigazione da tastiera, focus visibile, `prefers-reduced-motion` rispettato (le animazioni diventano statiche).
- **Font self-hosted**: nessuna chiamata a Google Fonts (privacy/GDPR e prestazioni).
- **Responsive**: verificato da 390 px a 1440 px senza scroll orizzontale.

## Da completare prima della pubblicazione

- [ ] **Modulo contatti**: oggi apre il programma di posta con un’email precompilata verso `info@liveintangibles.it`. Per l’invio diretto, aggiungere al `<form>` un attributo `action` verso un servizio (es. Formspree, Netlify Forms o un endpoint aziendale).
- [ ] **Privacy policy**: inserire il testo in `src/pages/privacy.html` (titolare, ragione sociale, P.IVA, sede legale).
- [ ] **Dati societari** nel footer (`src/partials/footer.html`): ragione sociale completa, P.IVA, indirizzo e link al profilo LinkedIn.
- [ ] **Use case 10 – Formazione**: nel company profile gli output erano duplicati dalla slide precedente; sul sito sono stati proposti “Piano formativo, Docenze su misura, Percorsi Academy” — da confermare.
- [ ] Verificare l’autorizzazione all’uso dei loghi dei clienti sul sito pubblico.
