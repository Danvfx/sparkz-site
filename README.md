# Sparkz: Build Your Own Drink

A student-run build-your-own mocktail at La Salle College Antipolo. Vite, vanilla JS, three.js, GSAP and Lenis. Hosted on GitHub Pages and embedded in Google Sites.

## Run it

```bash
npm install
npm run dev        # http://localhost:5174 (or the port Vite prints)
npm run build      # QR codes, then dist/
npm run preview    # serve dist/
```

Useful URL switches: `?lite=1` (Tier B), `?static=1` (Tier C), `?embed=1` or `?embed=0`, `?debug=1` (tier and FPS overlay), `?present=1` (projector mode, arrow keys step the pour).

## Deploy to GitHub Pages

1. Create a GitHub repository and push this folder to the `main` branch.
2. In the repository, open **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds with Vite and publishes `dist/`.
5. When it finishes, the site is at `https://<user>.github.io/<repo>/`.
6. Put that URL in `SITE_URL` in `src/config.js`, then run `npm run build` again (the QR codes use it) and re-export the poster (see below).

`vite.config.js` uses `base: './'`, and no asset uses a root-absolute path, so the site works from a repo subpath.

## Embed in Google Sites

1. In Google Sites choose **Insert > Embed > By URL** and paste the GitHub Pages link. If Sites offers a whole-page option instead of a preview card, pick it (menu wording not verified).
2. Drag the embed box wide and tall (about a laptop screen). The site scrolls inside the box.
3. Add a plain text link to the full site above or below the embed. School networks sometimes block frames.

Inside an iframe the site switches to embed mode: native scrolling (no Lenis), shorter pinned sections, no custom cursor, an "Open full site" button, and the pledge poster opens in a new tab because downloads can be blocked in frames. Test with `dev/embed-test.html`.

## Configure

Everything you will edit is in two files.

- `src/config.js`: `SITE_URL`, hashtag, the recycling destination (`RECYCLING_DESTINATION`) and `TAKEBACK_LIVE`, both Google Forms (`ORDER_FORM`, `FEEDBACK_FORM`), `BREAK_SLOTS`, `DELIVERY_LOCATIONS`, socials, the pitch deck (`PITCH`), the bin labels.
- `src/data/menu.js`: flavors, colors, signature drinks, layering.

**Google Forms.** Create the form, open **Get pre-filled link**, fill every field with a dummy value and copy the link. Each `entry.<number>` goes into `ENTRY` in `config.js`. `ACTION` is the form's `viewform` URL with `viewform` replaced by `formResponse`. Submit a test row and confirm it lands in the linked Sheet.

**Recycling copy.** While `RECYCLING_DESTINATION` is empty, the site only says "We collect empty cups at the stall". Fill it in only when a real destination is confirmed.

## Swap colors and assets

- Flavor colors: `src/data/menu.js` only. Replace each hex with a color sampled from a photo of the real syrup in a clear cup.
- Brand colors: `src/styles/tokens.css`.
- Logo: the header mark is an SVG drawn in `index.html` (`#sparkz-mark`, marked TODO). The raster logo is `public/img/logo.webp`, and the 3D cup sticker is `public/img/logo-sticker.png`. To rebuild images from the originals: put them in `_src/` and run `npm run assets`.
- Poster: `node scripts/poster.mjs` (dev server running) re-exports `public/img/advocacy-poster.png` and `.pdf`.
- Pour video: add `public/video/pour.webm` and `pour.mp4`. The video block shows itself once the file exists.

## Tiers

| Tier | When | What runs |
|---|---|---|
| A | strong desktop | full 3D, bloom, about 400 bubbles, Lenis (standalone only), custom cursor |
| B | phones, low memory or cores, `?lite=1` | 3D, about 120 bubbles, pixel ratio capped at 1.5, native scroll |
| C | no WebGL, reduced motion, `?static=1` | SVG cup, no scrubbed pins, every feature still works |

An FPS guard drops A to B (below about 45 fps) and B to throttled rendering (below about 30 fps) after the first 3 seconds.

## Notes

- The drink renders in `public/img/render-*.webp` are AI concept art, labeled as such on the page. Replace them with real photos.
- Nothing financial, and nothing from the Turon-Da-Go section of the study, belongs on this site. See the brief's "Keep off the site" lists.
