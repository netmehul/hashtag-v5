import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "../components/Home/Hero";
import GallerySection from "../components/Home/Gallery";
import WorkShowcase from "../components/Home/WorkShowcase";
import AboutSection from "../components/Home/Aboutsection";

gsap.registerPlugin(ScrollTrigger);

/* Page theme flow:  Hero (dark) -> Gallery + Showreel (light) -> About (dark)
   The dark pair is set here. The light pair is read from --color-background /
   --color-foreground in index.css, so that file stays the source of truth for
   the light theme. */
const DARK = { bg: "#000000", fg: "#FFFFFF" };
const FALLBACK_LIGHT = { bg: "#FFFAFA", fg: "#1A1110" };

// where each fade happens, relative to the viewport (top of the trigger section)
const FADE_START = "top 80%";
const FADE_END = "top 25%";

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
    const LIGHT = {
      bg: css.getPropertyValue("--color-background").trim() || FALLBACK_LIGHT.bg,
      fg: css.getPropertyValue("--color-foreground").trim() || FALLBACK_LIGHT.fg,
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // t: 0 = dark page, 1 = light page.
    // The background follows t directly; the text flips faster around the
    // middle so it never sits grey-on-grey while the background is mid-fade.
    const paint = (t: number) => {
      const f = gsap.utils.clamp(0, 1, (t - 0.4) / 0.2);
      main.style.setProperty("--color-background", gsap.utils.interpolate(DARK.bg, LIGHT.bg, t));
      main.style.setProperty("--color-foreground", gsap.utils.interpolate(DARK.fg, LIGHT.fg, f));
    };

    // progress (0..1) of each fade. Page is light only between the two:
    // gallery fade-in (toLight) multiplied by the about fade-out (toDark).
    let toLight = 0;
    let toDark = 0;
    const update = () => {
      const a = reduced ? (toLight >= 0.5 ? 1 : 0) : toLight; // no fades for reduced motion
      const b = reduced ? (toDark >= 0.5 ? 1 : 0) : toDark;
      paint(a * (1 - b));
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
    <main ref={mainRef} className="min-h-screen">
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
    </main>
  );
}

export default Home;