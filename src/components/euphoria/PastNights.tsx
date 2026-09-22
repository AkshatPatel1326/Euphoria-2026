import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Radio, Calendar, Music } from "lucide-react";

/* ── Types & Data Interfaces ────────────────────────────────── */
export type EditionYear = "2023" | "2024" | "2025";

export interface ConfirmedArtist {
  id: string;
  name: string;
  image?: string;
  role?: string;
  badge?: string;
  note?: string;
}

export interface PastNightChapter {
  year: EditionYear;
  editionLabel: string;
  poster?: string;
  theme: {
    accentColor: string;
    borderActive: string;
    glowClass: string;
    gradientText: string;
    radialGlow: string;
  };
  artists: ConfirmedArtist[];
}

/* ── Confirmed Data Configuration ─────────────────────────────
 * STRICT ZERO-FABRICATION POLICY:
 * Historical performer rosters remain strictly unpopulated until verified
 * official names and assets are supplied.
 * ──────────────────────────────────────────────────────────── */
export const PAST_NIGHTS_DATA: Record<EditionYear, PastNightChapter> = {
  "2023": {
    year: "2023",
    editionLabel: "Euphoria 2023",
    poster: "/assets/Z and P 2023.jpeg",
    theme: {
      accentColor: "text-euphoria-gold",
      borderActive: "border-euphoria-gold/70 shadow-[0_0_30px_rgba(175,153,71,0.25)]",
      glowClass: "from-euphoria-gold/20 via-transparent to-transparent",
      gradientText: "from-euphoria-gold via-amber-200 to-yellow-500",
      radialGlow:
        "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(175, 153, 71, 0.18) 0%, transparent 70%)",
    },
    artists: [],
  },
  "2024": {
    year: "2024",
    editionLabel: "Euphoria 2024",
    poster: "/assets/AS and DR 2024.jpg",
    theme: {
      accentColor: "text-euphoria-purple",
      borderActive: "border-euphoria-purple/70 shadow-[0_0_30px_rgba(162,50,160,0.25)]",
      glowClass: "from-euphoria-purple/20 via-transparent to-transparent",
      gradientText: "from-euphoria-purple via-fuchsia-300 to-purple-400",
      radialGlow:
        "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(162, 50, 160, 0.18) 0%, transparent 70%)",
    },
    artists: [],
  },
  "2025": {
    year: "2025",
    editionLabel: "Euphoria 2025",
    poster: "/assets/GV and DF 2025.jpg",
    theme: {
      accentColor: "text-euphoria-aqua",
      borderActive: "border-euphoria-aqua/70 shadow-[0_0_30px_rgba(62,238,213,0.25)]",
      glowClass: "from-euphoria-aqua/20 via-transparent to-transparent",
      gradientText: "from-euphoria-aqua via-teal-200 to-cyan-400",
      radialGlow:
        "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(62, 238, 213, 0.16) 0%, transparent 70%)",
    },
    artists: [],
  },
};

const YEARS_ORDER: EditionYear[] = ["2023", "2024", "2025"];

export function PastNights() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-20px" });
  const [selectedYear, setSelectedYear] = useState<EditionYear>("2025");

  const currentChapter = PAST_NIGHTS_DATA[selectedYear];
  const hasConfirmedArtists = currentChapter.artists.length > 0;

  return (
    <section
      id="past-nights"
      ref={sectionRef}
      aria-label="Past Nights Experience"
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-euphoria-dark text-white"
    >
      {/* ── Atmospheric Background Layer ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-euphoria-darker" />
        {/* Dynamic ambient color glow based on selected year */}
        <motion.div
          key={`glow-${selectedYear}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{ background: currentChapter.theme.radialGlow }}
        />
        {/* Secondary depth lighting */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 85% 80%, rgba(23, 111, 99, 0.12) 0%, transparent 60%)",
          }}
        />
        {/* Fine Noise Texture */}
        <div className="noise-overlay absolute inset-0 opacity-[0.03]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        {/* ── Section Heading ── */}
        <BlurFade inViewMargin="-20px" className="mb-8 sm:mb-10 lg:mb-12 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-euphoria-gold/50 bg-euphoria-gold/[0.14] mb-4 sm:mb-5 backdrop-blur-sm">
            <Radio className="w-4 h-4 text-euphoria-aqua animate-pulse" />
            <span className="text-xs sm:text-base lg:text-[17px] font-extrabold tracking-[0.2em] sm:tracking-[0.32em] uppercase text-euphoria-gold">
              PAST NIGHTS
            </span>
          </div>

          {/* Heading Lines */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] sm:leading-[1.03]">
            <span className="block text-white/95">THEY&apos;VE BEEN HERE</span>
            <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua">
              EXPERIENCE THE LEGACY
            </span>
          </h2>

          <p className="mt-4 text-[15px] sm:text-[17px] text-white/85 sm:text-white/75 max-w-2xl mx-auto leading-relaxed font-light">
            A lineage of unmatched energy, stage presence, and campus history. Explore the defining
            celebrations of past editions at SAGE University Indore.
          </p>
        </BlurFade>

        {/* ── Interactive Chapter Interface ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-euphoria-surface/60 backdrop-blur-md p-4 sm:p-8 lg:p-10 overflow-hidden"
        >
          {/* Subtle Stage Top Flare */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[40rem] h-48 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(162, 50, 160, 0.22) 0%, rgba(62, 238, 213, 0.08) 45%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-10 items-stretch">
            {/* ── Year Navigation Rail ── */}
            <div
              role="tablist"
              aria-label="Euphoria Editions by Year"
              className="lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-2.5 sm:gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none snap-x"
            >
              {YEARS_ORDER.map((year) => {
                const chapter = PAST_NIGHTS_DATA[year];
                const isSelected = selectedYear === year;

                return (
                  <button
                    key={year}
                    id={`tab-${year}`}
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={`panel-${year}`}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setSelectedYear(year)}
                    className={`relative text-center lg:text-left px-3 sm:px-6 py-3.5 sm:py-5 rounded-2xl border transition-all duration-300 cursor-pointer min-w-0 flex-1 lg:flex-initial group ${
                      isSelected
                        ? `${chapter.theme.borderActive} bg-white/[0.06]`
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 text-white/70 hover:text-white"
                    }`}
                  >
                    {/* Active indicator bar on desktop */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeVerticalIndicator"
                        className="hidden lg:block absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-gradient-to-b from-euphoria-gold via-euphoria-purple to-euphoria-aqua"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}

                    <div className="flex items-center justify-center lg:justify-start">
                      <span
                        className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tight transition-colors duration-300 ${
                          isSelected ? "text-white" : "text-white/75 sm:text-white/65 group-hover:text-white"
                        }`}
                      >
                        {year}
                      </span>
                    </div>

                    {/* Mobile bottom indicator */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeHorizontalIndicator"
                        className="lg:hidden absolute bottom-0 left-4 right-4 h-1 rounded-t-full bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Content Stage Area ── */}
            <div
              id={`panel-${selectedYear}`}
              role="tabpanel"
              aria-labelledby={`tab-${selectedYear}`}
              className={`flex-1 flex flex-col justify-center rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-md relative overflow-hidden transition-all duration-300 ${
                currentChapter.poster
                  ? "p-0"
                  : "min-h-[340px] sm:min-h-[400px] p-6 sm:p-10 lg:p-12"
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`state-${selectedYear}`}
                  initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`relative z-10 w-full ${
                    currentChapter.poster
                      ? "h-full flex items-center justify-center"
                      : "flex flex-col justify-center my-auto"
                  }`}
                >
                  {currentChapter.poster ? (
                    <img
                      src={currentChapter.poster}
                      alt={`${currentChapter.editionLabel} Headline Poster`}
                      loading="lazy"
                      className="w-full h-auto aspect-[16/9] object-cover object-center block"
                    />
                  ) : hasConfirmedArtists ? (
                    /* Display confirmed artists if records exist */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                      {currentChapter.artists.map((artist) => (
                        <div
                          key={artist.id}
                          className="group relative rounded-2xl overflow-hidden border border-white/[0.08] bg-euphoria-surface/80 transition-all duration-500 hover:border-white/20"
                        >
                          <div className="relative aspect-[3/4] w-full overflow-hidden bg-euphoria-darker">
                            {artist.image ? (
                              <img
                                src={artist.image}
                                alt={artist.name}
                                loading="lazy"
                                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-white/[0.05] to-transparent p-6 text-center">
                                <Music className="w-10 h-10 text-white/30 mb-3" />
                                <span className="text-xs uppercase tracking-widest text-white/40">
                                  {currentChapter.editionLabel}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-euphoria-dark via-euphoria-dark/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              {artist.badge && (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase bg-white/10 text-white/80 border border-white/10 mb-2">
                                  {artist.badge}
                                </span>
                              )}
                              <h4 className="text-xl font-bold text-white tracking-tight">
                                {artist.name}
                              </h4>
                              {artist.role && (
                                <p className="text-xs text-white/50 mt-1">{artist.role}</p>
                              )}
                              {artist.note && (
                                <p className="text-xs text-white/40 mt-1 line-clamp-2">
                                  {artist.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Zero-Fabrication Authentic Archival Curation State */
                    <div className="flex flex-col items-center text-center max-w-xl mx-auto py-6">
                      {/* Chapter Icon */}
                      <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center mb-6 shadow-inner">
                        <Calendar className={`w-6 h-6 ${currentChapter.theme.accentColor}`} />
                      </div>

                      {/* Eyebrow */}
                      <span
                        className={`text-xs font-bold tracking-[0.3em] uppercase ${currentChapter.theme.accentColor} mb-2`}
                      >
                        {currentChapter.editionLabel}
                      </span>

                      {/* Title */}
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
                        Archival Lineup Under Curation
                      </h3>

                      {/* Authentic Description */}
                      <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed font-light">
                        Archival records and confirmed headline performance footage for the{" "}
                        <span className="text-white font-medium">{selectedYear} edition</span> are
                        currently being curated from the festival vault.
                      </p>

                      {/* Zero-Fabrication Archival Guarantee Tag */}
                      <div className="mt-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] text-[11px] sm:text-xs text-white/45 tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-euphoria-gold/80" />
                        <span>Verified Archival Records Stored Safely</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Corner framing brackets */}
              <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-white/15 pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-white/15 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-white/15 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-white/15 pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle Bottom Section Separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </section>
  );
}
