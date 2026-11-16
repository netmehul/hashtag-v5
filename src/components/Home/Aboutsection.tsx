import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AbstractModel, { type ModelKind } from "../providers/AbstractModel";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const statement =
  "At Hashtag Eventz, we’re experience-makers who turn bold ideas into unforgettable experiences. Blending creativity, strategy, and flawless execution, we craft events that bring people together, spark emotions, and leave a lasting impression. From concept to completion, we go beyond the ordinary to create moments that matter and experiences worth remembering.";

// word positions (0-based) that get the brand treatment: "Hashtag" "Eventz,"
const BRAND_WORDS = new Set([1, 2]);

const stats: {
  value: number;
  suffix: string;
  label: string;
  /** which grain-gradient preset this card uses */
  model: ModelKind;
  /** desktop placement in the 12-column bento + mobile span */
  span: string;
  /** number size */
  size: string;
}[] = [
  {
    value: 13,
    suffix: "+",
    label: "Years of experience",
    model: "knot",
    span: "col-span-2 min-h-[22rem] md:col-span-5 md:row-span-2",
    size: "text-[clamp(4.5rem,12vw,12rem)]",
  },
  {
    value: 4000,
    suffix: "+",
    label: "Successful events",
    model: "gyro",
    span: "col-span-2 min-h-[14rem] md:col-span-7",
    size: "text-[clamp(3.5rem,7.5vw,7.5rem)]",
  },
  {
    value: 40,
    suffix: "+",
    label: "Brand collaborations",
    model: "chain",
    span: "col-span-1 min-h-[13rem] md:col-span-4",
    size: "text-[clamp(2.75rem,6vw,6.5rem)]",
  },
  {
    value: 30,
    suffix: "+",
    label: "Daily order from customer",
    model: "tower",
    span: "col-span-1 min-h-[13rem] md:col-span-3",
    size: "text-[clamp(2.75rem,6vw,6.5rem)]",
  },
];

const words = statement.split(" ");
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
// const pad = (n: number) => String(n).padStart(2, "0");

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  /* hover: a soft red glow follows the cursor across the card */
  const onCardMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  useLayoutEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // label row + spinning hash mark
      gsap.from(".about-label", {
        opacity: 0,
        y: 12,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ".about-label", start: "top 90%" },
      });
      gsap.to(".about-hash", {
        rotation: 180,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
      });

      // statement: every word rises out of its own mask...
      gsap.from(".about-word-inner", {
        yPercent: 115,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.025,
        scrollTrigger: { trigger: ".about-statement", start: "top 82%" },
      });
      // ...then lights up as you read down the paragraph
      gsap.fromTo(
        ".about-word-inner",
        { opacity: 0.22 },
        {
          opacity: 1,
          ease: "none",
          stagger: { each: 0.05 },
          scrollTrigger: { trigger: ".about-statement", start: "top 80%", end: "bottom 50%", scrub: true },
        }
      );

      // bento cards: rise in, count up, and each gradient blooms out of the top-right corner
      root.querySelectorAll<HTMLElement>(".bento-card").forEach((card, i) => {
        const num = card.querySelector<HTMLElement>(".about-num");
        const plus = card.querySelector<HTMLElement>(".about-plus");
        const target = Number(num?.dataset.value ?? 0);
        const q = (sel: string) => card.querySelectorAll(sel);

        const tl = gsap.timeline({
          scrollTrigger: { trigger: card, start: "top 90%" },
          delay: i * 0.07,
        });

        tl.from(card, { y: 70, opacity: 0, duration: 1.1, ease: "expo.out" }, 0);

        if (num) {
          num.textContent = "0";
          const counter = { v: 0 };
          tl.to(
            counter,
            { v: target, duration: 2.2, ease: "power3.out", onUpdate: () => { num.textContent = fmt(counter.v); } },
            0.2
          );
        }
        if (plus) {
          tl.fromTo(
            plus,
            { scale: 0, rotation: -180, opacity: 0 },
            { scale: 1, rotation: 0, opacity: 1, duration: 0.9, ease: "back.out(2.4)", clearProps: "transform,opacity" },
            1.0
          );
        }
        if (q(".about-fade").length) tl.from(q(".about-fade"), { opacity: 0, y: 14, duration: 0.8, ease: "power3.out", stagger: 0.1 }, 0.35);

        if (q(".orb-wrap").length) {
          tl.from(
            q(".orb-wrap"),
            { scale: 0.4, opacity: 0, transformOrigin: "100% 0%", duration: 1.8, ease: "expo.out" },
            0.3
          );
        }
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="About Hashtag Eventz"
      className="relative w-screen overflow-x-clip bg-background px-[5vw] py-28 text-foreground md:py-44"
    >
      <div className="mx-auto max-w-[1920px]">
        {/* Label row */}
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.25em]">
          <p className="about-label flex items-center gap-3">
            <span aria-hidden className="about-hash font-season text-lg font-bold leading-none text-accent">#</span>
            (About Us)
          </p>
        </div>

        {/* Statement */}
        <div className="flex flex-col py-4 md:flex-row md:items-start md:gap-[4vw]">
          <div>
            <h2 data-h2-effect className="mt-6 md:min-w-[40vw] text-[clamp(1.75rem,7vw,6rem)] font-light uppercase leading-[0.88] tracking-tight">
              We Don't Just Create Events. We Create Impact.
            </h2>
          </div>
          <p className="about-statement mt-10 text-[clamp(1.25rem,2.7vw,2.3rem)] font-light leading-[1.14] tracking-[-0.02em] md:mt-16 md:max-w-[75%]">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-top">
                <span
                  className={`about-word-inner inline-block ${
                    BRAND_WORDS.has(i) ? "font-season text-[0.72em] font-bold uppercase tracking-[-0.01em] text-accent" : ""
                  }`}
                >
                  {w}
                  {i < words.length - 1 && " "}
                </span>
              </span>
            ))}
          </p>
        </div>

        {/* Stats: bento grid */}
        <dl className="mt-10 grid grid-cols-2 gap-3 md:mt-20 md:auto-rows-[clamp(15rem,17vw,22rem)] md:grid-cols-12 md:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              onPointerMove={onCardMove}
              className={`bento-card group relative flex flex-col justify-between overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.035] p-5 transition-[translate,border-color,background-color] duration-500 ease-out hover:-translate-y-1 hover:border-accent/50 hover:bg-foreground/6 md:p-7 ${s.span}`}
            >
              {/* cursor-following red glow */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--color-accent) 20%, transparent), transparent 70%)",
                }}
              />

              {/* grain gradient: fills the whole card so it can bleed from the top-right corner */}
              <div aria-hidden className="orb-wrap pointer-events-none absolute inset-0">
                <AbstractModel className="h-full w-full" kind={s.model} />
              </div>

              {/* bottom: number + label */}
              <div className="relative z-10 mt-auto">
                <dd className={`about-fade font-light leading-[0.9] tracking-[-0.045em] tabular-nums ${s.size}`}>
                  <span className="about-num" data-value={s.value}>{fmt(s.value)}</span>
                  {/* outer span = GSAP entrance, inner span = CSS hover spin (kept apart so they don't fight) */}
                  <span className="about-plus ml-[0.1em] inline-block origin-center tracking-normal text-accent">
                    <span className="inline-block origin-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-90">
                      {s.suffix}
                    </span>
                  </span>
                </dd>
                <dt className="about-fade mt-3 max-w-full text-xs font-normal uppercase tracking-wide text-foreground/70 md:mt-5 md:max-w-[62%] md:text-base">
                  {s.label}
                </dt>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}