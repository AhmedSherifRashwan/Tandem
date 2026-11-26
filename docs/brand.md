# Tandem brand assets

The paired-T mark represents two distinct contributors moving in the same direction. It replaces the generic chain-link symbol. Use the flat vector mark in interface chrome; use the dimensional teal tile in the macOS Dock and app bundle.

| Asset | Use |
| --- | --- |
| `assets/logo.svg` | Scalable teal symbol on light backgrounds. |
| `assets/logo-light.svg` | Ivory symbol on dark backgrounds. |
| `assets/wordmark.svg` | Horizontal Tandem wordmark on light backgrounds. |
| `assets/wordmark-dark.svg` | Horizontal wordmark on dark backgrounds. |
| `assets/icon.png` | Generated dimensional macOS app icon; transparent outside the tile. |
| `assets/icon.svg` | Editable flat app-icon variant. |

Palette: petrol teal `#174B56`, ivory `#F7F3E9`, and neutral interface surfaces. Keep the mark upright, preserve its proportions and the gap between the two parts, and allow clear space around it. Do not rotate it as the old chain-link mark was rotated. Avoid placing the wordmark inside the Dock icon.

The interface and README wordmarks are editable SVG assets. The macOS PNG was created with the built-in image-generation tool and copied into this repository; the vector assets are an optically simplified companion to that image. No paid image API integration or API key was used. `node scripts/icon.mjs` exports the flat SVG to `assets/icon-flat.png` without overwriting the generated Mac icon. Electron Builder creates the native `.icns` resource from `assets/icon.png` during packaging.

## Image-generation prompt

> Create one finished macOS app icon for Tandem, an open-source local workspace where Claude and Codex collaborate. Production app icon, square 1024x1024 composition, real transparent background outside a single softly rounded square tile inset about 9 percent on each side, no cast shadow outside tile. Tile deep petrol teal #174B56 with extremely restrained satin dimensional edge and subtle soft top lighting, elegant Apple desktop icon craft. Centered bold ivory-white abstract capital T monogram built from exactly TWO separate equal-weight rounded geometric ribbons: each ribbon has a horizontal top arm and a vertical stem, forming two interlocking/offset T-like forms that read as a single paired T. Clear open negative space dividing the two ribbons. Geometric, balanced, instantly legible at 32px, large mark occupies 58 percent tile width and height. Slight warm ivory surface, very subtle bevel on glyph, no metal chrome, no glass, no rainbow, no neon, no glow, no chain links, no infinity symbol, no circuit boards, no stars, no robot. No text, no wordmark, no letters outside the monogram, no mockup, no scene, no grid of options. One beautiful usable app icon.

The generated master was retained at its returned resolution. The brand assets are included under the repository's MIT license; provider names and third-party marks are not part of this identity.
