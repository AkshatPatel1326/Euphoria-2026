import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { events, type EventCategory } from "@/data/events";
import { EventCard } from "./EventCard";
import { EventDetailModal } from "./EventDetailModal";
import { BlurFade } from "@/components/magicui/blur-fade";

const categories: (EventCategory | "all")[] = [
  "all",
  "cultural",
  "literary-management",
  "science-tech",
  "sports",
];

const tabLabels: Record<string, string> = {
  all: "All Events",
  cultural: "01 Cultural",
  "literary-management": "02 Lit & Mgmt",
  "science-tech": "03 Sci & Tech",
  sports: "04 Sports",
};

export function Events() {
  const [activeCategory, setActiveCategory] = useState<EventCategory | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const filtered =
    activeCategory === "all"
      ? events.filter((e) => e.status !== "DRAFT" && e.id !== "cultural-6")
      : events.filter(
          (e) =>
            e.category === activeCategory &&
            e.status !== "DRAFT" &&
            e.id !== "cultural-6" &&
            (activeCategory !== "cultural" ||
              (e.id !== "cultural-11" && e.id !== "cultural-12"))
        );

  const selectedEventData = events.find((e) => e.id === selectedEvent) ?? null;

  return (
    <section id="events" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-euphoria-darker" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(162, 50, 160, 0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <BlurFade inViewMargin="-80px" className="text-center mb-12 sm:mb-16">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-[0.4em] uppercase text-euphoria-aqua/60 mb-4">
            Events
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-white">Find Your </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua">
              Arena
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/65 max-w-xl mx-auto leading-relaxed">
            A vibrant blend of art, music, culture, innovation, competitions, and performance —
            across four disciplines and over thirty events.
          </p>
        </BlurFade>

        {/* Category tabs */}
        <BlurFade delay={0.15} inViewMargin="-80px" className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-300 ${
                  isActive
                    ? "bg-euphoria-aqua/15 text-euphoria-aqua border border-euphoria-aqua/40 shadow-[0_0_20px_rgba(62,238,213,0.1)]"
                    : "text-white/55 border border-white/[0.06] hover:text-white/70 hover:border-white/10"
                }`}
              >
                {tabLabels[cat] || cat}
              </button>
            );
          })}
        </BlurFade>

        {/* Event count */}
        <div className="text-center mb-8">
          <span className="text-xs text-white/45 tracking-wider">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Event grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
          >
            {filtered.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                onViewEvent={() => setSelectedEvent(event.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Event detail modal */}
      <EventDetailModal
        event={selectedEventData}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-euphoria-purple/10 to-transparent" />
    </section>
  );
}
