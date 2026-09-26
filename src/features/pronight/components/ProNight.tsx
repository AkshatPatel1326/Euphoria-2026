import { useState, useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Sparkles,
  Radio,
  Music2,
  Mic2,
  Wand2,
} from "lucide-react";
import { events as staticEvents, type EuphoriaEvent } from "@/data/events";
import { useEvents } from "@/hooks/use-events";
import { EventDetailModal } from "@/features/events/components/EventDetailModal";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ENTERTAINMENT / NIGHT EXPERIENCES CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized asset & event references for the 4 headline experiences:
 * 1. Main Artist: Madhur Sharma (real asset: /assets/MS.jpeg)
 * 2. Red Bull DJ/Event: Slot reserved for upcoming announcement
 * 3. Standup Comedy: Pankaj Upadhyay (real asset: /assets/Standup Comedy.jpeg)
 * 4. Magic Show: Sagar Kumar (real asset: /assets/Magic Show.jpeg)
 */

export const PRO_NIGHT_ARTIST_IMAGE = "/assets/MS.jpeg";
export const PRO_NIGHT_ARTIST_NAME = "MADHUR SHARMA";
export const PRO_NIGHT_DATE = "October 30, 2026";
export const PRO_NIGHT_TIME = "07:00 PM Onwards";
export const PRO_NIGHT_VENUE = "Euphoria Main Stage";

/**
 * RED BULL DJ / EVENT SLOT CONFIGURATION
 * When the official poster and event details become available,
 * simply populate this configuration object without redesigning the layout.
 */
export const RED_BULL_EVENT_CONFIG = {
  isRevealed: false,
  posterUrl: null as string | null, // e.g. "/assets/Redbull_Event.jpg" when available
  name: "Red Bull DJ Night",
  subtitle: "Official DJ Experience",
  venue: "Euphoria Arena Grounds",
  date: "October 29, 2026",
  time: "06:00 PM Onwards",
  description:
    "An electrifying night of high-octane electronic beats, festival anthems, and sensory soundscapes.",
  statusText: "LINEUP REVEAL SOON",
  actionText: "STAY TUNED",
};

export function ProNight() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });

  const [selectedModalEvent, setSelectedModalEvent] =
    useState<EuphoriaEvent | null>(null);

  // Retrieve cultural events (live with static fallback)
  const { events: liveEvents } = useEvents("cultural");
  const allEventsList = liveEvents.length > 0 ? liveEvents : staticEvents;

  // Retrieve real event data for Standup Comedy
  const standupEvent = useMemo<EuphoriaEvent>(() => {
    return (
      allEventsList.find(
        (e) =>
          e.id === "cultural-12" ||
          e.name.toLowerCase().includes("standup comedy") ||
          e.name.toLowerCase().includes("pankaj")
      ) ??
      staticEvents.find((e) => e.id === "cultural-12") ?? {
        id: "cultural-12",
        name: "Standup Comedy — By Pankaj Upadhyay",
        category: "cultural",
        description:
          "A high-energy live standup comedy performance by Pankaj Upadhyay bringing humor and joy to Euphoria.",
        poster: "/assets/Standup Comedy.jpeg",
        registrationFee: "₹199",
        fee: 199,
        registrationType: "individual",
        minTeamSize: 1,
        maxTeamSize: 1,
        registrationOpen: true,
        date: "28 October 2026",
        day: "Wednesday",
        time: "02:00 PM - 3:00 PM",
        venue: "Kalpvriksha Auditorium",
        teamSize: "Individual",
        prizes: "NA",
        rules: "Open to all students and attendees with valid registration.",
      }
    );
  }, [allEventsList]);

  // Retrieve real event data for Magic Show
  const magicEvent = useMemo<EuphoriaEvent>(() => {
    return (
      allEventsList.find(
        (e) =>
          e.id === "cultural-11" ||
          e.name.toLowerCase().includes("magic show") ||
          e.name.toLowerCase().includes("sagar")
      ) ??
      staticEvents.find((e) => e.id === "cultural-11") ?? {
        id: "cultural-11",
        name: "Magic Show — By Sagar Kumar",
        category: "cultural",
        description:
          "An enchanting live magic performance by Sagar Kumar celebrating illusion, wonder, and mystery.",
        poster: "/assets/Magic show.jpeg",
        registrationFee: "₹49",
        fee: 49,
        registrationType: "individual",
        minTeamSize: 1,
        maxTeamSize: 1,
        registrationOpen: true,
        date: "30 October 2026",
        day: "Friday",
        time: "10:30 AM - 12:00 PM",
        venue: "Kalpvriksha Auditorium",
        teamSize: "Individual",
        prizes: "NA",
        rules: "Open to all students and attendees with valid registration.",
      }
    );
  }, [allEventsList]);

  const magicPosterSrc = useMemo(() => {
    if (magicEvent.poster && magicEvent.poster.toLowerCase().includes("magic")) {
      return "/assets/Magic show.jpeg";
    }
    return magicEvent.poster || "/assets/Magic show.jpeg";
  }, [magicEvent.poster]);

  const handleScrollToPasses = () => {
    const el = document.getElementById("passes");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="pro-night"
      ref={sectionRef}
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-euphoria-dark"
    >
      {/* ─── Cinematic Background Atmosphere ─── */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[#06030b]" />

        {/* Deep stage plum glow top center */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 45% at 50% 8%, rgba(162, 50, 160, 0.22) 0%, transparent 60%)",
          }}
        />

        {/* Ambient cyan glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 40% at 30% 50%, rgba(62, 238, 213, 0.08) 0%, transparent 65%)",
          }}
        />

        {/* Subtle warm amber glow bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 35% at 75% 70%, rgba(175, 153, 71, 0.07) 0%, transparent 60%)",
          }}
        />

        {/* Fine grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── SECTION HEADER ─── */}
        <div className="text-center mb-10 sm:mb-14 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-euphoria-purple/35 bg-euphoria-purple/[0.12] backdrop-blur-md mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-euphoria-purple animate-pulse" />
            <span className="text-[11px] sm:text-xs font-black tracking-[0.25em] uppercase text-euphoria-purple">
              ENTERTAINMENT & NIGHT EXPERIENCES
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[0.95] select-none"
          >
            <span className="block text-white/95">HEADLINERS &</span>
            <span className="block bg-gradient-to-r from-euphoria-purple via-cyan-300 to-euphoria-aqua bg-clip-text text-transparent">
              LIVE EXPERIENCES
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-4 text-xs sm:text-sm md:text-base text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            Four extraordinary experiences illuminating the Euphoria 2026 stages.
            From powerhouse stadium vocals and pulse-pounding DJ rhythms to
            side-splitting comedy and spellbinding illusions.
          </motion.p>
        </div>

        {/* ─── TOP ROW: MAIN ARTIST (60%) + RED BULL DJ (40%) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 items-stretch mb-5 sm:mb-7">
          {/* ── CARD 1: MAIN ARTIST — MADHUR SHARMA (≈ 60% on desktop) ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="lg:col-span-7 relative group flex flex-col"
          >
            {/* Luminous stage back-halo behind headliner card */}
            <div
              className="absolute -inset-2 rounded-3xl opacity-60 group-hover:opacity-85 transition-opacity duration-700 blur-2xl -z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 50% at 30% 40%, rgba(162, 50, 160, 0.35) 0%, rgba(62, 238, 213, 0.15) 50%, transparent 80%)",
              }}
            />

            <div className="relative h-full flex flex-col sm:flex-row rounded-2xl sm:rounded-3xl border border-white/[0.12] group-hover:border-euphoria-purple/40 bg-[#0c0715]/90 backdrop-blur-xl overflow-hidden transition-all duration-500 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
              {/* Headliner Portrait Visual */}
              <div className="relative w-full sm:w-[260px] md:w-[290px] lg:w-[270px] xl:w-[310px] shrink-0 aspect-[4/5] sm:aspect-auto overflow-hidden bg-black/50">
                <img
                  src={PRO_NIGHT_ARTIST_IMAGE}
                  alt={PRO_NIGHT_ARTIST_NAME}
                  className="w-full h-full object-cover object-[center_top] select-none filter brightness-95 contrast-105 group-hover:scale-[1.03] transition-transform duration-700"
                  loading="lazy"
                />

                {/* Cinematic Edge Vignettes */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0c0715] via-[#0c0715]/20 to-transparent sm:hidden opacity-80" />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-[#0c0715] hidden sm:block opacity-90" />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                {/* Live Headliner Badge */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-euphoria-aqua animate-pulse" />
                    <span className="text-[10px] sm:text-[11px] font-black tracking-[0.2em] uppercase text-white">
                      HEADLINER 2026
                    </span>
                  </div>
                </div>
              </div>

              {/* Headliner Content & Actions */}
              <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-euphoria-gold animate-pulse shrink-0" />
                    <span className="text-[11px] font-extrabold tracking-[0.2em] sm:tracking-[0.25em] uppercase text-euphoria-gold">
                      CONFIRMED HEADLINER
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl xs:text-3xl sm:text-4xl xl:text-5xl font-black uppercase text-white leading-[0.95] tracking-tight">
                      {PRO_NIGHT_ARTIST_NAME}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold tracking-[0.14em] sm:tracking-[0.18em] uppercase text-euphoria-aqua mt-1.5 sm:mt-2">
                      LIVE IN CONCERT · SAGE EUPHORIA 2026
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
                    Prepare for a transcendent musical spectacle as chart-topping
                    sensation Madhur Sharma commands the Euphoria main stage with
                    soul-stirring anthems and electric energy.
                  </p>

                  {/* Metadata Pills */}
                  <div className="pt-1.5 grid grid-cols-2 gap-2 text-[11px] text-white/70">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="size-3 text-euphoria-aqua/90 shrink-0" />
                      <span className="truncate">{PRO_NIGHT_DATE}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="size-3 text-euphoria-aqua/90 shrink-0" />
                      <span className="truncate">{PRO_NIGHT_TIME}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 min-w-0 text-white/60">
                      <MapPin className="size-3 text-euphoria-aqua/90 shrink-0" />
                      <span className="truncate">{PRO_NIGHT_VENUE}</span>
                    </div>
                  </div>
                </div>

                {/* Pass Access Statement & CTA Button */}
                <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex sm:block items-center justify-between sm:justify-start">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 block">
                      Access Type
                    </span>
                    <span className="text-xs sm:text-[13px] font-extrabold text-white/90">
                      Included with Euphoria Pass
                    </span>
                  </div>

                  <button
                    onClick={handleScrollToPasses}
                    className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-black text-xs tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 hover:brightness-110 transition-all duration-300 shadow-lg shadow-euphoria-aqua/20 hover:shadow-euphoria-aqua/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <span>GET FESTIVAL PASS</span>
                    <ArrowRight className="size-4 text-neutral-950" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── CARD 2: RED BULL DJ / EVENT SLOT (≈ 40% on desktop) ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="lg:col-span-5 relative group flex flex-col"
          >
            {/* Subtle energetic ambient aura */}
            <div
              className="absolute -inset-2 rounded-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 blur-2xl -z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 50% at 60% 40%, rgba(225, 29, 72, 0.22) 0%, rgba(162, 50, 160, 0.18) 45%, transparent 75%)",
              }}
            />

            <div className="relative h-full flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/[0.1] group-hover:border-rose-500/35 bg-[#0b0614]/90 backdrop-blur-xl p-5 sm:p-7 overflow-hidden transition-all duration-500 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              {/* If official poster is available in the future, render image container */}
              {RED_BULL_EVENT_CONFIG.isRevealed && RED_BULL_EVENT_CONFIG.posterUrl ? (
                <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-xl overflow-hidden border border-white/10 mb-4">
                  <img
                    src={RED_BULL_EVENT_CONFIG.posterUrl}
                    alt={RED_BULL_EVENT_CONFIG.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                /* Intentional Dark Cinematic Media Placeholder */
                <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-xl overflow-hidden border border-white/[0.08] bg-black/40 mb-4 flex items-center justify-center">
                  {/* Subtle radial audio wave / DJ disc motif */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 50%, rgba(225, 29, 72, 0.12) 0%, rgba(162, 50, 160, 0.08) 50%, transparent 75%)",
                    }}
                  />

                  {/* Concentric subtle sound grooves */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                    <div className="w-40 h-40 rounded-full border border-white/30 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full border border-white/20 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full border border-rose-400/40" />
                      </div>
                    </div>
                  </div>

                  {/* Soundwave equalizer bars representation */}
                  <div className="relative z-10 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="w-1 h-6 rounded-full bg-rose-500 animate-pulse" />
                    <span className="w-1 h-10 rounded-full bg-euphoria-purple animate-pulse [animation-delay:150ms]" />
                    <span className="w-1 h-14 rounded-full bg-cyan-400 animate-pulse [animation-delay:300ms]" />
                    <span className="w-1 h-9 rounded-full bg-rose-400 animate-pulse [animation-delay:450ms]" />
                    <span className="w-1 h-5 rounded-full bg-euphoria-aqua animate-pulse [animation-delay:200ms]" />
                  </div>

                  {/* Slot category badge */}
                  <div className="absolute top-3 left-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15">
                      <Music2 className="size-3 text-rose-400" />
                      <span className="text-[10px] font-extrabold tracking-[0.15em] uppercase text-white/90">
                        OFFICIAL PARTNER STAGE
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Slot Details */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Radio className="size-3.5 text-rose-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-extrabold tracking-[0.2em] sm:tracking-[0.25em] uppercase text-rose-400">
                    SPECIAL GUEST STAGE
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-white leading-none tracking-tight">
                  {RED_BULL_EVENT_CONFIG.name}
                </h3>

                <p className="text-xs sm:text-sm font-semibold tracking-wider text-white/50 uppercase">
                  {RED_BULL_EVENT_CONFIG.subtitle} · {RED_BULL_EVENT_CONFIG.venue}
                </p>

                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  {RED_BULL_EVENT_CONFIG.description}
                </p>

                {/* Metadata Pills */}
                <div className="pt-1.5 grid grid-cols-2 gap-2 text-[11px] text-white/70">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="size-3 text-rose-400/90 shrink-0" />
                    <span className="truncate">{RED_BULL_EVENT_CONFIG.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="size-3 text-rose-400/90 shrink-0" />
                    <span className="truncate">{RED_BULL_EVENT_CONFIG.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 min-w-0 text-white/60">
                    <MapPin className="size-3 text-rose-400/90 shrink-0" />
                    <span className="truncate">{RED_BULL_EVENT_CONFIG.venue}</span>
                  </div>
                </div>
              </div>

              {/* Status & Replacement-Ready Footer */}
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/[0.08] flex items-center justify-between gap-3 min-h-[44px]">
                <div className="inline-flex items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.18em] text-white/80">
                    {RED_BULL_EVENT_CONFIG.statusText}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] font-bold tracking-wider uppercase text-white/50 shrink-0">
                  <span>{RED_BULL_EVENT_CONFIG.actionText}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── BOTTOM ROW: STANDUP COMEDY (50%) + MAGIC SHOW (50%) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7 items-stretch">
          {/* ── CARD 3: STANDUP COMEDY — PANKAJ UPADHYAY (50% on desktop) ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative group flex flex-col h-full"
          >
            {/* Ambient gold / purple glow */}
            <div
              className="absolute -inset-2 rounded-3xl opacity-35 group-hover:opacity-65 transition-opacity duration-700 blur-2xl -z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 50% at 30% 50%, rgba(175, 153, 71, 0.2) 0%, rgba(162, 50, 160, 0.15) 50%, transparent 80%)",
              }}
            />

            <div className="relative h-full flex flex-col sm:flex-row rounded-2xl sm:rounded-3xl border border-white/[0.1] group-hover:border-euphoria-gold/40 bg-[#0c0714]/90 backdrop-blur-xl overflow-hidden transition-all duration-500 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              {/* Standup Poster Visual */}
              <div className="relative w-full sm:w-[200px] md:w-[210px] lg:w-[230px] shrink-0 aspect-[4/5] sm:aspect-auto sm:self-stretch overflow-hidden bg-black/50 border-b border-white/[0.08] sm:border-b-0 sm:border-r">
                <img
                  src={standupEvent.poster || "/assets/Standup Comedy.jpeg"}
                  alt={standupEvent.name}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    if (!e.currentTarget.src.includes("Standup%20Comedy.jpeg")) {
                      e.currentTarget.src = "/assets/Standup Comedy.jpeg";
                    }
                  }}
                />

                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-[#0c0714] hidden sm:block opacity-90" />

                {/* Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20">
                    <Mic2 className="size-3 text-euphoria-gold" />
                    <span className="text-[10px] font-black tracking-wider uppercase text-white">
                      STANDUP COMEDY
                    </span>
                  </div>
                </div>
              </div>

              {/* Standup Details & Action */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Category / Eyebrow & Fee */}
                  <div className="flex items-center justify-between gap-2 h-7">
                    <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] uppercase text-euphoria-gold truncate">
                      LIVE COMEDY SPECIAL
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-white px-2.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 shrink-0">
                      <Ticket className="size-3 text-euphoria-gold" />
                      {standupEvent.registrationFee || "₹199"}
                    </span>
                  </div>

                  {/* Title with standardized height */}
                  <div className="mt-3 min-h-[3.25rem] sm:min-h-[3.5rem] lg:min-h-[4.25rem] flex items-start">
                    <h3 className="text-xl sm:text-2xl lg:text-[26px] xl:text-3xl font-black uppercase text-white leading-tight tracking-tight line-clamp-2">
                      {standupEvent.name}
                    </h3>
                  </div>

                  {/* Description with standardized height */}
                  <div className="mt-2 min-h-[3rem] sm:min-h-[3.5rem] flex items-start">
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {standupEvent.description}
                    </p>
                  </div>

                  {/* Metadata Pills */}
                  <div className="mt-4 pt-2 grid grid-cols-2 gap-2 text-[11px] text-white/70">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="size-3 text-euphoria-gold/80 shrink-0" />
                      <span className="truncate">{standupEvent.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="size-3 text-euphoria-gold/80 shrink-0" />
                      <span className="truncate">{standupEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 min-w-0">
                      <MapPin className="size-3 text-euphoria-gold/80 shrink-0" />
                      <span className="truncate">{standupEvent.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Festival Pass Benefit Callout */}
                <div className="mt-3.5 px-3 py-2 rounded-xl bg-euphoria-gold/[0.08] border border-euphoria-gold/25 flex items-center gap-2">
                  <Sparkles className="size-3.5 text-euphoria-gold shrink-0" />
                  <p className="text-[11px] sm:text-xs text-white/85 leading-snug">
                    Festival Pass holders can use their Festival Pass Registration ID to get the Standup Comedy ticket for{" "}
                    <span className="font-bold text-euphoria-gold">₹49</span>.
                  </p>
                </div>

                {/* CTA Button */}
                <div className="mt-4 pt-3.5 border-t border-white/[0.08]">
                  <button
                    onClick={() => setSelectedModalEvent(standupEvent)}
                    className="w-full h-11 sm:h-12 inline-flex items-center justify-center gap-2 px-5 rounded-xl font-bold text-xs tracking-wider uppercase bg-white/[0.08] hover:bg-euphoria-gold hover:text-neutral-950 text-white border border-white/15 hover:border-euphoria-gold transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md"
                  >
                    <span>VIEW DETAILS & REGISTER</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── CARD 4: MAGIC SHOW — SAGAR KUMAR (50% on desktop) ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative group flex flex-col h-full"
          >
            {/* Ambient cyan / purple glow */}
            <div
              className="absolute -inset-2 rounded-3xl opacity-35 group-hover:opacity-65 transition-opacity duration-700 blur-2xl -z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 50% at 70% 50%, rgba(62, 238, 213, 0.2) 0%, rgba(162, 50, 160, 0.15) 50%, transparent 80%)",
              }}
            />

            <div className="relative h-full flex flex-col sm:flex-row rounded-2xl sm:rounded-3xl border border-white/[0.1] group-hover:border-euphoria-aqua/40 bg-[#0c0714]/90 backdrop-blur-xl overflow-hidden transition-all duration-500 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              {/* Magic Show Poster Visual */}
              <div className="relative w-full sm:w-[200px] md:w-[210px] lg:w-[230px] shrink-0 aspect-[4/5] sm:aspect-auto sm:self-stretch overflow-hidden bg-black/50 border-b border-white/[0.08] sm:border-b-0 sm:border-r">
                <img
                  src={magicPosterSrc}
                  alt={magicEvent.name}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/assets/Magic show.jpeg") {
                      e.currentTarget.src = "/assets/Magic show.jpeg";
                    }
                  }}
                />

                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-[#0c0714] hidden sm:block opacity-90" />

                {/* Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20">
                    <Wand2 className="size-3 text-euphoria-aqua" />
                    <span className="text-[10px] font-black tracking-wider uppercase text-white">
                      ILLUSION & WONDER
                    </span>
                  </div>
                </div>
              </div>

              {/* Magic Details & Action */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Category / Eyebrow & Fee */}
                  <div className="flex items-center justify-between gap-2 h-7">
                    <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] uppercase text-euphoria-aqua truncate">
                      GRAND ILLUSION SHOW
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-white px-2.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 shrink-0">
                      <Ticket className="size-3 text-euphoria-aqua" />
                      {magicEvent.registrationFee || "₹49"}
                    </span>
                  </div>

                  {/* Title with standardized height */}
                  <div className="mt-3 min-h-[3.25rem] sm:min-h-[3.5rem] lg:min-h-[4.25rem] flex items-start">
                    <h3 className="text-xl sm:text-2xl lg:text-[26px] xl:text-3xl font-black uppercase text-white leading-tight tracking-tight line-clamp-2">
                      {magicEvent.name}
                    </h3>
                  </div>

                  {/* Description with standardized height */}
                  <div className="mt-2 min-h-[3rem] sm:min-h-[3.5rem] flex items-start">
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {magicEvent.description}
                    </p>
                  </div>

                  {/* Metadata Pills */}
                  <div className="mt-4 pt-2 grid grid-cols-2 gap-2 text-[11px] text-white/70">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="size-3 text-euphoria-aqua/80 shrink-0" />
                      <span className="truncate">{magicEvent.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="size-3 text-euphoria-aqua/80 shrink-0" />
                      <span className="truncate">{magicEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 min-w-0">
                      <MapPin className="size-3 text-euphoria-aqua/80 shrink-0" />
                      <span className="truncate">{magicEvent.venue}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-5 pt-4 border-t border-white/[0.08]">
                  <button
                    onClick={() => setSelectedModalEvent(magicEvent)}
                    className="w-full h-11 sm:h-12 inline-flex items-center justify-center gap-2 px-5 rounded-xl font-bold text-xs tracking-wider uppercase bg-white/[0.08] hover:bg-euphoria-aqua hover:text-neutral-950 text-white border border-white/15 hover:border-euphoria-aqua transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md"
                  >
                    <span>VIEW DETAILS & REGISTER</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── EVENT DETAIL & REGISTRATION MODAL ─── */}
      <EventDetailModal
        event={selectedModalEvent}
        allEvents={allEventsList}
        onClose={() => setSelectedModalEvent(null)}
      />
    </section>
  );
}
