import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";

type Props = {
  /** image urls, in order */
  images: string[];
  /** scroll position as a float index: 0 = first image, 1 = second ... (written by the parent) */
  progress: MutableRefObject<number>;
  className?: string;
  label?: string;
  /** called once if WebGL isn't available, so the parent can show plain images */
  onFail?: () => void;
};

/* ------------------------------------------------------------------ */
/*  Shaders                                                            */
/* ------------------------------------------------------------------ */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform float uMix;       // 0 = image A, 1 = image B
  uniform float uTime;
  uniform float uHover;     // 0..1, eased
  uniform float uAspect;    // canvas width / height
  uniform float uRatioA;    // image A width / height
  uniform float uRatioB;
  uniform vec2  uPointer;   // 0..1, origin bottom-left
  uniform float uGlitch;    // 0 = glitch disabled (reduced motion), 1 = on
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int k = 0; k < 4; k++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return clamp(v / 0.94, 0.0, 1.0);
  }

  // object-fit: cover
  vec2 cover(vec2 uv, float ratio) {
    vec2 s = uAspect > ratio ? vec2(1.0, ratio / uAspect) : vec2(uAspect / ratio, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  // cover-sample with a touch of chromatic split along the radial direction
  vec3 tex(sampler2D t, vec2 uv, float ratio, float ca, float sx) {
    vec2 d = (uv - 0.5) * ca + vec2(sx, 0.0);
    float r = texture2D(t, cover(uv + d, ratio)).r;
    float g = texture2D(t, cover(uv,     ratio)).g;
    float b = texture2D(t, cover(uv - d, ratio)).b;
    return vec3(r, g, b);
  }

  void main() {
    vec2 fuv = vUv;
    vec2 uv = fuv;

    // --- hover lens: the picture swells gently toward the cursor, with a faint ripple
    vec2 pc = (uv - uPointer) * vec2(uAspect, 1.0);
    float d = length(pc);
    float fall = exp(-d * d * 9.0) * uHover;
    uv += (uPointer - uv) * fall * 0.10;
    uv += normalize(pc + 1e-4) * sin(d * 26.0 - uTime * 2.2) * fall * 0.003;
    uv += (uPointer - 0.5) * 0.012;                       // tiny parallax

    // --- transition: an organic noise front sweeps bottom -> top
    vec2 q = fuv * vec2(uAspect, 1.0) * 2.2;
    float n = fbm(q + uTime * 0.04);
    float s = n * 0.7 + fuv.y * 0.3;
    float edge = uMix * 1.38 - s;
    float r = smoothstep(0.0, 0.18, edge);
    float amt = sin(3.14159265 * uMix);                   // strongest mid-transition

    // --- glitch: sliced horizontal tearing, RGB split and corruption blocks.
    //     Runs while hovering (strongest near the cursor) and while the image swaps.
    float hoverG = uHover * mix(0.55, 1.0, exp(-d * d * 3.0));
    float gAmt = max(hoverG, amt * 0.4) * uGlitch;
    float tstep = floor(uTime * 14.0);                    // stutters at ~14 fps
    float burst = step(0.5, hash(vec2(tstep, 3.1)));      // glitch comes in bursts
    float g = gAmt * mix(0.3, 1.0, burst);
    float band = floor(fuv.y * 22.0);
    float sliceOn = step(0.80, hash(vec2(band, tstep))) * g;
    float shift = (hash(vec2(band, tstep + 7.0)) - 0.5) * 0.16 * sliceOn;
    shift += (hash(vec2(floor(fuv.y * 240.0), tstep)) - 0.5) * 0.006 * g; // fine scanline jitter
    uv.x += shift;
    float sx = g * 0.012 * (0.5 + burst);                 // R/B channel split

    // images warp as they swap
    vec2 w = vec2(n, fbm(q + 7.3)) - 0.5;
    vec3 a = tex(uA, uv + w * 0.10 * uMix,         uRatioA, amt * 0.014, sx);
    vec3 b = tex(uB, uv - w * 0.10 * (1.0 - uMix), uRatioB, amt * 0.014, sx);
    vec3 col = mix(a, b, r);

    // --- black & white by default. Colour arrives (a) everywhere while the image swaps,
    //     (b) inside the torn slices while it glitches
    float colorAmt = max(smoothstep(0.0, 0.55, amt), max(smoothstep(0.05, 0.3, sliceOn), g * 0.3));
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 mono = vec3((lum - 0.5) * 1.1 + 0.5);
    col = mix(mono, col, colorAmt);

    // soft light along the moving front
    float front = smoothstep(0.0, 0.09, edge) * (1.0 - smoothstep(0.09, 0.2, edge));
    col += front * 0.07 * amt;

    // --- glitch finish: a few inverted corruption blocks + faint scanlines
    float blk = step(0.985, hash(floor(fuv * vec2(14.0, 10.0)) + tstep * 1.7)) * burst * g;
    col = mix(col, vec3(1.0) - col, step(0.05, blk));
    col *= 1.0 - 0.06 * g * (0.5 + 0.5 * sin(fuv.y * 700.0));

    // film grain
    col += (hash(fuv * 900.0 + fract(uTime)) - 0.5) * 0.025;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ServiceCanvas({ images, progress, className = "", label = "Services", onFail }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const failRef = useRef(onFail);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    failRef.current = onFail;
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const N = images.length;

    /* ---- renderer ------------------------------------------------- */
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch {
      failRef.current?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 1.75));
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
    wrap.insertBefore(renderer.domElement, wrap.firstChild);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    /* ---- textures (dark grey until each image arrives) ------------- */
    const placeholder = new THREE.DataTexture(new Uint8Array([24, 24, 24, 255]), 1, 1);
    placeholder.needsUpdate = true;
    const textures: THREE.Texture[] = images.map(() => placeholder);
    const ratios: number[] = images.map(() => 1);

    let disposed = false;
    const loader = new THREE.TextureLoader();
    images.forEach((src, i) => {
      loader.load(
        encodeURI(src), // file names contain spaces
        (tex) => {
          if (disposed) {
            tex.dispose();
            return;
          }
          tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          textures[i] = tex;
          ratios[i] = tex.image.width / tex.image.height;
          if (i === 0) setReady(true);
        },
        undefined,
        () => console.warn("ServiceCanvas: could not load", src)
      );
    });

    /* ---- material ------------------------------------------------- */
    const uniforms = {
      uA: { value: placeholder as THREE.Texture },
      uB: { value: placeholder as THREE.Texture },
      uMix: { value: 0 },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uAspect: { value: 1 },
      uRatioA: { value: 1 },
      uRatioB: { value: 1 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uGlitch: { value: reduced ? 0 : 1 },
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    quad.frustumCulled = false;
    scene.add(quad);

    /* ---- sizing --------------------------------------------------- */
    const resize = () => {
      const w = Math.max(1, wrap.clientWidth);
      const h = Math.max(1, wrap.clientHeight);
      renderer.setSize(w, h, false);
      uniforms.uAspect.value = w / h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    /* ---- pointer (mouse / pen: hover; touch: a tap gives a short pulse) ---- */
    const target = { x: 0.5, y: 0.5, hover: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || reduced) return;
      const r = wrap.getBoundingClientRect();
      target.x = clamp01((e.clientX - r.left) / r.width);
      target.y = clamp01(1 - (e.clientY - r.top) / r.height);
      target.hover = 1;
    };
    const onLeave = () => {
      target.hover = 0;
    };
    let tapTimer = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || reduced) return;
      const r = wrap.getBoundingClientRect();
      target.x = clamp01((e.clientX - r.left) / r.width);
      target.y = clamp01(1 - (e.clientY - r.top) / r.height);
      target.hover = 1;
      window.clearTimeout(tapTimer);
      tapTimer = window.setTimeout(() => {
        target.hover = 0;
      }, 1400);
    };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointerdown", onDown);

    /* ---- loop (only while on screen) ------------------------------ */
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let time = 0;
    let cur = progress.current;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced) time += dt;

      // ease toward the scroll position so a flick of the wheel still plays out smoothly
      cur += (progress.current - cur) * (1 - Math.exp(-7 * dt));
      const i = Math.min(Math.floor(cur + 1e-4), N - 1);
      const next = Math.min(i + 1, N - 1);
      const m = i === N - 1 ? 0 : smooth(0.28, 0.72, cur - i); // each image dwells, then swaps

      uniforms.uA.value = textures[i];
      uniforms.uB.value = textures[next];
      uniforms.uRatioA.value = ratios[i];
      uniforms.uRatioB.value = ratios[next];
      uniforms.uMix.value = m;
      uniforms.uTime.value = time;

      const k = 1 - Math.exp(-6 * dt);
      uniforms.uPointer.value.x += (target.x - uniforms.uPointer.value.x) * k;
      uniforms.uPointer.value.y += (target.y - uniforms.uPointer.value.y) * k;
      uniforms.uHover.value += (target.hover - uniforms.uHover.value) * k;

      renderer.render(scene, camera);
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(wrap);

    /* ---- cleanup -------------------------------------------------- */
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerdown", onDown);
      window.clearTimeout(tapTimer);
      textures.forEach((t) => t.dispose());
      placeholder.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [images, progress]);

  return (
    <div ref={wrapRef} role="img" aria-label={label} className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      {/* the canvas is injected by the effect; this veil fades away once the first image is in */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-10 bg-neutral-900 transition-opacity duration-1000 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}