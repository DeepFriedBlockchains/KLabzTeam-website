# Kasual Labz website

A lightweight static landing page for **Kasual Labz**, the development team under NF Projects. The site includes approved public project information and does not link to private repositories or reveal confidential development details.

## Project layout

The deployable static website is in `site/`:

- `index.html` contains homepage content, SEO/social metadata, the Projects board, and the Kasquatch launch announcement toast.
- `projects/kasquatch/index.html` is the dedicated Kasquatch token page, including concise tokenomics facts, a token-ID copy control, and the live-tracking dashboard.
- `projects/kasquatch/merch/index.html` is the separate Kasquatch merchandise concept gallery, linked from the token page.
- `styles.css` contains the responsive visual system, toast, project cards, donation dialog, tokenomics and tracker cards, focus states, and reduced-motion behavior.
- `script.js` contains mobile navigation, the one-time-per-session launch toast, token-ID copy feedback, and footer year update.
- `donation.js` is loaded only by the homepage and controls the accessible five-currency donation dialog, local wallet selection, copy feedback, and QR display. It makes no third-party requests and connects no wallets.
- `donation-wallets.json` stores the five user-supplied public addresses (BTC, ETH, ZEC, KAS, SOL), corresponding networks, local logos and QR file paths. These addresses are intentionally public wallet destinations, not credentials.
- `kasquatch-live.js` is loaded only on the Kasquatch page. It reads token-specific KCC-20/market data, verified chart candles, and a signed KAS/USD feed from the public Kascov API. It refreshes every 30 seconds, reports unavailable data instead of simulating it, handles retry responses, and adds no dependency or backend.
- `merchandise.js` is loaded only on the Kasquatch page. It filters the supplied made-to-order concept gallery, opens larger image previews and a request form, then creates an email draft to `contact@kasuallabz.xyz`. There is no request backend; visitors must send the draft themselves, and the site does not confirm orders.
- `assets/merch/` contains optimized local WebP copies of the supplied product mockups. The collection collage is displayed as a preview only, not as a requestable item.
- `assets/` contains supplied Kasual Labz and Kasquatch artwork plus local donation-network SVG logos and generated QR codes. The transparent Kasquatch main logo is used as the featured token artwork. The dedicated page uses an optimized crop of the supplied forest poster as a quiet backdrop.
- `tools/generate-donation-qr.py` regenerates the local QR SVGs from `site/donation-wallets.json`; its pinned Python dependency is build-time only and is not loaded by the website.
- `favicon.png`, `robots.txt`, `sitemap.xml`, and `manus-routes.json` support browser identity and discoverability.

`plan.md` records the design and implementation approach. `TODO.md` tracks delivery outcomes. `app.config.ts` stores the durable project-logo URL required by the managed workspace.

## Local preview

No package installation is required. From the repository root, run:

```bash
python3 -m http.server 3000 --directory site
```

Then open `http://localhost:3000`, `http://localhost:3000/projects/kasquatch/`, and `http://localhost:3000/projects/kasquatch/merch/`. Stop the server with `Ctrl+C`.

To regenerate donation QR files after an address change, update `site/donation-wallets.json` and run `python3 -m pip install -r tools/requirements-donation-qr.txt`, then `python3 tools/generate-donation-qr.py`. Use `python3 tools/generate-donation-qr.py --check` to verify the saved QR files match the configured addresses. A missing or placeholder wallet must have `configured: false` and no QR will be generated for it; do not add credentials or private keys.

## Editing the site

Update page copy in the relevant HTML file; keep public-facing copy in HTML rather than in images. Update layout and colors in `site/styles.css`. Keep `prefers-reduced-motion` support when adding motion. Assets supplied for Kasual Labz and Kasquatch are stored in `site/assets/`; preserve their proportions, transparency, and visual treatment.

The made-to-order gallery is in `site/projects/kasquatch/merch/index.html`; the shared navigation links to both the token page and gallery. Each requestable `.merch-card` has a `data-category`, `data-design`, `data-item-type`, and local optimized image. Use the existing category IDs in `site/merchandise.js`; empty categories are hidden automatically. Add future product cards with an existing category value and they will appear under that filter. Current supplied mockups are individual product cards; keep multi-item collage artwork out of the gallery. The form uses a `mailto:` email draft, not a backend. Do not describe opening the draft as a submitted or confirmed order. The token page groups its Kasseal, Tokenomics, and Merchandise actions responsively to prevent mobile overlap.

The homepage donation modal is in `site/index.html` and `site/donation.js`. Its top-nav Donate entry closes the mobile menu, scrolls to the footer, and opens the dialog. The Kasquatch token and merchandise pages keep a matching Donate pill; it returns to the homepage and opens the same dialog. The two Kasquatch destination buttons share equal dimensions while Donate retains its separate pill styling. To change static wallet data, edit `site/donation-wallets.json`, regenerate and verify the corresponding QR SVGs using the tool above, and preview the modal at phone and desktop sizes. Keep QR files local; do not add an external QR service, wallet connection, or payment processor. The Kaspa icon's attribution and CC BY-SA 4.0 license, along with source notes for other network marks, are shown in the modal's expandable logo-information note.

The homepage announcement uses `sessionStorage` so it is shown at most once per browser session, whether it times out or is dismissed. Keep the route manifest synchronized with actual pages. After edits, check desktop and mobile layouts, internal navigation, the Kasseal token URL, the verified Kasquatch X profile, `mailto:contact@kasuallabz.xyz`, and the existing Kasual Labz X link. Tokenomics copy uses the approved fixed project facts; changing fees or supply requires source verification. The live dashboard keeps curve progress separate from spot price, uses verified Kascov candle and token data, and displays USD only when its signed KAS/USD feed passes freshness and signature checks. Missing metrics must remain “Data temporarily unavailable.” Keep price motion tied to actual source-value changes and test chart ranges, reduced motion, API failures, and mobile overflow.

## GitHub Pages deployment

`.github/workflows/deploy-pages.yml` publishes the committed `site/` directory whenever `main` changes. The approved Kasquatch update was fast-forwarded to `main` at commit `effc1bc`; GitHub Pages workflow run #4 succeeded. The primary domain and Kasquatch route are live over HTTPS, and `www.kasuallabz.xyz` redirects to the primary domain. Future production changes still require owner approval and should be reviewed on a feature branch first.

The workflow uses GitHub’s official Pages actions and uploads only the static website, with no build-time secrets or credentials. GitHub Pages must be enabled once for the repository with the **GitHub Actions** publishing source; each later push to `main` deploys automatically.

## Cloudflare DNS custom domain

Cloudflare is used only as the authoritative DNS provider. Any future domain work must inspect and record existing DNS first, then change only records required to connect the website. Preserve Cloudflare Email Routing and every MX, SPF, DKIM, DMARC, email-verification, and unrelated record. Do not change nameservers, registrar settings, account access, billing, or credentials.

## Rollback

Use Git history to identify the relevant source commit. Revert it with a normal new commit and follow the approved deployment process; do not force-push or delete deployment history or DNS records as a rollback mechanism.
