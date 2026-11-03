import { useLayoutEffect, useRef } from "react";
import type { PointerEvent } from "react";

import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { testimonials } from "../../data/testimonials";
import type { Testimonial } from "../../data/testimonials";

gsap.registerPlugin(ScrollTrigger, Draggable);

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const d = (seconds: number) => (REDUCED ? 0 : seconds);

/** resting tilt of each note, in degrees (wraps if there are more notes) */
const TILTS = [-2.5, 1.8, -1.2, 2.6, -2, 1.2, -3, 2.2];

/** three kinds of paper so the board doesn't read as one repeated card */
const PAPERS = [
  "bg-[#ecebe4] text-[#161616]", // card stock
  "bg-neutral-900 text-foreground ring-1 ring-foreground/15", // dark note
  "bg-accent text-background", // accent note
];

const PIN_COLORS = ["#ff2e4d", "#e9e9e2", "#ff2e4d"];

/* ------------------------------------------------------------------ */

/** Media only exists when there is something to show.
 *  video   -> still frame (poster) until hovered, then plays; tap toggles on touch
 *  image   -> plain photo
 *  neither -> nothing is rendered, the note is text only */
function Media({ t }: { t: Testimonial }) {
  const ref = useRef<HTMLVideoElement>(null);

  if (t.video) {
    const play = () => {
      void ref.current?.play().catch(() => {});
    };
    const stop = () => {
      const v = ref.current;
      if (!v) return;
      v.pause();
      v.currentTime = 0;
    };

    return (
      <div
        className="group/media relative aspect-[4/3] w-full overflow-hidden bg-neutral-900"
        onPointerEnter={(e: PointerEvent) => e.pointerType === "mouse" && play()}
        onPointerLeave={(e: PointerEvent) => e.pointerType === "mouse" && stop()}
        onClick={() => {
          // no hover on touch screens: tap to play / pause
          if (window.matchMedia("(hover: hover)").matches) return;
          const v = ref.current;
          if (!v) return;
          if (v.paused) play();
          else stop();
        }}
      >
        <video
          ref={ref}
          src={t.video}
          poster={t.image || undefined}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`Video testimonial from ${t.name}`}
          className="h-full w-full object-cover grayscale transition-[filter] duration-500 group-hover/media:grayscale-0"
        />
        {/* play glyph: only there to say "this moves", fades once it does */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white transition-opacity duration-300 group-hover/media:opacity-0"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2.5 1.2v9.6L10.5 6z" />
          </svg>
        </span>
      </div>
    );
  }

  if (t.image) {
    return (
      <div className="group/media aspect-[4/3] w-full overflow-hidden bg-neutral-900">
        <img
          src={t.image}
          alt=""
          draggable={false}
          className="h-full w-full object-cover grayscale transition-[filter] duration-500 group-hover/media:grayscale-0"
        />
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */

export default function Testimonials() {
  const rootRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".tm-card");
      const rotOf = (el: Element) => Number((el as HTMLElement).dataset.rot);

      // softer tilt on small screens so notes never poke past the board edge
      const k = window.innerWidth < 768 ? 0.5 : 1;

      // 1. every note starts parked just off screen, on the side of the board
      //    it sits on (set before first paint). Notes near the middle alternate
      //    left / right, so on mobile (one column) they zig-zag in.
      const board = (boardRef.current as HTMLElement).getBoundingClientRect();
      const mid = board.left + board.width / 2;
      const spots = cards.map((el) => el.getBoundingClientRect());

      cards.forEach((el, i) => {
        const r = TILTS[i % TILTS.length] * k;
        el.dataset.rot = String(r);
        const pin = el.querySelector(".tm-pin");

        if (REDUCED) {
          gsap.set(el, { rotation: r });
          return;
        }

        const box = spots[i];
        const off = box.left + box.width / 2 - mid;
        const dir =
          Math.abs(off) < board.width * 0.12 ? (i % 2 ? 1 : -1) : off > 0 ? 1 : -1;
        const x =
          dir > 0 ? window.innerWidth - box.left + 40 : -(box.right + 40);

        gsap.set(el, {
          x,
          y: 30,
          rotation: r + dir * 16,
          scale: 0.94,
          opacity: 0,
        });
        if (pin) gsap.set(pin, { scale: 0 });
      });

      gsap.from(".tm-heading", {
        yPercent: 110,
        duration: d(1.2),
        ease: "expo.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 80%" },
      });

      /* ---- dragging (mouse devices only) ----
         Each note becomes draggable only AFTER its own drop-in has finished.
         Creating Draggable while a note is still mid-animation made it measure
         the board from the wrong spot, which is what threw notes around. */
      let z = 10;
      let enabled = false;
      const revealed = new Set<HTMLElement>();
      const started = new Set<HTMLElement>();
      const drags = new Map<HTMLElement, Draggable>();

      const arm = (el: HTMLElement) => {
        if (!enabled || !revealed.has(el) || drags.has(el)) return;
        const [dr] = Draggable.create(el, {
          type: "x,y",
          bounds: boardRef.current as HTMLElement,
          edgeResistance: 0.85,
          minimumMovement: 4,
          onPress() {
            const t = this.target as HTMLElement;
            gsap.set(t, { zIndex: ++z });
            gsap.to(t, {
              scale: 1.04,
              rotation: 0,
              boxShadow: "0 40px 60px -24px rgba(0,0,0,0.75)",
              duration: d(0.3),
              ease: "power3.out",
              overwrite: "auto",
            });
          },
          onRelease() {
            const t = this.target as HTMLElement;
            gsap.to(t, {
              scale: 1,
              rotation: rotOf(t),
              boxShadow: "0 14px 30px -14px rgba(0,0,0,0.6)",
              duration: d(0.6),
              ease: "elastic.out(1, 0.6)",
              overwrite: "auto",
            });
          },
        });
        drags.set(el, dr);
      };

      mm.add("(min-width: 768px) and (pointer: fine)", () => {
        enabled = true;
        revealed.forEach(arm);
        return () => {
          // leaving desktop: forget every drag offset so notes go back to the grid
          enabled = false;
          drags.forEach((dr) => dr.kill());
          drags.clear();
          revealed.forEach((el) =>
            gsap.set(el, {
              x: 0,
              y: 0,
              scale: 1,
              rotation: rotOf(el),
              clearProps: "boxShadow,zIndex",
            })
          );
        };
      });

      /* ---- the drop-in: each note is pinned as it scrolls into view ---- */
      const reveal = (batch: Element[]) => {
        const fresh = (batch as HTMLElement[]).filter((el) => !started.has(el));
        if (!fresh.length) return;
        fresh.forEach((el) => started.add(el));

        // fade in quickly while the note is still far away...
        gsap.to(fresh, {
          opacity: 1,
          duration: d(0.35),
          ease: "power1.out",
          stagger: d(0.14),
        });

        // ...and fly it in from the side, settling into its tilt
        gsap.to(fresh, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: (_i: number, el: Element) => rotOf(el),
          duration: d(1.25),
          ease: "expo.out",
          stagger: d(0.14),
          onComplete: () => {
            fresh.forEach((el) => {
              revealed.add(el);
              arm(el);
            });
          },
        });

        gsap.to(
          fresh.map((el) => el.querySelector(".tm-pin")).filter(Boolean),
          {
            scale: 1,
            duration: d(0.35),
            ease: "back.out(3)",
            stagger: d(0.12),
            delay: d(0.7),
          }
        );
      };

      ScrollTrigger.batch(cards, {
        start: "top 92%",
        onEnter: reveal,
        onEnterBack: reveal,
      });
    }, rootRef);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      aria-label="Testimonials"
      className="relative isolate w-full overflow-hidden bg-background px-[5vw] py-[8svh] text-foreground md:py-[12svh]"
    >
      <h2 className="mb-[4svh] text-[clamp(1.75rem,6vw,5rem)] text-center font-light uppercase leading-[0.88] tracking-tight md:mb-[7svh]">
        <span className="block overflow-hidden pb-[0.08em]">
          <span className="tm-heading block">What They Say</span>
        </span>
      </h2>

      {/* The board. It clips its notes top and bottom (clip-path), but not at the sides, so
          notes can fly in from outside the board and still never slide over the heading.
          Notes sit in a plain grid: a long quote makes its own note taller. */}
      <div
        ref={boardRef}
        className="relative isolate grid grid-cols-1 items-start gap-x-10 gap-y-10 [clip-path:inset(0_-100vw)] px-4 pb-8 pt-9 sm:grid-cols-2 sm:px-8 md:gap-y-14 md:px-10 md:pb-14 md:pt-14 lg:grid-cols-3"
      >
        {/* The board surface (border, tint, dots) is its own layer behind the notes,
            so the edge fade mask only touches the board and never the cards. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 border border-foreground/15 bg-foreground/[0.03] mask-l-from-75% mask-r-from-75% mask-t-from-75% mask-b-from-75%"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in srgb, currentColor 20%, transparent) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        {testimonials.map((t, i) => {
          const paper = PAPERS[i % PAPERS.length];
          const pin = PIN_COLORS[i % PIN_COLORS.length];
          const hasMedia = Boolean(t.video || t.image);

          return (
            <figure
              key={t.id}
              className={`tm-card relative w-full select-none shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)] sm:max-lg:even:mt-12 md:cursor-grab md:active:cursor-grabbing lg:nth-[3n+2]:mt-14 ${paper}`}
            >
              <span
                aria-hidden
                className="tm-pin absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.45)]"
                style={{
                  background: `radial-gradient(circle at 35% 30%, #fff8, ${pin} 55%)`,
                }}
              />

              {hasMedia && (
                <div className="p-3 pb-0">
                  <Media t={t} />
                </div>
              )}

              <blockquote
                className={`px-5 pb-1 text-[clamp(0.95rem,1.05vw,1.1rem)] font-light leading-relaxed tracking-[-0.005em] ${
                  hasMedia ? "pt-4" : "pt-7"
                }`}
              >
                {t.quote}
              </blockquote>

              <figcaption className="px-5 pb-5 pt-4">
                <div className="text-base font-normal leading-tight">{t.name}</div>
                <div className="mt-0.5 text-sm font-light opacity-60">
                  {t.role}, {t.company}
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}