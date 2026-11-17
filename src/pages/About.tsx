import { useId, useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AboutSection from "../components/Home/Aboutsection";
// The grain-gradient backdrop used in the stats bento. Adjust this path if
// your AbstractModel lives somewhere else.
import AbstractModel, { type ModelKind } from "../components/providers/AbstractModel";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Dark theme, scoped to this page only                               */
/*  Overrides the two colour tokens every utility on this page uses    */
/*  (bg-background, text-foreground, border-foreground/10 …), so the   */
/*  page is dark whatever the site-wide theme is set to. The accent    */
/*  colour is left alone.                                              */
/* ------------------------------------------------------------------ */
const DARK_THEME = {
  "--color-background": "#000000",
  "--color-foreground": "#f4f4f2",
  colorScheme: "dark",
} as CSSProperties;

/* ------------------------------------------------------------------ */
/*  Content: everything marked EDIT is placeholder copy, swap freely   */
/* ------------------------------------------------------------------ */

// EDIT: hero
const HERO_WORDS = ["We", "are", "experience-makers."];
const HERO_ACCENT_WORD = 2; // index of the word shown in the accent colour
const HERO_SUB =
  "Hashtag Eventz turns bold ideas into events people talk about long after the lights go down.";

// EDIT: services
const services = [
  {
    title: "Concept & Creative",
    text: "Big ideas, sharpened into themes, stories and moments built around your audience.",
    tags: ["Strategy", "Theme", "Storytelling"],
  },
  {
    title: "Production & Execution",
    text: "Stages, sound, light, logistics and crew, run flawlessly from load-in to last guest.",
    tags: ["Staging", "AV", "Logistics"],
  },
  {
    title: "Brand Activations",
    text: "Experiences that put your brand in people's hands, not just in front of their eyes.",
    tags: ["Launches", "Pop-ups", "Experiential"],
  },
  {
    title: "Corporate & Social Events",
    text: "From conferences and galas to celebrations, each one designed to feel unmistakably yours.",
    tags: ["Conferences", "Galas", "Celebrations"],
  },
];

// EDIT: process
const steps = [
  { title: "Listen", text: "We start with your goals, your audience and what you want people to feel." },
  { title: "Concept", text: "Ideas, references and a creative direction you can see before you commit." },
  { title: "Plan", text: "Budgets, timelines, vendors and run-of-show, locked down in detail." },
  { title: "Deliver", text: "On the day we run the show, so you can be in the room instead of behind it." },
];

type IconKind = "detail" | "calm" | "spark";

// EDIT: principles
//  icon  – which drawing to use
//  model – which grain-gradient preset glows from the card's top-right corner
//  tint  – the matching colour used for the icon's glow and gradient
const principles: { title: string; text: string; icon: IconKind; model: ModelKind; tint: string }[] = [
  {
    title: "Detail is the difference",
    text: "Guests never see the thousand decisions behind a great night. They feel every one of them.",
    icon: "detail",
    model: "knot",
    tint: "#ff5a6a",
  },
  {
    title: "Calm under pressure",
    text: "Live events never go to plan. Ours go well anyway, because we plan for what could go wrong.",
    icon: "calm",
    model: "gyro",
    tint: "#b6c1ff",
  },
  {
    title: "Made to be remembered",
    text: "We design for the moment people pull out their phones, and the one they put them away.",
    icon: "spark",
    model: "chain",
    tint: "#a3e4e2",
  },
];

// EDIT: marquee words
const MARQUEE = ["Concept", "Craft", "Production", "Experience", "Emotion", "Execution"];

const pad = (n: number) => String(n).padStart(2, "0");

/* film grain tile, the same printed texture as the stats gradients */
// const GRAIN =
//   "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/*                                                                     */
/*  Spacing note: vertical space between text elements is made with    */
/*  flex/grid `gap` and `padding`, never `margin` on <p>/<h*>, because */
/*  global CSS resets (p, h1…h6 { margin: 0 }) can silently override   */
/*  Tailwind's margin utilities.                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <p className="reveal flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em]">
      <span aria-hidden className="font-season text-lg font-bold leading-tight text-accent">#</span>
      <span className="text-foreground/40">({index})</span>
      {title}
    </p>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M7 17L17 7M7 7H17V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* every stroke is normalised (pathLength=1) so GSAP can "draw" it in */
const draw = { pathLength: 1, strokeDasharray: 1, className: "icon-stroke" } as const;

/**
 * Duotone icon: a white-to-tint gradient stroke over a soft tinted fill,
 * so it reads as lit glass rather than a flat outline.
 */
function PrincipleIcon({ kind, tint }: { kind: IconKind; tint: string }) {
  const uid = useId().replace(/:/g, "");
  const stroke = `url(#${uid}-s)`;
  const fill = `url(#${uid}-f)`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="relative h-14 w-14 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-6 group-hover:scale-110 md:h-16 md:w-16"
    >
      <defs>
        <linearGradient id={`${uid}-s`} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor={tint} />
        </linearGradient>
        <linearGradient id={`${uid}-f`} x1="10" y1="8" x2="50" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={tint} stopOpacity="0.5" />
          <stop offset="1" stopColor={tint} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Detail: a lens with a crosshair, focus on the small stuff */}
      {kind === "detail" && (
        <>
          <circle cx="27" cy="27" r="17" fill={fill} className="icon-fill" />
          <circle cx="27" cy="27" r="17" stroke={stroke} {...draw} />
          <path d="M16.5 22 A12 12 0 0 1 23.5 16" stroke="#ffffff" strokeOpacity="0.6" {...draw} />
          <line x1="40" y1="40" x2="55" y2="55" stroke={stroke} strokeWidth={3.4} {...draw} />
          <line x1="27" y1="20" x2="27" y2="34" stroke={tint} {...draw} />
          <line x1="20" y1="27" x2="34" y2="27" stroke={tint} {...draw} />
        </>
      )}

      {/* Calm: turbulence settling into one steady line */}
      {kind === "calm" && (
        <>
          <path d="M6 18 C14 4, 22 32, 32 18 S50 4, 58 18" stroke={stroke} strokeOpacity="0.45" {...draw} />
          <path d="M6 32 C14 24, 22 40, 32 32 S50 24, 58 32" stroke={stroke} strokeOpacity="0.8" {...draw} />
          <path d="M6 46 H51" stroke={tint} strokeWidth={2} {...draw} />
          <circle cx="57" cy="46" r="3.2" fill={tint} className="icon-fill" />
        </>
      )}

      {/* Remembered: a spark with a smaller one orbiting it */}
      {kind === "spark" && (
        <>
          <path
            d="M30 8 C32 24 38 30 54 32 C38 34 32 40 30 56 C28 40 22 34 6 32 C22 30 28 24 30 8 Z"
            fill={fill}
            className="icon-fill"
          />
          <path
            d="M30 8 C32 24 38 30 54 32 C38 34 32 40 30 56 C28 40 22 34 6 32 C22 30 28 24 30 8 Z"
            stroke={stroke}
            {...draw}
          />
          <path d="M52 6 V16 M47 11 H57" stroke="#ffffff" strokeOpacity="0.85" {...draw} />
          <circle cx="11" cy="52" r="2.2" stroke={tint} {...draw} />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function About() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // hero headline: each word rises out of its own mask
      gsap.from(".hero-word", { yPercent: 115, duration: 1.3, ease: "expo.out", stagger: 0.12, delay: 0.1 });
      gsap.from(".hero-fade", { opacity: 0, y: 20, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.7 });

      // gentle parallax on the hero headline as you scroll away
      gsap.to(".hero-title", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });

      // generic reveals (labels, button); h2s are handled by data-h2-effect
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 36,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      // service rows stagger in
      gsap.from(".service-row", {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ".services-list", start: "top 85%" },
      });

      // process: the rule above each step draws in as you scroll
      gsap.utils.toArray<HTMLElement>(".step").forEach((step, i) => {
        const line = step.querySelector(".step-line");
        const tl = gsap.timeline({ scrollTrigger: { trigger: step, start: "top 88%" }, delay: i * 0.08 });
        if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.out" }, 0);
        tl.from(step.querySelectorAll(".step-fade"), { opacity: 0, y: 24, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 0.15);
      });

      // principles: cards rise in, then each icon draws itself
      gsap.from(".principle", {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".principles", start: "top 85%" },
      });
      gsap.fromTo(
        ".icon-stroke",
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: 1.8,
          ease: "power2.inOut",
          stagger: 0.05,
          delay: 0.25,
          scrollTrigger: { trigger: ".principles", start: "top 80%" },
        }
      );
      gsap.from(".icon-fill", {
        opacity: 0,
        duration: 1.4,
        ease: "power2.out",
        delay: 0.9,
        scrollTrigger: { trigger: ".principles", start: "top 80%" },
      });

      // marquee: endless loop, speeds up slightly while you scroll
      const track = root.querySelector<HTMLElement>(".marquee-track");
      if (track) {
        const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
        ScrollTrigger.create({
          trigger: ".marquee",
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(self.getVelocity()) / 600, 4), duration: 0.3, overwrite: true });
            gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3, overwrite: "auto" });
          },
        });
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <main ref={rootRef} style={DARK_THEME} className="bg-background text-foreground">
      {/* ---------------------------------------------------------- */}
      {/* 1 · Hero                                                    */}
      {/* ---------------------------------------------------------- */}
      <section
        aria-label="Introduction"
        className="hero relative flex min-h-[40svh] md:min-h-[92svh] w-screen flex-col justify-end overflow-x-clip px-[5vw] pb-16 pt-40 md:pb-24"
      >
        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-8 md:gap-14">


          <h1 className="hero-title text-[clamp(3rem,11.5vw,12rem)] font-light uppercase leading-none tracking-[-0.03em]">
            {HERO_WORDS.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em] pr-[0.22em] align-top">
                <span className={`hero-word inline-block ${i === HERO_ACCENT_WORD ? "text-accent" : ""}`}>{w}</span>
              </span>
            ))}
          </h1>

          <div className="flex flex-col gap-8 pt-4 md:flex-row md:items-end md:justify-between md:pt-10">
            <p className="hero-fade max-w-136 text-lg font-light leading-tight text-foreground/70 md:text-2xl">{HERO_SUB}</p>
            <a
              href="#story"
              className="hero-fade group flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-foreground/70 transition-colors duration-500 hover:text-accent"
            >
              Scroll
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/20 transition-[border-color,background-color,color,rotate] duration-500 group-hover:rotate-135 group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                <Arrow className="h-3.5 w-3.5" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 2 · Statement + stats (your existing section, unchanged)    */}
      {/* ---------------------------------------------------------- */}
      <div id="story">
        <AboutSection />
      </div>

      {/* ---------------------------------------------------------- */}
      {/* 3 · What we do                                              */}
      {/* ---------------------------------------------------------- */}
      <section aria-label="What we do" className="w-screen overflow-x-clip px-[5vw] py-24 md:py-40">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-14 md:gap-24">
          <div className="flex flex-col gap-8">
            <SectionLabel index="01" title="What we do" />
            <h2 data-h2-effect className="max-w-[18ch] text-[clamp(2rem,6vw,5.5rem)] font-light uppercase leading-tight tracking-tight">
              One team. From first idea to final applause.
            </h2>
          </div>

          <ul className="services-list border-t border-foreground/10">
            {services.map((s, i) => (
              <li
                key={s.title}
                className="service-row group relative grid grid-cols-1 gap-5 border-b border-foreground/10 py-8 transition-colors duration-500 hover:bg-foreground/3 md:grid-cols-12 md:items-center md:gap-8 md:py-12"
              >
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40 transition-colors duration-500 group-hover:text-accent md:col-span-1">
                  ({pad(i + 1)})
                </span>
                <h3 className="text-[clamp(1.5rem,3.2vw,3rem)] font-light leading-tight tracking-[-0.02em] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 md:col-span-5">
                  {s.title}
                </h3>
                <div className="flex flex-col gap-4 md:col-span-4">
                  <p className="text-base leading-tight text-foreground/70 md:text-lg">{s.text}</p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/40">
                    {s.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
                <span
                  aria-hidden
                  className="hidden h-11 w-11 items-center justify-center justify-self-end rounded-full border border-foreground/20 text-foreground/60 transition-[border-color,background-color,color,rotate] duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-white md:col-span-2 md:flex"
                >
                  <Arrow className="h-4 w-4" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 4 · Marquee                                                 */}
      {/* ---------------------------------------------------------- */}
      <section aria-hidden className="marquee w-screen overflow-hidden border-y border-foreground/10 py-6 md:py-10">
        <div className="marquee-track flex w-max whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {MARQUEE.map((w) => (
                <span key={`${dup}-${w}`} className="flex items-center text-[clamp(2.5rem,8vw,8rem)] font-light uppercase leading-tight tracking-[-0.03em] text-foreground/90">
                  {w}
                  <span className="px-[0.5em] font-season text-[0.5em] font-bold text-accent">#</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 5 · Process                                                 */}
      {/* ---------------------------------------------------------- */}
      <section aria-label="How we work" className="w-screen overflow-x-clip px-[5vw] py-24 md:py-40">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-14 md:gap-24">
          <div className="flex flex-col gap-8">
            <SectionLabel index="02" title="How we work" />
            <h2 data-h2-effect className="max-w-[16ch] text-[clamp(2rem,6vw,5.5rem)] font-light uppercase leading-tight tracking-tight">
              Concept to completion.
            </h2>
          </div>

          <ol className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
            {steps.map((s, i) => (
              <li key={s.title} className="step flex flex-col">
                <div className="step-line h-px origin-left bg-accent" />
                <div className="flex flex-col gap-5 pt-6 md:gap-6 md:pt-8">
                  <p className="step-fade font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">({pad(i + 1)})</p>
                  <h3 className="step-fade text-[clamp(1.75rem,3vw,2.75rem)] font-light leading-tight tracking-[-0.02em]">{s.title}</h3>
                  <p className="step-fade max-w-[32ch] text-base leading-tight text-foreground/70 md:text-lg">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 6 · Principles                                              */}
      {/* ---------------------------------------------------------- */}
      <section aria-label="What we believe" className="hidden w-screen overflow-x-clip px-[5vw] pb-24 md:pb-40">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-10 md:gap-16">
          <SectionLabel index="03" title="What we believe" />

          <div className="principles grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {principles.map((p, i) => (
              <article
                key={p.title}
                // "bento-card" lets the grain gradient react to this card's hover, cursor and clicks
                className="principle bento-card group relative flex min-h-96 flex-col justify-between gap-10 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.035] p-6 transition-[translate,border-color,background-color] duration-500 ease-out hover:-translate-y-1 hover:border-accent/50 hover:bg-foreground/6 md:min-h-120 md:p-8"
              >
                {/* grain gradient blooming from the top-right corner */}
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <AbstractModel className="h-full w-full" kind={p.model} reach={0.8} />
                </div>

                <div className="relative z-10 flex flex-col gap-8 md:gap-10">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40 transition-colors duration-500 group-hover:text-accent">
                    ({pad(i + 1)})
                  </span>

                  {/* glass tile: tinted glow + film grain + duotone icon */}
                  <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl md:h-28 md:w-28">
                    <span
                      aria-hidden
                      className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover:opacity-100"
                      
                    />
                    <span aria-hidden className="absolute inset-0 opacity-[0.22] mix-blend-overlay" />
                    <PrincipleIcon kind={p.icon} tint={p.tint} />
                  </div>
                </div>

                <div className="relative z-10 flex flex-col gap-4">
                  <h3 className="text-[clamp(1.5rem,2.4vw,2.4rem)] font-light leading-tight tracking-[-0.02em]">{p.title}</h3>
                  <p className="text-base leading-tight text-foreground/70">{p.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 7 · Closing CTA                                             */}
      {/* ---------------------------------------------------------- */}
      <section aria-label="Get in touch" className="cta w-screen overflow-x-clip border-t border-foreground/10 px-[5vw] py-28 md:py-48">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-12 md:gap-20">
          <h2 data-h2-effect className="text-[clamp(2.5rem,9vw,9.5rem)] font-light uppercase leading-tight tracking-[-0.03em]">
            Let's make something worth <span className="text-accent">remembering.</span>
          </h2>

          <div className="reveal flex flex-wrap items-center gap-6">
            {/* EDIT: point this at your contact route */}
            <a
              href="/contact"
              className="group inline-flex items-center gap-4 rounded-full border border-foreground/20 py-2 pl-7 pr-2 text-base uppercase tracking-wide transition-[border-color,background-color] duration-500 hover:border-accent hover:bg-accent md:text-lg"
            >
              Start a project
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white transition-[background-color,color,rotate] duration-500 group-hover:rotate-45 group-hover:bg-white group-hover:text-accent">
                <Arrow className="h-4 w-4" />
              </span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;