import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "../components/Home/Hero";
import GallerySection from "../components/Home/Gallery";
import WorkShowcase from "../components/Home/WorkShowcase";
import AboutSection from "../components/Home/Aboutsection";
import WhatWeDo from "../components/Home/WhatWeDo";
import Testimonials from "../components/Home/Testimonials";

gsap.registerPlugin(ScrollTrigger);

/* Page theme flow:  Hero (dark) -> Gallery + Showreel (light) -> About (dark)
   The dark pair is set here. The light pair is read from --color-background /
   --color-foreground in index.css, so that file stays the source of truth for
   the light theme. */
const DARK = { bg: "#000000", fg: "#FFFFFF" };
const FALLBACK_LIGHT = { bg: "#FFFAFA", fg: "#1A1110" };

// where each fade happens, relative to the viewport (top of the trigger section).
// A colour fade is not vestibular-type motion, so it plays even when the OS
// has "reduce motion" on; widen the gap between these for a slower fade.
const FADE_START = "top 90%";
const FADE_END = "top 20%";

/* Production CSS minifies colours into names (#FFFAFA -> "snow"), which cannot be
   blended. Resolve ANY css colour (hex, name, rgb, hsl, oklch...) to plain
   [r, g, b] numbers first, then mix those ourselves. */
type RGB = [number, number, number];
let probe: CanvasRenderingContext2D | null = null;
const toRgb = (color: string): RGB => {
  if (!probe) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    probe = c.getContext("2d", { willReadFrequently: true });
  }
  if (!probe) return [0, 0, 0];
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = color; // ignored if the browser can't parse it
  probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
};
const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(" ")})`;

function Home() {
  const mainRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const main = mainRef.current;
    const gallery = galleryRef.current;
    const about = aboutRef.current;
    if (!main || !gallery || !about) return;

    const css = getComputedStyle(main);
    const light = {
      bg: toRgb(css.getPropertyValue("--color-background").trim() || FALLBACK_LIGHT.bg),
      fg: toRgb(css.getPropertyValue("--color-foreground").trim() || FALLBACK_LIGHT.fg),
    };
    const dark = { bg: toRgb(DARK.bg), fg: toRgb(DARK.fg) };

    // t: 0 = dark page, 1 = light page.
    // The background follows t directly; the text flips faster around the
    // middle so it never sits grey-on-grey while the background is mid-fade.
    const paint = (t: number) => {
      const f = gsap.utils.clamp(0, 1, (t - 0.4) / 0.2);
      main.style.setProperty("--color-background", mix(dark.bg, light.bg, t));
      main.style.setProperty("--color-foreground", mix(dark.fg, light.fg, f));
    };

    // progress (0..1) of each fade. Page is light only between the two:
    // gallery fade-in (toLight) multiplied by the about fade-out (toDark).
    let toLight = 0;
    let toDark = 0;
    const update = () => {
      paint(toLight * (1 - toDark));
    };

    paint(0); // Hero is dark from the very first frame

    const triggers = [
      ScrollTrigger.create({
        trigger: gallery,
        start: FADE_START,
        end: FADE_END,
        onUpdate: (self) => { toLight = self.progress; update(); },
        onRefresh: (self) => { toLight = self.progress; update(); },
      }),
      ScrollTrigger.create({
        trigger: about,
        start: FADE_START,
        end: FADE_END,
        onUpdate: (self) => { toDark = self.progress; update(); },
        onRefresh: (self) => { toDark = self.progress; update(); },
      }),
    ];

    return () => {
      triggers.forEach((t) => t.kill());
      main.style.removeProperty("--color-background");
      main.style.removeProperty("--color-foreground");
    };
  }, []);

  return (
    <main ref={mainRef} className="min-h-screen overflow-hidden">
      <Hero />

      {/* paints the gallery with the live theme colours and overrides any
          background or text colour set on the section's outer element */}
      <div
        ref={galleryRef}
        className="bg-background text-foreground [&>section]:bg-transparent! [&>section]:text-inherit!"
      >
        <GallerySection />
      </div>

      <WorkShowcase />

      {/* same treatment for About, which fades back to dark */}
      <div
        ref={aboutRef}
        className="bg-background text-foreground [&>section]:bg-transparent! [&>section]:text-inherit!"
      >
        <AboutSection />
      </div>
      <WhatWeDo />
      <Testimonials />
    </main>
  );
}

export default Home;