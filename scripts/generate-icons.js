// Finara icon generator — uses expo-icon.png (transparent logo, 1024x1024).
// Run: node scripts/generate-icons.js

const sharp = require('sharp');
const path  = require('path');

const OUT    = path.join(__dirname, '..', 'assets', 'images');
const SOURCE = path.join(OUT, 'expo-icon.png'); // transparent logo

// Dark navy background — used wherever a solid bg is required (app icon, Android bg)
const DARK_BG = { r: 6, g: 14, b: 36, alpha: 1 }; // #060e24

// Composite transparent logo onto a solid dark background → produces a clean app icon
async function onDarkBg(size) {
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: DARK_BG },
  }).png().toBuffer();

  const logo = await sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .png()
    .toBuffer();

  return sharp(bg)
    .composite([{ input: logo }])
    .png()
    .toBuffer();
}

async function generate() {
  console.log('Source: expo-icon.png (transparent, 1024×1024)\n');

  // ── App icon — needs solid bg (Apple & Android reject transparent icons) ──
  const iconBuf = await onDarkBg(1024);
  await sharp(iconBuf).png().toFile(path.join(OUT, 'icon.png'));
  console.log('  ✓ icon.png                1024×1024  (dark bg)');

  // ── Splash-screen icon — transparent, works on any backgroundColor ────────
  await sharp(SOURCE)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .png()
    .toFile(path.join(OUT, 'splash-icon.png'));
  console.log('  ✓ splash-icon.png         1024×1024  (transparent)');

  // ── Web favicon — transparent ─────────────────────────────────────────────
  await sharp(SOURCE)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .png()
    .toFile(path.join(OUT, 'favicon.png'));
  console.log('  ✓ favicon.png             64×64      (transparent)');

  // ── Android adaptive foreground — transparent (launcher clips to shape) ───
  await sharp(SOURCE)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .png()
    .toFile(path.join(OUT, 'android-icon-foreground.png'));
  console.log('  ✓ android-icon-foreground.png  1024×1024  (transparent)');

  // ── Android adaptive background — solid dark navy ─────────────────────────
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: DARK_BG },
  })
    .png()
    .toFile(path.join(OUT, 'android-icon-background.png'));
  console.log('  ✓ android-icon-background.png  1024×1024  (#060e24)');

  // ── Android monochrome (Android 13+ themed icons) — transparent ───────────
  await sharp(SOURCE)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .png()
    .toFile(path.join(OUT, 'android-icon-monochrome.png'));
  console.log('  ✓ android-icon-monochrome.png  1024×1024  (transparent)');

  console.log('\nAll Finara assets generated ✓');
}

generate().catch((err) => { console.error(err); process.exit(1); });
