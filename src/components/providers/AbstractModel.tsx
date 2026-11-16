import { useEffect, useRef } from "react";

/**
 * Pastel swirl-stripe grain gradients (raw WebGL, no three.js).
 *
 * Fill the whole card with this (`absolute inset-0`). Soft ribbons of colour
 * radiate out of the card's TOP-RIGHT corner, curving as they travel (a spiral
 * twist), with grainy, printed-looking edges. Each card has its own pastel
 * palette so the four read as a family, not a copy:
 *   knot  card 01  soft brand red
 *   gyro  card 02  lavender / periwinkle
 *   chain card 03  mint / seafoam
 *   tower card 04  butter / apricot
 *
 * Kept deliberately quiet: low peak opacity, slow drift, no hot core.
 *
 * Interaction (subtle)
 *  - hover        a touch more intensity and reach
 *  - cursor       the stripes bend around the pointer like a magnet
 *  - click / tap  a soft wave pushes through the stripes
 *  - leave        everything eases back
 *
 * Same file name, default export and `ModelKind` type as before. Renders only
 * while visible, pauses on hidden tabs, draws one still frame for
 * prefers-reduced-motion, and frees its WebGL context on unmount.
 */

export type ModelKind = "knot" | "gyro" | "chain" | "tower";

type Palette = [string, string, string, string];

type Props = {
  kind: ModelKind;
  /** override the preset's four pastel colours */
  colors?: Palette;
  /** how far the stripes reach into the card (0.6 – 1.2) */
  reach?: number;
  className?: string;
  label?: string;
};

const PRESETS: Record<
  ModelKind,
  {
    colors: Palette;
    /** stripe density */
    freq: number;
    /** spiral twist (sign flips the curl direction) */
    twist: number;
    phase: number;
    /** drift speed of the stripes */
    speed: number;
    timeOffset: number;
  }
> = {
  knot: {
    colors: ["#ff4d5e", "#ee2a3c", "#ff8a95", "#ff6b7a"],
    freq: 3.1,
    twist: 2.4,
    phase: 0.0,
    speed: 0.22,
    timeOffset: 3,
  },
  gyro: {
    colors: ["#cbb8ff", "#b6c1ff", "#bcd4ff", "#e6c8ff"],
    freq: 2.5,
    twist: -1.9,
    phase: 1.7,
    speed: 0.18,
    timeOffset: 11,
  },
  chain: {
    colors: ["#b6ead6", "#c9f1dc", "#a3e4e2", "#e0f4d2"],
    freq: 3.5,
    twist: 3.0,
    phase: 3.1,
    speed: 0.25,
    timeOffset: 19,
  },
  tower: {
    colors: ["#ffe7ac", "#ffd6a6", "#f6f7b8", "#ffc9a8"],
    freq: 2.8,
    twist: -2.6,
    phase: 4.4,
    speed: 0.2,
    timeOffset: 27,
  },
};

const VERTEX = /* glsl */ `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uHover;
uniform float uReach;
uniform vec2 uPointer;   // pixels, GL space (origin bottom-left)
uniform vec4 uRipple;    // x px, y px, age (s), active
uniform vec4 uStripe;    // freq, twist, phase, speed
uniform vec3 uCol[4];

float hash(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float reachPx = uReach * 0.5 * (uRes.x + uRes.y) * (1.0 + 0.16 * uHover);

  // corner space: (0,0) = top-right corner, grows left (x) and down (y)
  vec2 s  = (uRes - frag) / reachPx;
  vec2 ps = (uRes - uPointer) / reachPx;
  float t = uTime;

  // slow liquid warp
  vec2 w = s + 0.20 * vec2(
    sin(s.y * 3.2 + t * 0.30 + sin(s.x * 2.1 + uStripe.z)),
    cos(s.x * 2.8 - t * 0.25 + sin(s.y * 1.7))
  );

  // the cursor bends the stripes around itself
  vec2 dm = w - ps;
  w += dm * exp(-dot(dm, dm) / 0.09) * 0.22 * uHover;

  // click wave
  float ring = 0.0;
  if (uRipple.w > 0.5) {
    vec2 rp = (uRes - uRipple.xy) / reachPx;
    ring = exp(-pow((length(s - rp) - uRipple.z * 0.9) * 8.0, 2.0)) * exp(-uRipple.z * 1.5);
  }

  // swirl field: rings around the corner + spiral twist + wobble
  float r = length(w);
  float ang = atan(w.y, w.x);
  float f = r * uStripe.x
          + ang * uStripe.y
          + 0.30 * sin(w.x * 2.4 + w.y * 1.9 + t * 0.8 + uStripe.z)
          + uStripe.z
          - t * uStripe.w
          + ring * 0.6;

  // film grain, re-rolled ~10x per second
  vec2 seed = frag + floor(t * 10.0) * vec2(37.0, 17.0);
  float n  = hash(seed);
  float n2 = hash(seed.yx * 1.37 + 7.7);

  // soft ribbons with grainy, printed edges
  float band = 0.5 + 0.5 * sin(6.28318 * f);
  band = smoothstep(0.12, 0.88, band + (n - 0.5) * 0.30);

  // pastel colour cycling smoothly along the stripes
  float x = fract(f * 0.5) * 4.0;
  vec3 col = vec3(0.0);
  float ws = 0.0;
  for (int i = 0; i < 4; i++) {
    float d = abs(mod(x - float(i) + 2.0, 4.0) - 2.0);
    float k = smoothstep(1.0, 0.0, d);
    col += uCol[i] * k;
    ws += k;
  }
  col /= max(ws, 1e-3);

  // fade away from the corner; keep the peak quiet
  float mask = 1.0 - smoothstep(0.10, 1.0, length(s));
  float a = mask * (0.12 + 0.88 * band) * 0.35 * (1.0 + 0.22 * uHover);
  a += ring * 0.10 * mask;

  // grain on alpha and colour
  a = clamp(a + (n2 - 0.5) * 0.45 * sqrt(a) * (1.0 - a), 0.0, 1.0);
  col *= 0.92 + 0.16 * n2;

  gl_FragColor = vec4(col * a, a);   // premultiplied alpha
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0.9, 0.85, 0.95];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn("AbstractModel shader error:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function AbstractModel({
  kind,
  colors,
  reach = 0.95,
  className = "",
  label = "Decorative gradient",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const colorKey = colors ? colors.join(",") : "";

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return; // no WebGL: the card simply renders without the backdrop
    host.appendChild(canvas);

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      canvas.remove();
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("AbstractModel link error:", gl.getProgramInfoLog(program));
      canvas.remove();
      return;
    }
    gl.useProgram(program);

    // one oversized triangle covers the whole canvas
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const loc = (n: string) => gl.getUniformLocation(program, n);
    const uRes = loc("uRes");
    const uTime = loc("uTime");
    const uHover = loc("uHover");
    const uReach = loc("uReach");
    const uPointer = loc("uPointer");
    const uRipple = loc("uRipple");

    const preset = PRESETS[kind];
    const palette = colors ?? preset.colors;
    gl.uniform3fv(loc("uCol"), new Float32Array(palette.flatMap((c) => hexToRgb(c))));
    gl.uniform4f(loc("uStripe"), preset.freq, preset.twist, preset.phase, preset.speed);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    let time = preset.timeOffset;
    let hover = 0;
    let hoverTarget = 0;
    // pointer in 0..1 card space (y up). Rests at the top-right corner.
    const pointer = { x: 1, y: 1 };
    const pointerTarget = { x: 1, y: 1 };
    const ripple = { x: 1, y: 1, start: -100 };

    const draw = () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      const w = canvas.width;
      const h = canvas.height;
      const age = time - ripple.start;
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uHover, hover);
      gl.uniform1f(uReach, reach);
      gl.uniform2f(uPointer, pointer.x * w, pointer.y * h);
      gl.uniform4f(uRipple, ripple.x * w, ripple.y * h, age, age < 3 ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let running = false;
    const resize = () => {
      const w = Math.max(Math.round(host.clientWidth * dpr), 1);
      const h = Math.max(Math.round(host.clientHeight * dpr), 1);
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      if (reduce || !running) draw();
    };

    /* interaction is listened for on the whole card, not just the canvas */
    const card = host.closest<HTMLElement>(".bento-card") ?? host;
    const toCard = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(r.width, 1))),
        y: Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / Math.max(r.height, 1))),
      };
    };
    const onEnter = () => (hoverTarget = 1);
    const onLeave = () => {
      hoverTarget = 0;
      pointerTarget.x = 1;
      pointerTarget.y = 1;
    };
    const onMove = (e: PointerEvent) => {
      const p = toCard(e);
      pointerTarget.x = p.x;
      pointerTarget.y = p.y;
      hoverTarget = 1;
    };
    const onDown = (e: PointerEvent) => {
      const p = toCard(e);
      ripple.x = p.x;
      ripple.y = p.y;
      ripple.start = time;
      if (reduce) draw();
    };
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);
    card.addEventListener("pointercancel", onLeave);
    if (!reduce) {
      card.addEventListener("pointermove", onMove, { passive: true });
      card.addEventListener("pointerdown", onDown, { passive: true });
    }

    /* loop */
    let raf = 0;
    let visible = false;
    let last = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      hover += (hoverTarget - hover) * Math.min(1, dt * 4);
      pointer.x += (pointerTarget.x - pointer.x) * Math.min(1, dt * 5);
      pointer.y += (pointerTarget.y - pointer.y) * Math.min(1, dt * 5);
      time += dt * (1 + hover * 0.6);
      draw();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const sync = () => (visible && !document.hidden ? start() : stop());

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { rootMargin: "80px" }
    );
    io.observe(host);
    document.addEventListener("visibilitychange", sync);

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
      card.removeEventListener("pointercancel", onLeave);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerdown", onDown);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [kind, colorKey, reach]);

  return <div ref={hostRef} role="img" aria-label={label} className={className} />;
}