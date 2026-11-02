import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { workData } from "../../data/workData";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Tuning knobs                                                       */
/* ------------------------------------------------------------------ */

const CURVE_DEG = 15; // angle between neighbouring cards. 8 = barely curved, 25 = strong drum
const PERSPECTIVE = 2200; // higher = flatter
const MAX_BLUR = 9; // px, for the cards furthest out
const BLUR_PER_STEP = 3.4; // px of blur added per card of distance
const VISIBLE = 2.7; // cards further than this (in card-widths) are hidden
const ASPECT = 16 / 9;

const N = workData.length;
const pad = (n: number) => String(n).padStart(2, "0");
const mod = (n: number) => ((n % N) + N) % N;

/* Edge dissolve: blur + solid fade + stippled dots ("scatter") */
const BG = "var(--color-background)";
const dots = (size: number, r: number, offset = 0) => ({
  backgroundImage: `radial-gradient(circle at center, ${BG} ${r}px, transparent ${r + 0.7}px)`,
  backgroundSize: `${size}px ${size}px`,
  backgroundPosition: `${offset}px ${offset}px`,
});

function EdgeFade({ side }: { side: "left" | "right" }) {
  const toInner = side === "left" ? "to right" : "to left";
  const mask = (stops: string) => ({
    maskImage: `linear-gradient(${toInner}, ${stops})`,
    WebkitMaskImage: `linear-gradient(${toInner}, ${stops})`,
  });

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 z-200 w-[22%] ${side === "left" ? "left-0" : "right-0"}`}
    >
      {/* 1. progressive blur */}
      <div
        className="absolute inset-0 backdrop-blur-[14px]"
        style={mask("black 0%, black 25%, transparent 100%")}
      />
      {/* 2. solid fade into the page */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${toInner}, ${BG} 0%, color-mix(in srgb, ${BG} 70%, transparent) 40%, transparent 100%)`,
        }}
      />
      {/* 3. scattered specks: coarse + fine layers, denser towards the edge */}
      <div className="absolute inset-0" style={{ ...dots(9, 2.6), ...mask("black 0%, black 35%, transparent 85%") }} />
      <div className="absolute inset-0" style={{ ...dots(5, 1.5, 3), ...mask("black 0%, transparent 70%") }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function WorkShowcase() {
  const [active, setActive] = useState(0);
  const [size, setSize] = useState({ w: 720, h: 405 });
  const [inView, setInView] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const videoEls = useRef<(HTMLVideoElement | null)[]>([]);

  const proxy = useRef({ pos: 0 });
  const geo = useRef({ R: 3000, step: 0.26, arc: 760 });
  const drag = useRef({ down: false, startX: 0, startPos: 0, lastX: 0, lastT: 0, vel: 0, moved: 0 });
  const reduced = useRef(false);

  /* ---- paint every card from a (fractional) position ---------------- */
  const render = useCallback((pos: number) => {
    const { R, step } = geo.current;
    if (stageRef.current) stageRef.current.style.transform = `translateZ(${-R}px)`;

    cardEls.current.forEach((el, i) => {
      if (!el) return;
      let d = mod(i - pos);
      if (d > N / 2) d -= N;
      const a = Math.abs(d);

      if (a > VISIBLE) {
        el.style.visibility = "hidden";
        return;
      }
      const blur = Math.min(a * BLUR_PER_STEP, MAX_BLUR);
      el.style.visibility = "visible";
      el.style.transform = `rotateY(${d * step}rad) translateZ(${R}px)`;
      el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px) saturate(${1 - Math.min(a, 2) * 0.15})` : "none";
      el.style.opacity = String(Math.max(0, 1 - Math.max(0, a - 0.15) * 0.34).toFixed(3));
      el.style.zIndex = String(100 - Math.round(a * 10));
    });
  }, []);

  /* ---- move to an (unbounded) index with easing ---------------------- */
  const goTo = useCallback(
    (index: number) => {
      gsap.killTweensOf(proxy.current);
      gsap.to(proxy.current, {
        pos: index,
        duration: reduced.current ? 0 : 1.15,
        ease: "power3.out",
        onUpdate: () => render(proxy.current.pos),
        onComplete: () => render(proxy.current.pos),
      });
      setActive(mod(index));
    },
    [render]
  );

  const step = (dir: 1 | -1) => goTo(Math.round(proxy.current.pos) + dir);

  /* ---- responsive sizing -------------------------------------------- */
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const cw = el.clientWidth;
      const w = Math.round(Math.min(cw < 768 ? cw * 0.78 : cw * 0.56, 1040));
      setSize({ w, h: Math.round(w / ASPECT) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // recompute cylinder geometry whenever the card size changes
  useLayoutEffect(() => {
    const arc = size.w * 1.053; // card + gap
    const step = (CURVE_DEG * Math.PI) / 180;
    geo.current = { arc, step, R: arc / step };
    render(proxy.current.pos);
  }, [size, render]);

  /* ---- reduced motion + in-view tracking ---------------------------- */
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  /* ---- only the centred clip plays ---------------------------------- */
  useEffect(() => {
    videoEls.current.forEach((v, i) => {
      if (!v) return;
      if (i === active && inView && !reduced.current) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [active, inView]);

  /* ---- title swap animation ----------------------------------------- */
  useEffect(() => {
    if (!titleRef.current) return;
    const tween = gsap.fromTo(
      titleRef.current,
      { yPercent: 100, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: reduced.current ? 0 : 0.7, ease: "expo.out" }
    );
    return () => {
      tween.kill();
    };
  }, [active]);

  /* ---- heading reveal on first view --------------------------------- */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".showcase-heading-line", {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".showcase-header", start: "top 80%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ---- drag / swipe -------------------------------------------------- */
  const onPointerDown = (e: React.PointerEvent) => {
    gsap.killTweensOf(proxy.current);
    Object.assign(drag.current, {
      down: true,
      startX: e.clientX,
      startPos: proxy.current.pos,
      lastX: e.clientX,
      lastT: performance.now(),
      vel: 0,
      moved: 0,
    });
    viewportRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));
    const now = performance.now();
    d.vel = (e.clientX - d.lastX) / Math.max(1, now - d.lastT); // px per ms
    d.lastX = e.clientX;
    d.lastT = now;
    proxy.current.pos = d.startPos - dx / geo.current.arc;
    render(proxy.current.pos);
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    if (d.moved < 6) return; // it was a click, handled on the card
    const momentum = (-d.vel * 220) / geo.current.arc; // fling carries a little further
    goTo(Math.round(proxy.current.pos + momentum));
  };

  /* ---- card click: bring to centre, or toggle play on the centre card - */
  const onCardClick = (i: number) => {
    if (drag.current.moved >= 6) return;
    const base = Math.round(proxy.current.pos);
    let d = mod(i - base);
    if (d > N / 2) d -= N;
    if (d !== 0) return goTo(base + d);

    const v = videoEls.current[i];
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  };

  const current = workData[active];
  const padY = 28;

  return (
    <section
      ref={sectionRef}
      className="relative w-screen overflow-x-clip bg-background py-24 text-foreground md:py-32"
    >
      {/* Header */}
      <header className="showcase-header mb-10 flex flex-col gap-8 px-[5vw] md:mb-2 md:flex-row md:items-end md:justify-center">
        <div>
          {/* <p className="font-mono text-xs uppercase tracking-[0.25em] opacity-60">(Showreel)</p> */}
          <h2 className="mt-6 text-[clamp(1.75rem,7vw,6rem)] font-light uppercase leading-[0.88] tracking-tight">
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="showcase-heading-line block">Work in motion</span>
            </span>
          </h2>
        </div>
      </header>

      {/* Title of the centred clip */}
      

      {/* Cylinder */}
      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Work showreel"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative w-full cursor-grab touch-pan-y select-none  outline-none active:cursor-grabbing focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-accent"
        style={{ height: size.h + padY * 2, perspective: PERSPECTIVE }}
      >
        <div
          ref={stageRef}
          className="absolute left-1/2 transform-3d"
          style={{ top: padY, width: size.w, height: size.h, marginLeft: -size.w / 2 }}
        >
          {workData.map((r, i) => (
            <div
              key={r.id}
              ref={(el) => { cardEls.current[i] = el; }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${N}: ${r.title}`}
              aria-hidden={i !== active}
              onClick={() => onCardClick(i)}
              className="absolute inset-0 overflow-hidden rounded-md bg-neutral-200 shadow-[0_30px_60px_-30px_rgb(26_17_16/0.45)] will-change-transform"
              style={{ backfaceVisibility: "hidden" }}
            >
              <video
                ref={(el) => { videoEls.current[i] = el; }}
                src={r.video}
                poster={r.image}
                muted
                loop
                playsInline
                preload="none"
                draggable={false}
                className="h-full w-full object-cover"
              />
              {/* soft sheen so the curvature reads on the glass */}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/15 via-transparent to-black/15" />
            </div>
          ))}
        </div>

        <EdgeFade side="left" />
        <EdgeFade side="right" />
      </div>
      <div className="mx-auto mb-4 flex items-end justify-between" style={{ width: size.w }}>
        <div className="overflow-hidden">
          <div ref={titleRef}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
              {current.category} · {current.location} · {current.year}
            </p>
            <p className="mt-1 text-lg uppercase tracking-wide md:text-2xl">{current.title}</p>
          </div>
        </div>
        <span className="font-mono text-xs">
          {pad(active + 1)} <span className="opacity-40">/ {pad(N)}</span>
        </span>
      </div>

      {/* Controls */}
      <div className="mx-auto mt-8 flex items-center justify-between" style={{ width: size.w }}>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span>{pad(active + 1)}</span>
          <span className="relative h-px w-16 bg-neutral-300 md:w-24">
            <span
              className="absolute inset-y-0 left-0 h-px bg-neutral-900 transition-all duration-700"
              style={{ width: `${((active + 1) / N) * 100}%` }}
            />
          </span>
          <span className="opacity-50">{pad(N)}</span>
        </div>
        <div className="flex gap-2">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => step(dir)}
              aria-label={dir === -1 ? "Previous video" : "Next video"}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-neutral-400 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white md:h-12 md:w-12"
            >
              {dir === -1 ? "←" : "→"}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
