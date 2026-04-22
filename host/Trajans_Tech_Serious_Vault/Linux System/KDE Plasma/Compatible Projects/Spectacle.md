---
tags:
  - kde
  - spectacle
  - screenshots
created: 2026-03-13
---

# Spectacle

KDE's screenshot and screen recording tool. Significantly upgraded in Plasma 6.

## Screenshot Features

| Feature | Detail |
|---------|--------|
| Full screen | Capture all monitors |
| Active window | Current focused window |
| Rectangular region | Click and drag selection |
| Current screen | Single monitor only |
| Delay | Timer before capture |
| Include cursor | Optional |

## Screen Recording (Wayland, 23.04+)

- Record screen, window, or region
- Window exclusion from recordings
- [[Wayland vs X11|Wayland]] only

## OCR Text Extraction (Plasma 6.6, Feb 2026)

- **Tesseract-powered** OCR — extract text from screenshots
- Select region → Copy Text
- Huge productivity boost for extracting text from images

## Annotation Tools

- Arrows, text boxes, rectangles
- Blur/pixelate regions (privacy)
- Freehand drawing
- Number markers
- Embed screenshots in [[Panels and Widgets|panel widgets]] workflows

## Formats

PNG, JPEG, AVIF, TIFF, BMP

## Keyboard Shortcut

| Shortcut | Action |
|----------|--------|
| `Print` | Open Spectacle |
| `Meta+Shift+Print` | Rectangular region |

Configure via [[Keyboard Shortcuts]]. Spectacle can also be triggered via [[D-Bus Scripting]] for automated screenshots. Screenshots are saved to [[Configuration Files|configurable paths]].

## See Also

- [[Keyboard Shortcuts]]
- [[KDE Plasma Overview]]
- [[Configuration Files]]
- [[D-Bus Scripting]]
