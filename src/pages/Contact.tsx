import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent, ReactNode } from "react";
import { Link } from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { services } from "../data/whatWeDo";
import { BUDGETS, CONTACT, TIMELINES } from "../data/contact";
import { submitBrief } from "../lib/submitBrief";
import type { Brief } from "../lib/submitBrief";

gsap.registerPlugin(ScrollTrigger);

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const d = (s: number) => (REDUCED ? 0 : s);

const pad2 = (n: number) => String(n).padStart(2, "0");

/** same dark scope as the other black pages: theme colours flip to white on black inside <main> */
const DARK = { ["--color-background" as string]: "#000", ["--color-foreground" as string]: "#fff" };

const EMPTY: Brief = {
  services: [],
  budget: "",
  timeline: "",
  message: "",
  link: "",
  name: "",
  email: "",
  company: "",
  phone: "",
};

const STEPS = [
  { q: "What are we making?", hint: "Pick everything that fits. You can always change your mind." },
  { q: "What's the shape of it?", hint: "A rough range helps us suggest the right approach. No commitment." },
  { q: "Tell us the story.", hint: "The goal, the audience, the moment. Rough is completely fine." },
  { q: "Who should we call?", hint: "We reply within one working day." },
];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const stepValid = (step: number, b: Brief) => {
  if (step === 0) return b.services.length > 0;
  if (step === 1) return b.budget !== "" && b.timeline !== "";
  if (step === 2) return b.message.trim().length >= 10;
  return b.name.trim().length > 1 && isEmail(b.email);
};

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-xs font-light uppercase tracking-[0.12em] transition-[background-color,border-color,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 md:px-5 md:text-sm ${
        on ? "border-accent bg-accent text-white" : "border-foreground/30 hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="sp-in block">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">
        {props.label}
        {props.required && <span className="text-accent"> *</span>}
      </span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        className="mt-2 w-full border-b border-foreground/30 bg-transparent pb-3 text-[clamp(1.05rem,1.7vw,1.6rem)] font-light outline-none transition-colors duration-300 placeholder:text-foreground/20 focus:border-accent"
      />
    </label>
  );
}

/** slow outline-text ticker under the title */
function Marquee({ words }: { words: string[] }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || REDUCED) return;
    const tw = gsap.to(el, { xPercent: -50, ease: "none", duration: 45, repeat: -1 });
    const io = new IntersectionObserver(([e]) => tw.paused(!e.isIntersecting));
    io.observe(el);
    return () => {
      io.disconnect();
      tw.kill();
    };
  }, []);

  return (
    <div aria-hidden className="overflow-hidden border-y border-foreground/15 py-5 md:py-7">
      <div ref={track} className="flex w-max whitespace-nowrap">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {words.map((w) => (
              <span key={w} className="flex items-center">
                <span className="px-6 text-[clamp(1.6rem,4.2vw,4.25rem)] font-light uppercase leading-tight tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.4)] md:px-10">
                  {w}
                </span>
                <span className="text-accent">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Success screen                                                     */
/* ------------------------------------------------------------------ */

function Done({ brief, mode }: { brief: Brief; mode: "sent" | "mailto" }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (REDUCED) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".sp-tick", { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 0.9, ease: "power3.out", delay: 0.3 });
      gsap.fromTo(
        ".sp-ring",
        { scale: 0, rotation: -40 },
        { scale: 1, rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.5)" }
      );
      gsap.fromTo(
        ".sp-done",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.1, delay: 0.25 }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  const next = [
    ["01", "We read it", "Someone on the team reads your brief properly, not a quick skim."],
    ["02", "We call you", "A short call within one working day to dig into the details."],
    ["03", "You get a plan", "A clear approach, timeline and quote, shaped around your goals."],
  ];

  return (
    <div ref={root} className="px-6 py-14 md:px-12 md:py-20">
      <div className="flex items-center gap-6">
        <svg className="sp-ring" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
          <circle cx="36" cy="36" r="34" stroke="var(--color-accent, #ff2e4d)" strokeWidth="2" />
          <path
            className="sp-tick"
            d="M22 37l9 9 19-21"
            stroke="var(--color-accent, #ff2e4d)"
            strokeWidth="3"
            strokeLinecap="square"
            strokeDasharray="60"
          />
        </svg>
        <p className="sp-done font-mono text-xs uppercase tracking-[0.2em] text-foreground/60">
          {mode === "sent" ? "Brief received" : "Almost there"}
        </p>
      </div>

      <h2 className="sp-done mt-8 text-[clamp(2.25rem,6vw,6rem)] font-light uppercase leading-tight tracking-tight">
        {mode === "sent" ? (
          <>
            Thank you,
            <br />
            {brief.name.split(" ")[0]}.
          </>
        ) : (
          <>
            One last step,
            <br />
            {brief.name.split(" ")[0]}.
          </>
        )}
      </h2>

      <p className="sp-done mt-6 max-w-xl text-sm leading-tight text-foreground/60 md:text-base">
        {mode === "sent"
          ? "Your brief is with us. We'll be in touch at "
          : "Your email app should have opened with the brief ready to go. Hit send there, or write to us at "}
        <span className="text-foreground">{mode === "sent" ? brief.email : CONTACT.email}</span>.
      </p>

      <ol className="mt-12 grid grid-cols-1 border-l border-t border-foreground/15 md:grid-cols-3">
        {next.map(([n, t, body]) => (
          <li key={n} className="sp-done border-b border-r border-foreground/15 p-6 md:p-8">
            <p className="font-mono text-[11px] tabular-nums text-foreground/40">{n}</p>
            <p className="mt-4 text-[clamp(1.2rem,1.8vw,1.8rem)] font-light uppercase leading-tight">{t}</p>
            <p className="mt-3 text-sm leading-tight text-foreground/60">{body}</p>
          </li>
        ))}
      </ol>

      <div className="sp-done mt-10 flex flex-wrap gap-3">
        <Link
          to="/projects"
          className="rounded-full bg-accent px-7 py-3.5 text-sm font-light uppercase tracking-[0.12em] text-white transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105"
        >
          See our work
        </Link>
        <Link
          to="/"
          className="rounded-full border border-foreground/30 px-7 py-3.5 text-sm font-light uppercase tracking-[0.12em] transition-colors hover:border-foreground"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function ContactUs() {
  const [brief, setBrief] = useState<Brief>(EMPTY);
  const [step, setStep] = useState(0); // where we are going
  const [shown, setShown] = useState(0); // what is on screen
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "mailto" | "error">("idle");
  const [trap, setTrap] = useState(""); // honeypot: real people never fill this

  const frameRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const busy = useRef(false);
  const inView = useRef(false);
  const introRef = useRef<gsap.core.Timeline | null>(null);
  const dir = useRef(1);
  const raf = useRef(0);

  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief((b) => ({ ...b, [k]: v }));
  const toggleService = (t: string) =>
    setBrief((b) => ({
      ...b,
      services: b.services.includes(t) ? b.services.filter((x) => x !== t) : [...b.services, t],
    }));

  const sel = () => gsap.utils.selector(rootRef.current as HTMLElement);

  const go = (n: number) => {
    if (busy.current || n === step || n < 0 || n > STEPS.length - 1) return;
    dir.current = n > step ? 1 : -1;
    setStep(n);
  };

  const send = async () => {
    if (trap) {
      setStatus("sent"); // bots get a fake success
      return;
    }
    setStatus("sending");
    try {
      setStatus(await submitBrief(brief));
    } catch {
      setStatus("error");
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!stepValid(step, brief) || busy.current || status === "sending") return;
    if (step < STEPS.length - 1) go(step + 1);
    else void send();
  };

  // soft red light that follows the cursor across the frame
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = frameRef.current;
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

  useEffect(() => {
    const prev = document.title;
    document.title = "Start a project";
    return () => {
      document.title = prev;
      cancelAnimationFrame(raf.current);
    };
  }, []);

  /* ---- first time on screen ---- */
  useLayoutEffect(() => {
    const st = ScrollTrigger.create({
      trigger: frameRef.current,
      start: "top 78%",
      once: true,
      onEnter: () => {
        inView.current = true;
        introRef.current?.play();
      },
    });
    return () => st.kill();
  }, []);

  /* ---- step change: animate OUT, swap, animate IN ---- */
  useEffect(() => {
    if (shown === step) return;
    busy.current = true;
    const q = sel();
    const sign = dir.current;
    const tl = gsap.timeline({ onComplete: () => setShown(step) });
    tl.to(q(".sp-word"), { yPercent: -110 * sign, duration: d(0.4), ease: "power3.in", stagger: d(0.02) }, 0)
      .to(q(".sp-ghost"), { opacity: 0, duration: d(0.25) }, 0)
      .to(
        q(".sp-in"),
        { opacity: 0, x: -36 * sign, duration: d(0.35), ease: "power2.in", stagger: d(0.03) },
        0
      );
    return () => {
      tl.kill();
    };
    // sel only reads a ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useLayoutEffect(() => {
    if (status === "sent" || status === "mailto") return;
    const q = sel();
    const sign = dir.current;
    const tl = gsap.timeline({
      paused: !inView.current,
      onComplete: () => {
        busy.current = false;
      },
    });
    tl.fromTo(
      q(".sp-word"),
      { yPercent: 110 * sign },
      { yPercent: 0, duration: d(1), ease: "expo.out", stagger: d(0.035) },
      0
    )
      .fromTo(q(".sp-ghost"), { opacity: 0 }, { opacity: 1, duration: d(0.8) }, 0.1)
      .fromTo(
        q(".sp-in"),
        { opacity: 0, x: 40 * sign },
        { opacity: 1, x: 0, duration: d(0.9), ease: "expo.out", stagger: d(0.06) },
        0.15
      );
    introRef.current = tl;
    return () => {
      tl.kill();
      busy.current = false;
    };
    // sel only reads a ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, status]);

  const ok = stepValid(step, brief);
  const last = step === STEPS.length - 1;
  const finished = status === "sent" || status === "mailto";

  return (
    <main ref={rootRef} className="bg-background overflow-x-clip text-foreground" style={DARK}>
      {/* ---------- title ---------- */}
      <section className="px-[5vw] pb-[6svh] pt-[18svh]">
        {/* reveal + red spotlight come from data-h1-effect (src/lib/headingEffects.ts) */}
        <h1
          data-h1-effect
          className="font-season text-[clamp(3rem,11vw,13.5rem)] font-black uppercase leading-none tracking-[-0.03em]"
        >
          Start a <br /> project
        </h1>
        <div className="mt-10 flex flex-col gap-6 md:mt-14 md:flex-row md:items-end md:justify-between">
          <p className="max-w-sm text-sm leading-tight opacity-60">
            Four quick questions and we&apos;ll know exactly where to start. It takes about two minutes.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-60">
            Or write to{" "}
            <a href={`mailto:${CONTACT.email}`} className="text-accent underline-offset-4 hover:underline">
              {CONTACT.email}
            </a>
          </p>
        </div>
      </section>

      <Marquee words={services.map((s) => s.title)} />

      {/* ---------- brief builder ---------- */}
      <section className="px-[5vw] py-[7svh] md:py-[9svh]">
        <div
          ref={frameRef}
          onPointerMove={onMove}
          className="relative isolate overflow-hidden border border-foreground/15"
          style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(520px circle at var(--mx) var(--my), color-mix(in srgb, var(--color-accent, #ff2e4d) 14%, transparent), transparent 65%)",
            }}
          />

          {finished ? (
            <Done brief={brief} mode={status === "sent" ? "sent" : "mailto"} />
          ) : (
            <form noValidate onSubmit={onSubmit}>
              {/* progress */}
              <div className="flex gap-1.5 px-6 pt-6 md:px-12 md:pt-8" role="group" aria-label="Progress">
                {STEPS.map((s, i) => (
                  <button
                    key={s.q}
                    type="button"
                    disabled={i >= step}
                    onClick={() => go(i)}
                    aria-label={`Back to step ${i + 1}`}
                    aria-current={i === step ? "step" : undefined}
                    className="flex h-6 flex-1 items-center disabled:cursor-default"
                  >
                    <span className="block h-0.5 w-full bg-foreground/20">
                      <span
                        className={`block h-full bg-accent transition-[width] duration-700 ease-out ${
                          i <= step ? "w-full" : "w-0"
                        }`}
                      />
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid gap-10 px-6 pb-8 pt-8 md:grid-cols-12 md:gap-[3vw] md:px-12 md:pb-12 md:pt-12">
                {/* ---- question ---- */}
                <div className="relative md:col-span-5">
                  <span
                    aria-hidden
                    className="sp-ghost pointer-events-none absolute -top-4 right-0 select-none text-[clamp(5rem,11vw,10rem)] font-light leading-tight text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.14)] md:-top-8 md:left-0 md:right-auto"
                  >
                    {pad2(shown + 1)}
                  </span>

                  <div className="relative pt-[13vw] md:pt-[8vw]">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/50">
                      Step {pad2(shown + 1)} / {pad2(STEPS.length)}
                    </p>
                    <h2
                      aria-live="polite"
                      className="mt-4 text-[clamp(1.75rem,3.3vw,3.75rem)] font-light uppercase leading-tight tracking-[-0.02em]"
                    >
                      {STEPS[shown].q.split(" ").map((w, i) => (
                        <span key={`${shown}-${i}`}>
                          <span className="inline-block overflow-hidden align-top pb-[0.1em] mb-[-0.1em]">
                            <span className="sp-word inline-block will-change-transform">{w}</span>
                          </span>{" "}
                        </span>
                      ))}
                    </h2>
                    <p className="sp-in mt-5 max-w-xs text-sm leading-tight text-foreground/60">
                      {STEPS[shown].hint}
                    </p>
                  </div>
                </div>

                {/* ---- answers ---- */}
                <div className="md:col-span-7">
                  {shown === 0 && (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                      {services.map((s) => {
                        const on = brief.services.includes(s.title);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleService(s.title)}
                            className={`sp-in group relative aspect-square overflow-hidden text-left outline-1 transition-[outline-color] duration-500 md:aspect-4/5 ${
                              on ? "outline-accent" : "outline-foreground/15 hover:outline-foreground/60"
                            }`}
                          >
                            <img
                              src={s.image}
                              alt=""
                              loading="lazy"
                              draggable={false}
                              className={`absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 group-hover:scale-105 ${
                                on ? "grayscale-0" : "grayscale group-hover:grayscale-0"
                              }`}
                            />
                            <span className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
                            <span className="absolute left-3 top-3 font-mono text-[11px] tabular-nums text-white">
                              {s.id}
                            </span>
                            <span
                              aria-hidden
                              className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-accent text-white transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                                on ? "scale-100" : "scale-0"
                              }`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                                <path d="M4 12l6 6L20 6" />
                              </svg>
                            </span>
                            <span className="absolute inset-x-3 bottom-3 text-[clamp(0.85rem,1.3vw,1.3rem)] font-light uppercase leading-tight text-white">
                              {s.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {shown === 1 && (
                    <div className="space-y-10">
                      <fieldset className="sp-in">
                        <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">
                          Rough budget
                        </legend>
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          {BUDGETS.map((b) => (
                            <Chip key={b} on={brief.budget === b} onClick={() => set("budget", b)}>
                              {b}
                            </Chip>
                          ))}
                        </div>
                      </fieldset>
                      <fieldset className="sp-in">
                        <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">
                          Timeline
                        </legend>
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          {TIMELINES.map((t) => (
                            <Chip key={t} on={brief.timeline === t} onClick={() => set("timeline", t)}>
                              {t}
                            </Chip>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  )}

                  {shown === 2 && (
                    <div className="space-y-10">
                      <label className="sp-in block">
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">
                          Your brief <span className="text-accent">*</span>
                        </span>
                        <textarea
                          rows={6}
                          value={brief.message}
                          onChange={(e) => set("message", e.target.value)}
                          placeholder="We're launching… we want people to feel…"
                          className="mt-2 w-full resize-none border-b border-foreground/30 bg-transparent pb-3 text-[clamp(1.05rem,1.7vw,1.6rem)] font-light leading-tight outline-none transition-colors duration-300 placeholder:text-foreground/20 focus:border-accent"
                        />
                        <span className="mt-2 block text-right font-mono text-[11px] tabular-nums text-foreground/40">
                          {brief.message.trim().length} characters
                        </span>
                      </label>
                      <Field
                        label="Link to a reference (optional)"
                        value={brief.link}
                        onChange={(v) => set("link", v)}
                        type="url"
                        placeholder="https://"
                      />
                    </div>
                  )}

                  {shown === 3 && (
                    <div className="space-y-8">
                      <div className="grid gap-8 md:grid-cols-2">
                        <Field label="Name" required value={brief.name} onChange={(v) => set("name", v)} autoComplete="name" />
                        <Field label="Email" required type="email" value={brief.email} onChange={(v) => set("email", v)} autoComplete="email" />
                        <Field label="Company" value={brief.company} onChange={(v) => set("company", v)} autoComplete="organization" />
                        <Field label="Phone" type="tel" value={brief.phone} onChange={(v) => set("phone", v)} autoComplete="tel" />
                      </div>

                      {/* honeypot: hidden from people, tempting for bots */}
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden
                        value={trap}
                        onChange={(e) => setTrap(e.target.value)}
                        className="absolute left-[-9999px] h-0 w-0 opacity-0"
                        name="website"
                      />

                      <div className="sp-in border border-foreground/15 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">Your brief so far</p>
                        <p className="mt-3 text-sm font-light uppercase leading-tight tracking-wide">
                          {brief.services.join(" · ")}
                        </p>
                        <p className="mt-1 text-sm font-light uppercase leading-tight tracking-wide text-foreground/60">
                          {brief.budget} · {brief.timeline}
                        </p>
                      </div>

                      {status === "error" && (
                        <p role="alert" className="text-sm text-accent">
                          Something went wrong sending that. Please try again, or email us at{" "}
                          <a href={`mailto:${CONTACT.email}`} className="underline">
                            {CONTACT.email}
                          </a>
                          .
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ---- controls ---- */}
              <div className="flex items-center justify-between gap-4 border-t border-foreground/15 px-6 py-5 md:px-12">
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  disabled={step === 0}
                  className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/70 transition-opacity hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={!ok || status === "sending"}
                  className="group inline-flex items-center gap-3 rounded-full bg-accent px-7 py-3.5 text-sm font-light uppercase tracking-[0.12em] text-white transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] enabled:hover:scale-105 disabled:opacity-30 md:px-9 md:py-4"
                >
                  {status === "sending" ? "Sending…" : last ? "Send brief" : "Continue"}
                  <span aria-hidden className="transition-transform duration-500 group-enabled:group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ---------- other ways ---------- */}
      <section className="border-t border-foreground/15 px-[5vw] py-[7svh]">
        <dl className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {(
            [
              ["Email", CONTACT.email, `mailto:${CONTACT.email}`],
              ["Phone", CONTACT.phone, `tel:${CONTACT.phone.replace(/\s/g, "")}`],
              ["Studio", `${CONTACT.location}\n${CONTACT.hours}`, undefined],
            ] as const
          ).map(([label, value, href]) => (
            <div key={label}>
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">{label}</dt>
              <dd className="mt-3 whitespace-pre-line text-[clamp(1rem,1.5vw,1.5rem)] font-light uppercase leading-tight tracking-[-0.01em]">
                {href ? (
                  <a href={href} className="transition-colors duration-300 hover:text-accent">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

export default ContactUs;