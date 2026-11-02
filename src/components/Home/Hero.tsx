import { useRef } from 'react'
import BurnReveal from './BurnReveal'

/**
 * Fluid type: the headline is sized in `cqw` (1% of its container's width), so it
 * scales continuously with the layout, with no breakpoints. It is the Figma
 * design scaled proportionally:
 *   font-size       400px / 1920px frame  = 20.83cqw
 *   letter-spacing  -12px / 400px         = -0.03em  (em, so it scales with the font)
 * If your Figma frame isn't 1920px wide, use: 40000 / frameWidth  (cqw).
 */
function Hero() {
    const sectionRef = useRef<HTMLElement>(null)

    return (
        <section
            ref={sectionRef}
            className="
                relative
                overflow-hidden
                md:max-w-[1920px]
                md:mx-auto
                md:px-8
                md:py-24
                py-4
                px-4
            ">
            {/* @container makes cqw units inside measure THIS box, not the viewport */}
            <div className="@container min-h-[75svh] relative z-10 w-full flex flex-col items-center justify-center md:min-h-[80svh] gap-4 select-none md:px-12">
                <h1
                    className="
                        font-season font-bold uppercase text-center whitespace-nowrap
                        text-[20.83cqw] tracking-[-0.03em] leading-none
                        [text-box:trim-both_cap_alphabetic]
                        md:mb-10
                    ">
                    Hashtag
                </h1>
                <p
                    className="
                        font-body uppercase text-center whitespace-nowrap
                        mt-[1.5cqw]
                        text-[clamp(1rem,3.2cqw,4rem)]
                        tracking-[1em] pl-[0.4em]
                    ">
                    Eventz
                </p>
            </div>

            <BurnReveal
                containerRef={sectionRef}
                videoSrc="/videos/hero-burn.mp4"
                radius={360}
                decay={0.5}
            />
        </section>
    )
}
export default Hero