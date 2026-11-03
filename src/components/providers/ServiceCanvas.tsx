import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Props = {
  /** image urls, in order */
  images: string[];
  /** scroll position as a float index: 0 = first image, 1 = second ... (written by the parent) */
  progress: MutableRefObject<number>;
  /** the service currently selected (integer) */
  active: number;
  /** two floating words per service, e.g. [["Launches","Expos"], ...] */
  tags?: Array<[string, string]>;
  /** optional pill colours per service: [colourOfWord1, colourOfWord2] */
  tagColors?: Array<[string, string]>;
  className?: string;
  label?: string;
  /** called once if WebGL isn't available, so the parent can show plain images */
  onFail?: () => void;
};

/* ------------------------------------------------------------------ */
/*  Layout (fractions of the whole canvas)                             */
/* ------------------------------------------------------------------ */

/** The photo frame, in canvas uv (origin bottom-left). The margin around it is
 *  where the pills and the chrome object are allowed to overlap the edges. */
const FRAME = { x: 0.1, y: 0.1, w: 0.84, h: 0.82 };
/** Where the chrome object sits: fraction from left / from top. */
const ANCHOR = { x: 0.15, y: 0.87 };

const FOV = 32;
const CAM_Z = 8;

const DEFAULT_TAGS: [string, string] = ["Ideas", "Impact"];
const DEFAULT_COLORS: [string, string] = ["#ff2e4d", "#8f8f1c"];
const PILL_REST = [-9, 7]; // resting rotation of each pill, degrees

/** One chrome shape per service (cycled). Torus knots read as liquid metal and are cheap. */
const KNOTS = [
  { p: 2, q: 3, tube: 0.34 },
  { p: 3, q: 2, tube: 0.3 },
  { p: 2, q: 5, tube: 0.26 },
  { p: 3, q: 4, tube: 0.24 },
  { p: 1, q: 3, tube: 0.4 },
  { p: 5, q: 3, tube: 0.2 },
];

/* ------------------------------------------------------------------ */
/*  Shaders (photo layer)                                              */
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
  uniform float uAspect;    // photo frame width / height
  uniform float uRatioA;    // image A width / height
  uniform float uRatioB;
  uniform vec2  uPointer;   // frame uv, origin bottom-left
  uniform vec4  uFrame;     // x, y, w, h of the photo frame in canvas uv
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
    // everything below happens inside the photo frame; outside it stays transparent
    vec2 fuv = (vUv - uFrame.xy) / uFrame.zw;
    if (fuv.x < 0.0 || fuv.x > 1.0 || fuv.y < 0.0 || fuv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }
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

export default function ServiceCanvas({
  images,
  progress,
  active,
  tags,
  tagColors,
  className = "",
  label = "Services",
  onFail,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const failRef = useRef(onFail);
  const activeRef = useRef(active);
  const [ready, setReady] = useState(false);

  // pill DOM: parallax wrapper (driven by the render loop) > float wrapper (gsap idle bob) > body (gsap pop in/out)
  const parRefs = useRef<(HTMLDivElement | null)[]>([]);
  const floatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [shown, setShown] = useState(active);
  const shownRef = useRef(active);
  const mounted = useRef(false);

  useEffect(() => {
    failRef.current = onFail;
    activeRef.current = active;
  });

  /* ---------------- pills: idle float ---------------- */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tweens = floatRefs.current.map((el, i) =>
      el
        ? gsap.to(el, {
            y: i ? -9 : 9,
            x: i ? 4 : -3,
            rotation: i ? -2.5 : 2.5,
            duration: 2.8 + i * 0.7,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          })
        : null
    );
    return () => tweens.forEach((t) => t?.kill());
  }, []);

  /* ---------------- pills: swap words when the service changes ---------------- */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const els = bodyRefs.current.filter(Boolean) as HTMLDivElement[];
    const tl = gsap.timeline();
    if (shownRef.current !== active) {
      // pop out, then swap the text (the layout effect below pops the new words in)
      tl.to(els, {
        scale: 0,
        opacity: 0,
        rotation: (i: number) => (i ? 28 : -28),
        duration: 0.26,
        ease: "back.in(2.2)",
        stagger: 0.05,
        overwrite: true,
      }).add(() => setShown(active));
    } else {
      // user bounced back before the swap happened: just restore
      tl.to(els, {
        scale: 1,
        opacity: 1,
        rotation: (i: number) => PILL_REST[i],
        duration: 0.5,
        ease: "back.out(1.8)",
        stagger: 0.05,
        overwrite: true,
      });
    }
    return () => {
      tl.kill();
    };
  }, [active]);

  useLayoutEffect(() => {
    shownRef.current = shown;
    const els = bodyRefs.current.filter(Boolean) as HTMLDivElement[];
    const tween = gsap.fromTo(
      els,
      { scale: 0, opacity: 0, rotation: (i: number) => (i ? 30 : -30) },
      {
        scale: 1,
        opacity: 1,
        rotation: (i: number) => PILL_REST[i],
        duration: 1.1,
        ease: "elastic.out(1, 0.5)",
        stagger: 0.1,
        delay: 0.12,
        overwrite: true,
      }
    );
    return () => {
      tween.kill();
    };
  }, [shown]);

  /* ---------------- WebGL ---------------- */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const N = images.length;

    /* ---- renderer ------------------------------------------------- */
    let renderer: THREE.WebGLRenderer;
    try {
      // antialias on: the chrome object's silhouette needs it (the photo layer doesn't care)
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      failRef.current?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 1.75));
    renderer.autoClear = false; // two passes: photo layer, then the 3D object on top
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
    wrap.insertBefore(renderer.domElement, wrap.firstChild);

    /* ---- photo layer (full-screen quad) ---------------------------- */
    const bgScene = new THREE.Scene();
    const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

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
      uFrame: { value: new THREE.Vector4(FRAME.x, FRAME.y, FRAME.w, FRAME.h) },
      uGlitch: { value: reduced ? 0 : 1 },
    };
    const bgMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
    });
    const bgGeometry = new THREE.PlaneGeometry(2, 2);
    const bgQuad = new THREE.Mesh(bgGeometry, bgMaterial);
    bgQuad.frustumCulled = false;
    bgScene.add(bgQuad);

    /* ---- chrome object -------------------------------------------- */
    const blobScene = new THREE.Scene();
    const persp = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    persp.position.set(0, 0, CAM_Z);

    // studio-light environment, baked once; this is what the chrome reflects
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRoom = new RoomEnvironment();
    const envTarget = pmrem.fromScene(envRoom, 0.04);
    blobScene.environment = envTarget.texture;
    envRoom.dispose();
    pmrem.dispose();

    const chrome = new THREE.MeshStandardMaterial({
      color: 0xeef2f8,
      metalness: 1,
      roughness: 0.07,
      envMapIntensity: 1.35,
    });

    const lowPoly = coarse || window.innerWidth < 768;
    const geoCache = new Map<number, { geo: THREE.TorusKnotGeometry; r: number }>();
    const getGeo = (i: number) => {
      let g = geoCache.get(i);
      if (!g) {
        const k = KNOTS[i];
        const geo = new THREE.TorusKnotGeometry(1, k.tube, lowPoly ? 110 : 200, lowPoly ? 16 : 28, k.p, k.q);
        geo.computeBoundingSphere();
        g = { geo, r: geo.boundingSphere?.radius ?? 1 };
        geoCache.set(i, g);
      }
      return g;
    };

    let curShape = activeRef.current % KNOTS.length;
    let curGeo = getGeo(curShape);
    const blobMesh = new THREE.Mesh(curGeo.geo, chrome);
    blobScene.add(blobMesh);

    /* ---- sizing --------------------------------------------------- */
    let cw = 1;
    let ch = 1;
    let halfW = 1;
    let halfH = 1;
    let blobR = 1; // world radius of the object
    let anchorX = 0;
    let anchorY = 0;

    const resize = () => {
      cw = Math.max(1, wrap.clientWidth);
      ch = Math.max(1, wrap.clientHeight);
      renderer.setSize(cw, ch, false);
      uniforms.uAspect.value = (cw * FRAME.w) / (ch * FRAME.h);
      persp.aspect = cw / ch;
      persp.updateProjectionMatrix();
      halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
      halfW = halfH * persp.aspect;
      blobR = halfW * (cw < 500 ? 0.4 : 0.34);
      anchorX = (ANCHOR.x * 2 - 1) * halfW;
      anchorY = (1 - ANCHOR.y * 2) * halfH;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    /* ---- pointer (mouse / pen only: touch is for scrolling) ------- */
    const target = { x: 0.5, y: 0.5, fx: 0.5, fy: 0.5, hover: 0 };
    const look = { x: 0.5, y: 0.5 }; // eased "where is the user looking", drives parallax + tilt
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || reduced) return;
      const r = wrap.getBoundingClientRect();
      target.x = clamp01((e.clientX - r.left) / r.width);
      target.y = clamp01(1 - (e.clientY - r.top) / r.height);
      target.fx = clamp01((target.x - FRAME.x) / FRAME.w);
      target.fy = clamp01((target.y - FRAME.y) / FRAME.h);
      target.hover = 1;
    };
    const onLeave = () => {
      target.hover = 0;
    };
    // touch has no hover: a tap gives a short glitch pulse
    let tapTimer = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || reduced) return;
      const r = wrap.getBoundingClientRect();
      target.x = clamp01((e.clientX - r.left) / r.width);
      target.y = clamp01(1 - (e.clientY - r.top) / r.height);
      target.fx = clamp01((target.x - FRAME.x) / FRAME.w);
      target.fy = clamp01((target.y - FRAME.y) / FRAME.h);
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
    let prevCur = cur;
    const blob = { s: 0, v: 0 }; // elastic scale (starts at 0 so it pops in)
    let rotY = 0.6;
    let spinV = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduced) time += dt;

      // ease toward the scroll position so a flick of the wheel still plays out smoothly
      cur += (progress.current - cur) * (1 - Math.exp(-7 * dt));
      const dp = cur - prevCur;
      prevCur = cur;
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
      uniforms.uPointer.value.x += (target.fx - uniforms.uPointer.value.x) * k;
      uniforms.uPointer.value.y += (target.fy - uniforms.uPointer.value.y) * k;
      uniforms.uHover.value += (target.hover - uniforms.uHover.value) * k;

      // "look": follows the cursor, otherwise drifts lazily (so touch screens still feel alive)
      const hov = target.hover > 0.5;
      const lx = hov ? target.x : 0.5 + (reduced ? 0 : 0.1 * Math.sin(time * 0.45));
      const ly = hov ? target.y : 0.5 + (reduced ? 0 : 0.08 * Math.cos(time * 0.37));
      const kl = 1 - Math.exp(-4 * dt);
      look.x += (lx - look.x) * kl;
      look.y += (ly - look.y) * kl;

      // pills: parallax against the look direction (different depth per pill)
      const dx = look.x - 0.5;
      const dy = look.y - 0.5;
      for (let p = 0; p < 2; p++) {
        const el = parRefs.current[p];
        if (el) {
          const depth = p ? 26 : 34;
          el.style.transform = `translate3d(${(-dx * depth).toFixed(2)}px,${(dy * depth).toFixed(2)}px,0)`;
        }
      }

      // chrome object: elastic swap when the service changes
      const want = activeRef.current % KNOTS.length;
      const swapping = want !== curShape;
      blob.v += ((swapping ? 0 : 1) - blob.s) * 170 * dt;
      blob.v *= Math.exp(-9 * dt);
      blob.s = Math.max(0, blob.s + blob.v * dt);
      if (swapping && blob.s < 0.05) {
        curGeo = getGeo(want);
        blobMesh.geometry = curGeo.geo;
        curShape = want;
        spinV += 5; // a little kick as the new shape appears
      }

      // spin: slow idle + extra while the user scrolls through services
      spinV += ((reduced ? 0 : 0.35) - spinV) * (1 - Math.exp(-1.5 * dt));
      spinV = Math.max(-9, Math.min(9, spinV + dp * 8));
      rotY += spinV * dt;

      blobMesh.scale.setScalar((blobR / curGeo.r) * blob.s);
      blobMesh.rotation.set(0.5 - dy * 0.7, rotY, dx * 0.5);
      // keep the whole object inside the canvas (it's clipped by overflow-hidden parents otherwise):
      // clamp the centre by the object's *current* radius, so the elastic overshoot nudges it inward
      const rr = blobR * blob.s * 1.03;
      const px = anchorX + dx * halfW * 0.12;
      const py = anchorY + Math.sin(time * 0.9) * halfH * 0.012 + dy * halfH * 0.08;
      blobMesh.position.set(
        Math.min(halfW - rr, Math.max(-halfW + rr, px)),
        Math.min(halfH - rr, Math.max(-halfH + rr, py)),
        0
      );
      // sweeping the reflection makes the highlights glide across the metal
      blobScene.environmentRotation.set(0, time * 0.12 + dx * 1.4, 0);

      renderer.clear();
      renderer.render(bgScene, bgCam);
      renderer.render(blobScene, persp);
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
      bgGeometry.dispose();
      bgMaterial.dispose();
      geoCache.forEach((g) => g.geo.dispose());
      chrome.dispose();
      envTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [images, progress]);

  /* ---------------- render ---------------- */
  const words = tags?.[shown] ?? DEFAULT_TAGS;
  const colors = tagColors?.[shown] ?? DEFAULT_COLORS;

  return (
    <div ref={wrapRef} role="img" aria-label={label} className={`relative ${className}`}>
      {/* the canvas is injected by the effect; this veil covers the photo frame until the first image is in */}
      <div
        aria-hidden
        className={`pointer-events-none absolute z-10 bg-neutral-900 transition-opacity duration-1000 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
        style={{
          left: `${FRAME.x * 100}%`,
          bottom: `${FRAME.y * 100}%`,
          width: `${FRAME.w * 100}%`,
          height: `${FRAME.h * 100}%`,
        }}
      />

      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden
          className={`pointer-events-none absolute z-20 ${
            i === 0 ? "left-[1%] top-[1.5%]" : "bottom-[4%] right-0"
          }`}
        >
          <div
            ref={(el) => {
              parRefs.current[i] = el;
            }}
            className="will-change-transform"
          >
            <div
              ref={(el) => {
                floatRefs.current[i] = el;
              }}
            >
              <div
                ref={(el) => {
                  bodyRefs.current[i] = el;
                }}
                className="whitespace-nowrap rounded-full px-[1.15em] py-[0.5em] text-[clamp(0.9rem,2.1vw,2rem)] font-light uppercase leading-none tracking-[-0.01em] text-white shadow-[0_14px_30px_-12px_rgba(0,0,0,0.65)]"
                style={{ background: colors[i], opacity: 0 }}
              >
                {words[i]}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}