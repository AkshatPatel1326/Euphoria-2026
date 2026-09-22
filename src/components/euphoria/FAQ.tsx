import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BlurFade } from "@/components/magicui/blur-fade";

/* ── FAQ data ──────────────────────────────────────────────── */
const faqs = [
  {
    q: "Who can participate in the fest?",
    a: "The fest is open to students from SAGE University Indore as well as participants from other colleges, subject to event-specific eligibility criteria.",
  },
  {
    q: "How can I register for events?",
    a: "Participants can register through the official fest website by selecting their desired events and completing the registration process.",
  },
  {
    q: "Is there any registration fee?",
    a: "Yes, some events may have a nominal registration fee. The fee details are mentioned under each event.",
  },
  {
    q: "Can I participate in multiple events?",
    a: "Yes, participants can register for multiple events as long as the event timings do not clash.",
  },
  {
    q: "Will I receive a confirmation after registration?",
    a: "Yes, a confirmation message/email will be provided after successful registration.",
  },
  {
    q: "What should I bring on the event day?",
    a: "Participants must carry: College ID card, Registration confirmation, and any required materials for their specific event.",
  },
  {
    q: "Are on-spot registrations allowed?",
    a: "On-spot registrations may be available for selected events, subject to availability of slots.",
  },
  {
    q: "Will certificates be provided?",
    a: "Yes, participation certificates will be provided to all registered participants, and winners will receive certificates along with prizes.",
  },
  {
    q: "How will I get event updates?",
    a: "All updates will be shared through the official website and registered contact details.",
  },
  {
    q: "Who should I contact for queries?",
    a: "Participants can contact the event coordinators or the official fest helpdesk mentioned on the website.",
  },
];

/* ── Single FAQ row ────────────────────────────────────────── */
function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: (typeof faqs)[number];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <BlurFade
      delay={0.08 + index * 0.05}
      inViewMargin="-60px"
    >
      <div
        className={`border-b transition-colors duration-300 ${
          isOpen
            ? "border-euphoria-gold/35 sm:border-euphoria-gold/25"
            : "border-white/[0.08] sm:border-white/[0.05] hover:border-white/[0.12]"
        }`}
      >
        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          className="w-full min-h-[52px] sm:min-h-[56px] flex items-center justify-between gap-3.5 sm:gap-4 py-4 sm:py-6 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-euphoria-aqua/40 focus-visible:ring-offset-2 focus-visible:ring-offset-euphoria-dark rounded-sm cursor-pointer"
        >
          <span
            className={`text-[15px] sm:text-[17px] leading-snug sm:leading-normal tracking-wide transition-colors duration-300 pr-2 ${
              isOpen
                ? "text-white font-bold"
                : "text-white/90 sm:text-white/85 group-hover:text-white font-semibold"
            }`}
          >
            {item.q}
          </span>

          {/* Expand/collapse icon */}
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all duration-300"
            style={{
              borderColor: isOpen
                ? "rgba(175,153,71,0.55)"
                : "rgba(255,255,255,0.18)",
              backgroundColor: isOpen
                ? "rgba(175,153,71,0.14)"
                : "rgba(255,255,255,0.04)",
            }}
          >
            <span
              className={`block w-3 h-[1.5px] rounded-full transition-colors duration-300 ${
                isOpen ? "bg-euphoria-gold" : "bg-white/80 group-hover:bg-white"
              }`}
            />
            <span
              className={`absolute block w-[1.5px] h-3 rounded-full transition-all duration-300 ${
                isOpen ? "bg-euphoria-gold opacity-0 scale-0" : "bg-white/80 group-hover:bg-white opacity-100 scale-100"
              }`}
            />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <p className="pb-5 sm:pb-6 text-sm sm:text-base text-white/90 sm:text-white/85 leading-relaxed font-normal max-w-2xl">
                {item.a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BlurFade>
  );
}

/* ── Main FAQ Section ──────────────────────────────────────── */
export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = useCallback(
    (index: number) => {
      setOpenIndex((prev) => (prev === index ? null : index));
    },
    []
  );

  return (
    <section
      id="faq"
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-euphoria-dark" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 20%, rgba(91,27,82,0.08) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 35% at 80% 80%, rgba(23,111,99,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14 items-start">
          {/* Left — heading */}
          <div className="lg:col-span-5">
            <BlurFade inViewMargin="-20px" className="mb-4 sm:mb-5">
              <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-euphoria-gold/50 bg-euphoria-gold/[0.14] mb-3 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-euphoria-gold animate-pulse" />
                <span className="text-xs sm:text-base lg:text-[17px] font-extrabold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-euphoria-gold">
                  FAQ & Helpdesk
                </span>
              </div>
            </BlurFade>

            <BlurFade delay={0.06} inViewMargin="-20px">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                <span className="text-white block">Euphoria</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-euphoria-gold via-purple-300 to-euphoria-aqua block mt-1 sm:mt-2">
                  Helpdesk
                </span>
              </h2>
            </BlurFade>

            <BlurFade delay={0.12} inViewMargin="-20px" className="mt-4 sm:mt-6">
              <p className="text-sm sm:text-lg text-white/85 sm:text-white/80 max-w-sm leading-relaxed font-normal">
                Everything you need to know before the fest begins.
              </p>
            </BlurFade>
          </div>

          {/* Right — accordion */}
          <div className="lg:col-span-7 lg:pt-4">
            {faqs.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => handleToggle(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-euphoria-gold/15 to-transparent" />
    </section>
  );
}
