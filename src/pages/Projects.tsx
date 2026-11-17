import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { categories, projects } from "../data/projects";
import type { Project } from "../data/projects";

gsap.registerPlugin(ScrollTrigger);

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Desktop placement repeats every 4 cards: wide, narrow (dropped), narrow, wide (dropped) */
const LAYOUT = [
  { col: "md:col-span-7", ratio: "md:aspect-[4/3]", drop: "" },
  { col: "md:col-span-5", ratio: "md:aspect-[4/5]", drop: "md:mt-[9vw]" },
  { col: "md:col-span-5", ratio: "md:aspect-[4/5]", drop: "" },
  { col: "md:col-span-7", ratio: "md:aspect-[4/3]", drop: "md:mt-[6vw]" },
];

/* ------------------------------------------------------------------ */
/*  One project card                                                   */
/* ------------------------------------------------------------------ */

function Card({ p, i }: { p: Project; i: number }) {
  const l = LAYOUT[i % LAYOUT.length];
  const video = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLAnchorElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    const v = video.current;
    if (!v) return;
    v.play().then(() => setPlaying(true)).catch(() => {});
  };
  const stop = () => {
    const v = video.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
  };

  // touch screens have no hover: play the preview while the card is mostly in view
  useEffect(() => {
    if (!p.video || REDUCED || !window.matchMedia("(hover: none)").matches) return;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? play() : stop()),
      { threshold: 0.65 }
    );
    io.observe(el);
    return () => io.disconnect();
    // play/stop only touch refs and state setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.video]);

  return (
    <li className={`project-card col-span-1 ${l.col} ${l.drop}`}>
      <Link
        ref={box}
        to={`/projects/${p.slug}`}
        aria-label={`${p.title}, ${p.category}, ${p.year}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && !REDUCED && play()}
        onPointerLeave={(e) => e.pointerType === "mouse" && stop()}
        className="group block focus-visible:outline-none"
      >
        <div className={`relative aspect-4/3 overflow-hidden bg-neutral-900 ${l.ratio}`}>
          {/* black & white until you hover; the video fades in over the still */}
          <div className="absolute inset-0 transition-transform duration-900 ease-out group-hover:scale-[1.05]">
            <img
              src={p.cover}
              alt=""
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover grayscale transition-[filter] duration-700 group-hover:grayscale-0 group-focus-visible:grayscale-0"
            />
            {p.video && (
              <video
                ref={video}
                src={p.video}
                poster={p.cover}
                muted
                loop
                playsInline
                preload="metadata"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  playing ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
          </div>

          <span className="absolute left-4 top-4 font-mono text-[11px] tabular-nums text-white mix-blend-difference md:left-5 md:top-5">
            {pad2(i + 1)}
          </span>

          {p.video && (
            <span className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-sm md:right-5 md:top-5">
              Film
            </span>
          )}

          {/* arrow springs in on hover */}
          <span
            aria-hidden
            className="absolute bottom-4 right-4 grid h-12 w-12 scale-0 place-items-center rounded-full bg-accent text-white transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-100 group-focus-visible:scale-100 md:bottom-5 md:right-5 md:h-14 md:w-14"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
              <path d="M5 19L19 5M8 5h11v11" />
            </svg>
          </span>
        </div>

        <div className="mt-4 flex items-start justify-between gap-6">
          <h3 className="text-[clamp(1.4rem,2.6vw,2.8rem)] font-light uppercase leading-tight tracking-[-0.02em] transition-colors duration-500 group-hover:text-accent">
            {p.title}
          </h3>
          <p className="shrink-0 pt-1 text-right font-mono text-[11px] uppercase leading-tight tracking-[0.18em] text-foreground/50">
            {p.category}
            <br />
            {p.year}
          </p>
        </div>
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function Projects() {
  const [filter, setFilter] = useState("All");
  const gridRef = useRef<HTMLUListElement>(null);

  const visible = filter === "All" ? projects : projects.filter((p) => p.category === filter);
  const count = (c: string) => (c === "All" ? projects.length : projects.filter((p) => p.category === c).length);

  // cards rise in as they scroll into view (re-runs whenever the filter changes)
  useLayoutEffect(() => {
    if (REDUCED) return;
    const ctx = gsap.context(() => {
      gsap.set(".project-card", { opacity: 0, y: 60 });
      ScrollTrigger.batch(".project-card", {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, overwrite: true }),
      });
    }, gridRef);
    return () => ctx.revert();
  }, [filter]);

  return (
    <main
      className="bg-background text-foreground"
      // dark scope: re-points the theme colours for everything inside this page, so every
      // text-foreground / border-foreground / opacity variant below flips to white on black
      style={{ ["--color-background" as string]: "#000", ["--color-foreground" as string]: "#fff" }}
    >
      {/* ---------- intro ---------- */}
      <section className="px-[5vw] pb-[8svh] pt-[22svh] md:pb-[10svh]">
        {/* reveal + red spotlight come from data-h1-effect (src/lib/headingEffects.ts) */}
        <h1
          data-h1-effect
          className="font-season text-[clamp(3.5rem,17.5vw,22rem)] font-black uppercase leading-tight tracking-[-0.03em]"
        >
          Projects
        </h1>

        <div className="mt-10 flex flex-col gap-6 md:mt-14 md:flex-row md:items-end md:justify-between">
          <p className="max-w-sm text-sm leading-tight opacity-60">
            A selection of the events, campaigns and brand stories we&apos;ve brought to life. Hover for a preview, click to
            open the full story.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-60">
            ({pad2(projects.length)}) selected work
          </p>
        </div>
      </section>

      {/* ---------- filters ---------- */}
      <section className="px-[5vw]">
        <div className="flex flex-wrap gap-2 border-t border-foreground/15 pt-6 md:gap-3" role="group" aria-label="Filter projects">
          {categories.map((c) => {
            const on = c === filter;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(c)}
                className={`rounded-full border px-4 py-2 text-xs font-light uppercase tracking-[0.12em] transition-colors duration-300 md:px-5 md:text-sm ${
                  on
                    ? "border-accent bg-accent text-white"
                    : "border-foreground/30 hover:border-foreground"
                }`}
              >
                {c}
                <sup className="ml-1.5 text-[0.65em] opacity-70">{pad2(count(c))}</sup>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- grid ---------- */}
      <section className="px-[5vw] pb-[14svh] pt-10 md:pt-14">
        <ul ref={gridRef} className="grid grid-cols-1 gap-x-[2.5vw] gap-y-12 md:grid-cols-12 md:gap-y-[6vw]">
          {visible.map((p, i) => (
            <Card key={p.slug} p={p} i={i} />
          ))}
        </ul>
      </section>

      
    </main>
  );
}

export default Projects;