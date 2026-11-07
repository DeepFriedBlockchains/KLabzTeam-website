# Kasual Labz website plan

## Approved scope

Maintain the lightweight, static Kasual Labz website at `https://kasuallabz.xyz`. Kasual Labz is the development team under NF Projects. Preserve the existing homepage, About, Focus, Contact, SEO, and accessibility content while adding a featured Kasquatch ($KSQT) project card, two additional concise project listings, a one-time launch toast, and the dedicated `/projects/kasquatch/` page.

The public Kasquatch page describes it as a community-driven KCC-20 meme token launched on Kaspa through Kasseal. It displays only token facts verified at the official Kasseal launch page and links to Kasseal and the Kasquatch X profile linked from that page. No market or token statistics are embedded. The NFP-XTMMiner and Kaspa Fork listings use only the status and short descriptions provided for this update; the Kaspa Fork remains intentionally minimal and does not reveal a private name, technical detail, repository, progress, or documentation.

The site remains static: no account system, database, contact-form backend, analytics, paid APIs, or additional service dependencies. Implement and preview this change on a feature branch. Do not merge it into the production branch or deploy it without explicit approval. Do not change DNS, account access, billing, or unrelated services.

## Design direction

**Design movement — Obsidian systems atelier with moonlit wilderness accents.** Retain the existing dark editorial technology-studio aesthetic and use the supplied Kasquatch wilderness artwork and transparent mascot logo to introduce the project without replacing the Kasual Labz brand.

**Core principles.** Keep the parent studio identity intact, feature the supplied Kasquatch logo prominently, present statuses clearly, and keep page content legible and restrained.

**Color philosophy.** Near-black and blue-black surfaces retain the existing site identity. Mint-teal frames interactive and live signals. Silver-white copy remains readable against dark forest artwork.

**Layout paradigm.** Keep the existing editorial homepage layout. Present the Projects board as a consistent responsive stack of cards, with Kasquatch first and visually featured. Give the dedicated token page a full-width wilderness image backdrop, centered transparent main logo, and a readable token-facts section.

**Signature elements.** Reuse the Kasquatch mascot and wilderness banner; use compact status labels and thin teal rules aligned with the existing studio styling.

**Interaction philosophy.** All navigation, card links, and external actions lead to meaningful destinations. The launch toast never captures focus, is dismissible, and does not block page interaction.

**Animation.** The announcement appears after approximately 1.5 seconds and fades/slides in, then disappears after eight seconds. It appears at most once per browser session, including if dismissed. Reduced-motion preferences disable its transition. Existing site animation behavior and reduced-motion support remain intact.

**Typography system.** Retain the site's local system sans-serif stack, oversized compact headings, readable body copy, and tracked uppercase labels.

**Brand essence.** Kasual Labz is the practical experimental studio under NF Projects; the Kasquatch token page is one public project in its workbench. Personality: exploratory, precise, grounded.

**Brand voice.** Direct, playful for Kasquatch, and bounded by verified facts. Example headline: “KASQUATCH — HODL THE LEGEND!” Example action: “View on Kasseal.”

**Wordmark and logo.** Keep the supplied Kasual Labz wordmark as the site header identity. Use the supplied transparent Kasquatch main logo as the primary featured token artwork, preserving its proportions and transparency.

**Signature brand color.** The existing Kasual Current mint-teal remains the studio's ownable color.

## Implementation and project structure

Use semantic HTML, custom CSS, and the existing vanilla JavaScript. No new dependency is needed. The JavaScript handles the accessible mobile navigation, session-scoped toast, and current year. Content, links, and token data remain in HTML. CSS controls card layout, project-page presentation, responsiveness, focus states, and reduced motion.

```text
site/
├── index.html                         # Homepage, Projects board, announcement
├── projects/kasquatch/index.html      # Dedicated token page
├── styles.css                         # Responsive site, card, toast and project styles
├── script.js                          # Mobile navigation, toast and footer year
├── manus-routes.json                  # Homepage and project-page routes
└── assets/
    ├── kasual-labz-wordmark.webp
    ├── kasual-k-mark.webp
    ├── obsidian-peaks.webp
    ├── kasquatch-main-logo.png         # Supplied transparent token logo
    ├── kasquatch-forest-backdrop.webp    # Optimized supplied forest artwork
    └── kasquatch-forest-poster.png     # Supplied forest poster
```

The existing GitHub Pages workflow publishes the static `site/` folder from `main`; this task must remain on a feature branch and not trigger that production workflow.
