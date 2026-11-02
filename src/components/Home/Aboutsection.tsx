import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ModelViewer from "../providers/ModelViewer";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const statement =
  "At Hashtag Eventz, we’re experience-makers who turn bold ideas into unforgettable experiences. Blending creativity, strategy, and flawless execution, we craft events that bring people together, spark emotions, and leave a lasting impression. From concept to completion, we go beyond the ordinary to create moments that matter and experiences worth remembering.";

// word positions (0-based) that get the brand treatment: "Hashtag" "Eventz,"
const BRAND_WORDS = new Set([1, 2]);

const stats = [
  { value: 13, suffix: "+", label: "Years of experience" },
  { value: 4000, suffix: "+", label: "Successful events" },
  { value: 40, suffix: "+", label: "Brand collaborations" },
  { value: 30, suffix: "+", label: "Daily order from customer" },
];

const words = statement.split(" ");
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

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

      // statement: every word rises out of its own mask
      gsap.from(".about-word-inner", {
        yPercent: 115,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.025,
        scrollTrigger: { trigger: ".about-statement", start: "top 82%" },
      });

      // stats: rule draws across, number counts up
      root.querySelectorAll<HTMLElement>(".about-stat").forEach((stat, i) => {
        const num = stat.querySelector<HTMLElement>(".about-num");
        const target = Number(num?.dataset.value ?? 0);
        const tl = gsap.timeline({
          scrollTrigger: { trigger: stat, start: "top 90%" },
          delay: i * 0.08,
        });

        tl.fromTo(
          stat.querySelector(".about-rule"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.2, ease: "expo.inOut" },
          0
        );

        if (num) {
          num.textContent = "0";
          const counter = { v: 0 };
          tl.to(
            counter,
            {
              v: target,
              duration: 2,
              ease: "power3.out",
              onUpdate: () => { num.textContent = fmt(counter.v); },
            },
            0.15
          );
        }
        tl.from(stat.querySelectorAll(".about-fade"), { opacity: 0, y: 14, duration: 0.8, ease: "power3.out", stagger: 0.1 }, 0.3);
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
          <div>
              <p className="about-label opacity-60">Experience-makers</p>
          </div>
        </div>

        {/* Statement */}
        <div className="flex flex-col py-4 md:flex-row md:items-start md:gap-[4vw]">
          <p className="about-statement mt-10 text-[clamp(1.25rem,2.7vw,3rem)] font-light leading-[1.14] tracking-[-0.02em] md:mt-16 md:max-w-[75%]">
          {words.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-top">
              <span
                className={`about-word-inner inline-block ${
                  BRAND_WORDS.has(i) ? "font-season text-[0.82em] font-bold uppercase tracking-[-0.01em] text-accent" : ""
                }`}
              >
                {w}
                {i < words.length - 1 && "\u00A0"}
              </span>
            </span>
          ))}
          </p>

          {/* 3D shape */}
          <ModelViewer
            src="/model/abstract_shape.glb"
            label="Rotating 3D abstract shape"
            className="mt-6 aspect-square w-full md:mt-6 md:w-[28%] md:shrink-0"
          />
        </div>

        {/* Stats */}
        <dl className="mt-2 grid grid-cols-2 gap-x-[1.5vw] gap-y-14 md:mt-28 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="about-stat group relative pt-5 md:pt-6">
              <span aria-hidden className="about-rule absolute inset-x-0 top-0 h-px origin-left bg-foreground/20" />
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-700 ease-out group-hover:scale-x-100"
              />
              <dd className="about-fade text-[clamp(1.5rem,7.5vw,5rem)] font-light leading-[0.95] tracking-[-0.04em] tabular-nums">
                <span className="about-num" data-value={s.value}>{fmt(s.value)}</span>
                <span className="text-accent">{s.suffix}</span>
              </dd>
              <dt className="about-fade mt-4 font-mono text-[11px] uppercase tracking-[0.2em] opacity-60 md:mt-6 md:text-xs">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}