import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Lock, Check, Ticket } from "lucide-react";
import { apiGet } from "@/lib/api";
import { PassPurchaseModal } from "./PassPurchaseModal";

/* ─── Single pass data (data-driven, ready for backend) ─── */
const euphoriaPass = {
  id: "euphoria-2026-general",
  name: "EUPHORIA 2026",
  subtitle: "GENERAL PASS",
  tagline: "Your entry into the celebration.",
  price: null as number | null,
  status: "available" as "coming-soon" | "available",

  audiences: [
    "SAGE University students",
    "Students from other colleges / schools",
  ],
  features: [
    "Access to the Euphoria festival experience",
    "Entry to eligible events and activities",
    "Festival updates and announcements",
    "Access to designated festival areas",
    "More details to be announced",
  ],
};

/* ─── Fade-up animation helper ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function Passes() {
  const introRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [passData, setPassData] = useState(euphoriaPass);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  useEffect(() => {
    apiGet<{ status: string; data: { passes: any[] } }>("/passes")
      .then((res) => {
        if (res.data?.passes?.[0]) {
          const p = res.data.passes[0];
          setPassData((prev) => ({
            ...prev,
            id: p.id,
            name: p.name,
            subtitle: p.subtitle || prev.subtitle,
            price: p.price,
            status: p.status === "AVAILABLE" ? "available" : "coming-soon",
            tagline: p.tagline || prev.tagline,
            features: p.features || prev.features,
            audiences: p.audiences || prev.audiences,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const introInView = useInView(introRef, { once: true, amount: 0.2 });
  const cardInView = useInView(cardRef, { once: true, amount: 0.15 });

  return (
    <section
      id="passes"
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden"
    >
      {/* ─── Atmospheric background ─── */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-euphoria-dark" />
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-euphoria-purple/[0.06] blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-euphoria-aqua/[0.04] blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full bg-euphoria-gold/[0.025] blur-[220px]" />
        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ────────────────────────────────────────── */}
      {/* PART 1 — CINEMATIC INTRO                   */}
      {/* ────────────────────────────────────────── */}
      <div
        ref={introRef}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 sm:mb-14"
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={introInView ? "visible" : "hidden"}
          custom={0}
          className="mb-4 sm:mb-5"
        >
          <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-euphoria-gold/50 bg-euphoria-gold/[0.14] backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-euphoria-gold animate-pulse" />
            <span className="text-xs sm:text-base lg:text-[17px] font-extrabold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-euphoria-gold">
              Passes & Access
            </span>
          </div>
        </motion.div>

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate={introInView ? "visible" : "hidden"}
          custom={1}
          className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]"
          style={{ fontFamily: "var(--font-heading, inherit)" }}
        >
          <span className="text-white/90">ONE FESTIVAL</span>
          <br />
          <span className="text-white/90">ONE PASS</span>
          <br />
          <span className="bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua bg-clip-text text-transparent">
            ENDLESS EUPHORIA
          </span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate={introInView ? "visible" : "hidden"}
          custom={2}
          className="mt-4 sm:mt-5 text-base sm:text-lg text-white/85 sm:text-white/80 max-w-lg mx-auto leading-relaxed font-normal"
        >
          One pass. Open to everyone.
          <br />
          Students, outsiders, creators, dreamers — experience Euphoria
          together.
        </motion.p>

        {/* Subtle divider */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={introInView ? "visible" : "hidden"}
          custom={3}
          className="mt-10 mx-auto w-20 h-px bg-gradient-to-r from-transparent via-euphoria-gold/40 to-transparent"
        />
      </div>

      {/* ────────────────────────────────────────── */}
      {/* PART 2 — SINGLE PASS CARD                  */}
      {/* ────────────────────────────────────────── */}
      <div
        ref={cardRef}
        className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8"
      >
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={cardInView ? "visible" : "hidden"}
          custom={0}
          className="relative group"
        >
          {/* Animated gradient border glow */}
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-euphoria-aqua/20 via-euphoria-purple/15 to-euphoria-gold/20 opacity-60 group-hover:opacity-100 transition-opacity duration-700 blur-[1px]" />
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-euphoria-aqua/10 via-transparent to-euphoria-gold/10 opacity-0 group-hover:opacity-60 transition-opacity duration-700" />

          {/* Card body */}
          <div className="relative rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-xl overflow-hidden">
            {/* Top accent bar */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-euphoria-aqua/30 to-transparent" />

            {/* "Open to everyone" badge */}
            <div className="text-center pt-8 sm:pt-10">
              <motion.span
                variants={fadeUp}
                initial="hidden"
                animate={cardInView ? "visible" : "hidden"}
                custom={1}
                className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase text-euphoria-aqua/80 border border-euphoria-aqua/15 rounded-full px-5 py-1.5 bg-euphoria-aqua/[0.04]"
              >
                Open to Everyone
              </motion.span>
            </div>

            {/* Card content */}
            <div className="px-4 min-[380px]:px-6 sm:px-10 py-8 sm:py-10 text-center">
              <motion.h3
                variants={fadeUp}
                initial="hidden"
                animate={cardInView ? "visible" : "hidden"}
                custom={2}
                className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider text-white/90 leading-tight mb-2"
                style={{ fontFamily: "var(--font-heading, inherit)" }}
              >
                {euphoriaPass.name}
              </motion.h3>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate={cardInView ? "visible" : "hidden"}
                custom={3}
                className="text-sm sm:text-base font-medium tracking-[0.2em] uppercase text-euphoria-gold/80 sm:text-euphoria-gold/70 mb-1"
              >
                {euphoriaPass.subtitle}
              </motion.p>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate={cardInView ? "visible" : "hidden"}
                custom={3.5}
                className="text-sm text-white/70 sm:text-white/55 mb-8"
              >
                {euphoriaPass.tagline}
              </motion.p>

              {/* Eligible audiences */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate={cardInView ? "visible" : "hidden"}
                custom={4}
                className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-8"
              >
                {euphoriaPass.audiences.map((audience) => (
                  <span
                    key={audience}
                    className="flex items-center gap-1.5 text-xs sm:text-sm text-white/70 sm:text-white/50"
                  >
                    <Check className="size-3.5 text-euphoria-aqua/80 shrink-0" />
                    <span>{audience}</span>
                  </span>
                ))}
              </motion.div>

              {/* Divider */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

              {/* Features */}
              <motion.ul
                variants={fadeUp}
                initial="hidden"
                animate={cardInView ? "visible" : "hidden"}
                custom={5}
                className="space-y-3 mb-8 max-w-md mx-auto text-left"
              >
                {euphoriaPass.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-white/75 sm:text-white/65"
                  >
                    <Check className="size-3.5 mt-0.5 flex-shrink-0 text-euphoria-purple/80" />
                    <span>{feature}</span>
                  </li>
                ))}
              </motion.ul>

              {/* Price */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate={cardInView ? "visible" : "hidden"}
                custom={6}
                className="mb-6"
              >
                {passData.price != null ? (
                  <div className="inline-flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl font-black text-euphoria-gold tracking-tight">
                      ₹{passData.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/60 sm:text-white/40 mt-1">
                      All-Inclusive Festival Access
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium tracking-wide text-white/60 border border-white/10 rounded-lg px-4 py-2 inline-block">
                    PRICE TO BE ANNOUNCED
                  </span>
                )}
              </motion.div>

              {/* CTA Button */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate={cardInView ? "visible" : "hidden"}
                custom={7}
              >
                {passData.status === "available" ? (
                  <button
                    onClick={() => setIsPurchaseOpen(true)}
                    className="w-full sm:w-72 mx-auto py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-neutral-950 text-sm font-extrabold tracking-wider uppercase border border-amber-300/40 hover:brightness-105 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-euphoria-dark focus-visible:outline-none transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
                  >
                    <Ticket className="size-4 text-neutral-950 shrink-0" />
                    Get Festival Pass
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full sm:w-72 mx-auto py-3.5 sm:py-4 rounded-xl bg-white/[0.06] text-white/50 text-sm font-semibold tracking-wider uppercase cursor-not-allowed border border-white/[0.08] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Lock className="size-3.5 text-white/50 shrink-0" />
                    Coming Soon
                  </button>
                )}
              </motion.div>
            </div>

            {/* Bottom accent bar */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-euphoria-gold/20 to-transparent" />
          </div>
        </motion.div>
      </div>

      {/* Pass Purchase Modal */}
      <PassPurchaseModal
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        pass={passData}
      />
    </section>
  );
}
