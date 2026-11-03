# HASHTAG Eventz

The front-end for the HASHTAG Eventz agency and brand-experience website. The Home page is a visual, scroll-led experience with an interactive video hero, image gallery, video showreel, animated About section, interactive “What We Do” showcase, and testimonials board.

> **Status:** The Home page is the most developed route. About, Projects, Clients, and Contact routes exist, but several remain placeholders. The app is currently a static client-side experience with no CMS, backend, or inquiry form integration.

## What’s in the experience

- **Video-reveal hero:** A Three.js shader reveals a muted looping video along an animated pointer trail.
- **Selectable image gallery:** Nine local images in a responsive bento layout. Selecting a tile expands it and shows its caption, progress, and navigation controls.
- **WebGL gallery effects:** On compatible pointer devices, one Three.js canvas renders pointer-driven color reveal, lens distortion, and entrance effects. Touch/coarse-pointer devices and WebGL failures fall back to standard images.
- **Video showreel:** Eight video projects are presented in a curved perspective carousel. Navigate with drag/swipe, arrow controls, or Left/Right Arrow keys.
- **Animated About section:** Scroll-triggered copy and metric reveals, plus an interactive 3D model.
- **Responsive navigation:** Floating header hides while scrolling down and reappears while scrolling up; includes a mobile dropdown menu.
- **Pinned service showcase:** Scroll through six services with gentle snapping, clickable/keyboard navigation, animated image transitions, floating labels, and a reflective 3D object. A plain-image fallback is shown if WebGL is unavailable.
- **Testimonials board:** Five testimonial cards animate into a responsive board; cards can be dragged on desktop. The component supports optional photos or muted video, though the current testimonial content is placeholder text without media.
- **Site-wide footer:** A branded footer with route links, service list, local clocks for Dubai, Abu Dhabi, and Doha, an animated “Start a Project” CTA, and a back-to-top control. Its low-resolution Three.js glow reacts to pointer movement and falls back to a plain black footer if WebGL is unavailable.
- **Theme transitions:** Home scrolls from a dark hero into light Gallery/Showreel sections and back to dark About, service, and testimonial sections.

## Technology

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Three.js
- GSAP (ScrollTrigger and Flip) + `@gsap/react`
- Lenis
- Geist Variable and local Season Sans files

## Getting started

Requirements: Node.js and npm versions compatible with the installed Vite 8 toolchain.

```bash
npm install
npm run dev
```

Vite prints the development URL in the terminal. The app does not currently require API keys or a backend service.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot module replacement |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

No test runner or test script is configured yet.

## Routes

Routes are declared in `src/App.tsx`; the shared navbar and footer appear across routes.

| Path | Page | Current state |
|---|---|---|
| `/` | Home | Hero, Gallery, WorkShowcase, About section, What We Do, Testimonials |
| `/about-us` | About | Minimal About content |
| `/projects` | Projects | Placeholder heading |
| `/clients` | Clients | Placeholder heading |
| `/contact-us` | Contact | Placeholder “Start Project” heading |

**Known mismatch:** The navbar currently targets `/about` and `/contact`, while the registered routes are `/about-us` and `/contact-us`. Unknown paths have no dedicated not-found page.

### Global footer

`src/components/Footer.tsx` is rendered by `src/App.tsx` after the route content, so it appears on every route. It includes internal navigation, the shared service list, optional email/phone/social links (currently unconfigured), live local-time clocks, a magnetic project CTA, an animated services marquee, cursor-lit wordmark, and back-to-top control. `src/components/providers/FooterGlow.tsx` supplies a low-resolution Three.js atmospheric glow that animates only while visible; if WebGL creation fails, the footer remains black.

## Home page components

### Hero

`src/components/Home/Hero.tsx` composes `BurnReveal`, which uses `/videos/hero-burn.mp4` with a spring-following pointer, a decaying heat mask, and a shader-rendered video reveal.

### Image gallery

`src/components/Home/Gallery.tsx` defines the nine image items. `src/components/providers/GalleryGL.tsx` handles the WebGL canvas and its plain-image fallback. Select a tile to expand it; use Previous/Next, Left/Right Arrow keys, or Escape to navigate/close.

### Video showreel

`src/components/Home/WorkShowcase.tsx` reads its eight entries from `src/data/workData.ts`. Drag/swipe the curved carousel or use its controls and arrow keys. The selected muted video is intended to play while the section is visible. Media files are in `public/WorkAssets/`.

### About and 3D model

`src/components/Home/Aboutsection.tsx` contains animated company copy, four displayed metrics, and `ModelViewer`. The model loads `public/model/abstract_shape.glb` and responds to pointer drag, pointer tilt, and scroll.

### What We Do

`src/components/Home/WhatWeDo.tsx` adds a pinned, scroll-driven showcase after About. It presents six services from `src/data/whatWeDo.ts`, with desktop service navigation, mobile progress buttons, arrow-key navigation, and gentle snapping between services. `src/components/providers/ServiceCanvas.tsx` renders the service images with an organic shader transition, pointer-responsive lens/parallax effects, floating service tags, and a rotating reflective 3D shape. If WebGL initialization fails, the section falls back to regular images. Service images are in `public/images/whatWeDo/`.

### Testimonials

`src/components/Home/Testimonials.tsx` renders the “What They Say” section after What We Do. It displays responsive quote cards that animate in on scroll and can be dragged on desktop. `src/data/testimonials.ts` provides five entries and supports optional image/video media; current names, companies, and quotes are explicitly placeholder content, and no media is enabled yet.

## Assets and site metadata

- Gallery imagery: `public/GalleryAssets/01.webp`–`09.webp`
- Showreel videos: `public/WorkAssets/`
- Hero video: `public/videos/hero-burn.mp4`
- 3D asset: `public/model/abstract_shape.glb`
- What We Do service images: `public/images/whatWeDo/`
- Optional testimonial media: paths can be supplied in `src/data/testimonials.ts`; no testimonial media is currently configured.
- Footer contact details and social profiles are currently blank in `src/components/Footer.tsx`.
- Logo icon: `public/logoIcon.svg`
- Social preview: `public/og-image.jpg`
- Fonts: `public/fonts/SeasonSans/` and Geist Variable from npm

`index.html` sets the title, favicon, Open Graph metadata, and Twitter large-image metadata. The social image path is root-relative (`/og-image.jpg`); configure an absolute public URL when the deployment domain is finalized. The hero currently requests Season Sans weight 700, while the registered face uses the Heavy file at weight 900; choose the intended face/weight before release. The local font files are marked as trial fonts, so confirm production licensing.

## Current follow-ups

- Correct the Navbar About/Contact paths.
- Confirm which work gallery represents the final project portfolio; the image gallery and video showreel use separate hard-coded datasets.
- Verify the showreel poster paths: `workData.ts` references `/images/work/*.jpg`, but those posters were not present in the current asset inventory.
- Confirm About copy and displayed business metrics.
- Replace testimonial placeholder quotes, names, and companies with approved customer testimonials; add media only when available and approved.
- Configure the footer email, phone, and social links when approved contact details are available.
- Complete Projects, Clients, About, and Contact routes; define the Contact inquiry flow.
- Address the current lint errors: Navbar state update inside a route-change effect and `GalleryGL` refs updated during render.
- Measure bundle and GPU/mobile performance. A recent build emitted a ~1.08 MB minified JavaScript chunk; the site includes several Three.js-powered experiences, including the service showcase and footer glow.
- Add tests and a not-found route.

For detailed architecture, behavior, and handover notes, see [context.md](./context.md).
