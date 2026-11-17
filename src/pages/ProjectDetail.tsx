import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { getProject, projects } from "../data/projects";
import type { Project } from "../data/projects";

gsap.registerPlugin(ScrollTrigger);

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pad2 = (n: number) => String(n).padStart(2, "0");

/** same dark scope as the Projects page: theme colours flip to white on black inside <main> */
const DARK = { ["--color-background" as string]: "#000", ["--color-foreground" as string]: "#fff" };

/** gallery placement on desktop, repeats every 4 images */
const GALLERY = [
  { col: "md:col-span-8", ratio: "aspect-[4/3] md:aspect-[16/10]", extra: "" },
  { col: "md:col-span-4", ratio: "aspect-[4/3] md:aspect-[4/5]", extra: "md:mt-[10vw]" },
  { col: "md:col-span-5 md:col-start-2", ratio: "aspect-[4/3] md:aspect-[4/5]", extra: "" },
  { col: "md:col-span-6", ratio: "aspect-[4/3] md:aspect-[16/10]", extra: "md:mt-[6vw]" },
];

/* ------------------------------------------------------------------ */
/*  The page for one project                                           */
/* ------------------------------------------------------------------ */

function Detail({ p }: { p: Project }) {
  const rootRef = useRef<HTMLElement>(null);
  const [colour, setColour] = useState(REDUCED);

  const index = projects.findIndex((x) => x.slug === p.slug);
  const next = projects[(index + 1) % projects.length];

  // every project opens at the top
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // browser tab title
  useEffect(() => {
    const prev = document.title;
    document.title = `${p.title}: Projects`;
    return () => {
      document.title = prev;
    };
  }, [p.title]);

  // hero starts black & white and washes into colour just after it appears
  useEffect(() => {
    const t = window.setTimeout(() => setColour(true), 500);
    return () => window.clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    if (REDUCED) return;
    const ctx = gsap.context(() => {
      // hero media drifts and grows slightly as you scroll away
      gsap.to(".pd-hero-media", {
        yPercent: 12,
        scale: 1.08,
        ease: "none",
        scrollTrigger: { trigger: ".pd-hero", start: "top top", end: "bottom top", scrub: true },
      });

      // quiet fade-and-rise for facts, summary, captions
      gsap.set(".pd-reveal", { opacity: 0, y: 40 });
      ScrollTrigger.batch(".pd-reveal", {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, overwrite: true }),
      });

      // gallery images wipe open, with the picture settling inside
      gsap.utils.toArray<HTMLElement>(".pd-fig").forEach((fig) => {
        const img = fig.querySelector("img");
        gsap.fromTo(
          fig,
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: { trigger: fig, start: "top 88%", once: true },
          }
        );
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.25 },
            {
              scale: 1,
              duration: 1.8,
              ease: "expo.out",
              scrollTrigger: { trigger: fig, start: "top 88%", once: true },
            }
          );
        }
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const facts: [string, string][] = [
    ["Client", p.client],
    ["Location", p.location],
    ["Year", p.year],
    ["Services", p.services.join("\n")],
  ];

  return (
    <main
      ref={rootRef}
      className="bg-background text-foreground"
      style={DARK}
    >
      {/* ---------- hero ---------- */}
      <section className="pd-hero px-[5vw] pt-[20svh]">
        <Link
          to="/projects"
          className="group inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] opacity-70 transition-opacity hover:opacity-100"
        >
          <span aria-hidden className="transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-1.5">
            ←
          </span>
          All projects
        </Link>

        <div className="mt-8 flex items-center gap-4">
          <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-light uppercase tracking-[0.12em] text-white md:text-sm">
            {p.category}
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-60">
            {p.year} · {pad2(index + 1)} / {pad2(projects.length)}
          </span>
        </div>

        {/* reveal + red spotlight come from data-h1-effect (src/lib/headingEffects.ts) */}
        <h1
          data-h1-effect
          className="font-season mt-6 text-[clamp(3rem,11.5vw,14rem)] font-black uppercase leading-tight tracking-[-0.03em]"
        >
          {p.title}
        </h1>

        <div className="relative mt-10 aspect-[4/3] overflow-hidden bg-neutral-900 md:mt-14 md:aspect-[21/9]">
          <div
            className={`pd-hero-media absolute inset-0 transition-[filter] duration-[1800ms] ease-out ${
              colour ? "grayscale-0" : "grayscale"
            }`}
          >
            {p.video ? (
              <video
                src={p.video}
                poster={p.cover}
                autoPlay={!REDUCED}
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden
                className="h-full w-full object-cover"
              />
            ) : (
              <img src={p.cover} alt={p.title} className="h-full w-full object-cover" />
            )}
          </div>
        </div>
      </section>

      {/* ---------- facts ---------- */}
      <section className="px-[5vw] pt-12 md:pt-16">
        <dl className="grid grid-cols-2 border-l border-t border-foreground/15 md:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="pd-reveal border-b border-r border-foreground/15 p-5 md:p-7">
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">{label}</dt>
              <dd className="mt-3 whitespace-pre-line text-[clamp(1rem,1.6vw,1.6rem)] font-light uppercase leading-tight tracking-[-0.01em]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- summary ---------- */}
      <section className="px-[5vw] py-[12svh] md:py-[16svh]">
        <div className="md:grid md:grid-cols-12">
          <p className="pd-reveal mb-6 font-mono text-xs uppercase tracking-[0.2em] text-foreground/50 md:col-span-3 md:mb-0">
            The story
          </p>
          <p
            data-h2-effect
            className="text-[clamp(1.6rem,3.8vw,4rem)] font-light uppercase leading-tight tracking-[-0.02em] md:col-span-9"
          >
            {p.summary}
          </p>
        </div>
      </section>

      {/* ---------- gallery ---------- */}
      {p.gallery.length > 0 && (
        <section className="px-[5vw] pb-[14svh]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-x-[2.5vw] md:gap-y-[6vw]">
            {p.gallery.map((src, i) => {
              const l = GALLERY[i % GALLERY.length];
              return (
                <figure key={src + i} className={`col-span-1 ${l.col} ${l.extra}`}>
                  <div className={`pd-fig relative overflow-hidden bg-neutral-900 ${l.ratio}`}>
                    <img
                      src={src}
                      alt={`${p.title}, image ${i + 1}`}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <figcaption className="pd-reveal mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">
                    {pad2(i + 1)} / {pad2(p.gallery.length)}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- next project ---------- */}
      <section className="border-t border-foreground/15">
        <Link to={`/projects/${next.slug}`} className="group relative block overflow-hidden px-[5vw] py-[12svh]">
          {/* the next project's still fades in behind the title on hover */}
          <img
            src={next.cover}
            alt=""
            aria-hidden
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover opacity-0 grayscale transition-opacity duration-700 group-hover:opacity-30"
          />
          <div className="relative">
            <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-60">Next project</p>
            <p className="mt-4 flex items-end justify-between gap-6 text-[clamp(2.5rem,10vw,12rem)] font-light uppercase leading-tight tracking-tight transition-colors duration-500 group-hover:text-accent">
              <span>{next.title}</span>
              <span
                aria-hidden
                className="mb-[0.1em] shrink-0 text-[0.6em] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-3"
              >
                →
              </span>
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] opacity-60">
              {next.category} · {next.year}
            </p>
          </div>
        </Link>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Route component                                                    */
/* ------------------------------------------------------------------ */

function ProjectDetail() {
  const { slug } = useParams();
  const p = getProject(slug);

  if (!p) {
    return (
      <main className="grid min-h-svh place-items-center bg-background px-[5vw] text-foreground" style={DARK}>
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-60">404</p>
          <h1 className="mt-4 text-[clamp(2rem,6vw,5rem)] font-light uppercase leading-tight tracking-tight">
            Project not found
          </h1>
          <Link
            to="/projects"
            className="mt-8 inline-block rounded-full border border-foreground/30 px-6 py-3 text-sm font-light uppercase tracking-[0.12em] transition-colors hover:border-accent hover:bg-accent"
          >
            Back to projects
          </Link>
        </div>
      </main>
    );
  }

  // key = remount per project, so every animation and heading effect starts fresh
  return <Detail key={p.slug} p={p} />;
}

export default ProjectDetail;
