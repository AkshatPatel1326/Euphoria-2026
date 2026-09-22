/**
 * Official Google Docs Rulebook mappings extracted from `All events link.docx`.
 *
 * Source of truth: All events link.docx
 *
 * Rules:
 * - Sports events have NO rulebooks (returns null).
 * - Exact Google Docs URLs from `All events link.docx` are preserved with zero modifications.
 */

export const EVENT_RULEBOOK_URLS = {
  // Cultural
  moveAndGrooveSolo:
    "https://docs.google.com/document/d/1I6TF73DMU8aFo4MdSiVuFzU9hf9XJcWH0qZi8_D8Fow/edit?tab=t.0",
  moveAndGrooveGroup:
    "https://docs.google.com/document/d/17nKEyQ6tht4Ozn2v1jADAdAhGkLcejpXb5bnraOCUZc/edit?tab=t.0",
  swarFiesta:
    "https://docs.google.com/document/d/1ceWj3eyeKQ3M_Qhxiu9a9wAIz4iBAN4bGPRo5yP2Y04/edit?tab=t.0",
  modelHunt:
    "https://docs.google.com/document/d/1Z_ItyMBG80MtZFiBHel7LCKi9iCMqu9e4WJXmsBsbqU/edit?tab=t.0",
  fashionFiesta1Dress:
    "https://docs.google.com/document/d/1NSvVRV5FuhGOCHUABKKuLaysYO7jltu-X3CSDaEx_wY/edit?tab=t.0",
  fashionFiesta6Dress:
    "https://docs.google.com/document/d/1uN9o_VFhK4J1fyLcBIP2rXyifyqgOtjttpcoMW7J6aM/edit?tab=t.0",
  battleOfBands:
    "https://docs.google.com/document/d/1b4zPgi3jlH7CWDR_xfBp7B86_jHvOCXp66UEkk22Wzk/edit?tab=t.0",
  reelAndPhotography:
    "https://docs.google.com/document/d/1Nb61fYyrDLAiYbvxeLfflDfllwLVdcyOsE9UHTi0IFs/edit?tab=t.0",

  // Literary & Management
  crackTheClue:
    "https://docs.google.com/document/d/15jHO5gOioE6wjBBDuFshmxK5C3npsh5TqNEpqX6S3M0/edit?tab=t.0",
  bidToWin:
    "https://docs.google.com/document/d/1Rq5VVvRHtt8Pmf1rNgJXBXuePQa3zfa8KD88S2i2zIo/edit?tab=t.0",
  vocalInk:
    "https://docs.google.com/document/d/1NK40faLVh0AT590-WXYmM5JcQvt63yPesVKj0i7cGTw/edit?tab=t.0",
  theGreatDebate:
    "https://docs.google.com/document/d/1qY7WtY8He6f4o6QLj35hxK3snwX41viR4kgzwt37aS8/edit?tab=t.0",
  battleOfBrands:
    "https://docs.google.com/document/d/1J0db2VUxErfAUEis9eLaeIxDlV5rJez8K6vmTZhD4Z8/edit?tab=t.0",

  // Science & Technology
  ideaSparkSingle:
    "https://docs.google.com/document/d/140sbDNzJe-xr7xAHa4uBripfw3ho4USq6O_oQDy3RxY/edit?tab=t.0",
  ideaSparkGroup:
    "https://docs.google.com/document/d/1qtg4HZYCMZDLUBUOXe05N6Y6v-JvplK1YR1ldrv9a-M/edit?tab=t.0",
  sciPhaAgroModel:
    "https://docs.google.com/document/d/1C7PCq2g16s9FrYNbFO0Kw--VXgbpTr50gARjHl4Z8RM/edit?tab=t.0",
  sciPhaAgroPoster:
    "https://docs.google.com/document/d/1I636r6g9ae9d5l8PE6eDqdzH8-G-yJw0A49KZhOpyX8/edit?tab=t.0",
  aiPromptChallenge:
    "https://docs.google.com/document/d/1bGNn4_oewZv0_ZqecXev3Xnr0rBpfsNwBrqvipRWRv4/edit?tab=t.0",
  lanGaming:
    "https://docs.google.com/document/d/1rGH2cQLyzNH7DTLrJh-AXZrgu8s9jfHojLNzW8Oq1QI/edit?tab=t.0",
  roboRace:
    "https://docs.google.com/document/d/18BJBFacChF8lTiFeKJuxTCYorzabq4C3eFYhVeby7kA/edit?tab=t.0",
  codingMania:
    "https://docs.google.com/document/d/1zpHyaYcwboIjhqfJu74yedkFpYjYwiBTJFiWhc8AQxg/edit?tab=t.0",
  decoderSpyder:
    "https://docs.google.com/document/d/1L6c-lXCpGErqFulxCS47ZKtAMKc_pT8kltmwGFM6emc/edit?tab=t.0",
  bridgeMaking:
    "https://docs.google.com/document/d/1SvwF6TYiL5xubgLo18W3QZpQIj57tK-mNy-7sz4YeWw/edit?tab=t.0",
} as const;

/**
 * Direct ID to Rulebook URL mapping for static & backend IDs.
 */
export const EVENT_ID_RULEBOOK_MAP: Record<string, string> = {
  // Move & Groove Solo (Audition & Competition share Solo rulebook)
  "cultural-13": EVENT_RULEBOOK_URLS.moveAndGrooveSolo,
  "cultural-1": EVENT_RULEBOOK_URLS.moveAndGrooveSolo,

  // Move & Groove Group (Audition & Competition share Group rulebook)
  "cultural-14": EVENT_RULEBOOK_URLS.moveAndGrooveGroup,
  "cultural-2": EVENT_RULEBOOK_URLS.moveAndGrooveGroup,

  // Swar Fiesta (Singing Audition & Competition share rulebook)
  "cultural-3": EVENT_RULEBOOK_URLS.swarFiesta,

  // Model Hunt (Audition & Finalist share rulebook)
  "cultural-8": EVENT_RULEBOOK_URLS.modelHunt,
  "cultural-9": EVENT_RULEBOOK_URLS.modelHunt,

  // Fashion Fiesta (1 Designer Dress and 6 Designer Dress have separate rulebooks)
  "cultural-5": EVENT_RULEBOOK_URLS.fashionFiesta1Dress,
  "cultural-7": EVENT_RULEBOOK_URLS.fashionFiesta6Dress,

  // Cultural Standalone
  "cultural-4": EVENT_RULEBOOK_URLS.battleOfBands,
  "cultural-10": EVENT_RULEBOOK_URLS.reelAndPhotography,

  // Literary & Management
  "lit-1": EVENT_RULEBOOK_URLS.crackTheClue,
  "lit-2": EVENT_RULEBOOK_URLS.bidToWin,
  "lit-4": EVENT_RULEBOOK_URLS.battleOfBrands,
  "lit-6": EVENT_RULEBOOK_URLS.theGreatDebate,
  "lit-7": EVENT_RULEBOOK_URLS.vocalInk,

  // Science & Technology
  "sci-1": EVENT_RULEBOOK_URLS.ideaSparkSingle,
  "sci-2": EVENT_RULEBOOK_URLS.ideaSparkGroup,
  "sci-3": EVENT_RULEBOOK_URLS.sciPhaAgroModel,
  "sci-4": EVENT_RULEBOOK_URLS.sciPhaAgroPoster,
  "sci-5": EVENT_RULEBOOK_URLS.aiPromptChallenge,
  "sci-6": EVENT_RULEBOOK_URLS.lanGaming,
  "sci-7": EVENT_RULEBOOK_URLS.roboRace,
  "sci-8": EVENT_RULEBOOK_URLS.codingMania,
  "sci-9": EVENT_RULEBOOK_URLS.decoderSpyder,
  "sci-10": EVENT_RULEBOOK_URLS.bridgeMaking,
};

export interface EventLike {
  id?: string | null;
  name?: string | null;
  category?: string | null;
  eventFamily?: string | null;
  variant?: string | null;
  stage?: string | null;
}

/**
 * Resolves the official rulebook URL for a given event, variant, or family.
 * Returns null for sports and events with no rulebook in `All events link.docx`.
 */
export function getRulebookUrl(event?: EventLike | null): string | null {
  if (!event) return null;

  // Strict: Sports currently have NO rulebooks
  if (event.category === "sports") return null;

  // 1. Direct ID match
  if (event.id && EVENT_ID_RULEBOOK_MAP[event.id]) {
    return EVENT_ID_RULEBOOK_MAP[event.id];
  }

  const name = (event.name || "").toLowerCase();
  const family = (event.eventFamily || "").toLowerCase();
  const variant = (event.variant || "").toLowerCase();

  // 2. Move & Groove family
  if (family.includes("move") || name.includes("move & groove") || name.includes("move n groove")) {
    if (variant === "solo" || name.includes("solo")) {
      return EVENT_RULEBOOK_URLS.moveAndGrooveSolo;
    }
    if (variant === "group" || name.includes("group")) {
      return EVENT_RULEBOOK_URLS.moveAndGrooveGroup;
    }
  }

  // 3. Swar Fiesta
  if (family.includes("swar") || family.includes("swara") || name.includes("swar") || name.includes("singing")) {
    return EVENT_RULEBOOK_URLS.swarFiesta;
  }

  // 4. Model Hunt family
  if (family.includes("model hunt") || name.includes("model hunt")) {
    return EVENT_RULEBOOK_URLS.modelHunt;
  }

  // 5. Fashion Fiesta family (must distinguish 1-dress vs 6-dress)
  if (family.includes("fashion") || name.includes("fashion")) {
    if (variant === "6-dress" || name.includes("6") || name.includes("max 6")) {
      return EVENT_RULEBOOK_URLS.fashionFiesta6Dress;
    }
    if (variant === "1-dress" || name.includes("1") || name.includes("single")) {
      return EVENT_RULEBOOK_URLS.fashionFiesta1Dress;
    }
  }

  // 6. IdeaSpark family (Single vs Group)
  if (family.includes("ideaspark") || name.includes("ideaspark") || name.includes("idea spark")) {
    if (variant === "group" || name.includes("group")) {
      return EVENT_RULEBOOK_URLS.ideaSparkGroup;
    }
    if (variant === "single" || name.includes("single")) {
      return EVENT_RULEBOOK_URLS.ideaSparkSingle;
    }
  }

  // 7. Cultural standalone
  if (name.includes("battle of bands") || name.includes("battle of the bands")) {
    return EVENT_RULEBOOK_URLS.battleOfBands;
  }
  if (name.includes("reel") || name.includes("photography")) {
    return EVENT_RULEBOOK_URLS.reelAndPhotography;
  }

  // 8. Literary & Management
  if (name.includes("crack the clue") || name.includes("treasure hunt")) {
    return EVENT_RULEBOOK_URLS.crackTheClue;
  }
  if (name.includes("bid to win") || name.includes("ipl")) {
    return EVENT_RULEBOOK_URLS.bidToWin;
  }
  if (name.includes("vocal ink") || name.includes("slam poetry")) {
    return EVENT_RULEBOOK_URLS.vocalInk;
  }
  if (name.includes("the great debate") || name.includes("debate")) {
    return EVENT_RULEBOOK_URLS.theGreatDebate;
  }
  if (name.includes("battle of brands")) {
    return EVENT_RULEBOOK_URLS.battleOfBrands;
  }

  // 9. Science & Technology
  if (name.includes("sci-pha-agro") || name.includes("sci pha agro")) {
    if (name.includes("poster") || name.includes("oral")) {
      return EVENT_RULEBOOK_URLS.sciPhaAgroPoster;
    }
    if (name.includes("model") || name.includes("product")) {
      return EVENT_RULEBOOK_URLS.sciPhaAgroModel;
    }
  }
  if (name.includes("ai") && (name.includes("prompt") || name.includes("challenge"))) {
    return EVENT_RULEBOOK_URLS.aiPromptChallenge;
  }
  if (name.includes("lan") || name.includes("gamming") || name.includes("gaming")) {
    return EVENT_RULEBOOK_URLS.lanGaming;
  }
  if (name.includes("robo race")) {
    return EVENT_RULEBOOK_URLS.roboRace;
  }
  if (name.includes("coding mania") || name.includes("para coading") || name.includes("coding")) {
    return EVENT_RULEBOOK_URLS.codingMania;
  }
  if (name.includes("decoder spyder") || name.includes("decoder")) {
    return EVENT_RULEBOOK_URLS.decoderSpyder;
  }
  if (name.includes("bridge making") || name.includes("birdge making") || name.includes("bridge")) {
    return EVENT_RULEBOOK_URLS.bridgeMaking;
  }

  return null;
}
