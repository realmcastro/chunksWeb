# PWA Icons

`icon.svg` — primary app icon (vector, scales to any density).
`icon-maskable.svg` — adaptive icon with the safe-zone padding required by
Android (content stays inside the inner 60% so the OS can apply any mask).

## SVG vs PNG

Chrome / Edge / Firefox honour SVG entries in the manifest. Safari iOS still
prefers raster icons for `apple-touch-icon`. If iOS install fidelity becomes a
priority, generate PNGs from `icon.svg`:

```bash
# requires Inkscape (or rsvg-convert / ImageMagick)
inkscape icon.svg -w 192 -h 192 -o icon-192.png
inkscape icon.svg -w 512 -h 512 -o icon-512.png
```

Then add them back to `public/manifest.json` alongside the SVG entries.

## Updating the design

Both SVGs share the same palette so editing one without the other will drift.
Change colours / glyph in `icon.svg` first, then mirror into
`icon-maskable.svg` with the larger inner safe-zone padding.
