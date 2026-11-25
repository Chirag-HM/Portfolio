# Chirag H M — Full-Stack & AI Developer Portfolio

An editorial, high-performance personal portfolio showcasing AI-integrated applications, full-stack systems, and IoT tools. Built with React, Vite, TypeScript, Tailwind CSS v4, React Three Fiber / Three.js, GSAP, and Lenis smooth scrolling.

---

## Highlights

- **3D Immersive Scenes (Lazy-Loaded)**:
  - **Stack Pedestal (`#stack`)**: Procedural particle sculptures (25,000 particles) representing Frontend, Backend, AI & APIs, and IoT with smooth geometric morphing, interactive group cycling, and orbital controls.
  - **Projects Crystal Gallery (`#projects`)**: Irregular faceted glass crystals with transmission, chromatic dispersion, interior project screenshots, floating HUD telemetry, and an inspectable detail panel.
  - **Moonlit Mountain Finale (`#contact`)**: Noise-displaced low-poly snow peaks, exponential graphite fog, starfield, glowing alpine hut, and an expanding signal beacon on camera approach.
- **Single-Canvas Architecture & Arbitration (`SceneSlot`)**:
  - Exactly **one** active WebGL canvas is mounted in the DOM at any given time.
  - Centralized scroll/overlap arbitration activates scenes based on viewport proximity and unmounts distant stages cleanly to eliminate GPU memory leaks.
- **Full Classic Fallback Parity**:
  - Seamless fallback for low-end hardware, narrow touch screens, `prefers-reduced-motion`, or users opting into Classic mode via the persistent mode toggle (`?mode=classic` / localStorage).
  - Sticky project cards, grouped skill chips with live note previews, and editorial typography.
- **Dedicated Routes**:
  - `/` — Interactive landing journey (Hero, Marquee, About, Services, Stack, Projects, Contact).
  - `/projects/:slug` — Deep-dive case studies (AI Smart Vision, Campus Placement Portal, DSA Solver Extension, Study Tools Automation) with metrics, problem breakdown, technical decisions, and learnings.
  - `/play` — 3D Plaza explore mode preview.
  - `*` — Accessible 404 page with navigation recovery.
- **Production-Ready SEO & Performance**:
  - Pre-rendered `robots.txt` and `sitemap.xml` with absolute URLs.
  - Injected `schema.org/Person` JSON-LD structured data.
  - Non-blocking Google Fonts loading strategy (`preload` + `onload`).
  - Web App Manifest (`site.webmanifest`) and standard 1200×630 Open Graph sharing assets.

---

## Tech Stack

- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, CSS Variables, Kanit + JetBrains Mono typography
- **Motion & Interaction**: Framer Motion, GSAP + ScrollTrigger, Lenis smooth scrolling
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Quality & Testing**: Playwright visual regression suite, Oxlint, TypeScript strict mode

---

## Getting Started

```bash
# Install dependencies
npm install

# Start local development server (http://localhost:5173)
npm run dev

# Run Oxlint linter
npm run lint

# Typecheck and build production bundle -> dist/
npm run build

# Preview production build locally (http://localhost:4173)
npm run preview

# Run comprehensive visual test across viewports & canvas invariants
npm run shot -- --canvas
```

---

## Content Configuration

All site content is decoupled from components and managed in `src/data/`:

- `src/data/config.ts`: Personal identity, social URLs, bio copy, section headings, and `SITE_URL`.
- `src/data/projects.ts`: Project details, case study narratives, tech stacks, and live/repo links.
- `src/data/skills.ts`: Skill categories, technology items, and contextual experience notes.
- `src/data/services.ts`: Core offerings and architectural specializations.

---

## Deployment

The repository includes a ready-to-deploy `vercel.json` configured for Vite SPA routing rewrites and immutable asset caching:

```bash
# Deploy to Vercel production
npx vercel --prod
```
