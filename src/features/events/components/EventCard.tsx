import { useState } from "react";
import { motion } from "framer-motion";
import type { EuphoriaEvent, EventCategory } from "@/data/events";
import { getRulebookUrl } from "@/data/rulebooks";

const categoryAccent: Record<EventCategory, string> = {
  cultural: "text-euphoria-purple",
  "literary-management": "text-euphoria-gold",
  "science-tech": "text-euphoria-aqua",
  sports: "text-euphoria-teal",
  test: "text-amber-400",
};

const categoryGradients: Record<EventCategory, string> = {
  cultural: "from-euphoria-plum via-euphoria-purple/60 to-euphoria-plum",
  "literary-management": "from-amber-800/60 via-euphoria-gold/40 to-amber-900/30",
  "science-tech": "from-euphoria-teal/80 via-emerald-700/50 to-euphoria-aqua/30",
  sports: "from-emerald-900/60 via-euphoria-teal/40 to-emerald-800/30",
  test: "from-amber-900/60 via-yellow-600/40 to-amber-800/30",
};

const categoryLabels: Record<EventCategory, string> = {
  cultural: "Cultural",
  "literary-management": "Lit & Mgmt",
  "science-tech": "Sci & Tech",
  sports: "Sports",
  test: "Sandbox QA",
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
  "/assets/Badminton_Female_2.jpg": "/assets/Badminton Female.png",
  "/assets/Badminton_Female.jpg": "/assets/Badminton Female.png",
  "/assets/Badminton Female.jpg": "/assets/Badminton Female.png",
  "/assets/Badminton_Womens.jpg": "/assets/Badminton Female.png",
  "/assets/Badminton FM.png": "/assets/Badminton Female.png",
  "/assets/Badminton_Male_2.jpg": "/assets/Badminton Male.png",
  "/assets/Badminton_Male.jpg": "/assets/Badminton Male.png",
  "/assets/Badminton_Mens.jpg": "/assets/Badminton Male.png",
  "/assets/Badminton M.png": "/assets/Badminton Male.png",
  "/assets/badminton male.jpg": "/assets/Badminton Male.png",
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
  "/assets/Basketball.jpg": "/assets/Basketball.jpeg",
  "/assets/BBasketball.jpg": "/assets/Basketball.jpeg",
  "/assets/Basketball.png": "/assets/Basketball.jpeg",

  /* ── Cultural fallbacks ── */
  "/assets/Move___Groove_Solo.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Move n Groove Solo.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Move___Groove_Group.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Move n Groove Group.jpg": "/assets/Move n groove Final.jpg",
  "/assets/Move n Groove solo Audition.png": "/assets/Move n groove audition.jpg",
  "/assets/Move n Groove group Audition.png": "/assets/Move n groove audition.jpg",
  "/assets/Move n Groove Audition.jpg": "/assets/Move n groove audition.jpg",
  "/assets/Move & Groove Group Audition.jpg": "/assets/Move n groove audition.jpg",
  "/assets/Move & Groove Solo Audition.jpg": "/assets/Move n groove audition.jpg",
  "/assets/Move & Groove Solo Audition - Copy.jpg": "/assets/Move n groove audition.jpg",
  "/assets/Fashion_Fiesta.jpg": "/assets/Fashion Fiesta.jpeg",
  "/assets/Fashion fiesta 1 dress.jpg": "/assets/Fashion Fiesta.jpeg",
  "/assets/Fashion fiesta 6 dress.jpg": "/assets/Fashion Fiesta.jpeg",
  "/assets/Model_Hunt.jpg": "/assets/Model hunt audition.jpg",
  "/assets/Model Hunt.jpg": "/assets/Model hunt audition.jpg",
  "/assets/Model Hunt Audition.jpg": "/assets/Model hunt audition.jpg",
  "/assets/Model_Hunt_Finalist.jpeg": "/assets/Model Hun Finalist.jpg",
  "/assets/Model Hunt Finalist.jpg": "/assets/Model Hun Finalist.jpg",
  "/assets/Model Hunt Finalist.jpeg": "/assets/Model Hun Finalist.jpg",
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

/* Poster display - real image or branded placeholder */
function EventPoster({ event }: { event: EuphoriaEvent }) {
  if (event.poster) {
    return (
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-euphoria-darker">
        <img
          src={event.poster}
          alt={`${event.name} poster`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const current = e.currentTarget.getAttribute("src") || "";
            const decoded = decodeURIComponent(current);
            const fallback = assetFallbacks[current] || assetFallbacks[decoded];
            if (fallback && e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    );
  }

  const gradient = categoryGradients[event.category];
  const initials = event.name
    .split("\u2014")[0]
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`relative w-full aspect-[3/4] rounded-lg bg-gradient-to-br ${gradient} overflow-hidden`}
    >
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-24 h-24 rounded-full border border-white/[0.06]" />
        <div className="absolute bottom-1/3 left-1/4 w-16 h-16 rounded-full border border-white/[0.04]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl sm:text-5xl font-black text-white/10 tracking-wider select-none">
          {initials}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
      <div className="absolute top-3 left-3">
        <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/60 bg-black/30 backdrop-blur-sm rounded px-2 py-1">
          Poster TBA
        </span>
      </div>
    </div>
  );
}

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

export function EventCard({
  event,
  stages,
  familyConfig,
  index,
  onViewEvent,
}: {
  event: EuphoriaEvent;
  stages?: { audition: EuphoriaEvent; main: EuphoriaEvent };
  familyConfig?: FamilyConfig;
  index: number;
  onViewEvent: (targetEvent: EuphoriaEvent) => void;
}) {
  const [mngVariant, setMngVariant] = useState<"solo" | "group">("solo");
  const [mngStage, setMngStage] = useState<"audition" | "main">("audition");
  const [sparkVariant, setSparkVariant] = useState<"single" | "group">("single");
  const [stageOnly, setStageOnly] = useState<"audition" | "main">("audition");
  const [mhStage, setMhStage] = useState<"audition" | "finalist">("audition");
  const [ffVariant, setFfVariant] = useState<"1-dress" | "6-dress">("1-dress");
  const [bmVariant, setBmVariant] = useState<"solo" | "double">("solo");

  let displayEvent: EuphoriaEvent = event;
  let familyBadge: string | null = null;
  let familyHeader: string | null = null;

  if (familyConfig?.kind === "move-and-groove") {
    displayEvent = familyConfig.variants[mngVariant][mngStage];
    familyBadge = "Event Family";
    familyHeader = "MOVE & GROOVE";
  } else if (familyConfig?.kind === "ideaspark") {
    displayEvent = familyConfig.variants[sparkVariant];
    familyBadge = "Event Family";
    familyHeader = "IDEASPARK";
  } else if (familyConfig?.kind === "model-hunt") {
    displayEvent = familyConfig.stages[mhStage];
    familyBadge = "Event Family";
    familyHeader = "MODEL HUNT";
  } else if (familyConfig?.kind === "fashion-fiesta") {
    displayEvent = familyConfig.variants[ffVariant];
    familyBadge = "Event Family";
    familyHeader = "FASHION FIESTA";
  } else if (familyConfig?.kind === "badminton-male") {
    displayEvent = familyConfig.variants[bmVariant];
    familyBadge = "Event Family";
    familyHeader = "BADMINTON — MALE";
  } else if (familyConfig?.kind === "stage-only") {
    displayEvent = familyConfig.stages[stageOnly];
    familyBadge = "2 Stages";
    familyHeader = familyConfig.familyName;
  } else if (stages?.audition && stages?.main) {
    displayEvent = stages[stageOnly];
    familyBadge = "2 Stages";
    familyHeader = event.eventFamily ?? null;
  }

  const rulebookUrl = getRulebookUrl(displayEvent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4) }}
      className="group h-full"
    >
      <div className="glass-card rounded-xl overflow-hidden transition-all duration-500 hover:border-white/15 hover:shadow-[0_8px_50px_rgba(0,0,0,0.4)] hover:-translate-y-1 h-full flex flex-col">
        <div className="p-3 flex-shrink-0">
          <EventPoster event={displayEvent} />
        </div>
        <div className="px-4 pb-4 pt-1 flex flex-col flex-1">
          {/* Category accent line */}
          <div className="flex items-center justify-between gap-1">
            <span
              className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${categoryAccent[displayEvent.category]}`}
            >
              {categoryLabels[displayEvent.category]}
            </span>
            {familyBadge && (
              <span
                className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                  displayEvent.category === "science-tech"
                    ? "text-euphoria-aqua bg-euphoria-aqua/10 border border-euphoria-aqua/30"
                    : "text-euphoria-purple bg-euphoria-purple/10 border border-euphoria-purple/30"
                }`}
              >
                {familyBadge}
              </span>
            )}
          </div>

          {/* 1. Move & Groove (Level 1: Solo/Group, Level 2: Audition/Main Competition) */}
          {familyConfig?.kind === "move-and-groove" && (
            <div className="mt-2.5 space-y-1.5">
              {/* Level 1 selector */}
              <div className="flex items-center p-0.5 bg-black/40 border border-white/[0.08] rounded-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMngVariant("solo");
                  }}
                  className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                    mngVariant === "solo"
                      ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Solo
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMngVariant("group");
                  }}
                  className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                    mngVariant === "group"
                      ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Group
                </button>
              </div>

              {/* Level 2 selector */}
              <div className="flex items-center p-0.5 bg-black/40 border border-white/[0.08] rounded-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMngStage("audition");
                  }}
                  className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                    mngStage === "audition"
                      ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Audition
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMngStage("main");
                  }}
                  className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                    mngStage === "main"
                      ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Main Competition
                </button>
              </div>
            </div>
          )}

          {/* 2. IdeaSpark (Single / Group - NO audition/main selector) */}
          {familyConfig?.kind === "ideaspark" && (
            <div className="mt-2.5 flex items-center p-0.5 bg-black/40 border border-white/[0.08] rounded-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSparkVariant("single");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  sparkVariant === "single"
                    ? "bg-gradient-to-r from-euphoria-teal via-emerald-600 to-euphoria-teal text-white shadow-sm shadow-euphoria-teal/30 border border-emerald-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSparkVariant("group");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  sparkVariant === "group"
                    ? "bg-gradient-to-r from-euphoria-teal via-emerald-600 to-euphoria-teal text-white shadow-sm shadow-euphoria-teal/30 border border-emerald-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Group
              </button>
            </div>
          )}

          {/* 3. Model Hunt (Audition / Finalist) */}
          {familyConfig?.kind === "model-hunt" && (
            <div className="mt-2.5 flex items-center p-0.5 bg-black/40 border border-white/[0.08] rounded-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMhStage("audition");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  mhStage === "audition"
                    ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Audition
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMhStage("finalist");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  mhStage === "finalist"
                    ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Finalist
              </button>
            </div>
          )}

          {/* 4. Fashion Fiesta (1 Designer Dress / 6 Designer Dress) */}
          {familyConfig?.kind === "fashion-fiesta" && (
            <div className="mt-2.5 flex items-center p-0.5 bg-black/40 border border-white/[0.08] rounded-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFfVariant("1-dress");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  ffVariant === "1-dress"
                    ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                1 Designer Dress
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFfVariant("6-dress");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  ffVariant === "6-dress"
                    ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                6 Designer Dress
              </button>
            </div>
          )}

          {/* 5. Badminton — Male (Solo / Double) */}
          {familyConfig?.kind === "badminton-male" && (
            <div className="mt-2.5 flex items-center p-0.5 bg-black/40 border border-white/[0.08] rounded-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBmVariant("solo");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  bmVariant === "solo"
                    ? "bg-gradient-to-r from-euphoria-teal via-emerald-600 to-euphoria-teal text-white shadow-sm shadow-euphoria-teal/30 border border-emerald-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Solo
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBmVariant("double");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  bmVariant === "double"
                    ? "bg-gradient-to-r from-euphoria-teal via-emerald-600 to-euphoria-teal text-white shadow-sm shadow-euphoria-teal/30 border border-emerald-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Double
              </button>
            </div>
          )}

          {/* 6. Stage Only (Swara Fiesta or fallback 2-stage) */}
          {(familyConfig?.kind === "stage-only" || (!familyConfig && stages?.audition && stages?.main)) && (
            <div className="mt-2.5 flex items-center p-0.5 bg-black/40 border border-white/[0.08] rounded-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStageOnly("audition");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  stageOnly === "audition"
                    ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Audition
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStageOnly("main");
                }}
                className={`flex-1 py-1 px-2 text-[10px] font-bold tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer text-center ${
                  stageOnly === "main"
                    ? "bg-gradient-to-r from-euphoria-purple via-fuchsia-600 to-euphoria-purple text-white shadow-sm shadow-euphoria-purple/30 border border-fuchsia-400/40"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Main Competition
              </button>
            </div>
          )}

          {/* Title & Family header */}
          <div className="mt-2">
            {familyHeader && (
              <span
                className={`text-[10px] font-bold tracking-[0.15em] uppercase block mb-0.5 ${
                  displayEvent.category === "science-tech"
                    ? "text-euphoria-aqua"
                    : "text-euphoria-purple"
                }`}
              >
                {familyHeader}
              </span>
            )}
            <h3 className="text-sm sm:text-[15px] font-semibold text-white/85 leading-snug line-clamp-2 group-hover:text-white transition-colors">
              {displayEvent.name}
            </h3>
          </div>

          <p className="mt-1.5 text-xs text-white/60 leading-relaxed line-clamp-2">
            {displayEvent.description}
          </p>

          {/* Stage Info Meta (Fee & Date) */}
          <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-white/65 sm:text-white/50 text-[11px]">
              Fee:{" "}
              <strong className="text-euphoria-aqua font-semibold">
                {displayEvent.registrationFee}
              </strong>
            </span>
            <span className="text-white/60 sm:text-white/40 text-[10px] truncate max-w-[120px]">
              {displayEvent.date}
            </span>
          </div>

          <div className="mt-auto pt-3">
            {rulebookUrl ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onViewEvent(displayEvent)}
                  className="w-full text-center min-h-[40px] py-2 px-1 sm:px-2 flex items-center justify-center text-[10px] sm:text-[11px] font-bold tracking-[0.08em] sm:tracking-[0.12em] uppercase text-euphoria-aqua border border-euphoria-aqua/40 bg-euphoria-aqua/[0.04] rounded-md transition-all duration-300 hover:bg-euphoria-aqua/15 hover:border-euphoria-aqua hover:shadow-[0_0_15px_rgba(62,238,213,0.2)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none cursor-pointer truncate"
                >
                  View Event
                </button>
                <a
                  href={rulebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-center min-h-[40px] py-2 px-1 sm:px-2 flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-bold tracking-[0.08em] sm:tracking-[0.12em] uppercase text-euphoria-aqua border border-euphoria-aqua/40 bg-euphoria-aqua/[0.08] hover:bg-euphoria-aqua/[0.18] hover:border-euphoria-aqua hover:shadow-[0_0_15px_rgba(62,238,213,0.2)] rounded-md transition-all duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none group cursor-pointer whitespace-nowrap"
                >
                  <span>VIEW RULEBOOK</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onViewEvent(displayEvent)}
                className="w-full text-center min-h-[40px] py-2.5 sm:py-2 flex items-center justify-center text-[11px] font-bold tracking-[0.15em] uppercase text-euphoria-aqua border border-euphoria-aqua/40 bg-euphoria-aqua/[0.04] rounded-md transition-all duration-300 hover:bg-euphoria-aqua/15 hover:border-euphoria-aqua hover:shadow-[0_0_15px_rgba(62,238,213,0.2)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none cursor-pointer"
              >
                View Event
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
