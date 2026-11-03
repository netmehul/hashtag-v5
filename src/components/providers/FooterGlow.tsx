import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Atmosphere for the footer: slow, warped clouds of brand red rising from the bottom edge,
 * a soft glow that follows the cursor, and a little film grain. Renders at reduced
 * resolution (it is soft by design) and only while on screen.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uAspect;
  uniform float uHover;
  uniform vec2  uPointer;
  varying vec2 vUv;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int k = 0; k < 5; k++) { v += a * vnoise(p); p = p * 2.02 + 11.7; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y) * 1.7;
    float t = uTime * 0.07;

    // domain-warped clouds drifting upward
    float n = fbm(p + vec2(t * 0.8, -t));
    float w = fbm(p * 1.6 + n * 1.8 + vec2(-t, t * 0.6));

    // strongest at the bottom edge, thinning out towards the top
    float rise = pow(1.0 - uv.y, 1.7);
    float glow = clamp(rise * (0.25 + 1.15 * w), 0.0, 1.0);

    // cursor glow
    vec2 pc = (uv - uPointer) * vec2(uAspect, 1.0);
    float c = exp(-dot(pc, pc) * 5.0) * uHover;

    vec3 deep = vec3(0.28, 0.015, 0.05);
    vec3 red  = vec3(0.93, 0.16, 0.22);
    vec3 col  = deep * glow * 1.25 + red * (glow * glow * 0.5 + c * 0.22 * (0.5 + w));

    // grain keeps the gradient from banding and gives it a filmic feel
    col += (hash(uv * vec2(uAspect, 1.0) * 1200.0 + fract(uTime)) - 0.5) * 0.035;
    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export default function FooterGlow({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const host = wrap.parentElement ?? wrap; // pointer is tracked over the whole footer
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
    } catch {
      return; // no WebGL: the footer is simply plain black
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1) * 0.7);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uHover: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.2) },
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    const resize = () => {
      const w = Math.max(1, wrap.clientWidth);
      const h = Math.max(1, wrap.clientHeight);
      renderer.setSize(w, h, false);
      uniforms.uAspect.value = w / h;
      renderer.render(scene, camera);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const target = { x: 0.5, y: 0.2, hover: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || reduced) return;
      const r = wrap.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1 - (e.clientY - r.top) / r.height;
      target.hover = 1;
    };
    const onLeave = () => { target.hover = 0; };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let visible = false;
    let last = performance.now();
    let time = 12;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      uniforms.uTime.value = time;
      const k = 1 - Math.exp(-4 * dt);
      uniforms.uPointer.value.x += (target.x - uniforms.uPointer.value.x) * k;
      uniforms.uPointer.value.y += (target.y - uniforms.uPointer.value.y) * k;
      uniforms.uHover.value += (target.hover - uniforms.uHover.value) * k;
      renderer.render(scene, camera);
      raf = visible && !reduced ? requestAnimationFrame(frame) : 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf && !reduced) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      },
      { rootMargin: "100px" }
    );
    io.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={wrapRef} aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${className}`} />;
}
