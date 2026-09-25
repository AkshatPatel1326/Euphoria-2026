import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Lock } from "lucide-react";
import { events as staticEvents, type EuphoriaEvent } from "@/data/events";
import { getRulebookUrl } from "@/data/rulebooks";
import { deriveDayFromDate } from "@/hooks/use-events";
import { RegistrationFlow } from "@/features/registrations/components/RegistrationFlow";

const categoryColor: Record<string, string> = {
  cultural: "text-euphoria-purple",
  "literary-management": "text-euphoria-gold",
  "science-tech": "text-euphoria-aqua",
  sports: "text-euphoria-teal",
  test: "text-amber-400",
};

const categoryLabel: Record<string, string> = {
  cultural: "Cultural",
  "literary-management": "Literary & Management",
  "science-tech": "Science & Technology",
  sports: "Sports",
  test: "Sandbox QA Test",
};

const categoryGradients: Record<string, string> = {
  cultural: "from-euphoria-plum via-euphoria-purple/60 to-euphoria-dark",
  "literary-management": "from-amber-800/40 via-euphoria-gold/20 to-euphoria-dark",
  "science-tech": "from-euphoria-teal/60 via-emerald-700/30 to-euphoria-dark",
  sports: "from-emerald-900/40 via-euphoria-teal/30 to-euphoria-dark",
  test: "from-amber-900/40 via-yellow-600/20 to-euphoria-dark",
};

const assetFallbacks: Record<string, string> = {
  /* ── Sports fallbacks (target = exact on-disk name) ── */
  "/assets/Arm_Wrestling_2.jpg": "/assets/Arm wresteling.jpg",
  "/assets/Arm_Wresteling_2.jpg": "/assets/Arm wresteling.jpg",
  "/assets/Arm_Wresteling.jpg": "/assets/Arm wresteling.jpg",
  "/assets/Arm_Wrestling.jpg": "/assets/Arm wresteling.jpg",
  "/assets/Arm Wrestling.png": "/assets/Arm wresteling.jpg",
  "/assets/Arm Wresteling.png": "/assets/Arm wresteling.jpg",
  "/assets/Arm Wresteling.jpg": "/assets/Arm wresteling.jpg",
  "/assets/Badminton_Female_2.jpg": "/assets/Badminton Female.jpg",
  "/assets/Badminton_Female.jpg": "/assets/Badminton Female.jpg",
  "/assets/Badminton_Womens.jpg": "/assets/Badminton Female.jpg",
  "/assets/Badminton FM.png": "/assets/Badminton Female.jpg",
  "/assets/Badminton Female.png": "/assets/Badminton Female.jpg",
  "/assets/Badminton_Male_2.jpg": "/assets/Badminton Male.png",
  "/assets/Badminton_Male.jpg": "/assets/Badminton Male.png",
  "/assets/Badminton_Mens.jpg": "/assets/Badminton Male.png",
  "/assets/Badminton M.png": "/assets/Badminton Male.png",
  "/assets/badminton male.jpg": "/assets/Badminton Male.png",
  "/assets/Badminton Male.png": "/assets/Badminton Male.png",
  "/assets/Badminton Male.jpg": "/assets/Badminton Male.png",
  "/assets/Carrom_2.jpg": "/assets/Carrom.jpg",
  "/assets/Carrom.png": "/assets/Carrom.jpg",
  "/assets/Chess_2.jpg": "/assets/Chess.jpg",
  "/assets/Chess.png": "/assets/Chess.jpg",
  "/assets/Cricket_2.jpg": "/assets/Cricket.jpg",
  "/assets/Cricket.png": "/assets/Cricket.jpg",
  "/assets/Football_2.jpg": "/assets/Footaball.jpg",
  "/assets/Footbal.png": "/assets/Footaball.jpg",
  "/assets/Football.png": "/assets/Footaball.jpg",
  "/assets/Football.jpg": "/assets/Footaball.jpg",
  "/assets/Kabaddi_2.jpg": "/assets/Kabbadi.jpg",
  "/assets/Kabbadi_2.jpg": "/assets/Kabbadi.jpg",
  "/assets/Kabaddi.jpg": "/assets/Kabbadi.jpg",
  "/assets/Kabaddi.png": "/assets/Kabbadi.jpg",
  "/assets/Kabbadi.png": "/assets/Kabbadi.jpg",
  "/assets/Power_Lifting_2.jpg": "/assets/Power lifting.jpg",
  "/assets/Power_Lifting.jpg": "/assets/Power lifting.jpg",
  "/assets/Power Lifting.png": "/assets/Power lifting.jpg",
  "/assets/Tabble_Tennis_2.jpg": "/assets/Table tennis.jpg",
  "/assets/Table_Tennis_2.jpg": "/assets/Table tennis.jpg",
  "/assets/Table_Tennis.jpg": "/assets/Table tennis.jpg",
  "/assets/Table Tennis.png": "/assets/Table tennis.jpg",
  "/assets/Volleyball_2.jpg": "/assets/Volleyball.jpg",
  "/assets/Volleyball.png": "/assets/Volleyball.jpg",

  /* ── Cultural fallbacks ── */
  "/assets/Move___Groove_Solo.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Move n Groove Solo.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Move & Groove Solo Audition.jpg": "/assets/Move n groove audition.jpg",
  "/assets/Move___Groove_Group.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Move n Groove Group.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Move n Groove solo Audition.png": "/assets/Move n groove audition.jpg",
  "/assets/Move n Groove group Audition.png": "/assets/Move n groove audition.jpg",
  "/assets/Move n Groove Audition.jpg": "/assets/Move n groove audition.jpg",
  "/assets/Move & Groove Group Audition.jpg": "/assets/Move n groove audition.jpg",
  "/assets/Move n Groove Group Audition.jpg": "/assets/Move n groove audition.jpg",
  "/assets/Move n Groove Final.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Move & Groove Final.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Fashion_Fiesta_1_Designer.jpg": "/assets/Fashion Fiesta.jpeg",
  "/assets/Fashion_Fiesta_6_Designer.jpg": "/assets/Fashion Fiesta.jpeg",
  "/assets/Fashion Fiesta 1.jpg": "/assets/Fashion Fiesta.jpeg",
  "/assets/Fashion Fiesta 6.jpg": "/assets/Fashion Fiesta.jpeg",
  "/assets/Fashion Fiesta.jpg": "/assets/Fashion Fiesta.jpeg",
  "/assets/Fashion_Fiesta.jpg": "/assets/Fashion Fiesta.jpeg",
  "/assets/Model_Hunt_Audition.jpg": "/assets/Model hunt audition.jpg",
  "/assets/Model_Hunt_Finalist.jpg": "/assets/Model Hun Finalist.jpg",
  "/assets/Model Hunt Audition.jpg": "/assets/Model hunt audition.jpg",
  "/assets/Model Hunt Finalist.jpg": "/assets/Model Hun Finalist.jpg",
  "/assets/Model Hunt.jpg": "/assets/Model hunt audition.jpg",
  "/assets/Singing.jpg": "/assets/Swar Fiesta Final.jpg",
  "/assets/Swar Fiesta.jpg": "/assets/Swar Fiesta Final.jpg",
  "/assets/Swar fiesta.jpg": "/assets/Swar Fiesta Final.jpg",
  "/assets/Swar Fiesta Audition.png": "/assets/Swar Fiesta Audition.jpg",
  "/assets/Battle of bands.jpg": "/assets/Battle of Bands.jpg",
  "/assets/Battle_of_bands.jpg": "/assets/Battle of Bands.jpg",
  "/assets/Reel_Making.jpg": "/assets/Reel and photography.jpg",
  "/assets/Reel & Photography.jpg": "/assets/Reel and photography.jpg",
  "/assets/Reel and Photography.jpg": "/assets/Reel and photography.jpg",
  "/assets/Magic Show.jpeg": "/assets/Magic show.jpeg",

  /* ── Category fallbacks ── */
  "/assets/Cultural_.jpeg": "/assets/Cultural Category.jpg",
  "/assets/Literary___Management.jpeg": "/assets/Literary & Management Category.jpg",
  "/assets/Science_and_Technology.jpeg": "/assets/Science & Technology Category.jpg",
  "/assets/Sports_.jpeg": "/assets/Sport Category.jpg",
  "/assets/Sports Category.jpg": "/assets/Sport Category.jpg",

  /* ── Literary & Management fallbacks ── */
  "/assets/Crack_the_Clue.jpg": "/assets/Crack the clue.jpg",
  "/assets/Crack the Clue.jpg": "/assets/Crack the clue.jpg",
  "/assets/Bid_to_win.jpg": "/assets/Bid to win.jpg",
  "/assets/Bid to Win.jpg": "/assets/Bid to win.jpg",
  "/assets/Battle_of_brands.jpg.jpeg": "/assets/battle of Brands.jpg",
  "/assets/Battle_of_brands.jpg": "/assets/battle of Brands.jpg",
  "/assets/Battle of Brands.jpg": "/assets/battle of Brands.jpg",
  "/assets/The_great_debate.jpg": "/assets/Ther gerat Debate.jpg",
  "/assets/The great debate.jpg": "/assets/Ther gerat Debate.jpg",
  "/assets/The great Debate.jpg": "/assets/Ther gerat Debate.jpg",
  "/assets/VI.jpg": "/assets/Vocal Ink.jpg",
  "/assets/Vocal ink.jpg": "/assets/Vocal Ink.jpg",

  /* ── Science & Technology fallbacks ── */
  "/assets/Idea_spark.jpg": "/assets/Idea Spark.jpg",
  "/assets/Idea spark.jpg": "/assets/Idea Spark.jpg",
  "/assets/Model_Product_Making.jpeg": "/assets/Model and product making presentation.jpg",
  "/assets/Model Product Making presentation.jpg": "/assets/Model and product making presentation.jpg",
  "/assets/Model Product making.jpg": "/assets/Model and product making presentation.jpg",
  "/assets/Oral_Poster_Presentation.jpeg": "/assets/Oral and postyer presentation.jpg",
  "/assets/Oral Poster Presentation.jpg": "/assets/Oral and postyer presentation.jpg",
  "/assets/Oral poster presentation.jpg": "/assets/Oral and postyer presentation.jpg",
  "/assets/Lan_Gaming.jpeg": "/assets/Lan gaming.jpg",
  "/assets/Lan Gaming.jpg": "/assets/Lan gaming.jpg",
  "/assets/lan gaming.jpg": "/assets/Lan gaming.jpg",
  "/assets/Robo_Race.jpeg": "/assets/Robo race.jpg",
  "/assets/Robo Race.jpg": "/assets/Robo race.jpg",
  "/assets/Para_Coding.jpeg": "/assets/Coding Mania.jpg",
  "/assets/Coding mania.jpg": "/assets/Coding Mania.jpg",
  "/assets/Decoder_Spyder.jpeg": "/assets/Decoder spyder.jpg",
  "/assets/Decoder Spyder.jpg": "/assets/Decoder spyder.jpg",
  "/assets/decode Spyder.jpg": "/assets/Decoder spyder.jpg",
  "/assets/Junkyard Wars.jpg": "/assets/Junkyard wars.jpg",
  "/assets/Junkyard wards.jpg": "/assets/Junkyard wars.jpg",
  "/assets/Bridge_Making.jpeg": "/assets/Bridge making.jpg",
  "/assets/Bridge Making.jpg": "/assets/Bridge making.jpg",
};

function parseCoordinators(raw?: string | null): string[] {
  if (!raw) return [];

  // Try JSON parsing
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((c) => c && (c.name || c.phone))
          .map((c) => (c.phone ? `${String(c.name).trim()} - ${String(c.phone).trim()}` : String(c.name).trim()));
      }
    } catch {}
  }

  const entries = trimmed
    .split(/[\r\n;]+|,(?![^(]*\))/)
    .map((s) => s.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : [trimmed];
}

function getCoordinatorList(
  coordinators?: Array<{ name: string; phone: string }>,
  raw?: string | null
): string[] {
  if (coordinators && coordinators.length > 0) {
    return coordinators
      .filter((c) => c.name?.trim() || c.phone?.trim())
      .map((c) => (c.phone?.trim() ? `${c.name.trim()} - ${c.phone.trim()}` : c.name.trim()));
  }
  return parseCoordinators(raw);
}

export function EventDetailModal({
  event,
  allEvents = [],
  initialStage,
  onClose,
}: {
  event: EuphoriaEvent | null;
  allEvents?: EuphoriaEvent[];
  initialStage?: "audition" | "main" | "finalist";
  onClose: () => void;
}) {
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedStage, setSelectedStage] = useState<"audition" | "main">("audition");

  // 1. Identify family category
  const isMoveAndGroove = useMemo(() => {
    if (!event) return false;
    return (
      event.eventFamily === "Move & Groove" ||
      ["cultural-1", "cultural-2", "cultural-13", "cultural-14"].includes(event.id)
    );
  }, [event]);

  const isIdeaSpark = useMemo(() => {
    if (!event) return false;
    return (
      event.eventFamily === "IdeaSpark" ||
      ["sci-1", "sci-2"].includes(event.id)
    );
  }, [event]);

  const isModelHunt = useMemo(() => {
    if (!event) return false;
    return (
      event.eventFamily === "Model Hunt" ||
      ["cultural-8", "cultural-9"].includes(event.id) ||
      event.name.toLowerCase().includes("model hunt")
    );
  }, [event]);

  const isFashionFiesta = useMemo(() => {
    if (!event) return false;
    return (
      event.eventFamily === "Fashion Fiesta" ||
      ["cultural-5", "cultural-7"].includes(event.id) ||
      event.name.toLowerCase().includes("fashion fiesta")
    );
  }, [event]);

  const isBadmintonMale = useMemo(() => {
    if (!event) return false;
    if (
      event.id === "sport-11" ||
      event.name.toLowerCase().includes("female") ||
      event.name.toLowerCase().includes("women")
    ) {
      return false;
    }
    return (
      event.eventFamily === "Badminton — Male" ||
      ["sport-9", "sport-10"].includes(event.id) ||
      (event.category === "sports" &&
        event.name.toLowerCase().includes("badminton") &&
        (event.name.toLowerCase().includes("male") || event.name.toLowerCase().includes("men")))
    );
  }, [event]);

  const isStageOnlyFamily = useMemo(() => {
    if (!event || isMoveAndGroove || isIdeaSpark || isModelHunt || isFashionFiesta || isBadmintonMale) return false;
    if (
      event.id === "sport-11" ||
      event.name.toLowerCase().includes("female") ||
      event.name.toLowerCase().includes("women")
    ) {
      return false;
    }
    return (
      Boolean(event.eventFamily) ||
      ["cultural-3", "cultural-15"].includes(event.id)
    );
  }, [event, isMoveAndGroove, isIdeaSpark, isModelHunt, isFashionFiesta, isBadmintonMale]);

  // 2. Resolve variants pool
  const mngPool = useMemo(() => {
    if (!isMoveAndGroove) return null;
    const pool = allEvents && allEvents.length > 0 ? allEvents : staticEvents;
    const soloAudition =
      pool.find((e) => e.id === "cultural-13") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Move & Groove" || e.name.toLowerCase().includes("move & groove")) &&
          (e.variant === "solo" || e.registrationType === "individual" || e.name.toLowerCase().includes("solo")) &&
          e.stage === "audition"
      );
    const soloMain =
      pool.find((e) => e.id === "cultural-1") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Move & Groove" || e.name.toLowerCase().includes("move & groove")) &&
          (e.variant === "solo" || e.registrationType === "individual" || e.name.toLowerCase().includes("solo")) &&
          e.stage === "main"
      );
    const groupAudition =
      pool.find((e) => e.id === "cultural-14") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Move & Groove" || e.name.toLowerCase().includes("move & groove")) &&
          (e.variant === "group" || e.registrationType === "group" || e.name.toLowerCase().includes("group")) &&
          e.stage === "audition"
      );
    const groupMain =
      pool.find((e) => e.id === "cultural-2") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Move & Groove" || e.name.toLowerCase().includes("move & groove")) &&
          (e.variant === "group" || e.registrationType === "group" || e.name.toLowerCase().includes("group")) &&
          e.stage === "main"
      );

    if (soloAudition && soloMain && groupAudition && groupMain) {
      return {
        solo: { audition: soloAudition, main: soloMain },
        group: { audition: groupAudition, main: groupMain },
      };
    }
    return null;
  }, [isMoveAndGroove, allEvents]);

  const sparkPool = useMemo(() => {
    if (!isIdeaSpark) return null;
    const pool = allEvents && allEvents.length > 0 ? allEvents : staticEvents;
    const single =
      pool.find((e) => e.id === "sci-1") ||
      pool.find(
        (e) =>
          (e.eventFamily === "IdeaSpark" || e.name.toLowerCase().includes("ideaspark")) &&
          (e.variant === "single" || e.registrationType === "individual" || e.name.toLowerCase().includes("single"))
      );
    const group =
      pool.find((e) => e.id === "sci-2") ||
      pool.find(
        (e) =>
          (e.eventFamily === "IdeaSpark" || e.name.toLowerCase().includes("ideaspark")) &&
          (e.variant === "group" || e.registrationType === "group" || e.name.toLowerCase().includes("group"))
      );

    if (single && group) {
      return { single, group };
    }
    return null;
  }, [isIdeaSpark, allEvents]);

  const mhPool = useMemo(() => {
    if (!isModelHunt) return null;
    const pool = allEvents && allEvents.length > 0 ? allEvents : staticEvents;
    const audition =
      pool.find((e) => e.id === "cultural-8") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Model Hunt" || e.name.toLowerCase().includes("model hunt")) &&
          (e.stage === "audition" || e.name.toLowerCase().includes("audition"))
      );
    const finalist =
      pool.find((e) => e.id === "cultural-9") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Model Hunt" || e.name.toLowerCase().includes("model hunt")) &&
          (e.stage === "finalist" || e.name.toLowerCase().includes("finalist"))
      );

    if (audition && finalist) {
      return { audition, finalist };
    }
    return null;
  }, [isModelHunt, allEvents]);

  const ffPool = useMemo(() => {
    if (!isFashionFiesta) return null;
    const pool = allEvents && allEvents.length > 0 ? allEvents : staticEvents;
    const singleDress =
      pool.find((e) => e.id === "cultural-5") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Fashion Fiesta" || e.name.toLowerCase().includes("fashion fiesta")) &&
          (e.variant === "1-dress" || e.name.toLowerCase().includes("1 designer"))
      );
    const sixDress =
      pool.find((e) => e.id === "cultural-7") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Fashion Fiesta" || e.name.toLowerCase().includes("fashion fiesta")) &&
          (e.variant === "6-dress" || e.name.toLowerCase().includes("6 designer"))
      );

    if (singleDress && sixDress) {
      return { "1-dress": singleDress, "6-dress": sixDress };
    }
    return null;
  }, [isFashionFiesta, allEvents]);

  const bmPool = useMemo(() => {
    if (!isBadmintonMale) return null;
    const pool = allEvents && allEvents.length > 0 ? allEvents : staticEvents;
    const solo =
      pool.find((e) => e.id === "sport-9") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Badminton — Male" || e.name.toLowerCase().includes("badminton")) &&
          (e.variant === "solo" || e.variant === "single" || e.registrationType === "individual" || e.name.toLowerCase().includes("single") || e.name.toLowerCase().includes("solo")) &&
          !e.name.toLowerCase().includes("female")
      );
    const double =
      pool.find((e) => e.id === "sport-10") ||
      pool.find(
        (e) =>
          (e.eventFamily === "Badminton — Male" || e.name.toLowerCase().includes("badminton")) &&
          (e.variant === "double" || e.name.toLowerCase().includes("double")) &&
          !e.name.toLowerCase().includes("female")
      );

    if (solo && double) {
      return { solo, double };
    }
    return null;
  }, [isBadmintonMale, allEvents]);

  const stageOnlyPool = useMemo(() => {
    if (!isStageOnlyFamily || !event) return null;
    const pool = allEvents && allEvents.length > 0 ? allEvents : staticEvents;
    const famName = event.eventFamily || "Swara Fiesta";
    const familyEvents = pool.filter((e) => e.eventFamily === famName || ["cultural-3", "cultural-15"].includes(e.id));
    const audition = familyEvents.find((e) => e.stage === "audition") || pool.find((e) => e.id === "cultural-15");
    const main = familyEvents.find((e) => e.stage === "main") || pool.find((e) => e.id === "cultural-3");

    if (audition && main) {
      return { audition, main };
    }
    return null;
  }, [isStageOnlyFamily, event, allEvents]);

  const [mngVariant, setMngVariant] = useState<"solo" | "group">("solo");
  const [mngStage, setMngStage] = useState<"audition" | "main">("audition");
  const [sparkVariant, setSparkVariant] = useState<"single" | "group">("single");
  const [swaraStage, setSwaraStage] = useState<"audition" | "main">("audition");
  const [mhStage, setMhStage] = useState<"audition" | "finalist">("audition");
  const [ffVariant, setFfVariant] = useState<"1-dress" | "6-dress">("1-dress");
  const [bmVariant, setBmVariant] = useState<"solo" | "double">("solo");

  // Sync selected stage/variant when event or initialStage changes
  useEffect(() => {
    if (!event) {
      setShowRegistration(false);
      return;
    }

    // Move & Groove
    if (
      event.id === "cultural-14" ||
      event.id === "cultural-2" ||
      event.variant === "group" ||
      event.registrationType === "group" ||
      event.name.toLowerCase().includes("group")
    ) {
      setMngVariant("group");
    } else {
      setMngVariant("solo");
    }

    if (
      event.id === "cultural-1" ||
      event.id === "cultural-2" ||
      initialStage === "main" ||
      event.stage === "main"
    ) {
      setMngStage("main");
    } else {
      setMngStage("audition");
    }

    // IdeaSpark
    if (
      event.id === "sci-2" ||
      event.variant === "group" ||
      event.registrationType === "group" ||
      event.name.toLowerCase().includes("group")
    ) {
      setSparkVariant("group");
    } else {
      setSparkVariant("single");
    }

    // Model Hunt
    if (event.id === "cultural-9" || event.stage === "finalist" || event.name.toLowerCase().includes("finalist")) {
      setMhStage("finalist");
    } else {
      setMhStage("audition");
    }

    // Fashion Fiesta
    if (event.id === "cultural-7" || event.variant === "6-dress" || event.name.toLowerCase().includes("6 designer")) {
      setFfVariant("6-dress");
    } else {
      setFfVariant("1-dress");
    }

    // Badminton Male
    if (isBadmintonMale) {
      if (event.id === "sport-10" || event.variant === "double" || (event.name.toLowerCase().includes("double") && !event.name.toLowerCase().includes("female") && !event.name.toLowerCase().includes("women"))) {
        setBmVariant("double");
      } else {
        setBmVariant("solo");
      }
    }

    // Swara Fiesta
    if (event.id === "cultural-3" || initialStage === "main" || event.stage === "main") {
      setSwaraStage("main");
    } else {
      setSwaraStage("audition");
    }
  }, [event, initialStage]);

  // Active event stage is the absolute single source of truth for all displayed data
  const activeEvent = useMemo<EuphoriaEvent | null>(() => {
    if (!event) return null;
    if (mngPool) {
      return mngPool[mngVariant][mngStage];
    }
    if (sparkPool) {
      return sparkPool[sparkVariant];
    }
    if (mhPool) {
      return mhPool[mhStage];
    }
    if (ffPool) {
      return ffPool[ffVariant];
    }
    if (bmPool) {
      return bmPool[bmVariant];
    }
    if (stageOnlyPool) {
      return stageOnlyPool[swaraStage];
    }
    return event;
  }, [event, mngPool, mngVariant, mngStage, sparkPool, sparkVariant, mhPool, mhStage, ffPool, ffVariant, bmPool, bmVariant, stageOnlyPool, swaraStage]);

  const rulebookUrl = useMemo(() => {
    if (
      activeEvent?.rules &&
      (activeEvent.rules.startsWith("http://") || activeEvent.rules.startsWith("https://"))
    ) {
      return activeEvent.rules;
    }
    return getRulebookUrl(activeEvent);
  }, [activeEvent]);

  const isRegOpen = activeEvent?.registrationOpen ?? false;
  const isCapacityReached = useMemo(() => {
    if (!activeEvent || activeEvent.capacity === null || activeEvent.capacity === undefined) {
      return false;
    }
    const current = activeEvent.activeRegistrationsCount ?? 0;
    return current >= activeEvent.capacity;
  }, [activeEvent]);

  return (
    <>
      <AnimatePresence>
        {activeEvent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[620px] lg:w-[880px] xl:w-[980px] bg-euphoria-surface/95 backdrop-blur-xl border-l border-white/[0.06] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden"
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 rounded-full text-white/50 hover:text-white/90 hover:bg-white/5 transition-all"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>

              {/* Poster area (Left Side) */}
              <div className="w-full lg:w-1/2 lg:h-full flex items-center justify-center p-4 sm:p-6 bg-black/25 shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.06] overflow-hidden min-w-0">
                {activeEvent.poster ? (
                  <img
                    key={activeEvent.id}
                    src={activeEvent.poster}
                    alt={`${activeEvent.name} poster`}
                    className="max-w-full max-h-[45vh] lg:max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/[0.08] transition-opacity duration-300"
                    onError={(e) => {
                      const current = e.currentTarget.getAttribute("src") || "";
                      const decoded = decodeURIComponent(current);
                      const fallback = assetFallbacks[current] || assetFallbacks[decoded];
                      if (fallback && e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                ) : (
                  <div
                    className={`relative w-full aspect-[3/4] max-h-[45vh] lg:max-h-[85vh] rounded-xl bg-gradient-to-br ${categoryGradients[activeEvent.category] || "from-amber-900/40 via-yellow-600/20 to-euphoria-dark"} flex items-center justify-center border border-white/[0.08] overflow-hidden`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 rounded-full border-2 border-white/[0.06] flex items-center justify-center">
                        <span className="text-2xl font-black text-white/15">
                          {activeEvent.name
                            .split("—")[0]
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content (Right Side) */}
              <div className="w-full lg:w-1/2 lg:h-full overflow-y-auto p-5 sm:p-7 lg:p-8 space-y-5 min-w-0">
                {/* Category & Stage badge */}
                <div className="pr-8 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-semibold tracking-[0.3em] uppercase ${categoryColor[activeEvent.category]}`}
                  >
                    {categoryLabel[activeEvent.category]}
                    {(mngPool || sparkPool || mhPool || ffPool || bmPool) && " • EVENT FAMILY"}
                    {stageOnlyPool && " • STAGED EVENT"}
                  </span>

                  {mngPool && (
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/50 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                      {mngVariant.toUpperCase()} • {mngStage === "audition" ? "AUDITION" : "MAIN"}
                    </span>
                  )}

                  {sparkPool && (
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/50 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                      {sparkVariant.toUpperCase()} CATEGORY
                    </span>
                  )}

                  {mhPool && (
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/50 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                      {mhStage === "audition" ? "AUDITION" : "FINALIST"}
                    </span>
                  )}

                  {ffPool && (
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/50 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                      {ffVariant === "1-dress" ? "1 DESIGNER DRESS" : "6 DESIGNER DRESS"}
                    </span>
                  )}

                  {bmPool && (
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/50 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                      {bmVariant === "solo" ? "SOLO (SINGLE)" : "DOUBLE (PAIR)"}
                    </span>
                  )}

                  {stageOnlyPool && (
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                      {swaraStage === "audition" ? "Stage 1: Audition" : "Stage 2: Main Event"}
                    </span>
                  )}
                </div>

                {/* 1. Move & Groove (Level 1: Solo/Group, Level 2: Audition/Main Competition) */}
                {mngPool && (
                  <div className="pt-1 space-y-2">
                    {/* Level 1: Solo / Group */}
                    <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/[0.1] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setMngVariant("solo")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          mngVariant === "solo"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Solo
                      </button>
                      <button
                        type="button"
                        onClick={() => setMngVariant("group")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          mngVariant === "group"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Group
                      </button>
                    </div>

                    {/* Level 2: Audition / Main Competition */}
                    <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/[0.1] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setMngStage("audition")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          mngStage === "audition"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Audition
                      </button>
                      <button
                        type="button"
                        onClick={() => setMngStage("main")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          mngStage === "main"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Main Competition
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. IdeaSpark (Single / Group - NO audition/main selector) */}
                {sparkPool && (
                  <div className="pt-1">
                    <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/[0.1] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSparkVariant("single")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          sparkVariant === "single"
                            ? "bg-gradient-to-r from-euphoria-teal via-emerald-600 to-euphoria-teal text-white shadow-md shadow-euphoria-teal/30 border border-emerald-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Single
                      </button>
                      <button
                        type="button"
                        onClick={() => setSparkVariant("group")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          sparkVariant === "group"
                            ? "bg-gradient-to-r from-euphoria-teal via-emerald-600 to-euphoria-teal text-white shadow-md shadow-euphoria-teal/30 border border-emerald-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Group
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Model Hunt (Audition / Finalist) */}
                {mhPool && (
                  <div className="pt-1">
                    <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/[0.1] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setMhStage("audition")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          mhStage === "audition"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Audition
                      </button>
                      <button
                        type="button"
                        onClick={() => setMhStage("finalist")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          mhStage === "finalist"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Finalist
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Fashion Fiesta (1 Designer Dress / 6 Designer Dress) */}
                {ffPool && (
                  <div className="pt-1">
                    <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/[0.1] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFfVariant("1-dress")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          ffVariant === "1-dress"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        1 Designer Dress
                      </button>
                      <button
                        type="button"
                        onClick={() => setFfVariant("6-dress")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          ffVariant === "6-dress"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        6 Designer Dress
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Badminton — Male (Solo / Double) */}
                {bmPool && (
                  <div className="pt-1">
                    <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/[0.1] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setBmVariant("solo")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          bmVariant === "solo"
                            ? "bg-gradient-to-r from-euphoria-teal via-emerald-600 to-euphoria-teal text-white shadow-md shadow-euphoria-teal/30 border border-emerald-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Solo
                      </button>
                      <button
                        type="button"
                        onClick={() => setBmVariant("double")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          bmVariant === "double"
                            ? "bg-gradient-to-r from-euphoria-teal via-emerald-600 to-euphoria-teal text-white shadow-md shadow-euphoria-teal/30 border border-emerald-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Double
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. Stage Only (Swara Fiesta or fallback 2-stage) */}
                {stageOnlyPool && (
                  <div className="pt-1">
                    <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/[0.1] rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSwaraStage("audition")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          swaraStage === "audition"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Audition
                      </button>
                      <button
                        type="button"
                        onClick={() => setSwaraStage("main")}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer text-center ${
                          swaraStage === "main"
                            ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-md shadow-euphoria-purple/30 border border-fuchsia-400/40"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        Main Competition
                      </button>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  {(mngPool || sparkPool || mhPool || ffPool || bmPool || stageOnlyPool) && (
                    <p
                      className={`text-xs font-bold tracking-[0.2em] uppercase mb-1 ${
                        activeEvent.category === "science-tech"
                          ? "text-euphoria-aqua"
                          : activeEvent.category === "sports"
                          ? "text-euphoria-teal"
                          : "text-euphoria-purple"
                      }`}
                    >
                      {mngPool
                        ? "MOVE & GROOVE"
                        : sparkPool
                        ? "IDEASPARK"
                        : mhPool
                        ? "MODEL HUNT"
                        : ffPool
                        ? "FASHION FIESTA"
                        : bmPool
                        ? "BADMINTON — MALE"
                        : (activeEvent.eventFamily || "SWARA FIESTA")}
                    </p>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                    {activeEvent.name}
                  </h2>
                </div>

                {/* Description */}
                <p className="text-sm text-white/70 leading-relaxed">
                  {activeEvent.description}
                </p>

                {/* Details */}
                <div className="space-y-3">
                  {[
                    {
                      label: "Entry Fee",
                      value: activeEvent.fee === 0 ? "Free" : `₹${activeEvent.fee.toLocaleString("en-IN")}`,
                      isFee: true,
                    },
                    { label: "Date", value: activeEvent.date },
                    { label: "Day", value: activeEvent.day || deriveDayFromDate(activeEvent.date) },
                    { label: "Time", value: activeEvent.time },
                    { label: "Venue", value: activeEvent.venue },
                    { label: "Team Size", value: activeEvent.teamSize },
                    { label: "Prizes", value: activeEvent.prizes },
                    {
                      label: "Faculty Coordinator",
                      value: activeEvent.facultyCoordinator,
                      coordinators: activeEvent.facultyCoordinators,
                      isCoordinator: true,
                    },
                    {
                      label: "Student Coordinator",
                      value: activeEvent.studentCoordinator,
                      coordinators: activeEvent.studentCoordinators,
                      isCoordinator: true,
                    },
                  ]
                    .filter((item) => {
                      if (item.isCoordinator) {
                        return (item.coordinators && item.coordinators.length > 0) || (item.value && item.value !== "TBA" && item.value !== "NA");
                      }
                      return item.value && item.value !== "TBA" && item.value !== "NA";
                    })
                    .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="text-white/55 w-28 sm:w-36 shrink-0 text-xs sm:text-sm">
                        {item.label}
                      </span>
                      {item.isCoordinator ? (
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          {getCoordinatorList(item.coordinators, item.value).map((coordinator, idx) => (
                            <span
                              key={idx}
                              className="text-xs sm:text-sm text-white/70 break-words leading-relaxed"
                            >
                              {coordinator}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={`text-xs sm:text-sm ${item.isFee ? "text-euphoria-aqua font-semibold" : "text-white/70"}`}>
                          {item.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Rulebook Button (Non-sports events with mapped rulebook) */}
                {rulebookUrl && (
                  <a
                    href={rulebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-euphoria-aqua bg-euphoria-aqua/[0.08] hover:bg-euphoria-aqua/[0.16] border border-euphoria-aqua/30 hover:border-euphoria-aqua/50 rounded-xl transition-all duration-300 shadow-md shadow-euphoria-aqua/5 hover:shadow-euphoria-aqua/15 hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none group cursor-pointer"
                  >
                    <span>VIEW RULEBOOK</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </a>
                )}

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                {/* Registration CTA */}
                <div className="space-y-3">

                  {isCapacityReached ? (
                    <div className="w-full flex items-center justify-center gap-2.5 py-4 text-base sm:text-[17px] font-semibold tracking-[0.15em] uppercase bg-amber-500/10 text-amber-300 rounded-xl border border-amber-500/25 cursor-not-allowed">
                      <Lock className="size-5 text-amber-300" />
                      Registration Full
                    </div>
                  ) : isRegOpen ? (
                    <button
                      type="button"
                      onClick={() => setShowRegistration(true)}
                      className="relative z-10 cursor-pointer w-full flex items-center justify-center gap-2.5 py-4 text-base sm:text-[17px] font-black tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 rounded-xl hover:brightness-105 transition-all duration-300 shadow-lg shadow-euphoria-aqua/25 hover:shadow-euphoria-aqua/40 hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:ring-offset-2 focus-visible:ring-offset-euphoria-dark focus-visible:outline-none"
                    >
                      Register Now
                      <ChevronRight className="size-5 text-neutral-950" />
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2.5 py-4 text-base sm:text-[17px] font-semibold tracking-[0.15em] uppercase bg-white/[0.04] text-white/45 rounded-xl border border-white/[0.08] cursor-not-allowed">
                      <Lock className="size-5 text-white/45" />
                      Registration Closed
                    </div>
                  )}
                  <div className="text-center space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-white/80">
                      Entry Fee:{" "}
                      <span className="text-euphoria-aqua font-bold">
                        {activeEvent.fee === 0 ? "Free" : `₹${activeEvent.fee.toLocaleString("en-IN")}`}
                      </span>
                    </p>
                    {isCapacityReached ? (
                      <p className="text-xs sm:text-[13px] text-amber-300/80">
                        This event has reached its maximum registration limit.
                      </p>
                    ) : isRegOpen ? (
                      <p className="text-xs sm:text-[13px] text-white/60">
                        Registrations are currently open · Secure your slot now
                      </p>
                    ) : (
                      <p className="text-xs sm:text-[13px] text-white/45">
                        Registration is currently closed for this event.
                      </p>
                    )}
                  </div>
                </div>

                {/* Back */}
                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm text-white/70 hover:text-white transition-colors tracking-wider uppercase focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:outline-none rounded-lg"
                >
                  Back to events
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Registration flow — separate overlay with active stage event */}
      <AnimatePresence>
        {showRegistration && activeEvent && (
          <RegistrationFlow
            event={activeEvent}
            onClose={() => setShowRegistration(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
