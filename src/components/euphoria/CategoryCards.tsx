import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { categoryMeta, events, categoryOrder, type EventCategory } from "@/data/events";
import { BlurFade } from "@/components/magicui/blur-fade";

/* ── Category-specific atmospheric glow colors ──────────────── */
const categoryAtmosphere: Record<EventCategory, string> = {
  cultural: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(162,50,160,0.08) 0%, transparent 70%)",
  "literary-management": "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(175,153,71,0.06) 0%, transparent 70%)",
  "science-tech": "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(62,238,213,0.06) 0%, transparent 70%)",
  sports: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(23,111,99,0.07) 0%, transparent 70%)",
  test: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)",
};

/* ── Category visual area — consistent across all four ─────── */
function CategoryVisual({
  category,
  isEven,
}: {
  category: EventCategory;
  isEven: boolean;
}) {
  const meta = categoryMeta[category];
  const navigate = useNavigate();
  const route =
    category === "cultural"
      ? "/events/cultural"
      : category === "literary-management"
        ? "/events/literary-management"
        : category === "science-tech"
          ? "/events/science-tech"
          : "/events/sports";

  const sharedVisualClass = "relative w-full lg:w-[420px] xl:w-[480px] aspect-[16/10] lg:aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform";

  /* ── Category poster images ── */
  const categoryPosters: Partial<Record<EventCategory, string>> = {
    cultural: "/assets/Cultural Category.jpg",
    "literary-management": "/assets/Literary & Management Category.jpg",
    "science-tech": "/assets/Science & Technology Category.jpg",
    sports: "/assets/Sport Category.jpg",
  };
  const posterSrc = categoryPosters[category];

  const categoryFallbacks: Record<string, string> = {
    "/assets/Cultural_.jpeg": "/assets/Cultural Category.jpg",
    "/assets/Cultural Category.jpg": "/assets/Cultural Category.jpg",
    "/assets/Literary___Management.jpeg": "/assets/Literary & Management Category.jpg",
    "/assets/Literary & Management Category.jpg": "/assets/Literary & Management Category.jpg",
    "/assets/Literary%20&%20Management%20Category.jpg": "/assets/Literary & Management Category.jpg",
    "/assets/Science_and_Technology.jpeg": "/assets/Science & Technology Category.jpg",
    "/assets/Science & Technology Category.jpg": "/assets/Science & Technology Category.jpg",
    "/assets/Science%20&%20Technology%20Category.jpg": "/assets/Science & Technology Category.jpg",
    "/assets/Sports_.jpeg": "/assets/Sport Category.jpg",
    "/assets/Sports Category.jpg": "/assets/Sport Category.jpg",
    "/assets/Sport Category.jpg": "/assets/Sport Category.jpg",
  };

  /* ── All categories: uniform visual treatment ── */
  return (
    <div
      className={`relative ${isEven ? "" : "lg:order-1"}`}
      style={{ direction: "ltr" }}
    >
      {/* Atmospheric glow behind the visual */}
      <div
        className="absolute -inset-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: categoryAtmosphere[category] }}
      />

      <div
        className={`${sharedVisualClass} border border-white/[0.04] group-hover:border-white/[0.1] transition-all duration-500 group-hover:shadow-[0_12px_60px_rgba(0,0,0,0.5)]`}
        onClick={() => navigate(route)}
        role="button"
        tabIndex={0}
        aria-label={`View ${meta.label} events`}
      >
        {/* Poster image or gradient background */}
        {posterSrc ? (
          <>
            <img
              src={posterSrc}
              alt={`${meta.label} category poster`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              onError={(e) => {
                const current = e.currentTarget.getAttribute("src") || "";
                const decoded = decodeURIComponent(current);
                const fallback = categoryFallbacks[current] || categoryFallbacks[decoded];
                if (fallback && e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-euphoria-dark/80 via-euphoria-dark/20 to-transparent" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-40 transition-transform duration-700 group-hover:scale-[1.03]`} />
        )}

        {/* Accent gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.accentGradient} opacity-0 group-hover:opacity-15 transition-opacity duration-700`} />

        {/* Abstract decorative shapes (only for non-poster categories) */}
        {!posterSrc && (
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]">
            <div
              className="absolute -top-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 rounded-full border opacity-10"
              style={{ borderColor: meta.color }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45" />
            <div
              className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 opacity-10 rounded-bl-lg"
              style={{ borderColor: meta.color }}
            />
            <div
              className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 opacity-10 rounded-tr-lg"
              style={{ borderColor: meta.color }}
            />
          </div>
        )}

        {/* Center number watermark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[80px] sm:text-[100px] font-black opacity-[0.08] select-none"
            style={{ color: meta.color }}
          >
            {meta.number}
          </span>
        </div>

        {/* "Explore" label on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <span
            className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase px-6 py-2.5 rounded-full border backdrop-blur-sm"
            style={{
              color: meta.color,
              borderColor: `${meta.color}40`,
              backgroundColor: `${meta.color}10`,
            }}
          >
            View Events
          </span>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-euphoria-dark to-transparent" />
      </div>
    </div>
  );
}

/* ── Single category row ────────────────────────────────────── */
function CategoryRow({
  category,
  index,
}: {
  category: EventCategory;
  index: number;
}) {
  const navigate = useNavigate();
  const meta = categoryMeta[category];
  const eventCount = events.filter(
    (e) => e.category === category && e.status !== "DRAFT" && e.id !== "cultural-6"
  ).length;
  const isEven = index % 2 === 0;

  const route =
    category === "cultural"
      ? "/events/cultural"
      : category === "literary-management"
        ? "/events/literary-management"
        : category === "science-tech"
          ? "/events/science-tech"
          : "/events/sports";

  return (
    <BlurFade
      delay={index * 0.08}
      duration={0.4}
      yOffset={20}
      inViewMargin="-20px"
      className="group relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 sm:gap-6 lg:gap-10 items-center py-7 sm:py-9 lg:py-12 border-b border-white/[0.06] last:border-b-0"
    >
      {/* Subtle category atmosphere glow on the row */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-3xl"
        style={{ background: categoryAtmosphere[category] }}
      />

      {/* Left — Category info */}
      <div
        className={`relative ${isEven ? "lg:text-left" : "lg:text-right lg:order-2"}`}
        style={{ direction: "ltr" }}
      >
        {/* Oversized number */}
        <div className="relative mb-2 sm:mb-3">
          <span
            className="text-[46px] sm:text-[70px] md:text-[105px] lg:text-[130px] font-black leading-none select-none tracking-tighter"
            style={{
              color: `${meta.color}35`,
              WebkitTextStroke: `2px ${meta.color}80`,
              textShadow: `0 0 40px ${meta.color}25, 0 0 80px ${meta.color}10`,
            }}
          >
            {meta.number}
          </span>
        </div>

        {/* Category name */}
        <h3
          className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase leading-tight"
          style={{ color: meta.color }}
        >
          {meta.label}
        </h3>

        {/* Keywords */}
        <p className="mt-2 sm:mt-2.5 text-[11px] sm:text-xs md:text-sm tracking-[0.14em] sm:tracking-[0.2em] uppercase text-white/60 font-semibold leading-normal">
          {meta.keywords}
        </p>

        {/* Description */}
        <p className="mt-2.5 sm:mt-3.5 text-sm sm:text-base lg:text-lg text-white/75 sm:text-white/80 max-w-md leading-relaxed font-normal">
          {meta.description}
        </p>

        {/* Event count + CTA */}
        <div
          className={`mt-4 sm:mt-5 flex items-center justify-between sm:justify-start gap-4 ${isEven ? "" : "lg:justify-end"}`}
          style={{ direction: "ltr" }}
        >
          <span className="text-xs sm:text-sm text-white/60 tracking-wider font-medium">
            {eventCount} events
          </span>
          <motion.button
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(route)}
            className="min-h-[42px] sm:min-h-0 flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.14em] uppercase transition-all duration-300 group/cta text-white/95 hover:text-white px-3.5 py-2 sm:px-1 sm:py-0.5 rounded-lg sm:rounded-md bg-white/[0.06] sm:bg-transparent border border-white/15 sm:border-0 hover:border-white/30 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-euphoria-aqua"
            aria-label={`Explore ${meta.label} events`}
          >
            <span>Explore Events</span>
            <span
              className="transition-transform group-hover:translate-x-1 group-hover/cta:translate-x-1.5 font-bold text-sm sm:text-base"
              style={{ color: meta.color }}
            >
              →
            </span>
          </motion.button>
        </div>
      </div>

      {/* Right — Visual area */}
      <CategoryVisual category={category} isEven={isEven} />
    </BlurFade>
  );
}

/* ── Main section ───────────────────────────────────────────── */
export function CategoryCards() {
  return (
    <section id="events" className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-euphoria-darker" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(91, 27, 82, 0.1) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 40% at 80% 80%, rgba(23, 111, 99, 0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <BlurFade inViewMargin="-20px" className="mb-10 sm:mb-12 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border border-euphoria-aqua/45 bg-euphoria-aqua/[0.14] mb-3.5 sm:mb-4 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-euphoria-aqua animate-pulse" />
            <span className="text-xs sm:text-base lg:text-[17px] font-extrabold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-euphoria-aqua">
              Events & Disciplines
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08]">
            <span className="text-white">Find Your </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua">
              Arena
            </span>
          </h2>
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
            <span className="font-semibold text-white/90 tracking-wide">
              4 Disciplines • 30+ Events
            </span>
          </div>
        </BlurFade>

        {/* Category rows */}
        <div>
          {categoryOrder.map((cat, i) => (
            <CategoryRow key={cat} category={cat} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-euphoria-purple/10 to-transparent" />
    </section>
  );
}
