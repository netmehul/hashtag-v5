# HASHTAG Eventz

The front-end for the HASHTAG Eventz agency/events website. The experience currently combines a video-reveal hero with an interactive work gallery, responsive navigation, and supporting About, Projects, Clients, and Contact pages.

> **Project status:** The Home page contains the most developed experience. The other route pages are still early placeholders, and there is no backend, CMS, or contact form integration yet.

## Features

- **Video-reveal hero:** A Three.js/WebGL shader reveals a looping video along a soft, cursor-following trail. The effect adapts to viewport size and pauses its video when off screen.
- **Interactive Work gallery:** Nine local showcase items arranged in a responsive bento grid. Selecting an item expands it into a featured view with caption, progress, and previous/next controls.
- **Gallery visual effects:** On supported pointer devices, one shared WebGL canvas renders the gallery with hover color reveal, image movement, and entrance effects. Touch/coarse-pointer devices and WebGL failures use regular images instead.
- **Responsive navigation:** A floating header that hides while scrolling down and reappears while scrolling up, with a mobile menu.
- **Motion and scrolling:** GSAP powers gallery transitions and scroll effects; Lenis provides smooth scrolling. Some gallery transitions respect `prefers-reduced-motion`.
- **Reusable CTA:** `CTAButton` supports internal links, external links, and native buttons, with style, size, and width variants.

## Tech stack

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Three.js
- GSAP (including Flip and ScrollTrigger)
- Lenis
- Geist Variable and local Season Sans font files

## Getting started

Install dependencies and run the Vite development server:

```bash
npm install
npm run dev
```

Vite prints the local URL in the terminal. The project is a client-side app; no API keys or backend services are currently required.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot module replacement |
| `npm run build` | Type-check the project and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

There is currently no test script or test suite.

## Routes and information architecture

Routes are declared in `src/App.tsx`. The shared navigation is rendered on every route.

| Path | Page | Current content |
|---|---|---|
| `/` | Home | Hero and interactive Work gallery |
| `/about-us` | About | Short About introduction |
| `/projects` | Projects | Placeholder heading |
| `/clients` | Clients | Placeholder heading |
| `/contact-us` | Contact | Placeholder “Start Project” heading |

**Known navigation mismatch:** The navbar currently links to `/about` and `/contact`, while the registered page routes are `/about-us` and `/contact-us`. Align these paths before relying on those links. There is no catch-all/not-found route.

## Home gallery interaction

The gallery data and selection behavior live in `src/components/Home/Work.tsx`; WebGL rendering and fallback behavior live in `src/components/providers/GalleryGL.tsx`.

- Choose a tile to expand it and show its caption panel.
- Use the Previous/Next buttons or Left/Right Arrow keys to move through the items.
- Use Close or Escape to return to the grid.
- On touch/coarse-pointer devices, if WebGL cannot be created or loses its context, or if no gallery texture loads within 10 seconds, regular image elements are shown.

The nine gallery entries and their copy are currently hard-coded examples, not CMS-backed project data.

## Repository layout

```text
src/
  App.tsx                         Router and shared page shell
  main.tsx                        React entry point and global styles
  index.css                       Tailwind theme, font declarations, CTA styles
  App.css                         Legacy starter styles
  components/
    Navbar.tsx                    Responsive, scroll-aware navigation
    CTAButton.tsx                 Reusable CTA component
    Home/
      Hero.tsx                    Home hero composition and reveal settings
      BurnReveal.tsx              Three.js hero reveal effect
      Work.tsx                    Home gallery content and interactions
    providers/
      GalleryGL.tsx               WebGL gallery renderer and fallback handling
  lib/
    SmoothScroll.tsx              Lenis and GSAP ticker integration
  pages/
    Home.tsx
    About.tsx
    Projects.tsx
    Clients.tsx
    Contact.tsx
public/
  GalleryAssets/                  Gallery images (01.webp–09.webp)
  fonts/SeasonSans/               Local Season Sans font files
  videos/                          Hero videos
```

## Assets and fonts

- The hero loads `/videos/hero-burn.mp4`.
- Gallery images are loaded from `/GalleryAssets/01.webp` through `/GalleryAssets/09.webp`.
- The navbar uses `/logoIcon.svg`.
- `font-season` is defined in `src/index.css`. The current declaration points to `SeasonSans-TRIAL-Heavy.woff2` at weight 900, while the hero heading requests Tailwind `font-bold` (700). The `SeasonSans-TRIAL-Bold.woff2` file is present but is not currently the registered face. Confirm the intended font weight and licensing before release; the local font filenames identify trial files.
- Geist Variable is provided by `@fontsource-variable/geist`.

## Current engineering follow-ups

- Align the About and Contact navbar destinations with their registered routes.
- Build out Projects, Clients, About, and Contact pages; define and implement a real project inquiry flow.
- Decide on the intended Season Sans weight and match the `@font-face` declaration to the hero's requested weight.
- Add a not-found route and tests for navigation/gallery behavior as the application grows.
- Re-run `npm run build` and `npm run lint` against the latest changes. The last recorded lint run reported `react-hooks/set-state-in-effect` in the navbar's route-change effect. A previous production build also reported a large main JavaScript chunk; measure the current build before deciding on code splitting.
- Review keyboard/focus behavior and reduced-motion support across the navigation, hero, and gallery.

For a fuller implementation handover—including interaction details and current behavior—see [context.md](./context.md).
