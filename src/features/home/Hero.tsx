import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LightRays } from "@/components/magicui/light-rays";
import { Particles } from "@/components/magicui/particles";
import { Marquee, MarqueeItem } from "@/components/magicui/marquee";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { FEST_DATES, FEST_MONTH, FEST_YEAR, EUPHORIA_START_DATE } from "@/data/festival";

/* ── Cinematic photo slideshow ───────────────────────────────── */
interface SlideConfig {
  src: string;
  position: string;
}

const SLIDESHOW_CONFIG: SlideConfig[] = [
  {
    // 1. AS (Akhil Sachdeva full-stage shot): performer on stage-right, head below header
    src: "/assets/AS.webp",
    position: "65% 22%",
  },
  {
    // 2. AS2 (Akhil Sachdeva close-up): upper-third focus so head is below header
    src: "/assets/AS2.webp",
    position: "50% 14%",
  },
  {
    // 3. DR (Deepali Roy): center performer's face and upper body in hero middle
    src: "/assets/DR.webp",
    position: "52% 38%",
  },
  {
    // 4. GV (Gajendra Verma hand raised): top-align to keep raised hand & head below navbar
    src: "/assets/GV.webp",
    position: "50% 12%",
  },
  {
    // 5. GV2 (Gajendra Verma with guitar): centered framing for singer + acoustic guitar
    src: "/assets/GV2.webp",
    position: "50% 28%",
  },
  {
    // 6. DF (DEAFOX DJ): position on DJ performer (~70% height) in center of hero
    src: "/assets/DF.webp",
    position: "50% 72%",
  },
];

const SLIDE_DURATION = 6000; // ms each slide is visible
const FADE_DURATION  = 2000; // ms crossfade

function CinematicSlideshow() {
  const reducedMotion = useReducedMotion();

  // Two persistent layers state:
  // Layer A = currently visible image
  // Layer B = next image
  const [layers, setLayers] = useState({
    layerA: { index: 0, opacity: 1 },
    layerB: { index: 1, opacity: 0 },
    activeLayer: "A" as "A" | "B",
  });

  const stateRef = useRef(layers);
  stateRef.current = layers;

  // Preload and decode all 6 images immediately on mount so transitions never stutter
  const preloadedRef = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    preloadedRef.current = SLIDESHOW_CONFIG.map((slide) => {
      const img = new Image();
      img.src = slide.src;
      if ("decode" in img) {
        img.decode().catch(() => {});
      }
      return img;
    });

    return () => {
      preloadedRef.current = [];
    };
  }, []);

  // Seamless two-layer crossfade loop
  useEffect(() => {
    if (reducedMotion) return;

    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const scheduleCycle = () => {
      holdTimer = setTimeout(() => {
        if (!isMounted) return;

        const currentActive = stateRef.current.activeLayer;

        if (currentActive === "A") {
          // Transition Layer A -> Layer B
          // Layer A continuously fades 1 -> 0
          // Layer B continuously fades 0 -> 1
          setLayers({
            layerA: { index: stateRef.current.layerA.index, opacity: 0 },
            layerB: { index: stateRef.current.layerB.index, opacity: 1 },
            activeLayer: "B",
          });

          // Wait until crossfade finishes completely
          fadeTimer = setTimeout(() => {
            if (!isMounted) return;

            // Crossfade complete: Layer B is now active (opacity 1)
            // Update inactive Layer A to prepare the next image in the loop while at opacity 0
            const nextIdx =
              (stateRef.current.layerB.index + 1) % SLIDESHOW_CONFIG.length;

            setLayers({
              layerA: { index: nextIdx, opacity: 0 },
              layerB: { index: stateRef.current.layerB.index, opacity: 1 },
              activeLayer: "B",
            });

            // Schedule the next transition cycle
            scheduleCycle();
          }, FADE_DURATION);
        } else {
          // Transition Layer B -> Layer A
          // Layer B continuously fades 1 -> 0
          // Layer A continuously fades 0 -> 1
          setLayers({
            layerA: { index: stateRef.current.layerA.index, opacity: 1 },
            layerB: { index: stateRef.current.layerB.index, opacity: 0 },
            activeLayer: "A",
          });

          // Wait until crossfade finishes completely
          fadeTimer = setTimeout(() => {
            if (!isMounted) return;

            // Crossfade complete: Layer A is now active (opacity 1)
            // Update inactive Layer B to prepare the next image in the loop while at opacity 0
            const nextIdx =
              (stateRef.current.layerA.index + 1) % SLIDESHOW_CONFIG.length;

            setLayers({
              layerA: { index: stateRef.current.layerA.index, opacity: 1 },
              layerB: { index: nextIdx, opacity: 0 },
              activeLayer: "A",
            });

            // Schedule the next transition cycle
            scheduleCycle();
          }, FADE_DURATION);
        }
      }, SLIDE_DURATION);
    };

    scheduleCycle();

    return () => {
      isMounted = false;
      if (holdTimer) clearTimeout(holdTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [reducedMotion]);

  const slideA = SLIDESHOW_CONFIG[layers.layerA.index];
  const slideB = SLIDESHOW_CONFIG[layers.layerB.index];

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity: 0.58 }}
      aria-hidden="true"
    >
      {/* Persistent Layer A */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url(${slideA.src})`,
          backgroundPosition: slideA.position,
          opacity: reducedMotion ? 1 : layers.layerA.opacity,
          zIndex: layers.activeLayer === "A" ? 2 : 1,
          transition: reducedMotion
            ? "none"
            : `opacity ${FADE_DURATION}ms ease-in-out`,
          willChange: "opacity",
        }}
      />

      {/* Persistent Layer B */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url(${slideB.src})`,
          backgroundPosition: slideB.position,
          opacity: reducedMotion ? 0 : layers.layerB.opacity,
          zIndex: layers.activeLayer === "B" ? 2 : 1,
          transition: reducedMotion
            ? "none"
            : `opacity ${FADE_DURATION}ms ease-in-out`,
          willChange: "opacity",
        }}
      />
    </div>
  );
}

/* ── Cinematic animated background ──────────────────────────── */
function HeroBackground() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* LAYER 0: Cinematic photo slideshow — deepest layer */}
      <CinematicSlideshow />

      {/* LAYER 1: Primary dark base that lets photos breathe */}
      <div className="absolute inset-0 bg-euphoria-dark/45" />

      {/* LAYER 2: Purple/teal radial colour washes — same as before */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(91, 27, 82, 0.35) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 20% 60%, rgba(162, 50, 160, 0.10) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 75% 70%, rgba(23, 111, 99, 0.15) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 30% 30% at 80% 20%, rgba(62, 238, 213, 0.03) 0%, transparent 40%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 25% 25% at 15% 25%, rgba(175, 153, 71, 0.04) 0%, transparent 40%)",
        }}
      />
      <LightRays
        colors={[
          "rgba(162, 50, 160, 0.06)",
          "rgba(91, 27, 82, 0.08)",
          "rgba(23, 111, 99, 0.05)",
          "rgba(175, 153, 71, 0.03)",
          "rgba(62, 238, 213, 0.02)",
        ]}
        rayCount={14}
        opacity={0.3}
        speed={45}
      />
      {/* Subtle floating colour wash instead of broken image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <div
          className={`absolute inset-0 ${
            reducedMotion ? "" : "animate-float"
          }`}
          style={{
            background:
              "radial-gradient(ellipse 40% 30% at 50% 50%, rgba(91,27,82,0.06) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* LAYER 3: Edge vignettes — keep text readable near borders */}
      <div className="absolute inset-0 bg-gradient-to-b from-euphoria-dark/80 via-transparent to-euphoria-dark" />
      <div className="absolute inset-0 bg-gradient-to-r from-euphoria-dark/60 via-transparent to-euphoria-dark/60" />
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}


/* ── Hero intro text loop timing configuration ────────────────── */
const HERO_INTRO_CONFIG = {
  celebrationEnterDuration: 800,  // ms enter transition for "THE CELEBRATION / BEYOND BOUNDARIES"
  celebrationHoldDuration: 1800,  // ms hold "THE CELEBRATION / BEYOND BOUNDARIES"
  celebrationExitDuration: 600,   // ms exit transition
  gapDuration: 150,               // ms breathing gap between transitions
  sageEuphoriaEnterDuration: 600, // ms enter transition for "SAGE EUPHORIA"
  sageEuphoriaHoldDuration: 2500, // ms hold "SAGE EUPHORIA" (~2–3 seconds)
  sageEuphoriaExitDuration: 600,  // ms exit transition
};

/* ── Opening tagline cinematic reveal ────────────────────────
 *
 *  Continuous seamless loop choreography:
 *    Phase 1: Enter (0.8s ease)
 *    Phase 2: Hold
 *    Phase 3: Exit (0.6s ease-in)
 *    Phase 4..8: Dormant while SAGE EUPHORIA takes center stage
 *
 *  No vertical movement whatsoever.
 *  ────────────────────────────────────────────────────────────── */
function TaglineText({
  phase,
  className = "",
}: {
  phase: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  const isDark = phase <= 0 || phase >= 4;
  const isEntering = phase === 1;
  const isExiting = phase === 3;

  const textOpacity = isDark ? 0 : isExiting ? 0 : 1;
  const textScale = isDark ? 0.94 : isExiting ? 1.03 : 1;
  const textBlur = isDark ? "blur(12px)" : isExiting ? "blur(6px)" : "blur(0px)";

  const textTransition = isEntering
    ? "all 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)"
    : isExiting
      ? "all 0.6s ease-in"
      : "all 0.15s ease";

  return (
    <div
      style={{
        opacity: textOpacity,
        transform: `scale(${textScale})`,
        filter: textBlur,
        transition: textTransition,
      }}
      className={`text-center select-none ${className}`}
      aria-hidden={phase < 1 || phase > 3}
    >
      <span className="block text-[clamp(1.5rem,4.8vw,4.25rem)] font-black tracking-[0.08em] sm:tracking-[0.1em] text-white/90 leading-[1.06]">
        THE CELEBRATION
      </span>
      <span className="block text-[clamp(1.95rem,6.2vw,5.4rem)] font-black tracking-[0.06em] sm:tracking-[0.08em] bg-clip-text text-transparent bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua leading-[1.08] mt-1.5 sm:mt-2 md:mt-2.5">
        BEYOND BOUNDARIES
      </span>
    </div>
  );
}

/* ── Opening tagline cinematic reveal ────────────────────────
 *
 *  Continuous seamless loop choreography:
 *    Phase 1: Enter (0.8s ease)
 *    Phase 2: Hold
 *    Phase 3: Exit (0.6s ease-in)
 *    Phase 4..8: Dormant while SAGE EUPHORIA takes center stage
 *
 *  No vertical movement whatsoever.
 *  ────────────────────────────────────────────────────────────── */
function ColourReveal({ phase }: { phase: number }) {
  const reducedMotion = useReducedMotion();

  /*
   * phase 0 = dark (waiting)
   * phase 1 = entering (0.8s blur→sharp, scale 0.94→1)
   * phase 2 = holding (fully visible)
   * phase 3 = exiting (0.6s fade out, scale 1→1.03, blur→subtle)
   * phase 4..8 = dormant (opacity 0)
   */

  const isDark = phase <= 0 || phase >= 4;
  const isEntering = phase === 1;
  const isExiting = phase === 3;

  const glowOpacity = isDark ? 0 : isExiting ? 0 : 1;
  const glowTransition = isEntering
    ? "opacity 1.2s ease-out"
    : isExiting
      ? "opacity 0.6s ease-in"
      : "opacity 0.15s ease";

  if (reducedMotion) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-opacity duration-300 ${
        phase >= 1 && phase <= 3 ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {/* Flowing colour glows behind the text */}
      <div
        className="absolute inset-0"
        style={{ opacity: glowOpacity, transition: glowTransition }}
      >
        {/* Gold */}
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute"
          style={{
            left: "25%", top: "35%", width: "280px", height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(175,153,71,0.18) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Purple */}
        <motion.div
          animate={{ x: [0, -35, 25, 0], y: [0, 25, -20, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute"
          style={{
            right: "20%", top: "30%", width: "300px", height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(162,50,160,0.16) 0%, transparent 70%)",
            filter: "blur(65px)",
          }}
        />
        {/* Teal */}
        <motion.div
          animate={{ x: [0, 30, -15, 0], y: [0, -20, 35, 0], scale: [1, 1.05, 0.92, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute"
          style={{
            left: "15%", top: "25%", width: "220px", height: "220px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(23,111,99,0.15) 0%, transparent 70%)",
            filter: "blur(55px)",
          }}
        />
        {/* Aqua */}
        <motion.div
          animate={{ x: [0, -25, 30, 0], y: [0, 30, -10, 0], scale: [1, 1.08, 0.95, 1] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute"
          style={{
            right: "30%", bottom: "30%", width: "200px", height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(62,238,213,0.12) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        {/* Magenta */}
        <motion.div
          animate={{ x: [0, 20, -30, 0], y: [0, -25, 15, 0], scale: [1, 0.95, 1.12, 1] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute"
          style={{
            left: "40%", top: "40%", width: "260px", height: "260px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(180,40,140,0.10) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>
    </div>
  );
}

/* ── Oversized background marquee typography ──────────────────── */
function MarqueeTypography() {
  const reducedMotion = useReducedMotion();
  const text = "SAGE EUPHORIA  ·  ";

  if (reducedMotion) {
    return (
      <div
        className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
        style={{ opacity: 0.03 }}
      >
        <span              className="text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] font-black tracking-wider whitespace-nowrap"
          style={{
            WebkitTextStroke: "2px rgba(162, 50, 160, 0.20)",
            color: "transparent",
            textShadow: "0 0 80px rgba(162, 50, 160, 0.05)",
          }}
        >
          {text}
        </span>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
      style={{ opacity: 0.035 }}
    >
      <Marquee speed={40} direction="left" pauseOnHover={false}>
        {Array.from({ length: 8 }).map((_, i) => (
          <MarqueeItem key={i}>
            <span
              className="text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] font-black tracking-wider mx-0"
              style={{
                WebkitTextStroke: "2px rgba(162, 50, 160, 0.22)",
                color: "transparent",
                textShadow: "0 0 100px rgba(162, 50, 160, 0.06)",
              }}
            >
              {text}
            </span>
          </MarqueeItem>
        ))}
      </Marquee>
    </div>
  );
}

/* ── Orbital decorative ring ────────────────────────────────── */
function OrbitalRing() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      <div
        className={`w-[450px] h-[450px] sm:w-[560px] sm:h-[560px] md:w-[700px] md:h-[700px] lg:w-[850px] lg:h-[850px] rounded-full border border-euphoria-purple/[0.04] ${
          reducedMotion ? "" : "animate-spin-slow"
        }`}
        style={{ animationDuration: "40s" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-euphoria-aqua/25" />
      </div>
      <div
        className={`absolute w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] md:w-[540px] md:h-[540px] lg:w-[660px] lg:h-[660px] rounded-full border border-euphoria-gold/[0.04] ${
          reducedMotion ? "" : "animate-spin-slow"
        }`}
        style={{ animationDuration: "55s", animationDirection: "reverse" }}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 rounded-full bg-euphoria-gold/20" />
      </div>
    </div>
  );
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/* ── Festival Countdown Target Date (imported from @/data/festival) ── */

function calculateTimeRemaining(targetDateStr: string): TimeRemaining {
  const target = new Date(targetDateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0 || isNaN(diff)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
  };
}

/* ── Main Hero ──────────────────────────────────────────────── */
export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(EUPHORIA_START_DATE)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(EUPHORIA_START_DATE));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /*
   * Continuous seamless loop:
   * 1. Show THE CELEBRATION / BEYOND BOUNDARIES
   * 2. Transition that reveals SAGE EUPHORIA
   * 3. Keep SAGE EUPHORIA visible for ~2–3 seconds
   * 4. Transition back to THE CELEBRATION / BEYOND BOUNDARIES
   * 5. Repeat continuously
   */
  const [introPhase, setIntroPhase] = useState<number>(() =>
    reducedMotion ? 6 : 0
  );
  const [hasSettled, setHasSettled] = useState<boolean>(() => Boolean(reducedMotion));

  useEffect(() => {
    if (reducedMotion) return;

    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const timeline = [
      { phase: 1, duration: HERO_INTRO_CONFIG.celebrationEnterDuration },
      { phase: 2, duration: HERO_INTRO_CONFIG.celebrationHoldDuration },
      { phase: 3, duration: HERO_INTRO_CONFIG.celebrationExitDuration },
      { phase: 4, duration: HERO_INTRO_CONFIG.gapDuration },
      { phase: 5, duration: HERO_INTRO_CONFIG.sageEuphoriaEnterDuration },
      { phase: 6, duration: HERO_INTRO_CONFIG.sageEuphoriaHoldDuration },
      { phase: 7, duration: HERO_INTRO_CONFIG.sageEuphoriaExitDuration },
      { phase: 8, duration: HERO_INTRO_CONFIG.gapDuration },
    ];

    let stepIndex = 0;

    const runStep = () => {
      if (!isMounted) return;

      const currentStep = timeline[stepIndex];
      setIntroPhase(currentStep.phase);

      if (currentStep.phase === 6) {
        setHasSettled(true);
      }

      timer = setTimeout(() => {
        if (!isMounted) return;
        stepIndex = (stepIndex + 1) % timeline.length;
        runStep();
      }, currentStep.duration);
    };

    // Initial brief start delay
    timer = setTimeout(runStep, 200);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [reducedMotion]);

  const heroReady = introPhase === 5 || introPhase === 6;
  const heroSettled = hasSettled;

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 sm:pt-24 lg:pt-24 pb-12 sm:pb-14 lg:pb-16 px-4 sm:px-6"
    >
      <HeroBackground />
      <MarqueeTypography />
      <OrbitalRing />

      {/* Magic UI Particles */}
      <Particles
        count={25}
        colors={[
          "rgba(62, 238, 213, 0.18)",
          "rgba(175, 153, 71, 0.15)",
          "rgba(162, 50, 160, 0.10)",
          "rgba(23, 111, 99, 0.12)",
        ]}
        maxSize={2}
        speed={0.6}
      />

      {/* ── ACT 1+2: Intro tagline reveal ── */}
      <ColourReveal phase={introPhase} />

      {/* ── ACT 3: SAGE EUPHORIA hero — unified center position in natural flow ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[1536px] mx-auto w-full my-auto pt-6 sm:pt-8 md:pt-10 lg:pt-12">
        {/* Reserved Branding Zone: Both "THE CELEBRATION / BEYOND BOUNDARIES" and "SAGE EUPHORIA" occupy the exact same reserved visual region across all screen sizes */}
        <div className="relative mb-3 sm:mb-4 md:mb-5 lg:mb-5 w-full flex items-start justify-center min-h-[135px] sm:min-h-[168px] md:min-h-[200px] lg:min-h-[230px]">
          {/* State A: Tagline overlay ("THE CELEBRATION / BEYOND BOUNDARIES") anchored to top */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-center pointer-events-none">
            <TaglineText phase={introPhase} className="px-2 sm:px-4" />
          </div>

          {/* State B: Large written SAGE EUPHORIA typography — enters from center, scale+opacity only */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={
              heroReady
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.96 }
            }
            transition={{
              duration: 0.6,
              delay: heroReady ? 0 : 0,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="w-full pointer-events-none"
            style={{ filter: heroReady ? "blur(0px)" : "blur(10px)", transition: "filter 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)" }}
          >
            <h1 className="tracking-tight select-none">
              <span className="block text-[clamp(2.65rem,6.8vw,6.25rem)] font-black text-white/90 leading-[0.88]">
                SAGE
              </span>
              <span className="block text-[clamp(3.35rem,8.6vw,7.85rem)] font-black text-transparent bg-clip-text bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua leading-[1.08]">
                Euphoria
              </span>
            </h1>
          </motion.div>
        </div>

        {/* ── Fest Dates Block (Directly below Hero animation & above CTAs) ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={heroSettled ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: 0.5, delay: heroSettled ? 0.1 : 0 }}
          className="flex flex-col items-center select-none w-full mb-5 sm:mb-6 md:mb-7"
        >
          {/* Three distinct date items: editorial, balanced visual weight */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5">
            {FEST_DATES.map((date, idx) => (
              <span key={date} className="contents">
                <span className="inline-flex items-center justify-center min-w-[36px] sm:min-w-[44px] md:min-w-[52px] text-2xl sm:text-3xl md:text-[32px] font-extrabold tracking-tight text-white tabular-nums drop-shadow-[0_2px_14px_rgba(255,255,255,0.2)]">
                  {date}
                </span>
                {idx < FEST_DATES.length - 1 && (
                  <span
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-euphoria-gold/80 shadow-[0_0_8px_rgba(175,153,71,0.5)] shrink-0"
                    aria-hidden="true"
                  />
                )}
              </span>
            ))}
          </div>

          {/* Month & Year context: smaller than date numbers */}
          <span className="text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.35em] sm:tracking-[0.4em] uppercase text-euphoria-gold mt-1 sm:mt-1.5 drop-shadow-[0_1px_8px_rgba(175,153,71,0.25)]">
            {FEST_MONTH} {FEST_YEAR}
          </span>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={heroSettled ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: heroSettled ? 0.15 : 0 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto items-center justify-center max-w-xs sm:max-w-none mx-auto"
        >
          <ShimmerButton
            shimmerColor="rgba(62, 238, 213, 0.4)"
            shimmerDuration="3s"
            background="rgba(62, 238, 213, 0.1)"
            className="w-full sm:w-auto min-h-[44px] px-7 sm:px-9 py-3 sm:py-3.5 flex items-center justify-center border border-euphoria-aqua/30 focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none cursor-pointer"
            onClick={() => scrollTo("#events")}
          >
            <span className="text-euphoria-aqua font-bold tracking-[0.2em] uppercase text-xs sm:text-sm drop-shadow-[0_0_10px_rgba(62,238,213,0.3)]">
              Explore Events
            </span>
          </ShimmerButton>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollTo("#about")}
            className="w-full sm:w-auto min-h-[44px] px-7 sm:px-9 py-3 sm:py-3.5 text-white/85 font-semibold tracking-[0.15em] uppercase text-[11px] sm:text-xs border border-white/20 bg-white/[0.03] rounded-lg transition-all duration-300 hover:text-white hover:border-white/40 hover:bg-white/[0.08] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none cursor-pointer"
          >
            Discover Euphoria
          </motion.button>
        </motion.div>

        {/* ── Countdown Block: smaller gap below CTA buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={heroSettled ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.5, delay: heroSettled ? 0.3 : 0 }}
          className="mt-4 sm:mt-5 md:mt-6 relative flex flex-col items-center pointer-events-none select-none w-full max-w-lg mx-auto"
          aria-label="Euphoria 2026 Countdown"
        >
          {/* Atmospheric ambient glow */}
          <motion.div
            animate={reducedMotion ? {} : { opacity: [0.35, 0.65, 0.35], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-x-12 -inset-y-8 pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(62, 238, 213, 0.08) 0%, rgba(162, 50, 160, 0.05) 45%, transparent 72%)",
            }}
            aria-hidden="true"
          />

          {/* Countdown micro label: small gap */}
          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold tracking-[0.32em] uppercase text-white/50 mb-1.5 sm:mb-2">
            COUNTDOWN TO DAY 1
          </span>

          {/* Cinematic counters with subtle rhythm separators */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-5">
            <div className="flex flex-col items-center min-w-[50px] sm:min-w-[62px] md:min-w-[72px]">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tight text-white tabular-nums leading-none drop-shadow-[0_2px_16px_rgba(255,255,255,0.15)]">
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold tracking-[0.28em] uppercase text-white/70 sm:text-white/50 mt-1.5 sm:mt-2">
                Days
              </span>
            </div>

            <motion.div
              animate={reducedMotion ? {} : { opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-6 sm:h-7 md:h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent self-center -mt-3.5 sm:-mt-4"
              aria-hidden="true"
            />

            <div className="flex flex-col items-center min-w-[50px] sm:min-w-[62px] md:min-w-[72px]">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tight text-white tabular-nums leading-none drop-shadow-[0_2px_16px_rgba(255,255,255,0.15)]">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold tracking-[0.28em] uppercase text-white/70 sm:text-white/50 mt-1.5 sm:mt-2">
                Hours
              </span>
            </div>

            <motion.div
              animate={reducedMotion ? {} : { opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-6 sm:h-7 md:h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent self-center -mt-3.5 sm:-mt-4"
              aria-hidden="true"
            />

            <div className="flex flex-col items-center min-w-[50px] sm:min-w-[62px] md:min-w-[72px]">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tight text-white tabular-nums leading-none drop-shadow-[0_2px_16px_rgba(255,255,255,0.15)]">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold tracking-[0.28em] uppercase text-white/70 sm:text-white/50 mt-1.5 sm:mt-2">
                Minutes
              </span>
            </div>

            <motion.div
              animate={reducedMotion ? {} : { opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-px h-6 sm:h-7 md:h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent self-center -mt-3.5 sm:-mt-4"
              aria-hidden="true"
            />

            <div className="flex flex-col items-center min-w-[50px] sm:min-w-[62px] md:min-w-[72px]">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tight text-white tabular-nums leading-none drop-shadow-[0_2px_16px_rgba(255,255,255,0.15)]">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold tracking-[0.28em] uppercase text-white/70 sm:text-white/50 mt-1.5 sm:mt-2">
                Seconds
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
