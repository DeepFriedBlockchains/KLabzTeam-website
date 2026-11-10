# Kasual Labz website plan

## Approved scope

Maintain the lightweight, static Kasual Labz website at `https://kasuallabz.xyz`. Kasual Labz is the development team under NF Projects. Preserve the existing homepage, About, Focus, Contact, SEO, and accessibility content while adding a featured Kasquatch ($KSQT) project card, two additional concise project listings, a one-time launch toast, and the dedicated `/projects/kasquatch/` page.

The public Kasquatch page describes it as a community-driven KCC-20 meme token launched on Kaspa through Kasseal. Its concise Tokenomics facts are Total Supply 1.20 Billion KSQT, Supply Control Sealed at Genesis, Bonding Curve KAS/KSQT, Launchpad Kasseal, Creator Fee 0.50%, Bonding Curve Fee 0.50%, and Pool Fee 0.05%, followed by the requested Kasseal market/trading note. A live dashboard reads token-specific curve progress, spot price, verified candles, holder count, and volume from Kascov's public API, and derives USD values only from its valid signed KAS/USD feed. Progress and spot price remain separate fields. Unavailable or unsupported values are never simulated; the dashboard reports temporary unavailability and the last update time. Market cap is derived as spot × supply and labelled as such if shown. The page continues to link to Kasseal and the Kasquatch X profile linked from that page. The NFP-XTMMiner and Kaspa Fork listings use only the status and short descriptions provided for this update; the Kaspa Fork remains intentionally minimal and does not reveal a private name, technical detail, repository, progress, or documentation.

The site remains static: no account system, database, contact-form backend, analytics, paid APIs, or additional runtime dependencies. The page-only vanilla script reads the public Kascov API, refreshes every 30 seconds (the API advertises a 15-second browser cache and a 30-second shared cache), respects Retry-After when provided, and handles service failures without fabricated numbers.

For the homepage donation section, add a small “Support Kasual Labz” footer button that opens a compact accessible modal with the exact supplied support message. Offer Bitcoin (BTC), Ethereum (ETH), ZCash (ZEC), Kaspa (KAS), and Solana (SOL), showing each supplied wallet address, its corresponding network, a local currency logo, a QR code encoding that exact address, and a one-click copy action with brief feedback. The Ethereum address was supplied after the initial four options and is included as a fifth option. Store addresses as configurable static data. Missing addresses must not produce functional copy buttons or QR codes. Generate QR assets offline from that configuration; do not add wallet connection, payment processing, a backend, a database, or a third-party runtime request. Load the donation interaction only on the homepage, keep all existing project pages and other sections unchanged, and preserve the current dark theme. Build and verify a preview before publishing to the live website, as requested.

## Design direction

**Design movement — Obsidian systems atelier with moonlit wilderness accents.** Retain the existing dark editorial technology-studio aesthetic and use the supplied Kasquatch wilderness artwork and transparent mascot logo to introduce the project without replacing the Kasual Labz brand.

**Core principles.** Keep the parent studio identity intact, feature the supplied Kasquatch logo prominently, present statuses clearly, and keep page content legible and restrained.

**Color philosophy.** Near-black and blue-black surfaces retain the existing site identity. Mint-teal frames interactive and live signals. Silver-white copy remains readable against dark forest artwork.

**Layout paradigm.** Keep the existing editorial homepage layout. Present the Projects board as a consistent responsive stack of cards, with Kasquatch first and visually featured. Give the dedicated token page a full-width wilderness image backdrop, centered transparent main logo, and readable token facts followed by a scannable tokenomics section, with an in-page jump link for quick access.

**Signature elements.** Reuse the Kasquatch mascot and wilderness banner; use compact status labels and thin teal rules aligned with the existing studio styling.

**Interaction philosophy.** All navigation, card links, and external actions lead to meaningful destinations. The launch toast never captures focus, is dismissible, and does not block page interaction. Keep the token-ID copy action with status feedback; add accessible chart-range controls and a progress meter with current data announced clearly. The homepage donation modal is keyboard-operable, dismissible, and supports switching among the configured coins; copy feedback is announced accessibly.

**Animation.** The announcement appears after approximately 1.5 seconds and fades/slides in, then disappears after eight seconds. It appears at most once per browser session, including if dismissed. Live progress animates only when the verified percentage changes; price feedback flashes mint or red only when the verified spot actually moves. Reduced-motion preferences disable or minimize these transitions. Existing site animation behavior and reduced-motion support remain intact.

**Typography system.** Retain the site's local system sans-serif stack, oversized compact headings, readable body copy, and tracked uppercase labels.

**Brand essence.** Kasual Labz is the practical experimental studio under NF Projects; the Kasquatch token page is one public project in its workbench. Personality: exploratory, precise, grounded.

**Brand voice.** Direct, playful for Kasquatch, and bounded by verified facts. Example headline: “KASQUATCH — HODL THE LEGEND!” Example action: “View on Kasseal.”

**Wordmark and logo.** Keep the supplied Kasual Labz wordmark as the site header identity. Use the supplied transparent Kasquatch main logo as the primary featured token artwork, preserving its proportions and transparency.

**Signature brand color.** The existing Kasual Current mint-teal remains the studio's ownable color.

## Implementation and project structure

Use semantic HTML, custom CSS, and vanilla JavaScript. No new website runtime dependency is needed. The global script handles accessible mobile navigation, the session-scoped toast, token-ID copy feedback, and current year. `donation.js` is loaded only on the homepage and controls the modal; `donation-wallets.json` is its configurable static source of truth, also read by the offline QR generator. Five generated local QR SVG assets and five local brand-logo SVGs are stored under `site/assets/donations/`. The `qrcode==8.2` Python package is pinned only for this offline build task and is not loaded on the website. `kasquatch-live.js` remains loaded only on the dedicated Kasquatch page. CSS controls the existing layout, dashboard, donation modal, responsiveness, focus states, and reduced motion.

```text
site/
├── index.html                         # Homepage, Projects board, announcement
├── donation.js                        # Homepage-only donation modal and copy controls
├── donation-wallets.json              # Public, configurable donation wallets and labels
├── projects/kasquatch/index.html      # Dedicated token page
├── kasquatch-live.js                  # Token-page-only live KCC-20 market tracker
├── styles.css                         # Responsive site, card, toast and project styles
├── script.js                          # Mobile navigation, toast and footer year
├── manus-routes.json                  # Homepage and project-page routes
└── assets/
    ├── kasual-labz-wordmark.webp
    ├── kasual-k-mark.webp
    ├── obsidian-peaks.webp
    ├── kasquatch-main-logo.png         # Supplied transparent token logo
    ├── kasquatch-forest-backdrop.webp  # Optimized supplied forest artwork
    └── donations/                     # Five local network SVGs and five QR SVGs
tools/
├── generate-donation-qr.py             # Offline static QR generator (development only)
└── requirements-donation-qr.txt        # Pinned build-time-only QR dependency
```

The existing GitHub Pages workflow publishes the static `site/` folder from `main`. Keep the donation changes isolated, review them in a feature-branch preview, and only publish after the requested behavior is verified.
