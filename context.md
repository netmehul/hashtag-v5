# HASHTAG Eventz — Project Handover Context

## Project overview

This repository contains the client-side website for **HASHTAG Eventz**, an events and brand-experience company. The app is built with React and TypeScript using Vite. Its current Home experience is a long-form visual landing page: dark video-reveal hero, light image gallery, light video showreel, animated About section, pinned “What We Do” showcase, and a testimonials board. A shared animated footer follows route content on every page.

The Home page is substantially more developed than the other routes. About, Projects, Clients, and Contact routes exist, but three are placeholders and About content is also present as a richer Home section. This is still a static front-end: no API, CMS, contact submission, authentication, or persistent app data is wired up.

## Stack and commands

- React 19, TypeScript 5.9
- Vite 8
- Tailwind CSS 4
- React Router 7
- Three.js for the hero, galleries, service showcase, and 3D models
- GSAP with ScrollTrigger and Flip, plus `@gsap/react`
- Lenis for smooth scrolling
- Geist Variable (npm package) and local Season Sans trial font assets

```bash
npm install
npm run dev       # Vite development server
npm run build     # TypeScript build + production bundle
npm run lint      # ESLint
npm run preview   # Serve dist/
```

### Latest verification

The last recorded `npm run build` succeeded before the current Footer/FooterGlow additions. That build emitted a 1,080.77 kB minified JavaScript chunk (311.27 kB gzip), above its 500 kB advisory threshold; rebuild to verify the current bundle.

The last recorded `npm run lint` failed with three React Hooks diagnostics:

- `src/components/Navbar.tsx:20`: synchronous state update inside the route-change effect (`react-hooks/set-state-in-effect`).
- `src/components/providers/GalleryGL.tsx:112` and `:114`: refs updated during render (`react-hooks/refs`).

No test script or test files are currently present. Re-run checks after changes; these findings describe the last observed run, not necessarily future state.

## Information architecture and routes

`src/App.tsx` creates a `BrowserRouter`, renders the shared `Navbar`, matched route content, and then the shared `Footer`:

| Route | Component | Current contents |
|---|---|---|
| `/` | `src/pages/Home.tsx` | Hero, Gallery, WorkShowcase, About section, What We Do, Testimonials |
| `/about-us` | `src/pages/About.tsx` | Minimal About page |
| `/projects` | `src/pages/Projects.tsx` | Placeholder heading |
| `/clients` | `src/pages/Clients.tsx` | Placeholder heading |
| `/contact-us` | `src/pages/Contact.tsx` | “Start Project” heading |

There is no not-found route; unmatched locations show the shared navbar and footer without page content.

**Known route mismatch:** Navbar links currently use `/about` and `/contact`; the router only registers `/about-us` and `/contact-us`. Projects and Clients paths match. Align paths or intentionally add aliases.

The global footer uses the registered `/about-us` and `/contact-us` destinations, so its About and Contact links do not share the Navbar's current mismatch.

## Current Home page flow

`src/pages/Home.tsx` renders these sections in order:

1. **Hero** — black/dark brand title and “Eventz” subtitle with an interactive video-reveal effect.
2. **Gallery** — nine image tiles in a responsive bento layout.
3. **Work in motion** — a separate 3D cylindrical showreel containing eight video entries.
4. **About** — animated company statement, animated numerical metrics, and an interactive 3D abstract model.
5. **What We Do** — a pinned showcase of six services, with scroll-synchronized imagery, service navigation, floating labels, and a reflective 3D object.
6. **Testimonials** — a responsive board of quote cards that animate into view and can be dragged on desktop.

`Home.tsx` uses GSAP ScrollTriggers to transition the page theme from dark at the hero to the light theme through Gallery and WorkShowcase, then back to dark at About. What We Do and Testimonials follow in the dark theme. The light colors come from the CSS theme tokens in `src/index.css`. The fade switches to threshold behavior when reduced motion is requested.

### Hero reveal

`src/components/Home/Hero.tsx` renders a fluid-size Season Sans “Hashtag” heading and Geist “Eventz” subtitle. It configures `BurnReveal` with `/videos/hero-burn.mp4`, radius 360, and decay 0.5.

`src/components/Home/BurnReveal.tsx` uses a transparent Three.js canvas, shader noise, a CPU-side heat grid, and a spring-following pointer to reveal a looping muted video underneath. The heat trail fades behind the pointer. The effect resizes with the section and pauses its video when not visible. Reduced motion suppresses the automatic wandering behavior on non-hover devices; it does not disable pointer interaction.

The `font-season` theme face currently points to `/fonts/SeasonSans/SeasonSans-TRIAL-Heavy.woff2` at weight 900, while the hero requests Tailwind `font-bold` (700). `SeasonSans-TRIAL-Bold.woff2` exists but is not the registered face. Choose the intended weight and align the font-face URL/weight with the CSS utility. These are trial-named font files; confirm the license is suitable before production.

### Gallery tiles

`src/components/Home/Gallery.tsx` owns the nine static gallery items, selection state, keyboard handling, and grid presentation. The images are `/GalleryAssets/01.webp` through `/GalleryAssets/09.webp`.

- At rest, images appear in a two-column mobile / 12-column desktop bento grid with title/category labels on hover.
- Selecting an image expands it into a featured stage and reveals a caption panel with category, title, description, item progress, previous/next, and close controls.
- Previous/Next buttons and Left/Right Arrow keys cycle through items; Escape closes the active selection.
- GSAP Flip animates tile geometry; ScrollTrigger animates the heading. Reduced motion disables the Flip duration and smooth auto-scroll.

`src/components/providers/GalleryGL.tsx` puts all tiles into one WebGL canvas. Its shader creates an organic pointer-driven grayscale-to-color reveal, lens distortion, scroll-velocity bend/RGB split, and staggered intro. On touch/coarse-pointer devices or WebGL failure/context loss/total texture-load timeout, the component falls back to regular `<img>` rendering. The source currently also updates `activeRef` and `failRef` during render, which ESLint flags.

### Video showreel

`src/components/Home/WorkShowcase.tsx` displays the separate `workData` carousel as a curved, perspective cylinder. It supports pointer drag/swipe with momentum, Previous/Next controls, and Left/Right Arrow keys. Clicking a non-centered video brings it to center; clicking the centered video toggles playback. Only the active video is intended to play while the section is visible; it is muted, looping, inline, and uses `preload="none"`. It respects reduced motion by disabling auto-play/transition movement.

The eight entries are defined in `src/data/workData.ts`, with title, category, year, location, description, video URL, poster URL, slug, featured flag, and tags. The video files exist in `public/WorkAssets/`. The `image` poster URLs point under `/images/work/`, but those poster files were not present in the current public-file inventory; verify/provide them or update those URLs.

### About section and 3D model

`src/components/Home/Aboutsection.tsx` includes the company statement, four displayed metrics, and `ModelViewer`. GSAP animations reveal the statement word-by-word, count metrics upward, draw rules, and rotate a decorative hash; animations are scoped to no-preference for reduced motion.

The current metrics are `13+ Years of experience`, `4000+ Successful events`, `40+ Brand collaborations`, and `30+ Daily order from customer`. Treat these as supplied copy/data and confirm factual accuracy and wording with the project owner.

`src/components/providers/ModelViewer.tsx` loads `/model/abstract_shape.glb` into a transparent Three.js scene with studio environment lighting and a red rim light. The model can auto-rotate, tilt toward pointer movement, react to scroll position, and be dragged/flung. It pauses its animation loop while offscreen and removes listeners/render resources on unmount.

## Testimonials

`src/components/Home/Testimonials.tsx` renders after What We Do. It builds a responsive one-, two-, or three-column board of testimonial notes using GSAP/ScrollTrigger entrance animations. On desktop devices with a fine pointer, notes become draggable within the board after their entrance animation completes. Reduced-motion preferences suppress the entrance motion.

`src/data/testimonials.ts` defines the `Testimonial` shape and five current entries. Each entry has a quote, name, role, and company. Optional image and video fields are supported; videos play muted on hover and can be toggled by tap on touch screens. The current entries have no enabled media, and the file explicitly identifies all testimonial copy and identity details as placeholder content that must be replaced with approved real material before publication.

## What We Do service showcase

`src/components/Home/WhatWeDo.tsx` renders after About. Its six service records (title, description, image, two tags, and optional tag colors) are defined in `src/data/whatWeDo.ts`; the images live under `public/images/whatWeDo/`.

- On desktop, a service list accompanies the image stage; on mobile, the current title and a row of labeled progress buttons provide navigation.
- The section is pinned while scrolling through the services. Scroll progress selects the active service and snaps gently to service positions, leaving small entry and exit zones unsnapped.
- Arrow keys move between services. Navigation buttons scroll to the requested service using GSAP ScrollTo.
- `src/components/providers/ServiceCanvas.tsx` draws the photos in a WebGL shader with an organic transition between adjacent images, pointer-responsive lens distortion, and subtle parallax.
- Two animated tags overlay the image, and a reflective torus-knot shape changes with the active service. The WebGL render loop runs only while the canvas is near the viewport; coarse pointers use lower-detail geometry and do not drive the hover interaction.
- If WebGL renderer creation fails, `WhatWeDo` switches to a plain image crossfade. Individual texture-load failures are logged by `ServiceCanvas`.

## Shared navigation and CTAs

`src/components/Navbar.tsx` renders a fixed header with `/logoIcon.svg`, desktop links, and a mobile dropdown:

- It hides when scrolling down beyond the first 80px and reappears when scrolling up; scroll handling is throttled with `requestAnimationFrame`.
- The mobile menu closes on route changes, scroll down, and Escape; the burger exposes `aria-expanded` and `aria-controls`, and closed mobile links have `tabIndex=-1`.
- The About link points to `/about` and the “Start a Project” CTA points to `/contact`, both currently mismatched with registered routes.
- The route-change effect synchronously sets state and is the current navbar lint error.

`src/components/CTAButton.tsx` renders an internal React Router link, external anchor, or native button. It supports `primary`/`secondary`/`ghost`, `sm`/`md`/`lg`, `fit`/`full`, and optional arrow icon. CTA styles and reduced-transition support are in `src/index.css`.

## Global footer

`src/components/Footer.tsx` is rendered after `Routes` in `src/App.tsx`, so it appears on all routes, including pages that are otherwise placeholders. It currently provides:

- A marquee of the six services, whose direction and speed respond to scroll velocity while the footer is visible.
- A “Got a bold idea?” CTA with a rotating SVG text ring, magnetic pointer response, and link to `/contact-us`.
- A responsive information grid with tagline, route links, service names, and live local clocks for Dubai, Abu Dhabi, and Doha.
- Optional email, phone, and social links. These are currently empty/unconfigured and therefore hidden.
- A large outlined HASHTAG EVENTZ wordmark with a cursor-following red spotlight, current-year copyright, and back-to-top button.
- Scroll-triggered reveals and subtle parallax; these motion effects are skipped when reduced motion is requested.

`src/components/providers/FooterGlow.tsx` draws the footer background using a low-resolution Three.js shader: drifting red clouds, film grain, and a pointer-following glow. Its render loop runs only while the footer is near/in view and stops animating under reduced motion. If WebGL setup fails, the component exits without an overlay and the footer stays plain black.

## Metadata, assets, and styling

- `index.html` sets the title to **HASHTAG Eventz**, uses `/logoIcon.svg` as favicon, and sets Open Graph and Twitter title/description/image metadata.
- Social image: `/og-image.jpg`. These are root-relative URLs; social crawlers generally need absolute URLs, so set the canonical production origin if/when it is known.
- Hero video: `public/videos/hero-burn.mp4`; an additional `raw_hero-burn.mp4` is present but its usage is unconfirmed.
- Gallery images: `public/GalleryAssets/`.
- Showreel videos: `public/WorkAssets/`.
- What We Do images: `public/images/whatWeDo/` (six service photos).
- Footer contact email, phone, and social links are not configured; set these in `src/components/Footer.tsx` when approved details are available.
- 3D model: `public/model/abstract_shape.glb`.
- Brand assets: `public/logoIcon.svg`, `public/logoFull.svg`, `public/favicon.svg`, `public/icons.svg`.
- Season Sans files: `public/fonts/SeasonSans/`; Geist comes from `@fontsource-variable/geist`.
- `src/index.css` defines Tailwind theme colors, font tokens, global reset, and CTA styles. Body defaults are black/white; Home changes theme tokens as it scrolls.
- `src/App.css` remains Vite starter CSS and its selectors do not appear in the current UI.

## Source map

```text
src/
  App.tsx
  main.tsx
  index.css
  App.css
  data/
    workData.ts                 Video showreel content
    whatWeDo.ts                 Six service records and image/tag data
    testimonials.ts             Testimonial types and placeholder content
  components/
    Navbar.tsx
    CTAButton.tsx
    Footer.tsx                 Shared animated footer, contact info, clocks, and navigation
    Home/
      Hero.tsx
      BurnReveal.tsx
      Gallery.tsx               Nine-image selectable gallery
      WorkShowcase.tsx          Video carousel
      Aboutsection.tsx          About copy, metrics, and model composition
      WhatWeDo.tsx              Pinned service showcase
      Testimonials.tsx          Animated, draggable testimonial board
    providers/
      GalleryGL.tsx
      ModelViewer.tsx
      ServiceCanvas.tsx         WebGL service images, tags, and chrome object
      FooterGlow.tsx            Low-resolution WebGL footer atmosphere
      HorizontalScroll.tsx      Reusable helper; current call sites not confirmed
  lib/
    SmoothScroll.tsx
  pages/
    Home.tsx
    About.tsx
    Projects.tsx
    Clients.tsx
    Contact.tsx
public/
  GalleryAssets/
  WorkAssets/
  images/whatWeDo/              Six service showcase images
  fonts/SeasonSans/
  model/
  videos/
```

## Open ends and next-agent guidance

1. Align Navbar destinations with the route table or add intended route aliases.
2. Decide whether the nine-image Gallery, eight-item WorkShowcase, or both represent the final portfolio; their content is currently separate and hard-coded.
3. Fix/verify showreel poster paths under `/images/work/`; those files were not found in the current public asset inventory.
4. Choose intended Season Sans weight and align font-face declaration and utility weight; verify loading and font license.
5. Confirm the About metrics and copy are accurate and approved.
6. Replace testimonial placeholder quotes, names, and companies with approved customer content. Configure optional media only when real approved assets are available.
7. Build out the non-Home route pages and actual Contact inquiry submission flow. Add a not-found page.
8. Configure footer email, phone, and social links with approved contact details.
9. Resolve the three current lint errors (Navbar set-state-in-effect; GalleryGL render-time ref writes).
10. Reassess bundle size and GPU/mobile performance. The latest recorded build emits a roughly 1.08 MB minified JS chunk; the site has multiple Three.js experiences, including the service canvas and footer glow.
11. Review keyboard, focus, reduced-motion, and fallback behaviors for navigation, gallery, showreel, service showcase, testimonials, footer, and 3D models.
12. Add tests; none are currently configured.

Before changing the Home experience, read `Home.tsx` and the relevant child component/provider together. Gallery tiles, video showreel, the service showcase, testimonials, and the About model are distinct experiences with different content sources and media lifecycle behavior.
