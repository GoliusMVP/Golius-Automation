# Golius public website

The public GitHub Pages website for **golius.de**, from https://github.com/GoliusMVP/Golius-Automation. This project is separate from agents.golius.de.

A static, responsive product website with a local interactive Agent Builder. No runtime dependencies, backend, API, credentials or database. The original GitHub Pages root and CNAME remain compatible.

## Run locally

Use Node.js 20 or newer:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. Use `PORT=4174 npm run dev` to choose another port. No environment file is needed.

## Check and build

```sh
npm run lint
npm test
npx playwright install --with-deps chromium
npm run test:browser
npm run build
```

Browser installation may require system administration privileges; install its host dependencies through your normal development environment. The build produces an ignored `dist/` static export. GitHub Pages can continue serving the repository root without an npm build. This is JavaScript; there is no separate TypeScript check. `lint` checks module syntax, local links, IDs and static-site constraints.

## Structure

- `index.html`: public homepage and accessible builder shell.
- `assets/css/`: site and builder styles.
- `assets/js/plan.mjs`: deterministic example planning and dependencies.
- `assets/js/runner.mjs`: cancellable playback and explicit approval pause.
- `assets/js/flow.mjs`: responsive nodes, measured SVG connections and pulses.
- `assets/js/builder.mjs`: controls, sample outputs, focus and state.
- `assets/js/site.mjs`, `icons.mjs`, `assets/mark.svg`: local page initialization and branding.
- `legal.html`: clearly marked legal-content preview; verified notices must replace it before publication.
- `scripts/`, `tests/`: local server, build, checks, logic and Chromium tests.

## Demo boundaries

Six selectable skills, prepared fictional customer data, and a goal label of 1–160 characters. The goal does not invoke an AI or change the example into a different domain. Missing prerequisites are shown as blocked steps. CRM requires email, record lookup and approval. Approval pauses until a visitor explicitly chooses to continue. Replay, reset and configuration changes cancel earlier playback. Reduced motion avoids travelling pulses and accelerates state transitions. Input lives only in memory; the demo makes no external requests or browser-storage writes.

Sales links use the booking URL already present in the original project. No booking widget, external fonts, analytics or fake contact submission is included.

## Languages

The website and interactive demo support English and German. A same-origin request to Cloudflare's `/cdn-cgi/trace` selects German for `loc=DE` and English for other countries, regardless of browser language. No third-party geolocation service, location permission, cookies or browser storage are used. If the request fails, returns an unknown country or exceeds 1.5 seconds, the primary browser language is used (German or English). VPN/proxy exit locations determine the detected country.

The header's DE / EN controls override automatic detection using `?lang=de` or `?lang=en`. This choice is preserved when navigating between the homepage and legal page. Remove `lang` from the URL to return to automatic detection. Without JavaScript, the static English content remains available. Translation copy lives in `assets/js/translations.mjs`.

Checks include Germany with an English browser, foreign countries with a German browser, explicit overrides, failed/invalid/stalled lookups, translated approval playback, legal navigation and German layouts at 320, 390, 768 and 1440 pixels.

## Publication

Published through the existing GitHub Pages root deployment from `main`. `CNAME` remains `golius.de`. The initial redesign was published as commit `1d672f6` with explicit authorization to preserve its existing content, including the marked legal placeholders. See [the implementation and deployment report](docs/REDESIGN-REPORT.md) for the original checks, screenshots, publishing steps, baseline and rollback. Cloudflare Access settings are separate from GitHub Pages publication.
