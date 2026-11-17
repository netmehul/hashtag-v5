# HASHTAG Eventz — Project Handover Context

## Project overview

This repository contains the client-side website for **HASHTAG Eventz**, an events and brand-experience company. The app is built with React and TypeScript using Vite. Its current Home experience is a long-form visual landing page: dark video-reveal hero, light image gallery, light video showreel, animated About section, pinned “What We Do” showcase, and a testimonials board. A shared animated footer follows route content on every page.

The Home page is the longest visual experience, and the other routes now have dedicated page experiences: a company story, filterable project portfolio and project details, partner logos, and a multi-step Contact brief. Project and partner content and contact details still contain sample placeholders. This is a client-side app without a CMS or persistent app data; Contact can POST to an optional endpoint or fall back to a prefilled email.

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

The most recent `npm run build` attempt failed at `src/pages/About.tsx:103` with TS6133 because `GRAIN` is declared but never read. The last previously successful build emitted a 1,080.77 kB minified JavaScript chunk (311.27 kB gzip), above its 500 kB advisory threshold; resolve the type error, then rebuild to verify the current bundle.

The last recorded `npm run lint` failed with three React Hooks diagnostics:

- `src/components/Navbar.tsx:20`: synchronous state update inside the route-change effect (`react-hooks/set-state-in-effect`).
- `src/components/providers/GalleryGL.tsx:112` and `:114`: refs updated during render (`react-hooks/refs`).

No test script or test files are currently present. Re-run checks after changes; these findings describe the last observed run, not necessarily future state.

## Information architecture and routes

`src/App.tsx` creates a `BrowserRouter`, renders the shared `Navbar`, matched route content, and then the shared `Footer`:

| Route | Component | Current contents |
|---|---|---|
| `/` | `src/pages/Home.tsx` | Hero, Gallery, WorkShowcase, About section, What We Do, Testimonials |
| `/about` | `src/pages/About.tsx` | Company story, services, process, and values |
| `/projects` | `src/pages/Projects.tsx` | Filterable portfolio with sample project content |
| `/projects/:slug` | `src/pages/ProjectDetail.tsx` | Project story, facts, media gallery, and next-project link |
| `/clients` | `src/pages/Clients.tsx` | Responsive partner-logo grid with placeholder names |
| `/contact` | `src/pages/Contact.tsx` | Four-step project inquiry brief |

There is no not-found route; unmatched locations show the shared navbar and footer without page content. Navbar links use the registered `/about` and `/contact` routes.

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

## Projects and project details

`src/pages/Projects.tsx` filters and displays project cards from `src/data/projects.ts`. Cards link to `/projects/:slug`, show optional muted video previews on hover (or when mostly in view on touch screens), and animate into view unless reduced motion is requested.

`src/pages/ProjectDetail.tsx` resolves the route slug against the same project dataset. Each detail page includes a hero image or video, category/year, client/location/services, summary, optional image gallery, and a link to the next project. The current nine project records are explicitly sample content: client names and project information must be replaced with approved material before publication.

## Clients page

`src/pages/Clients.tsx` renders the partner records from `src/data/partners.ts` in a responsive grid. SVGs are used as masks for consistent monochrome logos, with entrance animations and a pointer-following spotlight. Some partners may link to external sites. The current names are placeholders and should be replaced with approved names and URLs.

## Contact page and brief submission

`src/pages/Contact.tsx` provides a four-step brief builder:

1. Select one or more services from `src/data/whatWeDo.ts`.
2. Choose a budget range and timeline from `src/data/contact.ts`.
3. Enter a project brief (at least 10 non-whitespace characters) and an optional reference URL.
4. Provide a name and valid email; company and phone are optional.

Step progress, Back/Continue controls, validation, animated transitions, a hidden honeypot, sending/error states, and a success screen are handled in the page. `src/lib/submitBrief.ts` POSTs the brief as JSON to `VITE_FORM_ENDPOINT` when configured; without it, the browser opens a prefilled `mailto:` message addressed to `CONTACT.email`. Contact email, phone, studio location/hours, budgets, and timelines are currently placeholders in `src/data/contact.ts`. This is a form integration option, not a built-in backend.

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
- The About link points to `/about` and the “Start a Project” CTA points to `/contact`; both match registered routes.
- The route-change effect synchronously sets state and is the current navbar lint error.

`src/components/CTAButton.tsx` renders an internal React Router link, external anchor, or native button. It supports `primary`/`secondary`/`ghost`, `sm`/`md`/`lg`, `fit`/`full`, and optional arrow icon. CTA styles and reduced-transition support are in `src/index.css`.

## Global footer

`src/components/Footer.tsx` is rendered after `Routes` in `src/App.tsx`, so it appears on all routes, including pages that are otherwise placeholders. It currently provides:

- A marquee of the six services, whose direction and speed respond to scroll velocity while the footer is visible.
- A “Got a bold idea?” CTA with a rotating SVG text ring, magnetic pointer response, and link to `/contact-us`. This path is not registered; update it to `/contact`.
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
- Contact-form values and choice lists are in `src/data/contact.ts`; configure `VITE_FORM_ENDPOINT` for POST delivery or retain the email fallback.
- Project sample content is in `src/data/projects.ts`; partner placeholder names and logo paths are in `src/data/partners.ts` and `public/partner-logo/`.
- 3D model: `public/model/abstract_shape.glb`.
- Brand assets: `public/logoIcon.svg`, `public/logoFull.svg`, `public/favicon.svg`, `public/icons.svg`.
- Season Sans files: `public/fonts/SeasonSans/`; Geist comes from `@fontsource-variable/geist`.
- `src/index.css` defines Tailwind theme colors, font tokens, global reset, and CTA styles. Body defaults are black/white; Home changes theme tokens as it scrolls.
- Page and component line-height utilities use Tailwind's `leading-tight`.
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
    projects.ts                 Nine sample portfolio entries
    partners.ts                 Partner-logo names, paths, and optional URLs
    contact.ts                  Contact placeholders, budgets, and timelines
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
    submitBrief.ts              Optional endpoint POST with mailto fallback
  pages/
    Home.tsx
    About.tsx
    Projects.tsx
    ProjectDetail.tsx
    Clients.tsx
    Contact.tsx
public/
  GalleryAssets/
  WorkAssets/
  images/whatWeDo/              Six service showcase images
  partner-logo/                 Partner SVG logos
  fonts/SeasonSans/
  model/
  videos/
```

## Open ends and next-agent guidance

1. Update the Footer project CTA from `/contact-us` to the registered `/contact` route.
2. Replace the sample project and partner records with approved client names, project details, URLs, and media.
3. Decide whether the nine-image Gallery, eight-item WorkShowcase, or both represent the final portfolio; their content is currently separate and hard-coded.
4. Fix/verify showreel poster paths under `/images/work/`; those posters were not present in the current public asset inventory.
5. Choose the intended Season Sans weight, align the font-face declaration and utility weight, and confirm the font license.
6. Confirm the About metrics and copy are accurate and approved.
7. Replace testimonial placeholder quotes, names, and companies with approved customer content. Configure optional media only when available and approved.
8. Replace Contact placeholders in `src/data/contact.ts`, configure `VITE_FORM_ENDPOINT` if POST delivery is required, and set approved footer contact details.
9. Add a not-found route.
10. Resolve the current TypeScript build error (`GRAIN` unused in `src/pages/About.tsx`) and verify the current production bundle size.
11. Re-run lint and address any remaining findings; the last recorded lint issues were Navbar state update inside an effect and render-time ref writes in `GalleryGL`.
12. Review keyboard, focus, reduced-motion, and fallback behavior across navigation, galleries, project previews, the brief form, testimonials, footer, and 3D experiences.
13. Add tests; none are currently configured.

Before changing the Home experience, read `Home.tsx` and the relevant child component/provider together. Gallery tiles, video showreel, the service showcase, testimonials, and the About model are distinct experiences with different content sources and media lifecycle behavior.
