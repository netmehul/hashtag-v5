# Hashtag project context

## Purpose and current state

This repository is the front-end for a branded agency/events website called **HASHTAG Eventz**. It is a client-rendered React site built with TypeScript and Vite. The current design direction pairs the home-page video-backed, cursor-following “burn/reveal” hero with a light floating navigation bar, rounded white surfaces, custom display/body fonts, and reusable red-accented CTA buttons.

The project is an early/incomplete website implementation, not a feature-complete agency site:

- The Home route has the developed hero effect and brand headline, followed by an interactive nine-item Work gallery.
- About Us, Projects, Clients, and Start Project routes exist, but are mostly placeholders.
- No server, API integration, CMS, form submission, or persistent application state is present in the inspected source.
- No test script or test files are present in the project source.
- The project README is still the default React/Vite template and does not describe the product.

Treat these as observations of the current code, not as confirmation of the intended final brand or product requirements.

## Tech stack and commands

- React 19 + TypeScript 5.9
- Vite 8, with the React and Tailwind CSS Vite plugins
- Tailwind CSS 4 for utility classes and theme tokens
- React Router 7 for client-side routes
- Three.js for the WebGL hero reveal
- Lenis + GSAP ticker for global smooth scrolling
- Geist Variable (installed through `@fontsource-variable/geist`) and a locally supplied Season Sans font

Commands from `package.json`:

```bash
npm install
npm run dev       # local development server
npm run build     # TypeScript project build, then Vite production build
npm run lint      # ESLint
npm run preview   # serve the production build locally
```

Last build/lint verification was before the latest Home gallery change: build passed with a roughly 928 kB minified main chunk warning; lint failed on `react-hooks/set-state-in-effect` in `src/components/Navbar.tsx:20`, where the route-change effect synchronously calls `setIsMenuOpen(false)`. Re-run both checks after the gallery update. Three.js is a likely large-bundle contributor, but bundle analysis has not been run.

## Information architecture and routes

`src/App.tsx` owns the router and renders the shared `Navbar` above every route:

| URL | Page component | Current page content |
|---|---|---|
| `/` | `src/pages/Home.tsx` (imported as `Home`) | Hero followed by the interactive Work gallery |
| `/about-us` | `src/pages/About.tsx` | “About Us” and “We are experience-makers.” |
| `/projects` | `src/pages/Projects.tsx` | “Projects” heading only |
| `/clients` | `src/pages/Clients.tsx` | “Clients” heading only |
| `/contact-us` | `src/pages/Contact.tsx` | “Start Project” heading only |

The navbar currently links to Home (`/`), About (`/about`), Projects (`/projects`), Clients (`/clients`), and a “Start a Project” CTA (`/contact`). **The About and CTA destinations do not match the registered routes** (`/about-us` and `/contact-us`), so those two navbar links currently lead to a URL with no matching page. There is no catch-all route or not-found page; an unmatched URL renders the navbar without a matching page element.

### Main user flow as implemented

1. A visitor lands on `/` and sees the HASHTAG / Eventz hero.
2. They can explore the pointer-driven video reveal by moving the pointer across the hero. On touch-capability devices, the effect instead wanders automatically unless reduced motion is requested; touch pointer events can also activate it.
3. Scrolling down reveals the Work gallery: nine sample project/event tiles with title, category, and short descriptions. Selecting a tile expands it into a featured stage and opens an adjacent caption panel.
4. In the expanded gallery, Previous/Next buttons cycle through all nine entries, Close or Escape returns to the grid, and left/right arrow keys cycle entries. On touch/coarse-pointer devices or when WebGL fails, the gallery falls back to regular `<img>` rendering.
5. The navbar links to Projects and Clients correctly. Its About and “Start a Project” links currently point at unregistered paths (`/about` and `/contact`); the corresponding pages are registered at `/about-us` and `/contact-us`.
6. On mobile, the burger opens a dropdown navigation panel. Selecting a mobile link, changing route, scrolling down, or pressing Escape closes it. Clicking the logo goes Home.
7. There are no conversion, contact, project-detail, or client-detail flows beyond those route transitions and the Home showcase yet.

## UI, visual direction, and motion

### Shared shell and styling

- `src/components/Navbar.tsx` is a fixed, floating white/translucent header with the brand SVG, dark uppercase links, and a reusable CTA. On scroll down (more than 5px difference after the first 80px) it hides; on scroll up it returns. On mobile it uses a dropdown panel and burger, closes on route changes, Escape, or scroll down, and exposes `aria-expanded`/`aria-controls`. The mobile navigation is hidden from assistive technology while closed and its links are removed from tab order.
- `src/components/CTAButton.tsx` is the shared CTA implementation. It can render a React Router `Link`, external anchor, or native button; supports `primary`, `secondary`, and `ghost` variants, `sm`/`md`/`lg` sizes, `fit`/`full` widths, and an optional decorative arrow tile. The navbar currently uses the small primary variant.
- `src/index.css` imports Tailwind and Geist Variable, and declares theme colors (`background` `#FFFAFA`, `foreground` `#1A1110`, `accent` `#ED2939`) plus `font-season` and `font-body` Tailwind font tokens. The body uses Geist on a black background with white text. The stylesheet defines the CTA appearance, hover/press/focus/disabled states, and reduced-transition behavior.
- The current `font-season` face points to `/fonts/SeasonSans/SeasonSans-TRIAL-Heavy.woff2` at weight 900, while the hero heading requests Tailwind `font-bold` (700). The requested `SeasonSans-TRIAL-Bold.woff2` asset exists but is not the file currently registered in `@font-face`. Decide which weight is intended and align the face URL/declared weight with the hero utility. The prior build check predates this latest source state.
- `src/App.css` contains styling from the Vite starter app (counter, demo hero, and next-step sections). Those selectors do not appear in the current page markup.
- The hero uses the Season Sans font token for the “Hashtag” display title and Geist for “Eventz”. The title uses container-query width units (`cqw`) to scale continuously with its container, rather than a set of font-size breakpoints. The section is responsive and capped at 1920px on wider screens.
- The Work section has a light/neutral project-gallery presentation with a responsive two-column mobile / 12-column desktop bento grid. GSAP ScrollTrigger animates the heading into view; GSAP Flip animates tile layout changes when a work item is selected. Respect `prefers-reduced-motion` by removing the Flip duration and using non-smooth scroll positioning.

### Home Work gallery

The Home route composes `Hero` and `WorkSection` in `src/pages/home.tsx`. `src/components/Home/Work.tsx` defines nine hard-coded showcase entries (IDs `01`–`09`) with local image paths, titles, categories, short descriptions, and optional focal-point metadata. The images are in `public/GalleryAssets/`.

- At rest, the entries form a responsive bento grid with hover labels and an accessible button over each image.
- Selecting an entry rearranges the grid using GSAP Flip: the chosen image becomes the large stage and an adjacent caption panel presents its category, title, description (desktop), count/progress, previous/next controls, and close control.
- Keyboard interaction while an item is active: Escape closes; Left/Right Arrow changes the selected item. Selection wraps at either end.
- `src/components/providers/GalleryGL.tsx` draws the images in one transparent Three.js canvas. Each plane follows its tile's live bounding box, including during Flip transitions. The shader handles cover/focal-point cropping, grayscale-to-color pointer reveal, a lens/bulge effect, scroll-velocity bend/RGB split, and a staggered intro reveal.
- The gallery deliberately switches to ordinary `<img>` elements for coarse/touch pointers. It also signals fallback if WebGL creation fails, the context is lost, or no image texture loads within 10 seconds. Individual failed texture loads do not fail the entire gallery.
- The selected-work set and copy are currently hard-coded sample content, not sourced from a CMS/API. Each gallery image has an `alt` based on its title.

### Hero reveal effect

The effect is implemented in `src/components/Home/BurnReveal.tsx`, used by `src/components/Home/Hero.tsx`.

- A transparent Three.js/WebGL canvas overlays the hero. The normal hero text is underneath the overlay; a heat-mask-shaped region reveals a muted looping video while covering the text in that region.
- Pointer movement is measured relative to the hero section. A spring model gives the reveal a trailing, slightly elastic response; the reveal radius grows with pointer speed.
- The effect stamps heat into a CPU-side grid with roughly 6 CSS-pixel cells. Heat decays over time, creating a temporary trail that closes behind the pointer.
- A fragment shader adds low-frequency organic edge wobble and a smaller amount of edge tearing. Until video data is available, a dark animated shader texture is shown through the reveal.
- The video asset is `public/videos/hero-burn.mp4`, loaded at `/videos/hero-burn.mp4`. It is muted, looping, inline, and intended to autoplay.
- Default effect props are a 240px desktop radius and decay of 1.4 heat units per second. The radius is scaled to 65% below 768px.
- `ResizeObserver` recalculates renderer/grid/video sizing. `IntersectionObserver` pauses the video when the hero leaves view and skips effect updates/rendering while hidden.
- `prefers-reduced-motion` suppresses the automatic wandering effect on devices reporting no hover. It does **not** disable the effect for an active pointer.
- Cleanup removes event listeners/observers, stops the animation frame and video, and disposes the Three.js resources.

### Smooth-scroll lifecycle

`src/main.tsx` mounts `SmoothScroll` and `App` inside React `StrictMode`. `src/lib/SmoothScroll.tsx` creates one Lenis instance, advances it from the GSAP ticker, and calls `ScrollTrigger.update()` on Lenis scroll events. It removes the ticker/listener and destroys Lenis on unmount. ScrollTrigger is registered, although no ScrollTrigger animations are currently present in the inspected source.

## Source map

```text
src/
  App.tsx                       Router and shared page shell
  main.tsx                      React entry point, global CSS, smooth scroll mount
  index.css                     Tailwind import, theme variables, global reset
  App.css                       Legacy Vite demo CSS
  components/
    Navbar.tsx                  Fixed, scroll-aware responsive navigation
    CTAButton.tsx               Reusable link/anchor/button CTA with variants
    Home/
      Hero.tsx                  Fluid-type home headline and effect configuration
      BurnReveal.tsx             Three.js canvas/video reveal implementation
      Work.tsx                   Nine-item interactive Home work gallery
    providers/
      GalleryGL.tsx              Three.js gallery canvas, shader, and fallback
  lib/
    SmoothScroll.tsx             Lenis + GSAP ticker integration
  pages/
    Home.tsx
    About.tsx
    Projects.tsx
    Clients.tsx
    Contact.tsx
  assets/
    hero.png, react.svg, vite.svg  Present but not referenced by current app source
public/
  videos/hero-burn.mp4           Hero reveal video
  videos/raw_hero-burn.mp4       Additional source video asset (usage unconfirmed)
  GalleryAssets/01.webp–09.webp  Gallery project imagery
  logoFull.svg, logoIcon.svg     Brand logo assets used/available in public root
  favicon.svg, icons.svg, og-image.jpg
  fonts/SeasonSans/              Local Season Sans trial font files
```

Other useful root files:

- `index.html`: Vite HTML entry point; the current document title is `hashtag-v5`.
- `vite.config.ts`: Vite plugin configuration for React and Tailwind.
- `eslint.config.js`, `tsconfig*.json`: lint and TypeScript project configuration.
- `README.md`: default scaffold documentation; replace/update for this project when appropriate.

## Architecture and implementation conventions

- Routing is centralized in `App.tsx`; page components are simple route-level components.
- The navbar is outside `<Routes>`, so it persists across route changes. It uses `useLocation` to close its mobile panel on path changes.
- Keep registered route paths and navbar destinations synchronized; they have drifted (`/about` vs `/about-us`, `/contact` vs `/contact-us`).
- The hero reveal is isolated as a reusable component configured via props (`containerRef`, `videoSrc`, `radius`, `decay`). Its pointer listeners attach to the hero section while the canvas overlay is `aria-hidden` and ignores pointer events.
- The Home gallery data is currently local and hard-coded in `Work.tsx`; image loading and shader rendering are handled separately by `GalleryGL.tsx`. Preserve the plain-image fallback when changing the WebGL gallery.
- Use `CTAButton` for consistent CTA visuals; its CSS classes are defined in `index.css`, not `App.css`.
- Static public files are addressed from the site root (for example, `/videos/hero-burn.mp4`); imported source assets would instead be bundled by Vite.
- There is no observed shared data layer, state store, backend client, authentication, or environment-variable setup. Avoid introducing these without a real feature requirement.

## Open ends and handover checklist

### Product/content work

1. **Fix navigation route mismatches.** `Navbar.tsx` sends About to `/about` and the CTA to `/contact`, but `App.tsx` registers `/about-us` and `/contact-us`. Choose canonical paths and align both sides (or add intentional aliases).
2. **Finish route content and page designs.** The Home page now has a sample work showcase, but the Projects page is still a heading only; Clients and Contact are also headings only, and About is a minimal statement. Decide whether Projects should reuse or link into the Home gallery.
3. **Define the contact conversion flow.** “Start a Project” currently targets an unmatched route and the contact page itself contains only a heading. No form, validation, email link, API, success/error state, or submission handling exists.
4. **Align Season Sans weight and asset.** `font-season` currently registers the Heavy trial file at weight 900; Hero requests weight 700, and the Bold trial file exists but is not currently used. Choose the intended weight, update the face and/or class, verify loading in the browser/build, and confirm licensing/production use because the filenames identify trial fonts.
5. **Confirm brand and content details.** The Home copy says “HASHTAG Eventz,” while the About page describes “experience-makers.” Confirm spelling, capitalization, business positioning, and final copy with the project owner.
6. **Decide on project/client detail pages and a not-found experience.** Only list-level URLs are currently represented, and unknown paths have no dedicated fallback.
7. **Replace scaffold metadata/docs.** The browser title remains `hashtag-v5`; README remains template text. Add appropriate title, description, social metadata, and favicon/brand guidance after requirements are known.

### Engineering and quality work

1. **Check visual behavior across browsers/devices.** The custom WebGL hero and gallery, video autoplay, touch fallback, and mobile performance have not been browser/device-tested in this task.
2. **Review accessibility and reduced-motion behavior.** The navbar supports Escape-to-close and removes closed mobile links from tab order, but focus restoration/management and page-level accessibility need review. The CTA CSS reduces its transitions; the hero reduced-motion behavior only suppresses ambient touch motion. Check gallery focus/semantics and how keyboard selection state is announced.
3. **Resolve the current lint failure.** Previous lint run reported `react-hooks/set-state-in-effect` for the synchronous menu-close state update in the route-change effect in `Navbar.tsx`; rerun lint against the latest gallery source.
4. **Assess bundle size if performance budgets require it.** Previous build reported a roughly 928 kB minified main JS chunk. The gallery adds another Three.js renderer/shader path; consider reuse/lazy loading only after measuring the current bundle and runtime GPU costs.
5. **Add tests as meaningful behavior is built.** There is no existing test runner or test suite. At minimum, route rendering/navigation and gallery open/close/keyboard/fallback behavior merit coverage as testing is introduced.
6. **Remove or repurpose unused scaffold assets/styles.** `App.css` is Vite demo CSS, `src/assets` contains unused starter assets, and `public/videos/raw_hero-burn.mp4` appears unused. Confirm none are needed before removal.

## Guidance for the next agent

Start by confirming which unfinished route or interaction is in scope. Preserve the existing React Router structure and shared navbar unless the IA changes. For hero work, read both `Hero.tsx` and `BurnReveal.tsx` before changing behavior: the reveal is a custom shader plus CPU heat-grid simulation, and resizing, video lifecycle, pointer cleanup, and reduced-motion behavior are intertwined. Validate changes with `npm run build` and `npm run lint`; add a focused test setup only if the feature warrants it.
