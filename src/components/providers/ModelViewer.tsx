import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

type Props = {
  src: string;
  className?: string;
  /** accessible description of the model */
  label?: string;
};

const FIT = 2.3; // longest side of the model, in scene units
const AUTO_SPIN = 0.22; // rad / second
const POINTER_TILT = 0.45; // max tilt (rad) following the cursor
const SCROLL_TURN = 1.6; // rad of extra turn as the section scrolls past
const FRICTION = 2.6; // how quickly a fling slows down

/**
 * Transparent WebGL canvas showing a .glb that slowly turns, leans towards the
 * cursor, turns with page scroll and can be flung with a drag.
 * Renders only while on screen, disposes everything on unmount.
 */
export default function ModelViewer({ src, className = "", label = "3D abstract shape" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let disposed = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- renderer / scene / camera -------------------------------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;";
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 6);

    // The model is fully metallic, so it reflects its surroundings: give it a studio.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    // a touch of brand red catching the edge
    const rim = new THREE.PointLight(0xed2939, 18, 20, 2);
    rim.position.set(-3, 1.5, 2);
    scene.add(rim);

    /* ---- model ---------------------------------------------------- */
    const pivot = new THREE.Group(); // we rotate this, not the model
    scene.add(pivot);
    let model: THREE.Object3D | null = null;

    new GLTFLoader().load(
      src,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const centre = box.getCenter(new THREE.Vector3());
        model.position.sub(centre); // centre on the pivot
        pivot.scale.setScalar(FIT / Math.max(size.x, size.y, size.z));
        pivot.add(model);
        model.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.envMapIntensity = 1.15;
          }
        });
        setReady(true);
        draw(0);
      },
      undefined,
      (err) => console.warn("ModelViewer: could not load", src, err)
    );

    /* ---- sizing --------------------------------------------------- */
    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(() => { resize(); draw(0); });
    ro.observe(wrap);

    /* ---- input ---------------------------------------------------- */
    const pointer = { x: 0, y: 0 }; // -1..1, relative to the wrap
    const drag = { down: false, lastX: 0, vel: 0 };
    let spin = 0; // accumulated yaw from dragging

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (drag.down) {
        const dx = e.clientX - drag.lastX;
        drag.lastX = e.clientX;
        spin += dx * 0.012;
        drag.vel = dx * 0.012 * 60;
      }
    };
    const onDown = (e: PointerEvent) => {
      drag.down = true;
      drag.lastX = e.clientX;
      drag.vel = 0;
      wrap.setPointerCapture(e.pointerId);
    };
    const onUp = () => { drag.down = false; };
    const onLeave = () => { if (!drag.down) { pointer.x = 0; pointer.y = 0; } };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("pointerleave", onLeave);

    /* ---- loop (only while visible) -------------------------------- */
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let yaw = 0;
    const lean = { x: 0, y: 0 };

    const draw = (dt: number) => {
      if (!model) return;

      if (!reduced) yaw += AUTO_SPIN * dt;
      if (!drag.down) {
        spin += drag.vel * dt;
        drag.vel *= Math.exp(-FRICTION * dt);
      };

      // scroll progress of the wrap through the viewport: -1 (below) .. 1 (above)
      const r = wrap.getBoundingClientRect();
      const p = THREE.MathUtils.clamp(1 - (r.top + r.height / 2) / (window.innerHeight / 2) , -1, 1);

      // ease the lean toward the cursor
      const k = 1 - Math.exp(-5 * dt);
      lean.x += (pointer.y * POINTER_TILT - lean.x) * k;
      lean.y += (pointer.x * POINTER_TILT - lean.y) * k;

      pivot.rotation.set(lean.x + p * 0.35, yaw + spin + lean.y + p * SCROLL_TURN, 0);
      renderer.render(scene, camera);
    }

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(dt);
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        }
      },
      { rootMargin: "100px" }
    );
    io.observe(wrap);

    /* ---- cleanup -------------------------------------------------- */
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
      wrap.removeEventListener("pointerleave", onLeave);

      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
        }
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src]);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={label}
      className={`relative cursor-grab touch-pan-y select-none transition-opacity duration-1000 active:cursor-grabbing ${
        ready ? "opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}