import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

import ServiceCanvas from "../providers/ServiceCanvas";
import { services } from "../../data/whatWeDo";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const N = services.length;

const HOLD_START = 0.03;
const HOLD_END = 0.08;

const toFloatIndex = (p: number) =>
  Math.min(
    1,
    Math.max(
      0,
      (p - HOLD_START) / (1 - HOLD_START - HOLD_END)
    )
  ) *
  (N - 1);

const toProgress = (i: number) =>
  HOLD_START +
  (i / (N - 1)) *
    (1 - HOLD_START - HOLD_END);

export default function WhatWeDo() {
  const [active, setActive] = useState(0);
  const [webgl, setWebgl] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);

  const progress = useRef(0);

  const stRef = useRef<ScrollTrigger | null>(null);

  const images = useMemo(
    () => services.map((s) => s.image),
    []
  );

  const current = services[active];

  /* -------------------------------------------------------
     PIN SECTION + GENTLE SNAP
  ------------------------------------------------------- */

  useLayoutEffect(() => {
    if (N <= 1) return;

    const ctx = gsap.context(() => {
      stRef.current = ScrollTrigger.create({
        trigger: sectionRef.current,

        start: "top top",

        end: () =>
          `+=${Math.round(
            window.innerHeight *
              (N - 1) *
              (window.innerWidth < 768 ? 0.55 : 0.75)
          )}`,

        pin: true,

        /*
          No anticipatePin: it pre-jumps the pin a frame early
          and fights smooth (Lenis) scrolling.
        */

        invalidateOnRefresh: true,

        /*
          Snap to each service, but gently:
          - the entry / exit zones are left alone, so the section
            never yanks you forward when you arrive or back when
            you try to leave
          - it waits until scrolling has really settled
          - long, soft ease so it feels like the rest of the page
        */

        snap: {
          snapTo: (value) => {
            if (value < HOLD_START || value > 1 - HOLD_END) {
              return value;
            }

            return toProgress(
              Math.round(toFloatIndex(value))
            );
          },

          duration: {
            min: 0.6,
            max: 1.2,
          },

          delay: 0.25,

          ease: "power3.inOut",

          inertia: false,
        },

        onUpdate: (self) => {
          const f = toFloatIndex(self.progress);

          progress.current = f;

          const idx = Math.round(f);

          setActive((prev) =>
            prev === idx ? prev : idx
          );

          if (railRef.current) {
            railRef.current.style.transform =
              `scaleY(${f / (N - 1)})`;
          }
        },
      });
    }, sectionRef);

    return () => {
      stRef.current = null;

      ctx.revert();
    };
  }, []);

  /* -------------------------------------------------------
     CAPTION / MOBILE TITLE ANIMATION
  ------------------------------------------------------- */

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const tween = gsap.fromTo(
      ".wwd-m-copy, .wwd-caption",

      {
        opacity: 0,
        y: 14,
      },

      {
        opacity: 1,
        y: 0,

        duration: reduced ? 0 : 0.6,

        ease: "power3.out",

        stagger: 0.07,
      }
    );

    return () => {
      tween.kill();
    };
  }, [active]);

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  const jump = (i: number) => {
    const st = stRef.current;

    if (!st) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const target =
      st.start +
      toProgress(i) * (st.end - st.start);

    /*
      Use GSAP's scrollTo tween.

      This avoids native browser smooth scrolling,
      which can conflict with Lenis.
    */

    if (reduced) {
      window.scrollTo(0, target);
      return;
    }

    gsap.to(window, {
      scrollTo: {
        y: target,
        autoKill: true,
      },

      duration: 1.5,

      ease: "power2.inOut",

      overwrite: "auto",
    });
  };

  /* -------------------------------------------------------
     KEYBOARD NAVIGATION
  ------------------------------------------------------- */

  const onKeyDown = (
    e: React.KeyboardEvent
  ) => {
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowRight"
    ) {
      e.preventDefault();

      jump(Math.min(active + 1, N - 1));
    }

    if (
      e.key === "ArrowUp" ||
      e.key === "ArrowLeft"
    ) {
      e.preventDefault();

      jump(Math.max(active - 1, 0));
    }
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <section
      ref={sectionRef}
      aria-label="What we do"
      className="
        relative
        flex
        h-svh
        w-full
        flex-col
        overflow-hidden
        bg-background
        text-foreground
      "
    >
      {/* Stage */}

      <div
        onKeyDown={onKeyDown}
        className="
          flex
          min-h-0
          flex-1
          flex-col
          justify-center
          gap-6
          px-[5vw]
          py-6
          md:flex-row
          md:justify-between
          md:gap-[2.5vw]
          md:pb-[5vh]
          md:pt-[3vh]
          
        "
      >
        {/* Image column: image + two-line caption underneath */}

        <div
          className="
            order-1
            flex
            h-[38svh]
            
            shrink-0
            flex-col
            gap-4
            md:order-2
            md:col-span-7
            md:h-auto
            md:min-h-0
            md:py-32
            md:max-w-[40svw]
            md:flex-1
            md:shrink
          "
        >
          <div className="min-h-0 flex-1">
            {webgl ? (
              <ServiceCanvas
                images={images}
                progress={progress}
                label={current.title}
                onFail={() => setWebgl(false)}
                className="h-full w-full"
              />
            ) : (
              <div
                className="
                  relative
                  h-full
                  w-full
                  overflow-hidden
                  bg-neutral-200
                "
              >
                {services.map((s, i) => (
                  <img
                    key={s.id}
                    src={s.image}
                    alt={
                      i === active
                        ? s.title
                        : ""
                    }
                    draggable={false}
                    className={`
                      absolute
                      inset-0
                      h-[full]
                      w-full
                      object-cover
                      transition-opacity
                      duration-700
                      ${
                        i === active
                          ? "opacity-100"
                          : "opacity-0"
                      }
                    `}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop caption (mobile has its own below the title) */}
          <div className="hidden shrink-0 md:block">
            <p
              aria-live="polite"
              className="
                wwd-caption
                line-clamp-2
                min-h-[2.75em]
                max-w-[34em]
                text-[clamp(0.9rem,1.1vw,1.15rem)]
                font-light
                leading-snug
                text-foreground/60
              "
            >
              {current.text}
            </p>
          </div>
        </div>

        {/* Desktop Service List */}

        <div
          className="
            relative
            order-2
            hidden
            min-h-0
            md:order-1
            md:col-span-5
            md:flex
            md:flex-col
            md:justify-between
            md:pl-[1.6vw]
            md:py-[2.5svh]
          "
        >
          <header>
            {/* Reveal + red spotlight come from data-h2-effect (src/lib/headingEffects.ts).
                Keep this heading as plain text: no mask wrappers, no extra GSAP on it. */}
            <h2
              data-h2-effect
              className="
                text-[clamp(1.75rem,6vw,5rem)]
                font-light
                uppercase
                leading-[0.88]
                tracking-tight
                mb-4
                py-12
              "
            >
              What We Do
            </h2>
          </header>

          <ol className="flex flex-col gap-[1.4vh]">
            {services.map((s, i) => {
              const d = Math.abs(i - active);

              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    aria-current={
                      d === 0
                        ? "true"
                        : undefined
                    }
                    className="
                      group
                      flex
                      w-full
                      cursor-pointer
                      items-start
                      gap-4
                      text-left
                      transition-opacity
                      duration-500
                    "
                    style={{
                      opacity:
                        d === 0
                          ? 1
                          : Math.max(
                              0.16,
                              0.45 -
                                (d - 1) * 0.1
                            ),
                    }}
                  >
                    <span className="min-w-0">
                      <span
                        className="
                          flex
                          origin-left
                          items-center
                          transition-transform
                          duration-500
                          ease-out
                          group-hover:translate-x-1
                        "
                        style={{
                          transform:
                            d === 0
                              ? undefined
                              : "scale(0.8)",
                        }}
                      >
                        <span
                          className="
                            text-[clamp(1.4rem,2.9vw,3.1rem)]
                            font-light
                            uppercase
                            leading-[1.02]
                            tracking-[-0.02em]
                          "
                        >
                          {s.title}
                        </span>
                      </span>

                      <span
                        className={`
                          grid
                          transition-[grid-template-rows,opacity]
                          duration-500
                          ease-out
                          ${
                            d === 0
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0"
                          }
                        `}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Mobile Service Navigation */}

        <div
          className="
            order-2
            flex
            shrink-0
            flex-col
            gap-4
            md:hidden
          "
        >
          <div aria-live="polite">
            <h3
              className="
                wwd-m-copy
                mt-1
                flex
                items-start
                text-[clamp(1.75rem,8.4vw,2.6rem)]
                font-light
                uppercase
                leading-none
                tracking-[-0.02em]
              "
            >
              {current.title}
            </h3>

            <p
              className="
                wwd-caption
                mt-3
                line-clamp-2
                min-h-[2.75em]
                text-sm
                font-light
                leading-snug
                text-foreground/60
              "
            >
              {current.text}
            </p>
          </div>

          <div
            className="flex gap-1.5"
            role="group"
            aria-label="Choose a service"
          >
            {services.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => jump(i)}
                aria-label={`Go to ${s.title}`}
                aria-current={
                  i === active
                    ? "true"
                    : undefined
                }
                className="
                  flex
                  h-8
                  flex-1
                  items-center
                "
              >
                <span
                  className={`
                    h-0.5
                    w-full
                    transition-colors
                    duration-500
                    ${
                      i === active
                        ? "bg-accent"
                        : i < active
                        ? "bg-foreground/60"
                        : "bg-foreground/20"
                    }
                  `}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}