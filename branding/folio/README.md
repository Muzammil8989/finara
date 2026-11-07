# Folio — brand kit

**Folio** · *Your money, clearly kept.*

## Concept
A *folio* is a folded leaf of paper — a page in a ledger. The mark is a deep-teal sheet
with its top-right corner folded over to show an ochre underside, and a cream
Playfair Display **F** set like a masthead initial over a short ochre rule.

**The one risk:** the ochre fold. It is the only warm colour in the system and the
only non-letter element; everything else stays quiet so it reads as intentional.

## Palette
| Colour | Hex | Role |
|---|---|---|
| Teal | `#0D5C63` | Primary — the sheet, buttons, splash, Android icon background |
| Deep teal | `#0A474D` | Shadow / page behind the fold, pressed states |
| Ochre | `#B07D1E` | Accent — the fold and the masthead rule only |
| Paper | `#FBF7F0` | Background, the F |
| Ink | `#1A1714` | Text, single-colour mark |
| Rule | `#E4DCCF` | Hairlines and dividers |

## Type
- **Display:** Playfair Display 700 / 700 Italic (wordmark) — https://fonts.google.com/specimen/Playfair+Display
- **Utility:** Plus Jakarta Sans 500 (descriptor, UI) — https://fonts.google.com/specimen/Plus+Jakarta+Sans

All logo text is converted to vector paths; no fonts are needed to display the SVGs.

## Files
| Path | Use |
|---|---|
| `svg/icon-color.svg` | Primary mark (rounded tile with fold) |
| `svg/icon-white.svg`, `svg/icon-ink.svg` | Single-colour versions |
| `svg/favicon-mark.svg` | Simplified small-size mark (larger F) |
| `svg/lockup-horizontal-*.svg` | Mark + wordmark, light/dark, with/without descriptor |
| `svg/lockup-stacked-*.svg` | Stacked lockup |
| `svg/wordmark-*.svg` | Wordmark only |
| `svg/appicon-*.svg` | Rounded dark/light and full-bleed maskable icons |
| `png/` | Raster exports of the above |
| `web/` | Favicons, PWA icons, `site.webmanifest`, `head-snippet.html` |
| `brand-sheet.png` | Sizes, mono versions and lockup at a glance |
| `native-icons-sheet.png` | The Expo/native icons on their real backgrounds |
| `scripts/gen.js` | Regenerates everything (see below) |

The app's native assets in `assets/images/` (icon, Android adaptive foreground /
background / monochrome, splash, notification icon, favicon, `brand-mark*.png`) are
produced by the same script.

## Rules
- **Clear space:** at least the width of the ochre rule on every side of the mark.
- **Minimum size:** 24 px for the full mark; below that use `favicon-mark.svg`.
- **Full-bleed icons** (iOS, maskable) put deep teal under the fold — never transparency.
- **Android adaptive** uses the F + rule only; the fold would be cropped by circular masks.

**Do:** use the mark on paper, ink or teal backgrounds; keep the fold ochre in the colour version.
**Don't:** recolour the fold, add shadows or gradients, stretch the tile, or set the wordmark in another font.

## Naming
- **Brand / store name:** Folio
- **Descriptor:** Folio — personal finance, kept privately on your phone
- **In-app short form:** Folio
- Internal identifiers: Expo slug `folio`, URL scheme `folio://`, Android package
  `com.anonymous.folio`, storage keys prefixed `folio_`, database `folio.db`.

## Regenerate
```bash
cd <scratch dir>
npm i @resvg/resvg-js@2.6.2 opentype.js@1.3.4
node branding/folio/scripts/gen.js <projectRoot> <outDir>
```
Then copy `<outDir>/expo/*.png` into `assets/images/`.
