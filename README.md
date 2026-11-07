# Kasual Labz website

A lightweight static landing page for **Kasual Labz**, the development team under NF Projects. The site includes approved public project information and does not link to private repositories or reveal confidential development details.

## Project layout

The deployable static website is in `site/`:

- `index.html` contains homepage content, SEO/social metadata, the Projects board, and the Kasquatch launch announcement toast.
- `projects/kasquatch/index.html` is the dedicated Kasquatch token page, including concise tokenomics facts, a token-ID copy control, and the live-tracking dashboard.
- `styles.css` contains the responsive visual system, toast, project cards, tokenomics and tracker cards, focus states, and reduced-motion behavior.
- `script.js` contains mobile navigation, the one-time-per-session launch toast, token-ID copy feedback, and footer year update.
- `kasquatch-live.js` is loaded only on the Kasquatch page. It reads token-specific KCC-20/market data, verified chart candles, and a signed KAS/USD feed from the public Kascov API. It refreshes every 30 seconds, reports unavailable data instead of simulating it, handles retry responses, and adds no dependency or backend.
- `assets/` contains supplied Kasual Labz and Kasquatch artwork. The transparent Kasquatch main logo is used as the featured token artwork. The dedicated page uses an optimized crop of the supplied forest poster as a quiet backdrop.
- `favicon.png`, `robots.txt`, `sitemap.xml`, and `manus-routes.json` support browser identity and discoverability.

`plan.md` records the design and implementation approach. `TODO.md` tracks delivery outcomes. `app.config.ts` stores the durable project-logo URL required by the managed workspace.

## Local preview

No package installation is required. From the repository root, run:

```bash
python3 -m http.server 3000 --directory site
```

Then open `http://localhost:3000` and `http://localhost:3000/projects/kasquatch/`. Stop the server with `Ctrl+C`.

## Editing the site

Update page copy in the relevant HTML file; keep public-facing copy in HTML rather than in images. Update layout and colors in `site/styles.css`. Keep `prefers-reduced-motion` support when adding motion. Assets supplied for Kasual Labz and Kasquatch are stored in `site/assets/`; preserve their proportions, transparency, and visual treatment.

The homepage announcement uses `sessionStorage` so it is shown at most once per browser session, whether it times out or is dismissed. Keep the route manifest synchronized with actual pages. After edits, check desktop and mobile layouts, internal navigation, the Kasseal token URL, the verified Kasquatch X profile, `mailto:contact@kasuallabz.xyz`, and the existing Kasual Labz X link. Tokenomics copy uses the approved fixed project facts; changing fees or supply requires source verification. The live dashboard keeps curve progress separate from spot price, uses verified Kascov candle and token data, and displays USD only when its signed KAS/USD feed passes freshness and signature checks. Missing metrics must remain “Data temporarily unavailable.” Keep price motion tied to actual source-value changes and test chart ranges, reduced motion, API failures, and mobile overflow.

## GitHub Pages deployment

`.github/workflows/deploy-pages.yml` publishes the committed `site/` directory whenever `main` changes. The approved Kasquatch update was fast-forwarded to `main` at commit `effc1bc`; GitHub Pages workflow run #4 succeeded. The primary domain and Kasquatch route are live over HTTPS, and `www.kasuallabz.xyz` redirects to the primary domain. Future production changes still require owner approval and should be reviewed on a feature branch first.

The workflow uses GitHub’s official Pages actions and uploads only the static website, with no build-time secrets or credentials. GitHub Pages must be enabled once for the repository with the **GitHub Actions** publishing source; each later push to `main` deploys automatically.

## Cloudflare DNS custom domain

Cloudflare is used only as the authoritative DNS provider. Any future domain work must inspect and record existing DNS first, then change only records required to connect the website. Preserve Cloudflare Email Routing and every MX, SPF, DKIM, DMARC, email-verification, and unrelated record. Do not change nameservers, registrar settings, account access, billing, or credentials.

## Rollback

Use Git history to identify the relevant source commit. Revert it with a normal new commit and follow the approved deployment process; do not force-push or delete deployment history or DNS records as a rollback mechanism.
