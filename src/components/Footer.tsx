import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FooterGlow from "../components/providers/FooterGlow";
import { services } from "../data/whatWeDo";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Content — fill the empty ones in and they appear automatically     */
/* ------------------------------------------------------------------ */

const email: string = ""; // e.g. "hello@hashtageventz.com"
const phone: string = ""; // e.g. "+971 00 000 0000"
const socials: { label: string; href: string }[] = [
  // { label: "Instagram", href: "https://instagram.com/..." },
  // { label: "LinkedIn", href: "https://linkedin.com/company/..." },
];

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about-us" },
  { label: "Projects", to: "/projects" },
  { label: "Clients", to: "/clients" },
  { label: "Contact", to: "/contact-us" },
];

// where you work, with the IANA time zone used for the live clocks
const places = [
  { name: "Dubai", tz: "Asia/Dubai" },
  { name: "Abu Dhabi", tz: "Asia/Dubai" },
  { name: "Doha", tz: "Asia/Qatar" },
];

const WORDMARK = "HASHTAG EVENTZ";

/* ribbon tuning ----------------------------------------------------- */
const RIBBON_SPEED = 0.05; // how fast it flows: fraction of the screen width per second
const RIBBON_CURVE: "inward" | "outward" = "inward"; // inward = you're inside the ring, outward = wrapped round the outside
const RIBBON_WRAP_DEG = 82; // outward: how far round the cylinder the screen edges sit (60 = gentle, 85 = very curved)
const RIBBON_INWARD_DEG = 44; // inward: how strongly the edges swing towards you (30 = gentle, 52 = dramatic)
const RIBBON_SCROLL_BOOST = 1.2; // extra speed while you scroll (0 = constant speed, always)

const colTitle = "mb-5 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40";
const linkBase =
  "group/link relative inline-block py-1 text-base text-white/75 transition-colors duration-300 hover:text-white md:text-lg";

/* ------------------------------------------------------------------ */
/*  Pieces                                                             */
/* ------------------------------------------------------------------ */

function Underline() {
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out group-hover/link:scale-x-100"
    />
  );
}

/** Live local time for a time zone, e.g. "14:32" */
function useClock(tz: string) {
  const fmt = () =>
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date());
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = window.setInterval(() => setTime(fmt()), 15000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tz]);
  return time;
}

function Place({ name, tz }: { name: string; tz: string }) {
  const time = useClock(tz);
  return (
    <li className="flex items-baseline justify-between gap-6 border-b border-white/10 py-2.5 text-base text-white/75 md:text-lg">
      <span>{name}</span>
      <span className="font-mono text-xs tabular-nums text-white/40">{time}</span>
    </li>
  );
}

/** Round "Start a project" button with rotating text; drifts toward the cursor (mouse only). */
function MagneticCTA() {
  const areaRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const pathId = useId();

  useEffect(() => {
    const area = areaRef.current;
    const btn = btnRef.current;
    const ring = ringRef.current;
    if (!area || !btn || !ring) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const spin = gsap.to(ring, { rotation: 360, duration: 22, ease: "none", repeat: -1, transformOrigin: "50% 50%" });
    const qx = gsap.quickTo(btn, "x", { duration: 0.7, ease: "power3.out" });
    const qy = gsap.quickTo(btn, "y", { duration: 0.7, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2 - (gsap.getProperty(btn, "x") as number);
      const cy = r.top + r.height / 2 - (gsap.getProperty(btn, "y") as number);
      qx((e.clientX - cx) * 0.32);
      qy((e.clientY - cy) * 0.32);
    };
    const onEnter = () => gsap.to(spin, { timeScale: 5, duration: 0.6 });
    const onLeave = () => { qx(0); qy(0); gsap.to(spin, { timeScale: 1, duration: 0.8 }); };

    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerenter", onEnter);
    area.addEventListener("pointerleave", onLeave);
    return () => {
      spin.kill();
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerenter", onEnter);
      area.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const label = "START A PROJECT • ";
  return (
    <div ref={areaRef} className="ft-fade -m-8 p-8 md:-m-14 md:p-14">
      <Link
        ref={btnRef}
        to="/contact-us"
        aria-label="Start a project"
        className="group/cta relative flex h-[clamp(8.5rem,12vw,12.5rem)] w-[clamp(8.5rem,12vw,12.5rem)] items-center justify-center rounded-full border border-white/25 transition-colors duration-500 hover:border-accent"
      >
        {/* red fill that swells from the centre */}
        <span
          aria-hidden
          className="absolute inset-0 scale-0 rounded-full bg-accent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:scale-100"
        />
        <svg ref={ringRef} viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <path id={pathId} d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
          </defs>
          <text className="fill-white font-mono" fontSize="11.5">
            {/* stretched to exactly the circle's circumference (2 * pi * 80 = 502.6) so the ends never touch */}
            <textPath href={`#${pathId}`} textLength="498" lengthAdjust="spacing">
              {label.repeat(3)}
            </textPath>
          </text>
        </svg>
        <svg
          viewBox="0 0 24 24"
          className="relative h-[28%] w-[28%] text-white transition-transform duration-500 group-hover/cta:rotate-45"
          fill="none"
          aria-hidden
        >
          <path d="M7 17L17 7M7 7H17V17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}

function Wordmark({ className = "", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 1000 92" className={`block w-full overflow-visible ${className}`} aria-hidden>
      <text
        x="0"
        y="88"
        textLength="1000"
        lengthAdjust="spacing"
        fontSize="114"
        className="font-season font-bold"
        fill={filled ? "currentColor" : "rgba(255,255,255,0.025)"}
        stroke={filled ? "none" : "rgba(255,255,255,0.3)"}
        strokeWidth={filled ? 0 : 1.1}
      >
        {WORDMARK}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Wrapped ribbon                                                     */
/*                                                                     */
/*  The words sit on the outside of an invisible cylinder. Every       */
/*  letter is placed by its angle round that cylinder:                 */
/*    • screen position  = R · sin(angle)  → letters bunch up and      */
/*                         squeeze towards the edges                   */
/*    • width            = cos(angle)      → they turn away from you   */
/*    • opacity / fill   = cos(angle)      → outline-only and fading   */
/*                         as they round the corner; solid in front    */
/*  The flow itself is a constant, linear drift (an optional gentle    */
/*  speed-up while scrolling). Only transform / opacity / colour are   */
/*  written each frame, and only while the ribbon is on screen.        */
/* ------------------------------------------------------------------ */

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function WrappedRibbon({ items }: { items: { id: string | number; title: string }[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = Array.from(track.querySelectorAll<HTMLElement>("[data-ch]"));
    const isSep = chars.map((c) => c.dataset.ch === "sep");
    const cx = new Float32Array(chars.length); // natural (flat) centre of each letter
    const hidden = new Uint8Array(chars.length);

    const inward = RIBBON_CURVE === "inward";
    const wrapRad = (RIBBON_WRAP_DEG * Math.PI) / 180;
    const inRad = (RIBBON_INWARD_DEG * Math.PI) / 180;
    let vw = 0; // ribbon width
    let period = 0; // width of both copies together
    let R = 1; // cylinder radius
    let x = 0; // distance travelled (px)
    let speed = 1;
    let targetSpeed = 1;
    let visible = false;

    const measure = () => {
      vw = root.clientWidth;
      if (!vw) return;
      chars.forEach((el, i) => {
        cx[i] = el.offsetLeft + el.offsetWidth / 2;
      });
      period = track.scrollWidth; // two identical copies
      // outward: screen edge sits at R·sin(wrap).  inward: screen edge sits at R·tan(inward).
      R = inward ? vw / 2 / Math.tan(inRad) : vw / 2 / Math.sin(wrapRad);
    };

    const draw = () => {
      if (!vw || !period) return;
      const half = vw / 2;
      const halfPeriod = period / 2;
      for (let i = 0; i < chars.length; i++) {
        // distance from the ribbon's centre along the flat strip, wrapped so the loop is seamless
        let s = cx[i] - x - half;
        s = ((((s + halfPeriod) % period) + period) % period) - halfPeriod;

        const phi = s / R; // angle round the cylinder
        const el = chars[i];

        if (inward) {
          // Seen from inside the ring: the far wall bows towards you at the sides, so
          // letters spread apart and grow bigger (closer) at the edges, smallest in the middle.
          if (Math.abs(phi) > inRad * 1.3) {
            if (!hidden[i]) {
              el.style.opacity = "0";
              hidden[i] = 1;
            }
            continue;
          }
          hidden[i] = 0;
          const sec = 1 / Math.cos(phi);
          const tx = half + R * Math.tan(phi) - cx[i];
          el.style.transform = `translate3d(${tx.toFixed(2)}px,0,0) scale(${(sec * sec).toFixed(4)},${(1 + 0.75 * (sec - 1)).toFixed(4)})`;
          el.style.opacity = "1";
          if (!isSep[i]) {
            // solid in the middle, outline-only as it swings towards you
            el.style.color = `rgba(255,255,255,${(1 - smoothstep(0.3, 0.95, Math.abs(phi) / inRad)).toFixed(3)})`;
          }
          continue;
        }

        if (phi <= -Math.PI / 2 || phi >= Math.PI / 2) {
          if (!hidden[i]) {
            el.style.opacity = "0";
            hidden[i] = 1;
          }
          continue;
        }
        hidden[i] = 0;

        const c = Math.cos(phi);
        const tx = half + R * Math.sin(phi) - cx[i];
        el.style.transform = `translate3d(${tx.toFixed(2)}px,0,0) scale(${c.toFixed(4)},${(0.55 + 0.45 * c).toFixed(4)})`;
        el.style.opacity = Math.pow(c, 0.7).toFixed(3);
        if (!isSep[i]) {
          // solid in front, outline-only as it rounds the corner
          el.style.color = `rgba(255,255,255,${smoothstep(0.84, 0.985, c).toFixed(3)})`;
        }
      }
    };

    const reveal = () => {
      measure();
      draw();
      root.style.opacity = "1";
    };
    reveal();
    document.fonts?.ready.then(reveal); // re-measure once the display font is in

    const ro = new ResizeObserver(() => {
      measure();
      draw();
    });
    ro.observe(root);

    if (reduced) {
      return () => ro.disconnect(); // static, curved ribbon
    }

    // optional gentle speed-up while scrolling (no reversing, so it stays smooth)
    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const v = Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1) * 1000; // px/s
      lastY = window.scrollY;
      lastT = now;
      targetSpeed = 1 + Math.min(v / 1400, 1) * RIBBON_SCROLL_BOOST;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" });
    io.observe(root);

    const tick = (_t: number, deltaMs: number) => {
      if (!visible || !period) return;
      const dt = Math.min(deltaMs, 50) / 1000;
      targetSpeed += (1 - targetSpeed) * (1 - Math.exp(-dt * 1.4)); // boost eases back
      speed += (targetSpeed - speed) * (1 - Math.exp(-dt * 4));
      x = (x + speed * vw * RIBBON_SPEED * dt) % period;
      draw();
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`relative overflow-hidden border-y border-white/10 opacity-0 transition-opacity duration-700 ${
        RIBBON_CURVE === "inward" ? "py-7 md:py-12" : "py-5 md:py-8" // inward letters grow at the edges, so give them room
      }`}
      style={{
        // the far edges dissolve, so the ribbon seems to leak round the sides
        maskImage: "linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%)",
      }}
    >
      <div ref={trackRef} className="relative flex w-max whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {items.map((s) => (
              <span key={s.id} className="flex items-center">
                <span className="flex px-[2.4vw] font-season text-[clamp(1.9rem,5.4vw,5.2rem)] font-bold uppercase leading-tight tracking-[-0.02em] [-webkit-text-stroke:1px_rgba(255,255,255,0.55)]">
                  {Array.from(s.title).map((ch, k) => (
                    <span key={k} data-ch="txt" className="inline-block" style={{ color: "transparent" }}>
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </span>
                <span
                  data-ch="sep"
                  className="inline-block font-season text-[clamp(1.2rem,3vw,3rem)] font-bold leading-tight text-accent [-webkit-text-stroke:0]"
                >
                  #
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  /* reveals + gentle parallax as the footer arrives */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ft-inner",
        { yPercent: -7 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "top 15%", scrub: true },
        }
      );
      gsap.from(".ft-line", {
        yPercent: 110,
        duration: 1.3,
        ease: "expo.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ".ft-cta", start: "top 88%", once: true },
      });
      gsap.from(".ft-fade", {
        opacity: 0,
        y: 24,
        duration: 1,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: ".ft-cta", start: "top 85%", once: true },
      });
      gsap.from(".ft-cols > *", {
        opacity: 0,
        y: 24,
        duration: 1,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: ".ft-cols", start: "top 92%", once: true },
      });
      gsap.from(".ft-mark", {
        yPercent: 100,
        duration: 1.6,
        ease: "expo.out",
        scrollTrigger: { trigger: ".ft-mark-wrap", start: "top 96%", once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* cursor spotlight on the wordmark (mouse only) */
  useEffect(() => {
    const el = markRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const target = { x: -999, y: -999, on: 0 };
    const cur = { x: -999, y: -999, on: 0 };
    let raf = 0;

    const loop = () => {
      cur.x += (target.x - cur.x) * 0.14;
      cur.y += (target.y - cur.y) * 0.14;
      cur.on += (target.on - cur.on) * 0.12;
      el.style.setProperty("--mx", `${cur.x.toFixed(1)}px`);
      el.style.setProperty("--my", `${cur.y.toFixed(1)}px`);
      el.style.setProperty("--on", cur.on.toFixed(3));
      const settled = Math.abs(target.x - cur.x) < 0.3 && Math.abs(target.on - cur.on) < 0.003;
      raf = settled ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      target.on = 1;
      kick();
    };
    const onLeave = () => { target.on = 0; kick(); };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const toTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  const hasContact = Boolean(email || phone || socials.length);

  return (
    <footer ref={rootRef} className="relative isolate w-full overflow-hidden bg-black text-white">
      <FooterGlow />

      {/* Services ribbon: wrapped round a cylinder across the top */}
      <WrappedRibbon items={services} />

      <div className="ft-inner mx-auto max-w-[1920px] px-[5vw] pt-20 md:pt-36">
        {/* Call to action */}
        <div className="ft-cta flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ft-fade mb-6 font-mono text-xs uppercase tracking-[0.25em] text-white/50">(Let&rsquo;s talk)</p>
            <h2 className="text-[clamp(2.4rem,8.4vw,9rem)] font-light uppercase leading-none tracking-[-0.035em]">
              <span className="block overflow-hidden pb-[0.1em]">
                <span className="ft-line block">Got a bold idea?</span>
              </span>
              <span className="block overflow-hidden pb-[0.1em]">
                <span className="text-4xl md:text-[76px] tracking-wide leading-none block">Let&rsquo;s make it <span className=" font-season font-bold text-accent" >unforgettable</span></span>
              </span>
            </h2>
          </div>
          <MagneticCTA />
        </div>

        {/* Columns */}
        <div className="ft-cols mt-12 grid grid-cols-2 gap-x-6 gap-y-14 border-t border-white/10 pt-12 md:mt-20 md:grid-cols-12 md:gap-x-[1.5vw] md:pt-14">
          <div className="col-span-2 md:col-span-4 md:pr-[3vw]">
            <p className="max-w-sm text-lg leading-tight text-white/80 md:text-xl">
              Experience-makers who turn bold ideas into unforgettable experiences.
            </p>
            {hasContact && (
              <ul className="mt-8">
                {email && (
                  <li>
                    <a href={`mailto:${email}`} className={linkBase}>
                      {email}
                      <Underline />
                    </a>
                  </li>
                )}
                {phone && (
                  <li>
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className={linkBase}>
                      {phone}
                      <Underline />
                    </a>
                  </li>
                )}
                {socials.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noreferrer" className={linkBase}>
                      {s.label}
                      <Underline />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Footer" className="md:col-span-2">
            <h3 className={colTitle}>Navigate</h3>
            <ul>
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={linkBase}>
                    {l.label}
                    <Underline />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h3 className={colTitle}>What we do</h3>
            <ul>
              {services.map((s) => (
                <li key={s.id} className="py-1 text-base text-white/55 md:text-lg">
                  {s.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3">
            <h3 className={colTitle}>Where we work &middot; local time</h3>
            <ul className="border-t border-white/10">
              {places.map((p) => (
                <Place key={p.name} {...p} />
              ))}
            </ul>
          </div>
        </div>

        {/* Wordmark: outlined, lit in brand red under the cursor */}
        <div className="ft-mark-wrap mt-12 overflow-hidden md:mt-20">
          <div
            ref={markRef}
            className="ft-mark relative"
            style={{ ["--mx" as string]: "-999px", ["--my" as string]: "-999px", ["--on" as string]: "0" }}
          >
            <Wordmark />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 text-accent"
              style={{
                opacity: "var(--on)",
                maskImage: "radial-gradient(circle 220px at var(--mx) var(--my), #000 0%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(circle 220px at var(--mx) var(--my), #000 0%, transparent 100%)",
              }}
            >
              <Wordmark filled />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative mx-auto flex max-w-[1920px] flex-col gap-4 px-[5vw] pb-8 pt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} Hashtag Eventz. All rights reserved.</p>
        <button
          type="button"
          onClick={toTop}
          className="group/top inline-flex cursor-pointer items-center gap-3 self-start text-white/60 transition-colors hover:text-white md:self-auto"
        >
          Back to top
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 transition-transform duration-500 group-hover/top:-translate-y-1">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
              <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>
    </footer>
  );
}