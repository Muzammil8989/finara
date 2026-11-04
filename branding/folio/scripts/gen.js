// Folio brand kit generator — SVG masters (text converted to paths) + PNG renders.
// Usage: node gen.js <projectRoot> <outDir>
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const { Resvg } = require('@resvg/resvg-js');

const [, , ROOT, OUT] = process.argv;
const FONTS = path.join(ROOT, 'node_modules/@expo-google-fonts');
const serif = opentype.loadSync(path.join(FONTS, 'playfair-display/700Bold/PlayfairDisplay_700Bold.ttf'));
const serifIt = opentype.loadSync(path.join(FONTS, 'playfair-display/700Bold_Italic/PlayfairDisplay_700Bold_Italic.ttf'));
const sans = opentype.loadSync(path.join(FONTS, 'plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf'));

const C = {
  ink: '#1A1714', paper: '#FBF7F0', teal: '#0D5C63', deep: '#0A474D', ochre: '#B07D1E', rule: '#E4DCCF', white: '#FFFFFF',
};

for (const d of ['svg', 'png', 'web', 'expo']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

// ── Glyph helpers ─────────────────────────────────────────────────────────
/** Path for `text` fitted so its cap height is `h`, left/top at (x, y). Returns {d, w, h}. */
function textPath(font, text, x, y, h, letterSpacing = 0) {
  const size = 1000;
  const p = font.getPath(text, 0, 0, size, { letterSpacing });
  const bb = p.getBoundingBox();
  const k = h / (bb.y2 - bb.y1);
  const fitted = font.getPath(text, 0, 0, size * k, { letterSpacing });
  const fb = fitted.getBoundingBox();
  // translate so bbox top-left lands at (x, y)
  fitted.commands.forEach(c => {
    for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
      if (c[kx] !== undefined) { c[kx] += x - fb.x1; c[ky] += y - fb.y1; }
    }
  });
  return { d: fitted.toPathData(2), w: fb.x2 - fb.x1, h: fb.y2 - fb.y1 };
}

// ── The mark ──────────────────────────────────────────────────────────────
/**
 * Folio mark in a box of size S. The sheet is a rounded square whose top-right
 * corner is folded down; the fold shows the ochre underside. A cream serif F
 * sits over a short ochre rule.
 *   variant: 'color' | 'white' | 'ink'
 *   radius: corner radius (0 for full-bleed iOS icon)
 *   bleed: if true the sheet fills the whole canvas (maskable/iOS)
 */
function mark(S, { variant = 'color', radius = S * 0.22, bleed = false, inset = 0, glyphScale = 1 } = {}) {
  const x0 = inset, y0 = inset, W = S - inset * 2;
  const r = bleed ? 0 : radius;
  const f = W * 0.24; // fold size
  const sheet = variant === 'color' ? C.teal : variant === 'white' ? C.white : C.ink;
  const flap = variant === 'color' ? C.ochre : variant === 'white' ? 'rgba(255,255,255,0.55)' : 'rgba(26,23,20,0.55)';
  const shade = variant === 'color' ? C.deep : 'rgba(0,0,0,0.18)';
  const glyphFill = variant === 'color' ? C.paper : variant === 'white' ? C.teal : C.paper;

  const R = x0 + W, B = y0 + W;
  // Sheet with the top-right corner cut diagonally (where it folds).
  const sheetD = [
    `M${x0 + r},${y0}`,
    `H${R - f}`,
    `L${R},${y0 + f}`,
    `V${B - r}`,
    r ? `A${r},${r} 0 0 1 ${R - r},${B}` : `L${R},${B}`,
    `H${x0 + r}`,
    r ? `A${r},${r} 0 0 1 ${x0},${B - r}` : `L${x0},${B}`,
    `V${y0 + r}`,
    r ? `A${r},${r} 0 0 1 ${x0 + r},${y0}` : `L${x0},${y0}`,
    'Z',
  ].join(' ');
  // Folded flap: the triangle folded inward, showing the underside.
  const flapD = `M${R - f},${y0} L${R - f},${y0 + f} L${R},${y0 + f} Z`;
  // Thin crease shadow along the fold diagonal on the sheet.
  const creaseD = `M${R - f},${y0 + f} L${R},${y0 + f} L${R},${y0 + f + W * 0.035} L${R - f + W * 0.035},${y0 + f + W * 0.035} Z`;

  // F glyph, optically centred (nudged left/down away from the fold).
  const capH = W * 0.46 * glyphScale;
  const probe = textPath(serif, 'F', 0, 0, capH);
  const gx = x0 + (W - probe.w) / 2 - W * 0.035;
  const gy = y0 + (W - capH) / 2 - W * 0.02;
  const F = textPath(serif, 'F', gx, gy, capH);
  // Ochre masthead rule under the letter.
  const ruleW = probe.w * 1.15, ruleH = Math.max(2, W * 0.022);
  const ruleX = gx - (ruleW - probe.w) / 2 + W * 0.01, ruleY = gy + capH + W * 0.07;
  const ruleFill = variant === 'color' ? C.ochre : glyphFill;

  // Full-bleed icons can't have transparency (iOS fills it black): put the
  // "page behind" under the fold in deep teal.
  const under = bleed ? `<rect x="${x0}" y="${y0}" width="${W}" height="${W}" fill="${variant === 'color' ? C.deep : sheet}"/>` : '';
  return `${under}
    <path d="${sheetD}" fill="${sheet}"/>
    <path d="${creaseD}" fill="${shade}" opacity="0.6"/>
    <path d="${flapD}" fill="${flap}"/>
    <path d="${F.d}" fill="${glyphFill}"/>
    <rect x="${ruleX.toFixed(1)}" y="${ruleY.toFixed(1)}" width="${ruleW.toFixed(1)}" height="${ruleH.toFixed(1)}" rx="${(ruleH / 2).toFixed(1)}" fill="${ruleFill}"/>`;
}

/** Glyph-only silhouette (for Android monochrome / notification icons): F + rule + fold corner. */
function silhouette(S, { color = C.white, safe = 0.6 } = {}) {
  const W = S * safe, x0 = (S - W) / 2, y0 = (S - W) / 2;
  const capH = W * 0.78;
  const probe = textPath(serif, 'F', 0, 0, capH);
  const gx = x0 + (W - probe.w) / 2, gy = y0;
  const F = textPath(serif, 'F', gx, gy, capH);
  const ruleW = probe.w * 1.15, ruleH = W * 0.06;
  return `<path d="${F.d}" fill="${color}"/>
    <rect x="${gx - (ruleW - probe.w) / 2}" y="${gy + capH + W * 0.1}" width="${ruleW}" height="${ruleH}" rx="${ruleH / 2}" fill="${color}"/>`;
}

const svg = (w, h, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}${body}</svg>`;

function write(rel, content) { fs.writeFileSync(path.join(OUT, rel), content); }
function png(svgStr, rel, width) {
  const r = new Resvg(svgStr, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } });
  fs.writeFileSync(path.join(OUT, rel), r.render().asPng());
}

// ── Wordmark & lockups ────────────────────────────────────────────────────
function wordmark(x, y, h, color) {
  const w = textPath(serifIt, 'Folio', x, y, h, 0.01);
  return { body: `<path d="${w.d}" fill="${color}"/>`, w: w.w, h: w.h };
}
function descriptor(x, y, h, color) {
  const d = textPath(sans, 'YOUR MONEY, CLEARLY KEPT', x, y, h, 0.18);
  return { body: `<path d="${d.d}" fill="${color}"/>`, w: d.w };
}

function horizontal(dark, withDesc) {
  const H = 240, icon = 200, pad = 20;
  const ink = dark ? C.paper : C.ink;
  const wm = wordmark(0, 0, 118, ink);
  const tx = pad + icon + 56;
  const wmY = withDesc ? 38 : (H - wm.h) / 2;
  const w2 = wordmark(tx, wmY, 118, ink);
  let desc = { body: '', w: 0 };
  if (withDesc) desc = descriptor(tx + 4, wmY + wm.h + 36, 22, dark ? C.rule : '#6B6359');
  const W = Math.ceil(tx + Math.max(wm.w, desc.w) + pad + 12);
  const bodyIcon = `<g transform="translate(${pad},${(H - icon) / 2})">${mark(icon)}</g>`;
  return svg(W, H, bodyIcon + w2.body + desc.body, dark ? C.ink : C.paper);
}
function stacked(dark) {
  const W = 900, icon = 360, ink = dark ? C.paper : C.ink;
  const probe = wordmark(0, 0, 150, ink);
  const wm = wordmark((W - probe.w) / 2, 80 + icon + 70, 150, ink);
  const dp = descriptor(0, 0, 26, '#000');
  const desc = descriptor((W - dp.w) / 2, 80 + icon + 70 + probe.h + 44, 26, dark ? C.rule : '#6B6359');
  const H = Math.ceil(80 + icon + 70 + probe.h + 44 + 26 + 80);
  return svg(W, H, `<g transform="translate(${(W - icon) / 2},80)">${mark(icon)}</g>` + wm.body + desc.body, dark ? C.ink : C.paper);
}
function wordmarkSvg(dark) {
  const p = wordmark(0, 0, 200, '#000');
  const W = Math.ceil(p.w + 80), H = Math.ceil(p.h + 80);
  return svg(W, H, wordmark(40, 40, 200, dark ? C.paper : C.ink).body, dark ? C.ink : C.paper);
}

// ── SVG masters ───────────────────────────────────────────────────────────
const S = 1024;
write('svg/icon-color.svg', svg(S, S, mark(S)));
write('svg/icon-white.svg', svg(S, S, mark(S, { variant: 'white' })));
write('svg/icon-ink.svg', svg(S, S, mark(S, { variant: 'ink' })));
// Small sizes: bigger glyph, no crease, so the F and fold stay crisp at 16–32px.
write('svg/favicon-mark.svg', svg(64, 64, mark(64, { radius: 12, glyphScale: 1.18 })));
write('svg/lockup-horizontal-light.svg', horizontal(false, false));
write('svg/lockup-horizontal-dark.svg', horizontal(true, false));
write('svg/lockup-horizontal-light-descriptor.svg', horizontal(false, true));
write('svg/lockup-horizontal-dark-descriptor.svg', horizontal(true, true));
write('svg/lockup-stacked-light.svg', stacked(false));
write('svg/lockup-stacked-dark.svg', stacked(true));
write('svg/wordmark-light.svg', wordmarkSvg(false));
write('svg/wordmark-dark.svg', wordmarkSvg(true));
write('svg/appicon-dark-rounded.svg', svg(S, S, mark(S)));
write('svg/appicon-light-rounded.svg', svg(S, S, `<rect width="${S}" height="${S}" rx="${S * 0.22}" fill="${C.paper}"/>` + mark(S, { inset: S * 0.14, radius: S * 0.16 })));
write('svg/appicon-maskable.svg', svg(S, S, mark(S, { bleed: true, glyphScale: 0.82 })));

// ── PNG exports ───────────────────────────────────────────────────────────
const read = rel => fs.readFileSync(path.join(OUT, rel), 'utf8');
for (const w of [256, 512, 1024]) png(read('svg/icon-color.svg'), `png/icon-${w}.png`, w);
png(read('svg/icon-ink.svg'), 'png/icon-mono-512.png', 512);
png(read('svg/lockup-horizontal-light.svg'), 'png/lockup-800w.png', 800);
png(read('svg/lockup-horizontal-light.svg'), 'png/lockup-1600w.png', 1600);
png(read('svg/lockup-stacked-light.svg'), 'png/lockup-stacked-900w.png', 900);
png(read('svg/wordmark-light.svg'), 'png/wordmark-1000w.png', 1000);
png(read('svg/appicon-dark-rounded.svg'), 'png/appicon-512.png', 512);
png(read('svg/appicon-dark-rounded.svg'), 'png/appicon-1024.png', 1024);
png(read('svg/appicon-light-rounded.svg'), 'png/appicon-light-512.png', 512);
png(read('svg/appicon-maskable.svg'), 'png/appicon-maskable-512.png', 512);

// ── Expo / native assets ──────────────────────────────────────────────────
// iOS + store icon: full-bleed (the OS applies its own corner mask).
png(svg(S, S, mark(S, { bleed: true, glyphScale: 0.9 })), 'expo/icon.png', 1024);
png(svg(S, S, mark(S, { bleed: true, glyphScale: 0.9 })), 'expo/ios-icon.png', 1024);
// Android adaptive: background colour = teal (app.json); foreground is the F +
// rule + fold flap kept inside the 66% safe zone, transparent elsewhere.
{
  const safe = S * 0.62, o = (S - safe) / 2;
  const capH = safe * 0.62;
  const probe = textPath(serif, 'F', 0, 0, capH);
  const gx = o + (safe - probe.w) / 2 - safe * 0.03, gy = o + (safe - capH) / 2 - safe * 0.04;
  const F = textPath(serif, 'F', gx, gy, capH);
  const ruleW = probe.w * 1.15, ruleH = safe * 0.03;
  const fg = `<path d="${F.d}" fill="${C.paper}"/><rect x="${gx - (ruleW - probe.w) / 2 + safe * 0.01}" y="${gy + capH + safe * 0.09}" width="${ruleW}" height="${ruleH}" rx="${ruleH / 2}" fill="${C.ochre}"/>`;
  png(svg(S, S, fg), 'expo/android-icon-foreground.png', 1024);
  png(svg(S, S, '', C.teal), 'expo/android-icon-background.png', 1024);
  png(svg(S, S, silhouette(S, { safe: 0.5 })), 'expo/android-icon-monochrome.png', 1024);
}
// Splash: cream mark on the teal splash background (set in app.json).
png(svg(S, S, silhouette(S, { color: C.paper, safe: 0.5 })), 'expo/splash-icon.png', 1024);
// Notification icon: white silhouette on transparent (Android tints it).
png(svg(96, 96, silhouette(96, { safe: 0.72 })), 'expo/notification-icon.png', 96);
png(read('svg/favicon-mark.svg'), 'expo/favicon.png', 48);
png(svg(S, S, mark(S)), 'expo/expo-icon.png', 1024);

// ── Web bundle ────────────────────────────────────────────────────────────
fs.copyFileSync(path.join(OUT, 'svg/favicon-mark.svg'), path.join(OUT, 'web/favicon.svg'));
for (const w of [16, 32]) png(read('svg/favicon-mark.svg'), `web/favicon-${w}.png`, w);
png(read('svg/appicon-maskable.svg'), 'web/apple-touch-icon.png', 180);
for (const w of [192, 512]) {
  png(read('svg/icon-color.svg'), `web/icon-${w}.png`, w);
  png(read('svg/appicon-maskable.svg'), `web/icon-maskable-${w}.png`, w);
}
write('web/site.webmanifest', JSON.stringify({
  name: 'Folio', short_name: 'Folio', theme_color: C.teal, background_color: C.paper, display: 'standalone',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));
write('web/head-snippet.html', [
  '<link rel="icon" href="/favicon.ico" sizes="any">',
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  '<link rel="manifest" href="/site.webmanifest">',
  `<meta name="theme-color" content="${C.teal}">`,
].join('\n') + '\n');

// ── QA sheet: sizes + mono, light & dark ──────────────────────────────────
{
  const W = 1400, H = 720;
  let body = `<rect width="${W / 2}" height="${H}" fill="${C.paper}"/><rect x="${W / 2}" width="${W / 2}" height="${H}" fill="${C.ink}"/>`;
  const sizes = [256, 96, 48, 32, 16];
  let x = 40;
  for (const s of sizes) { body += `<g transform="translate(${x},40)">${mark(s, s <= 64 ? { radius: s * 0.19, glyphScale: 1.18 } : {})}</g>`; x += s + 30; }
  x = W / 2 + 40;
  for (const s of sizes) { body += `<g transform="translate(${x},40)">${mark(s, s <= 64 ? { radius: s * 0.19, glyphScale: 1.18 } : {})}</g>`; x += s + 30; }
  body += `<g transform="translate(40,340)">${mark(220, { variant: 'ink' })}</g>`;
  body += `<g transform="translate(${W / 2 + 40},340)">${mark(220, { variant: 'white' })}</g>`;
  body += `<g transform="translate(300,360)">${horizontal(false, true).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
  png(svg(W, H, body), 'qa-sheet.png', W);
}
console.log('done');
