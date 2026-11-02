import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GalleryGL, { type PointerState } from "../providers/GalleryGL";

gsap.registerPlugin(Flip, ScrollTrigger);

type Item = {
  id: string;
  src: string;
  title: string;
  tag: string;
  text: string;
  focus?: [number, number]; // focal point for cropping (0-1, origin top-left)
  span: string; // desktop placement in the 12x12 bento grid
};

const items: Item[] = [
  { id: "01", src: "/GalleryAssets/01.webp", title: "Launch Night", tag: "Events", text: "A full-scale launch built around one moment the room would remember.", span: "md:col-start-1 md:col-span-5 md:row-start-1 md:row-span-5" },
  { id: "02", src: "/GalleryAssets/02.webp", title: "Brand Story", tag: "Strategy", text: "Positioning turned into a story people could walk through.", span: "md:col-start-1 md:col-span-5 md:row-start-6 md:row-span-3" },
  { id: "03", src: "/GalleryAssets/03.webp", title: "Main Stage", tag: "Exhibitions", text: "Staging, light and sound designed as a single piece.", span: "md:col-start-1 md:col-span-5 md:row-start-9 md:row-span-4" },
  { id: "04", src: "/GalleryAssets/04.webp", title: "Crowd Moments", tag: "Events", text: "The unplanned reactions that tell you an event worked.", span: "md:col-start-6 md:col-span-3 md:row-start-1 md:row-span-4" },
  { id: "05", src: "/GalleryAssets/05.webp", title: "Campaign Shoot", tag: "Advertising", text: "Campaign imagery produced end to end, from concept to final frame.", span: "md:col-start-6 md:col-span-3 md:row-start-5 md:row-span-4" },
  { id: "06", src: "/GalleryAssets/06.webp", title: "Behind the Scenes", tag: "Production", text: "The crew, the schedule and the details nobody sees on the night.", span: "md:col-start-6 md:col-span-3 md:row-start-9 md:row-span-4" },
  { id: "07", src: "/GalleryAssets/07.webp", title: "Product Reveal", tag: "Launch", text: "A reveal choreographed to land exactly when the audience is ready.", span: "md:col-start-9 md:col-span-4 md:row-start-1 md:row-span-4" },
  { id: "08", src: "/GalleryAssets/08.webp", title: "Brand Activation", tag: "Experience", text: "Hands-on brand experiences that people choose to stay in.", span: "md:col-start-9 md:col-span-4 md:row-start-5 md:row-span-3" },
  { id: "09", src: "/GalleryAssets/09.webp", title: "Gala Evening", tag: "Events", text: "An evening designed from the guest list outward.", span: "md:col-start-9 md:col-span-4 md:row-start-8 md:row-span-5" },
];

const glItems = items.map(({ id, src, focus }) => ({ id, src, focus }));
const pad = (n: number) => String(n).padStart(2, "0");

const tileClass = (it: Item, activeId: string | null) => {
  if (activeId === null) return `col-span-1 row-span-1 ${it.span}`;
  if (activeId === it.id) return "order-[-2] col-span-2 row-span-2 md:col-span-8 md:row-span-5";
  return "col-span-1 row-span-1 md:col-span-3 md:row-span-2";
};

export default function WorkSection() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [webgl, setWebgl] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tileEls = useRef<Record<string, HTMLElement | null>>({});
  const pointer = useRef<PointerState>({ id: null, x: 0.5, y: 0.5 });
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const firstRun = useRef(true);

  const activeItem = items.find((i) => i.id === activeId) ?? null;

  const select = (id: string | null) => {
    if (id === activeId) return;
    flipState.current = Flip.getState(
      Object.values(tileEls.current).filter(Boolean) as HTMLElement[]
    );
    setActiveId(id);
  };

  const go = (dir: 1 | -1) => {
    if (!activeId) return;
    const i = items.findIndex((x) => x.id === activeId);
    select(items[(i + dir + items.length) % items.length].id);
  };

  useLayoutEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const state = flipState.current;
    if (!state) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      Flip.from(state, {
        duration: reduced ? 0 : 0.9,
        ease: "power3.inOut",
        scale: false, // animate real width/height so the WebGL planes never stretch
        onComplete: () => ScrollTrigger.refresh(),
      });
      if (activeId) {
        gsap.fromTo(
          ".gallery-ui",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6, delay: reduced ? 0 : 0.45, ease: "power3.out", stagger: 0.06 }
        );
      }
    }, gridRef);

    // keep the stage comfortably in view (only scrolls if it isn't already)
    const r = gridRef.current!.getBoundingClientRect();
    if (activeId && (r.top < 60 || r.top > window.innerHeight * 0.35)) {
      window.scrollTo({
        top: r.top + window.scrollY - 100,
        behavior: reduced ? "auto" : "smooth",
      });
    }

    return () => ctx.revert();
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".gallery-heading-line", {
        yPercent: 110,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".gallery-header", start: "top 80%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-screen overflow-x-clip px-[5vw] py-24 md:py-32">
      {/* Header */}
      <header className="gallery-header mb-14 flex flex-col gap-8 md:mb-20 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] opacity-60">(Gallery)</p>
          <h2 className="mt-6 text-[clamp(2.25rem,7vw,8rem)] font-light uppercase leading-[0.88] tracking-tight">
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="gallery-heading-line block">Glimpses of</span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="gallery-heading-line block">our excellence</span>
            </span>
          </h2>
        </div>
        <div className="max-w-xs text-sm leading-relaxed opacity-60">
          <p>Moments from the events, campaigns and brand stories we&apos;ve brought to life.</p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em]">Click any image to expand</p>
        </div>
      </header>

      {/* Grid */}
      <div
        ref={gridRef}
        className="relative isolate grid auto-rows-[38vw] grid-cols-2 gap-3 md:auto-rows-[6.5vw] md:grid-cols-12 md:gap-[1.1vw]"
      >
        <GalleryGL
          items={glItems}
          tileEls={tileEls}
          pointer={pointer}
          activeId={activeId}
          onFail={() => setWebgl(false)}
        />

        {items.map((it) => {
          const isActive = activeId === it.id;
          return (
            <figure
              key={it.id}
              ref={(el) => { tileEls.current[it.id] = el; }}
              onPointerEnter={() => { pointer.current.id = it.id; }}
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                pointer.current.id = it.id;
                pointer.current.x = (e.clientX - r.left) / r.width;
                pointer.current.y = 1 - (e.clientY - r.top) / r.height;
              }}
              onPointerLeave={() => { if (pointer.current.id === it.id) pointer.current.id = null; }}
              className={`group relative overflow-hidden bg-neutral-200 ${tileClass(it, activeId)}`}
            >
              <img
                src={it.src}
                alt={it.title}
                draggable={false}
                className={`absolute inset-0 h-full w-full object-cover ${webgl ? "opacity-0" : ""}`}
              />

              {!isActive && (
                <>
                  <button
                    type="button"
                    onClick={() => select(it.id)}
                    aria-label={`Open ${it.title}`}
                    className="absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:-outline-offset-4 focus-visible:outline-white"
                  />
                  <span className="pointer-events-none absolute left-3 top-3 z-10 font-mono text-[11px] text-white mix-blend-difference md:left-4 md:top-4">
                    {it.id}
                  </span>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between bg-linear-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:p-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">{it.tag}</p>
                      <p className="mt-1 text-sm uppercase tracking-wide text-white md:text-base">{it.title}</p>
                    </div>
                    <span className="font-mono text-lg leading-none text-white">+</span>
                  </div>
                </>
              )}

              {/* Expanded stage: just the image and a small counter chip */}
              {isActive && (
                <span
                  className="gallery-ui pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-black/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white backdrop-blur-sm md:left-6 md:top-6"
                  style={{ opacity: 0 }}
                >
                  {it.id} / {pad(items.length)}
                </span>
              )}
            </figure>
          );
        })}

        {/* Caption panel beside the stage */}
        {activeItem && (
          <aside className="-order-1 col-span-2 flex flex-col justify-between border-t border-neutral-300 pt-4 md:col-span-4 md:row-span-5 md:pl-[1.5vw] md:pt-5">
            <div>
              <div className="gallery-ui flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em]" style={{ opacity: 0 }}>
                <span className="opacity-60">{activeItem.tag}</span>
                <button
                  type="button"
                  onClick={() => select(null)}
                  className="flex items-center gap-2 cursor-pointer py-2 transition-opacity hover:opacity-60"
                >
                  Close <span aria-hidden>✕</span>
                </button>
              </div>

              <h3
                className="gallery-ui mt-5 text-[clamp(1.75rem,3.4vw,4rem)] font-light uppercase leading-[0.92] tracking-tight md:mt-8"
                style={{ opacity: 0 }}
              >
                {activeItem.title}
              </h3>

              <p className="gallery-ui mt-4 py-3 hidden max-w-sm text-sm leading-relaxed opacity-60 md:block" style={{ opacity: 0 }}>
                {activeItem.text} 5555
              </p>
            </div>

            <div className="gallery-ui flex items-center justify-between" style={{ opacity: 0 }}>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span>{activeItem.id}</span>
                <span className="relative h-px w-16 bg-neutral-300 md:w-24">
                  <span
                    className="absolute inset-y-0 left-0 h-px bg-neutral-900 transition-all duration-700"
                    style={{ width: `${(items.findIndex((i) => i.id === activeItem.id) + 1) / items.length * 100}%` }}
                  />
                </span>
                <span className="opacity-50">{pad(items.length)}</span>
              </div>
              <div className="flex gap-2">
                {([-1, 1] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => go(dir)}
                    aria-label={dir === -1 ? "Previous image" : "Next image"}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-400 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white md:h-12 md:w-12"
                  >
                    {dir === -1 ? "←" : "→"}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}