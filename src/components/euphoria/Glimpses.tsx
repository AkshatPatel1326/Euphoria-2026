import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BlurFade } from "@/components/magicui/blur-fade";

export function Glimpses() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-20px" });

  return (
    <section
      id="glimpses"
      ref={sectionRef}
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden"
    >
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-euphoria-dark" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(91, 27, 82, 0.10) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 30% at 70% 70%, rgba(23, 111, 99, 0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <BlurFade inViewMargin="-20px" className="mb-8 sm:mb-10 text-center">
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-euphoria-gold/50 bg-euphoria-gold/[0.14] mb-4 backdrop-blur-sm">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-euphoria-gold animate-pulse shrink-0" />
            <span className="text-xs sm:text-base lg:text-[16px] font-extrabold tracking-[0.16em] sm:tracking-[0.28em] uppercase text-euphoria-gold">
              Past Editions — 2023 · 2024 · 2025
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight">
            <span className="text-white">Glimpses of </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-euphoria-purple via-euphoria-gold to-euphoria-aqua">
              Euphoria
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed font-normal">
            Experience the energy, creativity, and unforgettable moments that define Euphoria.
          </p>
        </BlurFade>

        {/* Video feature area */}
        <BlurFade delay={0.1} inViewMargin="-20px">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={
              inView
                ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                : {}
            }
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="relative w-full aspect-video max-h-[600px] rounded-2xl overflow-hidden border border-white/[0.06] group cursor-pointer"
          >
            {/* YouTube embed */}
            <div className="absolute inset-0 bg-black">
              <iframe
                src="https://www.youtube-nocookie.com/embed/UninC6no5oU?rel=0&modestbranding=1&color=white"
                title="Euphoria Aftermovie"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-euphoria-dark/50 to-transparent pointer-events-none z-10" />

            {/* Corner accents */}
            <div className="absolute top-4 left-4 w-6 h-6 border-l border-t border-white/[0.06] rounded-tl-sm pointer-events-none z-10" />
            <div className="absolute top-4 right-4 w-6 h-6 border-r border-t border-white/[0.06] rounded-tr-sm pointer-events-none z-10" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-l border-b border-white/[0.06] rounded-bl-sm pointer-events-none z-10" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-r border-b border-white/[0.06] rounded-br-sm pointer-events-none z-10" />
          </motion.div>
        </BlurFade>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-euphoria-purple/10 to-transparent" />
    </section>
  );
}
