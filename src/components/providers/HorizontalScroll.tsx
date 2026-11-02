import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function HorizontalScroll({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current!;
      const getDistance = () =>
        Math.max(track.scrollWidth - window.innerWidth, 0);

      gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Re-measure whenever the track's size changes (fonts, images, resize)
      const ro = new ResizeObserver(() => ScrollTrigger.refresh());
      ro.observe(track);

      // Also after everything has loaded
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        ro.disconnect();
        window.removeEventListener("load", onLoad);
      };
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative z-10 h-screen overflow-hidden">
      <div ref={trackRef} className="flex h-full w-max will-change-transform">
        {children}
      </div>
    </section>
  );
}