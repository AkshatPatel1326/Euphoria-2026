// ─────────────────────────────────────────────────────────────
// useEvents — fetches events from GET /api/events and maps
// backend EventDetail shape → frontend EuphoriaEvent shape.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";
import {
  events as staticEvents,
  type EuphoriaEvent,
  type EventCategory,
  type RegistrationType,
} from "@/data/events";

// Shape returned by backend GET /api/events (verified from Prisma schema + eventService)
interface BackendCategory {
  id: string;
  slug: string;
  name: string;
  number: string | null;
  color: string | null;
  description: string | null;
  keywords: string | null;
  posterUrl: string | null;
}

interface BackendEvent {
  id: string;
  slug: string | null;
  name: string;
  description: string;
  posterUrl: string | null;
  categoryId: string;
  category: BackendCategory;
  fee: number;
  registrationType: "INDIVIDUAL" | "GROUP";
  minTeamSize: number;
  maxTeamSize: number;
  registrationOpen: boolean;
  capacity: number | null;
  status: string;
  date: string | null;
  day: string | null;
  time: string | null;
  venue: string | null;
  prizes: string | null;
  rules: string | null;
  facultyCoordinator?: string | null;
  studentCoordinator?: string | null;
  eventFamily?: string | null;
  stage?: string | null;
  variant?: string | null;
}

interface EventsResponse {
  status: string;
  count: number;
  data: {
    events: BackendEvent[];
  };
}

/**
 * Configuration for the 11 finalized sports events.
 * Preserves backend IDs for seamless database integration and registration flow.
 */
const FINAL_SPORTS_CONFIG: Record<
  string,
  { name: string; poster: string; order: number }
> = {
  "sport-15": {
    name: "Arm Wrestling",
    poster: "/assets/Arm wresteling.jpg",
    order: 1,
  },
  "sport-11": {
    name: "Badminton — Female",
    poster: "/assets/Badminton Female.png",
    order: 2,
  },
  "sport-9": {
    name: "Badminton — Male (Solo)",
    poster: "/assets/Badminton Male.png",
    order: 3,
  },
  "sport-10": {
    name: "Badminton — Male (Double)",
    poster: "/assets/Badminton Male.png",
    order: 3,
  },
  "sport-5": {
    name: "Carrom",
    poster: "/assets/Carrom.jpg",
    order: 4,
  },
  "sport-6": {
    name: "Chess",
    poster: "/assets/Chess.jpg",
    order: 5,
  },
  "sport-1": {
    name: "Cricket",
    poster: "/assets/Cricket.jpg",
    order: 6,
  },
  "sport-2": {
    name: "Football",
    poster: "/assets/Footaball.jpg",
    order: 7,
  },
  "sport-4": {
    name: "Kabaddi",
    poster: "/assets/Kabbadi.jpg",
    order: 8,
  },
  "sport-13": {
    name: "Power Lifting",
    poster: "/assets/Power lifting.jpg",
    order: 9,
  },
  "sport-8": {
    name: "Table Tennis",
    poster: "/assets/Table tennis.jpg",
    order: 10,
  },
  "sport-7": {
    name: "Volleyball",
    poster: "/assets/Volleyball.jpg",
    order: 11,
  },
};

/**
 * Fallback mapping for grouped event families, variants, and stages.
 * Guarantees relationships are always established even if DB was not freshly migrated.
 */
const EVENT_FAMILY_MAP: Record<
  string,
  {
    eventFamily: string;
    variant?: "solo" | "group" | "single" | "double" | "1-dress" | "6-dress" | string;
    stage?: "audition" | "main" | "finalist";
    posterUrl?: string | null;
  }
> = {
  "cultural-13": { eventFamily: "Move & Groove", variant: "solo", stage: "audition", posterUrl: "/assets/Move n groove audition.jpg" },
  "cultural-1": { eventFamily: "Move & Groove", variant: "solo", stage: "main", posterUrl: "/assets/Move n groove Final.jpg" },
  "cultural-14": { eventFamily: "Move & Groove", variant: "group", stage: "audition", posterUrl: "/assets/Move n groove audition.jpg" },
  "cultural-2": { eventFamily: "Move & Groove", variant: "group", stage: "main", posterUrl: "/assets/Move n groove Final.jpg" },
  "cultural-8": {
    eventFamily: "Model Hunt",
    stage: "audition",
    posterUrl: "/assets/Model hunt audition.jpg",
  },
  "cultural-9": {
    eventFamily: "Model Hunt",
    stage: "main",
    posterUrl: "/assets/Model Hun Finalist.jpg",
  },
  "cultural-5": {
    eventFamily: "Fashion Fiesta",
    variant: "1-dress",
    posterUrl: "/assets/Fashion Fiesta.jpeg",
  },
  "cultural-7": {
    eventFamily: "Fashion Fiesta",
    variant: "6-dress",
    posterUrl: "/assets/Fashion Fiesta.jpeg",
  },
  "sport-9": {
    eventFamily: "Badminton — Male",
    variant: "solo",
    posterUrl: "/assets/Badminton Male.png",
  },
  "sport-10": {
    eventFamily: "Badminton — Male",
    variant: "double",
    posterUrl: "/assets/Badminton Male.png",
  },
  "cultural-15": { eventFamily: "Swara Fiesta", stage: "audition" },
  "cultural-3": { eventFamily: "Swara Fiesta", stage: "main" },
  "sci-1": { eventFamily: "IdeaSpark", variant: "single" },
  "sci-2": { eventFamily: "IdeaSpark", variant: "group" },
};

/**
 * Maps a backend EventDetail to the frontend EuphoriaEvent interface.
 * Returns null if a sports event is not part of the finalized 11-event list.
 */
function mapBackendEvent(e: BackendEvent): EuphoriaEvent | null {
  const isSports = e.category.slug === "sports" || e.categoryId === "sports";

  if (isSports) {
    const sportsConfig = FINAL_SPORTS_CONFIG[e.id];
    // Filter out non-final sports (e.g. Weight Lifting, Snooker, Basketball, extra Badminton variants)
    if (!sportsConfig) {
      return null;
    }

    const fee = e.fee;
    const familyInfo = EVENT_FAMILY_MAP[e.id];
    const eventFamily = e.eventFamily || familyInfo?.eventFamily;
    const variant = (e.variant as string) || familyInfo?.variant;

    return {
      id: e.id,
      name: sportsConfig.name,
      category: "sports",
      description: e.description,
      poster: sportsConfig.poster,
      fee,
      registrationType: e.registrationType.toLowerCase() as RegistrationType,
      minTeamSize: e.minTeamSize,
      maxTeamSize: e.maxTeamSize,
      registrationOpen: e.registrationOpen,
      registrationFee: fee === 0 ? "Free" : `₹${fee.toLocaleString("en-IN")}`,
      date: e.date ?? "TBA",
      day: e.day ?? "",
      time: e.time ?? "TBA",
      venue: e.venue ?? "TBA",
      teamSize:
        e.minTeamSize === e.maxTeamSize
          ? String(e.minTeamSize)
          : `${e.minTeamSize}–${e.maxTeamSize}`,
      prizes: e.prizes ?? "TBA",
      rules: e.rules ?? "",
      facultyCoordinator: e.facultyCoordinator ?? undefined,
      studentCoordinator: e.studentCoordinator ?? undefined,
      eventFamily: eventFamily ?? undefined,
      variant: variant ?? undefined,
    };
  }

  const familyInfo = EVENT_FAMILY_MAP[e.id];
  const eventFamily = e.eventFamily || familyInfo?.eventFamily;
  const stage = (e.stage as "audition" | "main") || familyInfo?.stage;
  const variant = (e.variant as string) || familyInfo?.variant;

  // Use familyInfo posterUrl if available, otherwise backend posterUrl, otherwise fall back to static event data poster
  const staticMatch = staticEvents.find((se) => se.id === e.id);
  const resolvedPoster = familyInfo?.posterUrl ?? e.posterUrl ?? staticMatch?.poster ?? null;

  return {
    id: e.id,
    name: e.name,
    category: e.category.slug as EventCategory,
    description: e.description,
    poster: resolvedPoster,
    fee: e.fee,
    registrationType: e.registrationType.toLowerCase() as RegistrationType,
    minTeamSize: e.minTeamSize,
    maxTeamSize: e.maxTeamSize,
    registrationOpen: e.registrationOpen,
    registrationFee: e.fee === 0 ? "Free" : `₹${e.fee.toLocaleString("en-IN")}`,
    date: e.date ?? "TBA",
    day: e.day ?? "",
    time: e.time ?? "TBA",
    venue: e.venue ?? "TBA",
    teamSize:
      e.minTeamSize === e.maxTeamSize
        ? String(e.minTeamSize)
        : `${e.minTeamSize}–${e.maxTeamSize}`,
    prizes: e.prizes ?? "TBA",
    rules: e.rules ?? "",
    facultyCoordinator: e.facultyCoordinator ?? undefined,
    studentCoordinator: e.studentCoordinator ?? undefined,
    status: (e.status as "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED") ?? undefined,
    capacity: e.capacity ?? undefined,
    eventFamily: eventFamily ?? undefined,
    stage: stage ?? undefined,
    variant: variant ?? undefined,
  };
}

/**
 * Hook to fetch events from the backend, optionally filtered by category slug.
 */
export function useEvents(category?: string) {
  const [events, setEvents] = useState<EuphoriaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const queryParams = category ? `?category=${encodeURIComponent(category)}` : "";

    apiGet<EventsResponse>(`/events${queryParams}`)
      .then((res) => {
        const mapped = res.data.events
          .map(mapBackendEvent)
          .filter((e): e is EuphoriaEvent => e !== null && e.status !== "DRAFT" && e.id !== "cultural-6");

        // Ensure Badminton Male has both Solo (sport-9) and Double (sport-10) variants available
        if (mapped.some((e) => e.id === "sport-9") && !mapped.some((e) => e.id === "sport-10")) {
          const staticDouble = staticEvents.find((e) => e.id === "sport-10");
          if (staticDouble) {
            mapped.push(staticDouble);
          }
        }

        // Sort sports events according to the official finalized 11-event order
        if (category === "sports") {
          mapped.sort((a, b) => {
            const orderA = FINAL_SPORTS_CONFIG[a.id]?.order ?? 999;
            const orderB = FINAL_SPORTS_CONFIG[b.id]?.order ?? 999;
            return orderA - orderB;
          });
        }

        setEvents(mapped);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load events");
        // Fallback to static events from data/events on error
        const fallback = (category
          ? staticEvents.filter((e) => e.category === category)
          : staticEvents
        ).filter((e) => e.status !== "DRAFT" && e.id !== "cultural-6");
        setEvents(fallback);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [category]);

  return { events, isLoading, error };
}
