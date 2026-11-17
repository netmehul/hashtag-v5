import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Heading effects, driven purely by data attributes (works on ANY element,
 * not just <h1>/<h2>):
 *
 *   <h1 data-h1-effect>Big headline</h1>     // dramatic: letters rise from a mask
 *   <h2 data-h2-effect>Section title</h2>    // calmer: words rise from a mask
 *
 * Two behaviours:
 *   1. Scroll into view  -> the text appears (once).
 *   2. Hover (mouse)     -> a spotlight follows the cursor; ONLY the text inside
 *                           the spotlight turns red. Works from the first frame
 *                           of the reveal (no waiting for the animation to end).
 *
 * Optional attributes
 *   data-spot-color="#ff2e4d"   spotlight colour (default: your --color-accent, else red)
 *   data-spot-size="240"        spotlight radius in px (default scales with font size)
 *   data-spot-glow="1"          glow / drop-shadow strength on the lit text (0 = off, 2 = stronger)
 *   data-reveal-delay="0.3"     seconds to wait before the reveal plays
 *
 * Mount it once (e.g. in App.tsx):   useHeadingEffects();
 * Elements added later (route changes etc.) are picked up automatically.
 */

type Kind = "h1" | "h2";

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const d = (seconds: number) => (REDUCED ? 0 : seconds);

const FALLBACK_RED = "var(--color-accent, #ff2e4d)";

/* ------------------------------------------------------------------ */
/*  Hover spotlight: a red copy of the text, masked by a soft circle    */
/* ------------------------------------------------------------------ */

/**
 * `html` is the clean, un-split markup of the heading. It is passed in
 * explicitly because by the time the spotlight is attached the live text
 * may already be wrapped in SplitText's masks/lines/chars.
 */
function attachSpot(
  el: HTMLElement,
  kind: Kind,
  html: string = el.innerHTML
): () => void {
  const cs = getComputedStyle(el);
  const color = el.dataset.spotColor || FALLBACK_RED;
  const fontSize = parseFloat(cs.fontSize) || 32;
  const custom = parseFloat(el.dataset.spotSize ?? "");
  const R = Number.isFinite(custom)
    ? custom
    : Math.min(340, Math.max(110, fontSize * (kind === "h1" ? 0.9 : 1.5)));

  // glow + soft drop shadow, only on the lit (red) text; scales with the font size (em)
  const glow = parseFloat(el.dataset.spotGlow ?? "1");
  const g = Number.isFinite(glow) ? Math.max(0, glow) : 1;
  const shadow =
    g > 0
      ? [
          `0 0 ${(0.14 * g).toFixed(3)}em color-mix(in srgb, ${color} 70%, transparent)`,
          `0 0 ${(0.45 * g).toFixed(3)}em color-mix(in srgb, ${color} 40%, transparent)`,
          `0 ${(0.05 * g).toFixed(3)}em ${(0.12 * g).toFixed(3)}em rgba(0,0,0,0.28)`,
        ].join(",")
      : "none";

  // A mask only paints inside its own box, so the red layer is made bigger than the
  // element (by `bleed`) and its padding pushes the text back into place. That gives
  // the glow room to spread instead of being cut off in a hard rectangle.
  const bleed = g > 0 ? Math.ceil(fontSize * 0.9 * g) : 0;
  const padPx = (v: string) => `${(parseFloat(v) || 0) + bleed}px`;

  // the red layer is positioned against the element
  const prevPosition = el.style.position;
  if (cs.position === "static") el.style.position = "relative";

  // exact copy of the text, drawn in red on top; the mask decides where it shows
  const layer = document.createElement("span");
  layer.setAttribute("aria-hidden", "true");
  layer.setAttribute("data-fx-spot", "");
  layer.innerHTML = html;
  layer.style.cssText = [
    "position:absolute",
    `inset:${-bleed}px`,
    "box-sizing:border-box",
    `padding:${padPx(cs.paddingTop)} ${padPx(cs.paddingRight)} ${padPx(cs.paddingBottom)} ${padPx(cs.paddingLeft)}`,
    "pointer-events:none",
    "user-select:none",
    "visibility:hidden",
    `color:${color}`,
    `-webkit-text-fill-color:${color}`,
    `text-shadow:${shadow}`,
    "-webkit-mask-image:radial-gradient(circle var(--fx-r,0px) at var(--fx-x,50%) var(--fx-y,50%),#000 0%,#000 38%,transparent 100%)",
    "mask-image:radial-gradient(circle var(--fx-r,0px) at var(--fx-x,50%) var(--fx-y,50%),#000 0%,#000 38%,transparent 100%)",
  ].join(";");
  el.appendChild(layer);

  const s = { x: 0, y: 0, tx: 0, ty: 0, r: 0 };
  let ticking = false;

  const render = () => {
    // the layer starts `bleed` px up/left of the element, so shift the spotlight with it
    layer.style.setProperty("--fx-x", `${s.x + bleed}px`);
    layer.style.setProperty("--fx-y", `${s.y + bleed}px`);
    layer.style.setProperty("--fx-r", `${Math.max(s.r, 0.01)}px`);
    layer.style.visibility = s.r > 0.5 ? "visible" : "hidden";
  };

  // the spotlight trails the cursor a little (smooth, never snappy)
  const tick = () => {
    const k = 1 - Math.pow(1 - 0.22, gsap.ticker.deltaRatio());
    s.x += (s.tx - s.x) * k;
    s.y += (s.ty - s.y) * k;
    render();
  };
  const start = () => {
    if (ticking) return;
    ticking = true;
    gsap.ticker.add(tick);
  };
  const stop = () => {
    if (!ticking) return;
    ticking = false;
    gsap.ticker.remove(tick);
  };

  const place = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    s.tx = e.clientX - r.left;
    s.ty = e.clientY - r.top;
  };

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    place(e);
    s.x = s.tx;
    s.y = s.ty;
    start();
    gsap.to(s, {
      r: R,
      duration: d(0.6),
      ease: "back.out(1.5)",
      overwrite: true,
      onUpdate: render,
    });
    render();
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    place(e);
  };
  const onLeave = () => {
    gsap.to(s, {
      r: 0,
      duration: d(0.45),
      ease: "power3.in",
      overwrite: true,
      onUpdate: render,
      onComplete: () => {
        stop();
        render();
      },
    });
  };

  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);

  return () => {
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    gsap.killTweensOf(s);
    stop();
    layer.remove();
    el.style.position = prevPosition;
  };
}

/* ------------------------------------------------------------------ */
/*  One element: reveal on scroll, spotlight active from the start      */
/* ------------------------------------------------------------------ */

function setup(el: HTMLElement, kind: Kind): () => void {
  let disposed = false;
  let split: SplitText | undefined;
  let st: ScrollTrigger | undefined;
  let tween: gsap.core.Tween | undefined;
  let detachSpot: (() => void) | undefined;
  let wrap: HTMLElement | undefined;

  // put the original children back and drop the wrapper
  const unwrap = () => {
    if (!wrap) return;
    while (wrap.firstChild) el.insertBefore(wrap.firstChild, wrap);
    wrap.remove();
    wrap = undefined;
  };

  const run = async () => {
    // line breaks depend on the font, so wait for it before splitting
    await document.fonts.ready;
    if (disposed) return;

    if (REDUCED) {
      el.setAttribute("data-fx-ready", "");
      detachSpot = attachSpot(el, kind);
      return;
    }

    // clean markup, captured BEFORE any splitting, used for the red layer
    const cleanHTML = el.innerHTML;

    // Move the text into its own block wrapper. SplitText only touches the
    // wrapper, so the red spotlight layer (a sibling) is never split or reverted.
    const w = document.createElement("span");
    w.setAttribute("data-fx-text", "");
    w.style.display = "block";
    while (el.firstChild) w.appendChild(el.firstChild);
    el.appendChild(w);
    wrap = w;

    split = SplitText.create(
      w,
      kind === "h1"
        ? { type: "lines,chars", mask: "lines" }
        : { type: "lines,words", mask: "lines" }
    );
    const parts = kind === "h1" ? split.chars : split.words;

    // park everything below its mask, then un-hide the element
    gsap.set(parts, {
      yPercent: kind === "h1" ? 120 : 110,
      rotate: kind === "h1" ? 5 : 0,
      transformOrigin: "0% 100%",
    });
    el.setAttribute("data-fx-ready", "");

    const delay = parseFloat(el.dataset.revealDelay ?? "") || 0;

    st = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        // hover works from the first frame of the reveal
        if (!detachSpot) detachSpot = attachSpot(el, kind, cleanHTML);

        tween = gsap.to(parts, {
          yPercent: 0,
          rotate: 0,
          duration: kind === "h1" ? 1.3 : 1.1,
          ease: "expo.out",
          delay,
          stagger: {
            amount: Math.min(
              kind === "h1" ? 0.7 : 0.5,
              parts.length * (kind === "h1" ? 0.03 : 0.06)
            ),
          },
          onComplete: () => {
            // back to plain text; the red layer lives outside the wrapper, so it stays
            split?.revert();
            split = undefined;
          },
        });
      },
    });
  };

  void run();

  return () => {
    disposed = true;
    st?.kill();
    tween?.kill();
    split?.revert();
    split = undefined;
    detachSpot?.();
    detachSpot = undefined;
    unwrap();
    el.removeAttribute("data-fx-ready");
  };
}

/* ------------------------------------------------------------------ */
/*  Global watcher                                                      */
/* ------------------------------------------------------------------ */

export function initHeadingEffects(): () => void {
  const active = new Map<HTMLElement, () => void>();

  const scan = () => {
    document
      .querySelectorAll<HTMLElement>("[data-h1-effect],[data-h2-effect]")
      .forEach((el) => {
        if (active.has(el)) return;
        const kind: Kind = el.hasAttribute("data-h1-effect") ? "h1" : "h2";
        active.set(el, setup(el, kind));
      });

    // clean up elements that left the page (route changes)
    active.forEach((dispose, el) => {
      if (!el.isConnected) {
        dispose();
        active.delete(el);
      }
    });
  };

  let raf = 0;
  const mo = new MutationObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(scan);
  });
  mo.observe(document.body, { childList: true, subtree: true });
  scan();

  return () => {
    mo.disconnect();
    cancelAnimationFrame(raf);
    active.forEach((dispose) => dispose());
    active.clear();
  };
}

/** Call once near the root of the app. */
export function useHeadingEffects() {
  useEffect(() => initHeadingEffects(), []);
}