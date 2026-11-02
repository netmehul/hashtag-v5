import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

export type GLItem = { id: string; src: string; focus?: [number, number] };
export type PointerState = { id: string | null; x: number; y: number };

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uRes;
  uniform vec2 uImg;
  uniform vec2 uFocus;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uActive;
  uniform float uVel;
  uniform float uTime;
  uniform float uIntro;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    // object-fit: cover, with a focal point
    float ra = uRes.x / uRes.y;
    float ia = uImg.x / uImg.y;
    vec2 s = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);
    vec2 center = clamp(uFocus, s * 0.5, 1.0 - s * 0.5);
    vec2 off = (vUv - 0.5) * s;

    // cursor-driven colour reveal with an organic edge
    vec2 asp = vec2(ra, 1.0);
    vec2 d = (vUv - uMouse) * asp;
    float dist = length(d);
    float n = noise(vUv * asp * 5.0 + uTime * 0.25);

    float radius = uHover * 1.6;
    float reveal = 1.0 - smoothstep(radius - 0.45, radius, dist + (n - 0.5) * 0.3);
    reveal *= smoothstep(0.0, 0.1, uHover);
    float colorMix = max(reveal, uActive);

    // lens bulge around the cursor (off on the expanded image)
    float lens = (1.0 - uActive) * reveal * (1.0 - smoothstep(0.0, 0.7, dist));
    off -= (vUv - uMouse) * lens * 0.12 * s;

    // hover zoom + intro zoom
    float zoom = (1.0 + 0.05 * uHover * (1.0 - uActive)) * mix(1.3, 1.0, uIntro);
    off /= zoom;

    // scroll-velocity bend + RGB split
    off.x += sin(vUv.y * 3.14159) * uVel * 0.05 * s.x;
    float split = uVel * 0.01 + lens * 0.004;

    vec2 base = center + off;
    vec3 col = vec3(
      texture2D(uTex, base + vec2(split, 0.0)).r,
      texture2D(uTex, base).g,
      texture2D(uTex, base - vec2(split, 0.0)).b
    );

    float gray = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 mono = vec3((gray - 0.5) * 1.08 + 0.5) * 0.92;
    vec3 outc = mix(mono, col, colorMix);

    // intro wipe, top to bottom
    float t = 1.0 - vUv.y;
    float a = 1.0 - smoothstep(uIntro * 1.12 - 0.12, uIntro * 1.12, t);

    gl_FragColor = vec4(outc, a);
  }
`;

type Props = {
  items: GLItem[];
  tileEls: MutableRefObject<Record<string, HTMLElement | null>>;
  pointer: MutableRefObject<PointerState>;
  activeId: string | null;
  onFail: () => void;
};

/** One canvas for the whole gallery. It sits inside the grid (position:absolute),
 *  so it scrolls with the page and each plane follows its tile's live bounding box,
 *  including while the tile is being animated by GSAP Flip.
 *
 *  It reports `onFail` (so the parent can show the plain-image gallery) when:
 *   - the device is touch-only (the effects are hover-driven, and phones can't hold
 *     a full gallery of GPU textures),
 *   - WebGL can't be created,
 *   - the browser kills the context,
 *   - or no image has made it onto the GPU after 10 s. */
export default function GalleryGL({ items, tileEls, pointer, activeId, onFail }: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(activeId);
  activeRef.current = activeId;
  const failRef = useRef(onFail);
  failRef.current = onFail;

  useEffect(() => {
    // touch-only devices: use the plain-image gallery
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
      failRef.current();
      return;
    }

    const slot = slotRef.current!;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    } catch {
      failRef.current();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    slot.appendChild(canvas);

    const onLost = (e: Event) => {
      e.preventDefault();
      failRef.current();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
    const geometry = new THREE.PlaneGeometry(1, 1);
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const textures: THREE.Texture[] = [];
    let disposed = false;
    let anyLoaded = false;

    const nodes = items.map((it) => {
      const u = {
        uTex: { value: null as THREE.Texture | null },
        uRes: { value: new THREE.Vector2(1, 1) },
        uImg: { value: new THREE.Vector2(1, 1) },
        uFocus: { value: new THREE.Vector2(...(it.focus ?? [0.5, 0.5])) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uActive: { value: 0 },
        uVel: { value: 0 },
        uTime: { value: 0 },
        uIntro: { value: 0 },
      };
      const material = new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);

      const node = { id: it.id, mesh, material, u, loaded: false, introAt: -1, hover: 0, active: 0 };

      new THREE.TextureLoader().load(
        it.src,
        (tex) => {
          if (disposed) { tex.dispose(); return; }
          tex.anisotropy = maxAniso;
          textures.push(tex);
          u.uTex.value = tex;
          u.uImg.value.set(tex.image.width, tex.image.height);
          node.loaded = true;
          anyLoaded = true;
        },
        undefined,
        () => {
          /* a single image failed to load: that tile just stays empty */
        }
      );
      return node;
    });

    // watchdog: nothing reached the GPU -> let the parent show the plain gallery
    const watchdog = window.setTimeout(() => {
      if (!disposed && !anyLoaded) failRef.current();
    }, 10000);

    let W = 0;
    let H = 0;
    const resize = (w: number, h: number) => {
      W = w; H = h;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(w, h, false);
      camera.right = w;
      camera.top = h;
      camera.updateProjectionMatrix();
    };

    const tmp = new THREE.Vector2();
    const t0 = performance.now();
    let lastIntro = 0;
    let lastY = window.scrollY;
    let vel = 0;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const vh = window.innerHeight;
      const host = slot.getBoundingClientRect();
      const y = window.scrollY;

      if (host.bottom < 0 || host.top > vh) { lastY = y; return; } // gallery off-screen: no GPU work

      if (Math.abs(host.width - W) > 1 || Math.abs(host.height - H) > 1) {
        resize(Math.max(host.width, 1), Math.max(host.height, 1));
      }

      vel += (THREE.MathUtils.clamp((y - lastY) * 0.01, -1, 1) - vel) * 0.1;
      lastY = y;

      const ptr = pointer.current;
      for (const n of nodes) {
        const el = tileEls.current[n.id];
        if (!el || !n.loaded) { n.mesh.visible = false; continue; }
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh) { n.mesh.visible = false; continue; }
        n.mesh.visible = true;

        n.mesh.position.set(
          r.left - host.left + r.width / 2,
          H - (r.top - host.top + r.height / 2),
          0
        );
        n.mesh.scale.set(r.width, r.height, 1);

        // staggered intro the first time a tile scrolls into view
        if (n.introAt < 0 && r.top < vh * 0.92) {
          n.introAt = Math.max(now, lastIntro + 120);
          lastIntro = n.introAt;
        }
        const p = n.introAt < 0 ? 0 : THREE.MathUtils.clamp((now - n.introAt) / 1200, 0, 1);

        const hovered = ptr.id === n.id;
        if (hovered && n.hover < 0.02) n.u.uMouse.value.set(ptr.x, ptr.y);
        n.hover += ((hovered ? 1 : 0) - n.hover) * 0.08;
        if (hovered) n.u.uMouse.value.lerp(tmp.set(ptr.x, ptr.y), 0.15);
        n.active += ((activeRef.current === n.id ? 1 : 0) - n.active) * 0.1;
        n.mesh.renderOrder = n.active > 0.5 ? 2 : 1;

        n.u.uRes.value.set(r.width, r.height);
        n.u.uHover.value = n.hover;
        n.u.uActive.value = n.active;
        n.u.uVel.value = vel;
        n.u.uTime.value = (now - t0) / 1000;
        n.u.uIntro.value = 1 - Math.pow(1 - p, 3);
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      window.clearTimeout(watchdog);
      cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onLost);
      textures.forEach((t) => t.dispose());
      nodes.forEach((n) => n.material.dispose());
      geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [items, tileEls, pointer]);

  return <div ref={slotRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-1" />;
}