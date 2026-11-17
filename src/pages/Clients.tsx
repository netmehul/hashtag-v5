import { useLayoutEffect, useRef } from "react";
import type { PointerEvent } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { partners } from "../data/partners";

gsap.registerPlugin(ScrollTrigger);

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Partner logos.
 *
 * Each logo is drawn as a mask filled with the current text colour, so every SVG
 * becomes a clean one-colour silhouette no matter how it was exported. On hover the
 * logo turns accent-red and springs up a little; a soft red spotlight follows the
 * cursor across the whole grid.
 *
 * Note: this needs logos with a transparent background. If one has a solid
 * background rectangle it will show as a filled block: remove that rectangle in the SVG.
 */
export default function Clients() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  // cursor spotlight: write CSS variables straight to the element (no React re-render)
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = gridRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    });
  };

  useLayoutEffect(() => {
    if (REDUCED) return;

    const ctx = gsap.context(() => {
      gsap.from(".partner-cell", {
        opacity: 0,
        y: 40,
        duration: 1.1,
        ease: "expo.out",
        stagger: { amount: 0.5, from: "start" },
        scrollTrigger: { trigger: gridRef.current, start: "top 85%", once: true },
      });
      gsap.from(".partner-logo", {
        scale: 0.8,
        duration: 1.3,
        ease: "elastic.out(1, 0.55)",
        stagger: { amount: 0.5, from: "start" },
        scrollTrigger: { trigger: gridRef.current, start: "top 85%", once: true },
      });
    }, sectionRef);

    return () => {
      cancelAnimationFrame(raf.current);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Our partners"
      className="relative w-full overflow-x-clip bg-[#000000] px-[5vw] py-24 text-white md:py-32"
    >
      <header className="mb-14 flex flex-col gap-8 md:mb-20 md:flex-row md:items-end md:justify-between">
        {/* reveal + red spotlight come from data-h2-effect (src/lib/headingEffects.ts):
            keep this heading as plain text */}
        <h2
          data-h2-effect
          className="text-[clamp(2.25rem,7vw,8rem)] font-light uppercase leading-tight tracking-tight"
        >
          Trusted by <br /> great brands
        </h2>
        <p className="max-w-xs text-sm leading-tight opacity-60">
          The brands and organisations we&apos;ve partnered with to bring ideas to life.
        </p>
      </header>

      <div
        ref={gridRef}
        onPointerMove={onMove}
        className="group/grid relative grid grid-cols-2 border-l border-t border-white/15 md:grid-cols-3 lg:grid-cols-6"
        style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" }}
      >
        {/* soft red light that follows the cursor across the grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/grid:opacity-100"
          style={{
            background:
              "radial-gradient(420px circle at var(--mx) var(--my), color-mix(in srgb, var(--color-accent, #ff2e4d) 16%, transparent), transparent 65%)",
          }}
        />

        {partners.map((p) => {
          const logo = (
            <span
              role="img"
              aria-label={p.name}
              className="partner-logo block h-full w-full bg-current transition-[transform,color] duration-600 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/cell:scale-110 group-hover/cell:text-white"
              style={{
                WebkitMaskImage: `url(${p.src})`,
                maskImage: `url(${p.src})`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          );

          const inner = (
            <>
              <span className="absolute left-4 top-4 font-mono text-[11px] tabular-nums text-white/40 md:left-5 md:top-5">
                {p.id}
              </span>
              <div className="h-[35%] w-[85%] text-white/65 transition-colors duration-500">
                {logo}
              </div>
            </>
          );

          const cellClass =
            "partner-cell group/cell relative z-10 flex aspect-[7/5] items-center justify-center border-b border-r border-white/15 transition-colors duration-500 hover:bg-foreground/[0.03] md:aspect-[2/1] lg:aspect-square";

          return p.href ? (
            <a
              key={p.id}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name}
              className={cellClass}
            >
              {inner}
            </a>
          ) : (
            <div key={p.id} className={cellClass}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}