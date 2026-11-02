import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'

/**
 * BurnReveal
 * ----------
 * A full-size WebGL overlay for a hero section. Where the cursor is, the page
 * is cut away with a soft, organic (slightly wobbling) edge and a background
 * video shows through. The hole is opaque, so the hero text underneath is
 * fully hidden there: only video is visible. No colour on the edge.
 *
 * How it works
 *  1. The flame follows the cursor on a spring (it trails, overshoots a little
 *     and settles). Its radius is also a spring: it pops in and out elastically.
 *  2. A tiny CPU "heat" grid (≈6px cells) is stamped along the flame's path and
 *     cools down over time, so the hole closes smoothly behind it.
 *  3. The fragment shader reads that grid (smoothly interpolated), bends the
 *     edge with low-frequency noise, and thresholds it into the video reveal.
 */

type Props = {
  /** The hero <section>. Pointer events are listened to here. */
  containerRef: RefObject<HTMLElement | null>
  /** Background video shown through the hole. */
  videoSrc?: string
  /** Hole radius in CSS px on desktop (scaled down on small screens). */
  radius?: number
  /** How fast the hole cools, in heat units per second. Lower = the hole lingers longer. */
  decay?: number
}

const CELL = 6 // heat-grid cell size in CSS px

// Spring tuning: higher K = snappier, lower C = bouncier.
const POS_K = 110 // position stiffness
const POS_C = 13 // position damping
const RAD_K = 150 // radius stiffness
const RAD_C = 9 // radius damping (lower = more elastic pop)

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform sampler2D uHeat;
  uniform sampler2D uVideo;
  uniform vec2  uRes;
  uniform float uTime;
  uniform vec2  uVidScale;
  uniform vec2  uVidOffset;
  uniform float uHasVideo;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 px = vUv * uRes;
    float heat = texture2D(uHeat, vec2(vUv.x, 1.0 - vUv.y)).r;

    // Slow organic wobble = shape of the edge. Very little fine tearing = smooth.
    float shape = fbm(px / 110.0 + vec2(0.0, uTime * 0.08));
    float tear  = fbm(px / 26.0);
    float t = heat + (shape - 0.5) * 0.46 + (tear - 0.5) * 0.05;

    const float THR = 0.5;
    float aa   = max(fwidth(t) * 0.75, 0.0008); // hard edge, ~1px anti-aliasing only
    float hole = smoothstep(THR - aa, THR + aa, t);

    // neutral dark stand-in until the video has loaded
    vec3 idle = vec3(0.08) + 0.12 * fbm(px / 220.0 + vec2(0.0, -uTime * 0.2));
    vec3 vid = texture2D(uVideo, vUv * uVidScale + uVidOffset).rgb;
    vid = mix(idle, vid, uHasVideo);

    gl_FragColor = vec4(vid, hole);
  }
`

function BurnReveal({ containerRef, videoSrc = '/videos/hero-burn.mp4', radius = 240, decay = 0.6 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = containerRef.current
    const mount = mountRef.current
    if (!section || !mount) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const noHover = window.matchMedia('(hover: none)').matches

    // ---------- renderer / scene ----------
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // ---------- video ----------
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.preload = 'auto'
    video.src = videoSrc

    const videoTex = new THREE.VideoTexture(video)
    videoTex.colorSpace = THREE.NoColorSpace // raw sRGB in, raw sRGB out
    videoTex.minFilter = THREE.LinearFilter
    videoTex.generateMipmaps = false

    // ---------- uniforms / material ----------
    const uniforms = {
      uHeat: { value: null as THREE.Texture | null },
      uVideo: { value: videoTex as THREE.Texture },
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uVidScale: { value: new THREE.Vector2(1, 1) },
      uVidOffset: { value: new THREE.Vector2(0, 0) },
      uHasVideo: { value: 0 },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending, // write RGBA exactly as the shader outputs it
    })
    const geometry = new THREE.PlaneGeometry(2, 2)
    const quad = new THREE.Mesh(geometry, material)
    quad.frustumCulled = false
    scene.add(quad)

    // ---------- sizing + heat grid ----------
    let w = 1
    let h = 1
    let cols = 1
    let rows = 1
    let cw = CELL
    let ch = CELL
    let heat = new Float32Array(1)
    let heat8 = new Uint8Array(1)
    let heatTex: THREE.DataTexture | null = null

    const fitVideo = () => {
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return
      const ca = w / h
      const va = vw / vh
      const sx = va > ca ? ca / va : 1
      const sy = va > ca ? 1 : va / ca
      uniforms.uVidScale.value.set(sx, sy)
      uniforms.uVidOffset.value.set((1 - sx) / 2, (1 - sy) / 2)
    }

    const layout = () => {
      const nw = section.clientWidth
      const nh = section.clientHeight
      if (!nw || !nh) return
      w = nw
      h = nh
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
      uniforms.uRes.value.set(w, h)

      cols = Math.max(2, Math.ceil(w / CELL))
      rows = Math.max(2, Math.ceil(h / CELL))
      cw = w / cols
      ch = h / rows
      heat = new Float32Array(cols * rows)
      heat8 = new Uint8Array(cols * rows)
      heatTex?.dispose()
      heatTex = new THREE.DataTexture(heat8, cols, rows, THREE.RedFormat, THREE.UnsignedByteType)
      heatTex.minFilter = THREE.LinearFilter
      heatTex.magFilter = THREE.LinearFilter
      heatTex.unpackAlignment = 1 // rows aren't 4-byte aligned for R8
      heatTex.needsUpdate = true
      uniforms.uHeat.value = heatTex

      fitVideo()
    }

    // ---------- video events ----------
    const onVideoReady = () => {
      uniforms.uHasVideo.value = 1
      fitVideo()
    }
    const onVideoError = () => {
      uniforms.uHasVideo.value = 0
    }
    video.addEventListener('loadeddata', onVideoReady)
    video.addEventListener('loadedmetadata', fitVideo)
    video.addEventListener('error', onVideoError)
    video.play().catch(() => {
      /* autoplay blocked: the neutral stand-in stays */
    })

    // ---------- pointer ----------
    const pointer = { x: 0, y: 0, active: false }
    const flame = { x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, lx: 0, ly: 0, live: false, hasLast: false }

    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
      pointer.active = true
    }
    const onLeave = () => {
      pointer.active = false
    }
    section.addEventListener('pointermove', onMove)
    section.addEventListener('pointerdown', onMove)
    section.addEventListener('pointerleave', onLeave)
    section.addEventListener('pointercancel', onLeave)

    // ---------- heat stamping ----------
    const stamp = (x: number, y: number, R: number) => {
      const i0 = Math.max(0, Math.floor((x - R) / cw))
      const i1 = Math.min(cols - 1, Math.ceil((x + R) / cw))
      const j0 = Math.max(0, Math.floor((y - R) / ch))
      const j1 = Math.min(rows - 1, Math.ceil((y + R) / ch))
      for (let j = j0; j <= j1; j++) {
        const dy = (j + 0.5) * ch - y
        for (let i = i0; i <= i1; i++) {
          const dx = (i + 0.5) * cw - x
          const d = Math.sqrt(dx * dx + dy * dy) / R
          if (d >= 1) continue
          const idx = j * cols + i
          const f = 1 - d
          if (f > heat[idx]) heat[idx] = f
        }
      }
    }

    // ---------- loop ----------
    let raf = 0
    let last = performance.now()
    let visible = true

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible) {
        last = now
        return
      }
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      uniforms.uTime.value += dt
      const time = uniforms.uTime.value

      // Where does the flame want to be? Real pointer, or (touch) a slow wanderer.
      let tx = pointer.x
      let ty = pointer.y
      let on = pointer.active
      if (!on && noHover && !reduceMotion) {
        tx = w * (0.5 + 0.32 * Math.sin(time * 0.6))
        ty = h * (0.5 + 0.28 * Math.sin(time * 0.9 + 1.0))
        on = true
      }

      if (on && !flame.live) {
        // first contact: appear under the cursor instead of flying in
        flame.x = tx
        flame.y = ty
        flame.vx = 0
        flame.vy = 0
        flame.live = true
        flame.hasLast = false
      }

      if (flame.live) {
        // position spring: trails the cursor, overshoots slightly, settles
        if (!on) {
          tx = flame.x
          ty = flame.y
        }
        flame.vx += (tx - flame.x) * POS_K * dt
        flame.vy += (ty - flame.y) * POS_K * dt
        const damp = Math.exp(-POS_C * dt)
        flame.vx *= damp
        flame.vy *= damp
        flame.x += flame.vx * dt
        flame.y += flame.vy * dt

        // radius spring: elastic pop-in, stretches a touch with speed, shrinks on leave
        const base = radius * (w < 768 ? 0.65 : 1)
        const speed = Math.hypot(flame.vx, flame.vy)
        const targetR = on ? base * (1 + Math.min(speed / 2500, 0.25)) : 0
        flame.vr += (targetR - flame.r) * RAD_K * dt
        flame.vr *= Math.exp(-RAD_C * dt)
        flame.r = Math.max(0, flame.r + flame.vr * dt)

        if (flame.r > 2) {
          const fromX = flame.hasLast ? flame.lx : flame.x
          const fromY = flame.hasLast ? flame.ly : flame.y
          const dist = Math.hypot(flame.x - fromX, flame.y - fromY)
          const steps = Math.max(1, Math.ceil(dist / (flame.r * 0.12)))
          for (let i = 1; i <= steps; i++) {
            const k = i / steps
            stamp(fromX + (flame.x - fromX) * k, fromY + (flame.y - fromY) * k, flame.r)
          }
          flame.lx = flame.x
          flame.ly = flame.y
          flame.hasLast = true
        } else if (!on) {
          flame.live = false
          flame.r = 0
          flame.vr = 0
        }
      }

      // cool down + quantise for upload
      const dec = decay * dt
      for (let i = 0; i < heat.length; i++) {
        const v = heat[i] - dec
        heat[i] = v > 0 ? v : 0
        heat8[i] = v > 0 ? (v >= 1 ? 255 : (v * 255) | 0) : 0
      }
      if (heatTex) heatTex.needsUpdate = true

      renderer.render(scene, camera)
    }

    // ---------- observers ----------
    const ro = new ResizeObserver(() => layout())
    ro.observe(section)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) video.play().catch(() => {})
      else video.pause()
    })
    io.observe(section)

    layout()
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerdown', onMove)
      section.removeEventListener('pointerleave', onLeave)
      section.removeEventListener('pointercancel', onLeave)
      video.removeEventListener('loadeddata', onVideoReady)
      video.removeEventListener('loadedmetadata', fitVideo)
      video.removeEventListener('error', onVideoError)
      video.pause()
      video.removeAttribute('src')
      video.load()
      heatTex?.dispose()
      videoTex.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [containerRef, videoSrc, radius, decay])

  return <div ref={mountRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" />
}

export default BurnReveal