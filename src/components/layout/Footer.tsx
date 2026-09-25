import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Marquee, MarqueeItem } from "@/components/magicui/marquee";

const footerLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Passes", href: "#passes" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

/* ── Closing statement lines ──────────────────────────────── */
const closingLines = [
  { text: "MORE HUES", delay: 0 },
  { text: "MORE PASSION", delay: 0.25 },
  { text: "MORE POWER", delay: 0.5 },
];

/* ── Cinematic background ─────────────────────────────────── */
function FooterBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-euphoria-darker" />

      {/* Deep plum glow — bottom center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 100%, rgba(91,27,82,0.18) 0%, transparent 55%)",
        }}
      />

      {/* Teal glow — bottom right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 35% 30% at 80% 90%, rgba(23,111,99,0.10) 0%, transparent 50%)",
        }}
      />

      {/* Purple atmospheric — left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 30% 35% at 15% 70%, rgba(162,50,160,0.06) 0%, transparent 50%)",
        }}
      />

      {/* Gold accent — center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 25% 20% at 50% 60%, rgba(175,153,71,0.04) 0%, transparent 40%)",
        }}
      />

      {/* Subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

/* ── Large background marquee ─────────────────────────────── */
function FooterMarquee() {
  const text = "EUPHORIA  ·  ";

  return (
    <div
      className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
      style={{ opacity: 0.025 }}
    >
      <Marquee speed={12} direction="left" pauseOnHover={false}>
        {Array.from({ length: 8 }).map((_, i) => (
          <MarqueeItem key={i}>
            <span
              className="text-[11vw] sm:text-[9vw] md:text-[7.5vw] font-black tracking-wider mx-0"
              style={{
                WebkitTextStroke: "1.5px rgba(162, 50, 160, 0.22)",
                color: "transparent",
                textShadow: "0 0 60px rgba(162, 50, 160, 0.04)",
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

/* ── Animated gradient divider ─────────────────────────────── */
function GradientDivider() {
  return (
    <div className="relative w-full h-px mb-8 sm:mb-10 lg:mb-12 overflow-hidden">
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(162,50,160,0.3), rgba(175,153,71,0.4), rgba(23,111,99,0.3), transparent)",
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
}

/* ── Main Footer ──────────────────────────────────────────── */
export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const inView = useInView(footerRef, { once: true, margin: "-20px" });

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer
      id="contact"
      ref={footerRef}
      className="relative overflow-hidden"
    >
      <FooterBackground />
      <FooterMarquee />

      {/* ═══ CINEMATIC CLOSING STATEMENT ═══════════════════════ */}
      <div className="relative z-10 flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {closingLines.map((line, i) => (
            <motion.div
              key={line.text}
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={
                inView
                  ? { opacity: 1, y: 0, filter: "blur(0px)" }
                  : { opacity: 0, y: 16, filter: "blur(6px)" }
              }
              transition={{
                duration: 0.45,
                delay: 0.1 + line.delay * 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <span
                className="block font-black tracking-[0.08em] text-center"
                style={{
                  fontSize: "clamp(1.8rem, 5.5vw, 4.5rem)",
                  background:
                    i === 0
                      ? "linear-gradient(90deg, #AF9947, #d4af37)"
                      : i === 1
                        ? "linear-gradient(90deg, #A232A0, #c94dc9)"
                        : "linear-gradient(90deg, #176F63, #3EEED5)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {line.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Subtle atmospheric glow behind closing text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="w-[400px] h-[300px] sm:w-[600px] sm:h-[400px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(162,50,160,0.06) 0%, rgba(175,153,71,0.04) 40%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </motion.div>
      </div>

      {/* ═══ MINIMAL PRACTICAL FOOTER ═════════════════════════ */}
      <div className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <GradientDivider />

        <BlurFade inViewMargin="-30px" className="pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Brand & Official Link */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tracking-widest text-euphoria-aqua/75">
                  SAGE
                </span>
                <span className="text-lg font-light tracking-widest text-white/70">
                  Euphoria
                </span>
                <span className="text-[8px] font-semibold tracking-wider text-euphoria-gold/70 border border-euphoria-gold/35 rounded px-1.5 py-0.5">
                  2026
                </span>
              </div>
              <p className="text-xs text-white/65 sm:text-white/50 max-w-sm leading-relaxed">
                SAGE University Indore&apos;s flagship annual festival — a
                three-day celebration of culture, innovation, and sport.
              </p>
              <div className="pt-1">
                <a
                  href="https://sageuniversity.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="SAGE University official website (opens in new tab)"
                  className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-euphoria-aqua transition-colors duration-200 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-euphoria-aqua/50 rounded"
                >
                  <span className="underline underline-offset-4 decoration-white/30 group-hover:decoration-euphoria-aqua">
                    sageuniversity.in
                  </span>
                  <ExternalLink className="size-3 text-white/50 group-hover:text-euphoria-aqua transition-colors" />
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div className="lg:col-span-3">
              <span className="text-xs sm:text-[13px] tracking-[0.25em] uppercase text-white/90 font-bold block mb-3">
                Navigation
              </span>
              <nav className="flex flex-col space-y-1 sm:space-y-2">
                {footerLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    className="relative min-h-[36px] flex items-center py-1 sm:py-0.5 text-xs sm:text-[11px] text-white/75 sm:text-white/60 tracking-[0.15em] uppercase transition-colors duration-200 hover:text-euphoria-aqua group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-euphoria-aqua/50 rounded text-left w-fit cursor-pointer"
                  >
                    <span>{link.label}</span>
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-euphoria-aqua/60 transition-all duration-200 group-hover:w-full" />
                  </button>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div className="lg:col-span-3">
              <span className="text-xs sm:text-[13px] tracking-[0.25em] uppercase text-white/90 font-bold block mb-3">
                Contact
              </span>
              <div className="space-y-2 text-xs text-white/65 sm:text-white/50">
                <a
                  href="mailto:sage.euphoria@sageuniversity.in"
                  className="block min-h-[32px] flex items-center hover:text-white/90 transition-colors duration-200 break-all sm:break-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-euphoria-aqua/50 rounded w-fit"
                >
                  sage.euphoria@sageuniversity.in
                </a>
                <a
                  href="mailto:sponsorship@sageuniversity.in"
                  className="block min-h-[32px] flex items-center hover:text-white/90 transition-colors duration-200 break-all sm:break-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-euphoria-aqua/50 rounded w-fit"
                >
                  sponsorship@sageuniversity.in
                </a>
              </div>
            </div>

            {/* Follow Us */}
            <div className="lg:col-span-2">
              <span className="text-xs sm:text-[13px] tracking-[0.25em] uppercase text-white/90 font-bold block mb-3">
                Follow Us
              </span>
              <p className="text-xs text-white/65 sm:text-white/50">
                Instagram:{" "}
                <a
                  href="https://www.instagram.com/sage.euphoria/reels/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="SAGE Euphoria on Instagram (opens in new tab)"
                  className="text-white/80 hover:text-euphoria-aqua underline underline-offset-4 decoration-white/30 hover:decoration-euphoria-aqua transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-euphoria-aqua/50 rounded"
                >
                  @sage.euphoria
                </a>
              </p>
            </div>
          </div>
        </BlurFade>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 border-t border-white/[0.06]">
          <p className="text-[11px] text-white/55 sm:text-white/40 tracking-wider">
            &copy; 2026 SAGE Euphoria. All rights reserved.
          </p>
          <p className="text-[11px] text-white/55 sm:text-white/40 tracking-wider">
            SAGE University, Indore
          </p>
        </div>
      </div>
    </footer>
  );
}
