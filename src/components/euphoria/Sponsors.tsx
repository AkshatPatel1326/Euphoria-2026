import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BlurFade } from "@/components/magicui/blur-fade";

/* ── Featured sponsors (prominent placement) ───────────────── */
const featuredSponsors = [
  {
    src: "/assets/Sage_euphoria_logp.png",
    label: "SAGE Euphoria 2026",
    sublabel: "Flagship University Fest",
  },
  {
    src: "/assets/Past_Sponsors__14_.png",
    label: "Radio SAGE",
    sublabel: "Official Media Partner",
  },
];

/* ── Past sponsor logos ────────────────────────────────────── */
const pastSponsors = [
  { src: "/assets/Past_Sponsors__7_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__8_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__9_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__12_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__21_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__22_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__23_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__24_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__26_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__27_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__29_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__30_.png", alt: "Partner" },
  { src: "/assets/Past_Sponsors__39_.png", alt: "Partner" },
  { src: "/assets/JH.png", alt: "JH Partner" },
  { src: "/assets/RE.png", alt: "RE Partner" },
];

/* ── Atmospheric background ────────────────────────────────── */
function SponsorBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-euphoria-dark" />

      {/* Deep plum glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 90%, rgba(91,27,82,0.12) 0%, transparent 60%)",
        }}
      />

      {/* Gold accent glow — center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 30% at 50% 50%, rgba(175,153,71,0.05) 0%, transparent 50%)",
        }}
      />

      {/* Teal accent — right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 30% 25% at 80% 70%, rgba(23,111,99,0.06) 0%, transparent 50%)",
        }}
      />

      {/* Subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

/* ── Animated gradient divider ──────────────────────────────── */
function GradientDivider() {
  return (
    <div className="relative w-full h-px mb-8 sm:mb-10 lg:mb-12 overflow-hidden">
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(162,50,160,0.25), rgba(175,153,71,0.35), rgba(23,111,99,0.25), transparent)",
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
}

/* ── Main Sponsors Section ─────────────────────────────────── */
export function Sponsors() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-20px" });

  return (
    <section
      id="sponsors"
      ref={sectionRef}
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden"
    >
      <SponsorBackground />

      <div className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <GradientDivider />

        {/* ── Editorial heading ─────────────────────────────── */}
        <BlurFade inViewMargin="-20px" className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-euphoria-gold/50 bg-euphoria-gold/[0.14] mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-euphoria-gold animate-pulse" />
            <span className="text-xs sm:text-base lg:text-[17px] font-extrabold tracking-[0.18em] sm:tracking-[0.3em] uppercase text-euphoria-gold">
              Partners & Sponsors
            </span>
          </div>
          <h2
            className="font-black tracking-tight leading-[0.9]"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
          >
            <span className="block text-white/90">THE</span>
            <span className="block text-white/90">FORCE BEHIND</span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua">
              EUPHORIA
            </span>
          </h2>
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-white/80 sm:text-white/75 max-w-md mx-auto leading-relaxed font-normal">
            Every great festival is powered by the belief of its partners.
            <br />
            These are the names that made Euphoria possible.
          </p>
        </BlurFade>

        {/* ── Featured sponsors — prominent presentation ─────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mb-14 sm:mb-16">
          {featuredSponsors.map((sponsor, i) => (
            <BlurFade
              key={sponsor.label}
              delay={0.15 + i * 0.12}
              inViewMargin="-80px"
              className="flex flex-col items-center gap-4 group"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-white/[0.08] bg-white/[0.03] p-2.5 flex items-center justify-center transition-all duration-500 group-hover:border-euphoria-gold/30 group-hover:bg-white/[0.05] group-hover:shadow-[0_0_40px_rgba(175,153,71,0.12)]"
              >
                <img
                  src={sponsor.src}
                  alt={sponsor.label}
                  className="w-full h-full object-contain transition-all duration-500 opacity-85 group-hover:opacity-100"
                />
              </motion.div>
              <div className="text-center">
                <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-white/80 sm:text-white/65 group-hover:text-white transition-colors duration-300">
                  {sponsor.label}
                </p>
                <p className="text-[9px] sm:text-[10px] text-white/60 sm:text-white/45 tracking-wider mt-1">
                  {sponsor.sublabel}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>

        {/* ── Divider line ─────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-white/[0.08]" />
          <span className="text-[9px] tracking-[0.25em] sm:tracking-[0.35em] uppercase text-white/65 sm:text-white/45 font-medium">
            Past Sponsors &amp; Partners
          </span>
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-white/[0.08]" />
        </div>

        {/* ── Sponsor logo grid — staggered reveal ──────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
          {pastSponsors.map((logo, i) => (
            <BlurFade
              key={logo.src}
              delay={0.3 + i * 0.035}
              duration={0.45}
              inViewMargin="-50px"
            >
              <motion.div
                whileHover={{ scale: 1.06, y: -2 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="group flex items-center justify-center aspect-square rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all duration-400 hover:border-euphoria-gold/20 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(175,153,71,0.08)]"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                  loading="lazy"
                />
              </motion.div>
            </BlurFade>
          ))}
        </div>

        {/* ── Partnership inquiry ──────────────────── */}
        <BlurFade delay={0.5} inViewMargin="-60px" className="text-center mt-10 sm:mt-12">
          <p className="text-[10px] sm:text-[11px] text-white/65 sm:text-white/50 tracking-[0.14em] sm:tracking-[0.2em] px-4 leading-relaxed">
            For partnership inquiries:{" "}
            <span className="text-euphoria-gold/85 font-semibold break-all sm:break-normal">sponsorship@sageuniversity.in</span>
          </p>
        </BlurFade>
      </div>
    </section>
  );
}
