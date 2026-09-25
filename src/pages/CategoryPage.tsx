import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  events as staticEvents,
  categoryMeta,
  type EventCategory,
  type EuphoriaEvent,
} from "@/data/events";
import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/features/events/components/EventCard";
import { EventCardSkeleton } from "@/features/events/components/EventCardSkeleton";
import { EventDetailModal } from "@/features/events/components/EventDetailModal";

const validCategories: EventCategory[] = [
  "cultural",
  "literary-management",
  "science-tech",
  "sports",
  "test",
];

/* Category poster images for the hero background */
const categoryPosters: Record<EventCategory, string> = {
  cultural: "/assets/Cultural Category.jpg",
  "literary-management": "/assets/Literary & Management Category.jpg",
  "science-tech": "/assets/Science & Technology Category.jpg",
  sports: "/assets/Sport Category.jpg",
  test: "/assets/Cultural Category.jpg",
};

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

/* ── Category hero title definitions ── */
const categoryTitles: Record<
  EventCategory,
  { line1: string; line2: string; fontClass: string }
> = {
  cultural: {
    line1: "CULTURAL",
    line2: "EVENTS",
    /* Short title → larger font */
    fontClass: "text-[clamp(2rem,8vw,6rem)]",
  },
  "literary-management": {
    line1: "LITERARY | MANAGEMENT",
    line2: "EVENTS",
    /* Medium title → medium font */
    fontClass: "text-[clamp(1.4rem,5vw,3.8rem)]",
  },
  "science-tech": {
    line1: "SCIENCE AND TECHNOLOGY",
    line2: "EVENTS",
    /* Long title → smaller font */
    fontClass: "text-[clamp(1.2rem,4.2vw,3.2rem)]",
  },
  sports: {
    line1: "SPORT",
    line2: "EVENTS",
    /* Medium title → medium font */
    fontClass: "text-[clamp(1.6rem,5.5vw,4.2rem)]",
  },
  test: {
    line1: "SANDBOX TEST",
    line2: "EVENT (₹1)",
    fontClass: "text-[clamp(1.6rem,5.5vw,4.2rem)]",
  },
};

export type MoveAndGrooveFamily = {
  kind: "move-and-groove";
  familyName: "Move & Groove";
  variants: {
    solo: { audition: EuphoriaEvent; main: EuphoriaEvent };
    group: { audition: EuphoriaEvent; main: EuphoriaEvent };
  };
};

export type IdeaSparkFamily = {
  kind: "ideaspark";
  familyName: "IdeaSpark";
  variants: {
    single: EuphoriaEvent;
    group: EuphoriaEvent;
  };
};

export type StageOnlyFamily = {
  kind: "stage-only";
  familyName: string;
  stages: {
    audition: EuphoriaEvent;
    main: EuphoriaEvent;
  };
};

export type ModelHuntFamily = {
  kind: "model-hunt";
  familyName: "Model Hunt";
  stages: {
    audition: EuphoriaEvent;
    finalist: EuphoriaEvent;
  };
};

export type FashionFiestaFamily = {
  kind: "fashion-fiesta";
  familyName: "Fashion Fiesta";
  variants: {
    "1-dress": EuphoriaEvent;
    "6-dress": EuphoriaEvent;
  };
};

export type BadmintonMaleFamily = {
  kind: "badminton-male";
  familyName: "Badminton — Male";
  variants: {
    solo: EuphoriaEvent;
    double: EuphoriaEvent;
  };
};

export type FamilyConfig =
  | MoveAndGrooveFamily
  | IdeaSparkFamily
  | StageOnlyFamily
  | ModelHuntFamily
  | FashionFiestaFamily
  | BadmintonMaleFamily;

export type EventListItem =
  | {
      type: "family";
      id: string;
      familyName: string;
      representativeEvent: EuphoriaEvent;
      familyConfig: FamilyConfig;
    }
  | {
      type: "single";
      id: string;
      event: EuphoriaEvent;
    };

/* ── Inner content component — keyed by category so it fully remounts ── */
function CategoryContent({
  cat,
  meta,
  posterSrc,
  categoryEvents,
  isLoading,
  navigate,
  onSelectEvent,
}: {
  cat: EventCategory;
  meta: (typeof categoryMeta)[EventCategory];
  posterSrc: string | null;
  categoryEvents: EuphoriaEvent[];
  isLoading: boolean;
  navigate: (path: string) => void;
  onSelectEvent: (event: EuphoriaEvent) => void;
}) {
  const title = categoryTitles[cat];

  // Group related events into unified families for Cultural and Science & Tech categories
  const eventItems = useMemo<EventListItem[]>(() => {
    // Magic Show and Standup Comedy are now showcased in the dedicated Entertainment section
    const displayedEvents =
      cat === "cultural"
        ? categoryEvents.filter(
            (e) =>
              e.id !== "cultural-11" &&
              e.id !== "cultural-12" &&
              e.id !== "cultural-6" &&
              e.status !== "DRAFT" &&
              !e.name.toLowerCase().includes("magic show") &&
              !e.name.toLowerCase().includes("standup comedy") &&
              !e.name.toLowerCase().includes("graduation student")
          )
        : categoryEvents.filter((e) => e.status !== "DRAFT" && e.id !== "cultural-6");

    const items: EventListItem[] = [];
    const processedFamilies = new Set<string>();

    for (const ev of displayedEvents) {
      // 1. Move & Groove (Solo/Group × Audition/Main Competition)
      if (ev.eventFamily === "Move & Groove" || ["cultural-1", "cultural-2", "cultural-13", "cultural-14"].includes(ev.id)) {
        if (processedFamilies.has("Move & Groove")) continue;
        processedFamilies.add("Move & Groove");

        const mngGroup = displayedEvents.filter(
          (e) => e.eventFamily === "Move & Groove" || ["cultural-1", "cultural-2", "cultural-13", "cultural-14"].includes(e.id)
        );
        const soloAudition = mngGroup.find(
          (e) => (e.variant === "solo" || e.registrationType === "individual" || e.id === "cultural-13") && e.stage === "audition"
        ) || mngGroup.find((e) => e.id === "cultural-13");
        const soloMain = mngGroup.find(
          (e) => (e.variant === "solo" || e.registrationType === "individual" || e.id === "cultural-1") && e.stage === "main"
        ) || mngGroup.find((e) => e.id === "cultural-1");
        const groupAudition = mngGroup.find(
          (e) => (e.variant === "group" || e.registrationType === "group" || e.id === "cultural-14") && e.stage === "audition"
        ) || mngGroup.find((e) => e.id === "cultural-14");
        const groupMain = mngGroup.find(
          (e) => (e.variant === "group" || e.registrationType === "group" || e.id === "cultural-2") && e.stage === "main"
        ) || mngGroup.find((e) => e.id === "cultural-2");

        if (soloAudition && soloMain && groupAudition && groupMain) {
          items.push({
            type: "family",
            id: "family-move-and-groove",
            familyName: "Move & Groove",
            representativeEvent: groupMain,
            familyConfig: {
              kind: "move-and-groove",
              familyName: "Move & Groove",
              variants: {
                solo: { audition: soloAudition, main: soloMain },
                group: { audition: groupAudition, main: groupMain },
              },
            },
          });
          continue;
        }
      }

      // 2. Model Hunt (Audition / Finalist)
      if (
        ev.eventFamily === "Model Hunt" ||
        ["cultural-8", "cultural-9"].includes(ev.id) ||
        ev.name.toLowerCase().includes("model hunt")
      ) {
        if (processedFamilies.has("Model Hunt")) continue;
        processedFamilies.add("Model Hunt");

        const mhGroup = displayedEvents.filter(
          (e) =>
            e.eventFamily === "Model Hunt" ||
            ["cultural-8", "cultural-9"].includes(e.id) ||
            e.name.toLowerCase().includes("model hunt")
        );
        const audition =
          mhGroup.find(
            (e) =>
              e.stage === "audition" ||
              e.id === "cultural-8" ||
              e.name.toLowerCase().includes("audition")
          ) || mhGroup.find((e) => e.id === "cultural-8");
        const finalist =
          mhGroup.find(
            (e) =>
              e.stage === "main" ||
              e.id === "cultural-9" ||
              e.name.toLowerCase().includes("finalist")
          ) || mhGroup.find((e) => e.id === "cultural-9");

        if (audition && finalist) {
          items.push({
            type: "family",
            id: "family-model-hunt",
            familyName: "Model Hunt",
            representativeEvent: audition,
            familyConfig: {
              kind: "model-hunt",
              familyName: "Model Hunt",
              stages: {
                audition,
                finalist,
              },
            },
          });
          continue;
        }
      }

      // 3. Fashion Fiesta (1 Designer Dress / 6 Designer Dress)
      if (
        ev.eventFamily === "Fashion Fiesta" ||
        ["cultural-5", "cultural-7"].includes(ev.id) ||
        ev.name.toLowerCase().includes("fashion")
      ) {
        if (processedFamilies.has("Fashion Fiesta")) continue;
        processedFamilies.add("Fashion Fiesta");

        const ffGroup = displayedEvents.filter(
          (e) =>
            e.eventFamily === "Fashion Fiesta" ||
            ["cultural-5", "cultural-7"].includes(e.id) ||
            ev.name.toLowerCase().includes("fashion")
        );
        const singleDress =
          ffGroup.find(
            (e) =>
              e.id === "cultural-5" ||
              e.variant === "1-dress" ||
              e.name.toLowerCase().includes("single") ||
              e.name.toLowerCase().includes("1 dress")
          ) || ffGroup.find((e) => e.id === "cultural-5");
        const sixDress =
          ffGroup.find(
            (e) =>
              e.id === "cultural-7" ||
              e.variant === "6-dress" ||
              e.name.toLowerCase().includes("6 dress") ||
              e.name.toLowerCase().includes("max 6")
          ) || ffGroup.find((e) => e.id === "cultural-7");

        if (singleDress && sixDress) {
          items.push({
            type: "family",
            id: "family-fashion-fiesta",
            familyName: "Fashion Fiesta",
            representativeEvent: singleDress,
            familyConfig: {
              kind: "fashion-fiesta",
              familyName: "Fashion Fiesta",
              variants: {
                "1-dress": singleDress,
                "6-dress": sixDress,
              },
            },
          });
          continue;
        }
      }

      // 4. IdeaSpark (Single / Group)
      if (ev.eventFamily === "IdeaSpark" || ["sci-1", "sci-2"].includes(ev.id)) {
        if (processedFamilies.has("IdeaSpark")) continue;
        processedFamilies.add("IdeaSpark");

        const sparkGroup = displayedEvents.filter(
          (e) => e.eventFamily === "IdeaSpark" || ["sci-1", "sci-2"].includes(e.id)
        );
        const single = sparkGroup.find(
          (e) => e.variant === "single" || e.registrationType === "individual" || e.id === "sci-1"
        );
        const group = sparkGroup.find(
          (e) => e.variant === "group" || e.registrationType === "group" || e.id === "sci-2"
        );

        if (single && group) {
          items.push({
            type: "family",
            id: "family-ideaspark",
            familyName: "IdeaSpark",
            representativeEvent: single,
            familyConfig: {
              kind: "ideaspark",
              familyName: "IdeaSpark",
              variants: {
                single,
                group,
              },
            },
          });
          continue;
        }
      }

      // 5. Badminton — Male (Solo / Double)
      if (
        ev.id !== "sport-11" &&
        !ev.name.toLowerCase().includes("female") &&
        !ev.name.toLowerCase().includes("women") &&
        (ev.eventFamily === "Badminton — Male" ||
          ["sport-9", "sport-10"].includes(ev.id) ||
          (ev.category === "sports" &&
            ev.name.toLowerCase().includes("badminton") &&
            (ev.name.toLowerCase().includes("male") || ev.name.toLowerCase().includes("men"))))
      ) {
        if (processedFamilies.has("Badminton — Male")) continue;
        processedFamilies.add("Badminton — Male");

        const bmGroup = displayedEvents.filter(
          (e) =>
            e.id !== "sport-11" &&
            !e.name.toLowerCase().includes("female") &&
            !e.name.toLowerCase().includes("women") &&
            (e.eventFamily === "Badminton — Male" ||
              ["sport-9", "sport-10"].includes(e.id) ||
              (e.category === "sports" && e.name.toLowerCase().includes("badminton")))
        );
        const solo =
          bmGroup.find(
            (e) =>
              e.id === "sport-9" ||
              e.variant === "solo" ||
              e.registrationType === "individual" ||
              e.name.toLowerCase().includes("single") ||
              e.name.toLowerCase().includes("solo")
          ) || staticEvents.find((e) => e.id === "sport-9");
        const double =
          bmGroup.find(
            (e) =>
              e.id === "sport-10" ||
              e.variant === "double" ||
              e.registrationType === "group" ||
              e.name.toLowerCase().includes("double")
          ) || staticEvents.find((e) => e.id === "sport-10");

        if (solo && double) {
          items.push({
            type: "family",
            id: "family-badminton-male",
            familyName: "Badminton — Male",
            representativeEvent: solo,
            familyConfig: {
              kind: "badminton-male",
              familyName: "Badminton — Male",
              variants: {
                solo,
                double,
              },
            },
          });
          continue;
        }
      }

      // 6. Stage-Only Families (e.g. Swara Fiesta)
      if (
        ev.id !== "sport-11" &&
        !ev.name.toLowerCase().includes("female") &&
        !ev.name.toLowerCase().includes("women") &&
        ((ev.eventFamily &&
          ev.eventFamily !== "Move & Groove" &&
          ev.eventFamily !== "IdeaSpark" &&
          ev.eventFamily !== "Model Hunt" &&
          ev.eventFamily !== "Fashion Fiesta" &&
          ev.eventFamily !== "Badminton — Male") ||
        ["cultural-3", "cultural-15"].includes(ev.id))
      ) {
        const famName = ev.eventFamily || "Swara Fiesta";
        if (processedFamilies.has(famName)) continue;

        const familyGroup = displayedEvents.filter(
          (e) => e.eventFamily === famName || (famName === "Swara Fiesta" && ["cultural-3", "cultural-15"].includes(e.id))
        );
        const audition = familyGroup.find((e) => e.stage === "audition") || familyGroup.find((e) => e.id === "cultural-15");
        const main = familyGroup.find((e) => e.stage === "main") || familyGroup.find((e) => e.id === "cultural-3");

        if (audition && main) {
          processedFamilies.add(famName);
          items.push({
            type: "family",
            id: `family-${famName}`,
            familyName: famName,
            representativeEvent: audition,
            familyConfig: {
              kind: "stage-only",
              familyName: famName,
              stages: { audition, main },
            },
          });
          continue;
        }
      }

      // 7. Standalone individual events
      if (
        !["sport-9", "sport-10"].includes(ev.id) &&
        (!ev.eventFamily || !processedFamilies.has(ev.eventFamily))
      ) {
        items.push({ type: "single", id: ev.id, event: ev });
      }
    }

    // Sort visible top-level event cards/families alphabetically by displayed name (case-insensitively)
    items.sort((a, b) => {
      const nameA = a.type === "family" ? a.familyName : a.event.name;
      const nameB = b.type === "family" ? b.familyName : b.event.name;
      return nameA.trim().localeCompare(nameB.trim(), undefined, { sensitivity: "base" });
    });

    return items;
  }, [categoryEvents, cat]);

  return (
    <div className="min-h-screen bg-euphoria-dark text-white overflow-x-hidden">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-euphoria-dark/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="min-h-[44px] flex items-center gap-2 text-white/80 hover:text-white transition-colors group cursor-pointer pr-2"
              aria-label="Back to home"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform text-white/80 group-hover:text-white" />
              <span className="text-sm font-semibold tracking-wider">Back</span>
            </button>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-3">
              <span
                className="text-[10px] font-bold tracking-[0.15em]"
                style={{ color: meta.color }}
              >
                {meta.number}
              </span>
              <span
                className="text-sm font-semibold tracking-[0.15em] uppercase"
                style={{ color: meta.color }}
              >
                {meta.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CATEGORY HERO — poster background + text overlay
          ═══════════════════════════════════════════ */}
      <div className="relative pt-16 w-full overflow-hidden" style={{ height: "clamp(180px, 30vw, 420px)" }}>
        {/* Background poster — blurred and darkened to hide branding */}
        {posterSrc ? (
          <>
            <img
              src={posterSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
              style={{
                objectPosition: "50% 50%",
                filter: "blur(20px) brightness(0.35) saturate(1.3)",
                transform: "scale(1.15)",
              }}
              onError={(e) => {
                const current = e.currentTarget.getAttribute("src") || "";
                const decoded = decodeURIComponent(current);
                const fallback = categoryFallbacks[current] || categoryFallbacks[decoded];
                if (fallback && e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
            />
            {/* Extra dark overlay to ensure no branding bleeds through */}
            <div className="absolute inset-0 bg-euphoria-dark/50" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`} />
        )}

        {/* Centered category title — the ONLY foreground content */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center select-none">
            <h1
              className={`${title.fontClass} font-black tracking-[0.06em] uppercase leading-[1.05] text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]`}
            >
              {title.line1}
            </h1>
            <p
              className="mt-1 text-[clamp(0.65rem,1.8vw,1.1rem)] font-light tracking-[0.35em] uppercase text-white/55"
            >
              {title.line2}
            </p>
          </div>
        </div>
      </div>

      {/* Events grid with Skeleton Loading State */}
      <div
        className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 pb-24"
        aria-busy={isLoading}
      >
        {isLoading && (
          <span className="sr-only">Loading events...</span>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} index={i} />
            ))
          ) : (
            eventItems.map((item, i) => {
              if (item.type === "family") {
                return (
                  <EventCard
                    key={item.id}
                    event={item.representativeEvent}
                    familyConfig={item.familyConfig}
                    index={i}
                    onViewEvent={(targetEvent) => onSelectEvent(targetEvent)}
                  />
                );
              }
              return (
                <EventCard
                  key={item.id}
                  event={item.event}
                  index={i}
                  onViewEvent={(targetEvent) => onSelectEvent(targetEvent)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<"audition" | "main" | "finalist" | undefined>(undefined);

  // Scroll to top when navigating
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [category]);

  const isValid = validCategories.includes(category as EventCategory);
  const cat = category as EventCategory;
  const meta = isValid ? categoryMeta[cat] : null;

  // Fetch events from backend API filtered by category
  const { events: categoryEvents, isLoading: eventsLoading } = useEvents(
    isValid ? cat : undefined
  );

  const selectedEventData = categoryEvents.find((e) => e.id === selectedEvent) ?? null;
  const posterSrc = isValid ? categoryPosters[cat] : null;

  const handleSelectEvent = (event: EuphoriaEvent) => {
    setSelectedEvent(event.id);
    setSelectedStage(event.stage);
  };

  if (!isValid || !meta) {
    return (
      <div className="min-h-screen bg-euphoria-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Category not found.</p>
          <button
            onClick={() => navigate("/")}
            className="text-euphoria-aqua/75 text-sm tracking-wider uppercase hover:text-euphoria-aqua transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={cat}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CategoryContent
            cat={cat}
            meta={meta}
            posterSrc={posterSrc}
            categoryEvents={categoryEvents}
            isLoading={eventsLoading}
            navigate={navigate}
            onSelectEvent={handleSelectEvent}
          />
        </motion.div>
      </AnimatePresence>

      {/* Event detail modal — rendered outside AnimatePresence to persist */}
      <EventDetailModal
        event={selectedEventData}
        allEvents={categoryEvents}
        initialStage={selectedStage}
        onClose={() => {
          setSelectedEvent(null);
          setSelectedStage(undefined);
        }}
      />
    </>
  );
}
