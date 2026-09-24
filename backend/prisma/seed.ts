/* ═══════════════════════════════════════════════════════════════
   EUPHORIA DATABASE SEED SCRIPT (DEVELOPMENT & TEST ONLY)
   ═══════════════════════════════════════════════════════════════
   WARNING: This script is intended STRICTLY for local development
   and disposable testing environments.

   DO NOT RUN THIS SCRIPT IN PRODUCTION.
   Running this script against a live production database will:
     - Overwrite dynamically managed event registration fees
     - Overwrite dynamic festival pass pricing and pass status
     - Overwrite administrative user password hashes
     - Overwrite event schedules and category details

   PRODUCTION DATABASE INITIALIZATION / DEPLOYMENT:
     1. npm install
     2. npx prisma generate
     3. npx prisma migrate deploy
     4. npm run build
     5. npm run start

   In production (NODE_ENV=production), this script is guarded
   and will immediately terminate with an error before executing
   any database operations.
   ═══════════════════════════════════════════════════════════════ */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Role,
  RegistrationType,
  EventStatus,
  PassStatus,
} from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required in .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/* ═══════════════════════════════════════════════════════════════
   1. CATEGORIES (Extracted from src/data/events.ts categoryMeta)
   ═══════════════════════════════════════════════════════════════ */
const categories = [
  {
    id: "cultural",
    slug: "cultural",
    name: "Cultural",
    number: "01",
    color: "#A232A0",
    description:
      "Dance, music, fashion, and visual arts — where raw talent meets the stage.",
    keywords: "Dance · Music · Fashion · Performance",
    posterUrl: "/assets/Cultural Category.jpg",
  },
  {
    id: "literary-management",
    slug: "literary-management",
    name: "Literary & Management",
    number: "02",
    color: "#AF9947",
    description:
      "Debate, strategy, branding, and innovation — where ideas are sharpened.",
    keywords: "Ideas · Strategy · Debate · Marketing",
    posterUrl: "/assets/Literary & Management Category.jpg",
  },
  {
    id: "science-tech",
    slug: "science-tech",
    name: "Science & Technology",
    number: "03",
    color: "#3EEED5",
    description: "Innovation, research, and AI — where the future is built.",
    keywords: "Innovation · AI · Science · Technology",
    posterUrl: "/assets/Science & Technology Category.jpg",
  },
  {
    id: "sports",
    slug: "sports",
    name: "Sports",
    number: "04",
    color: "#176F63",
    description:
      "Competition, endurance, and strategy — where champions are made.",
    keywords: "Competition · Strength · Skill · Teamwork",
    posterUrl: "/assets/Sport Category.jpg",
  },
];

/* ═══════════════════════════════════════════════════════════════
   2. PASSES (Extracted from src/components/euphoria/Passes.tsx)
   ═══════════════════════════════════════════════════════════════ */
const euphoriaPass = {
  id: "euphoria-2026-general",
  slug: "euphoria-2026-general",
  name: "EUPHORIA 2026",
  subtitle: "GENERAL PASS",
  tagline: "Your entry into the celebration.",
  price: 799,
  status: PassStatus.AVAILABLE,

  audiences: [
    "SAGE University students",
    "Students from other colleges",
    "General public / outsiders",
  ],
  features: [
    "Access to the Euphoria festival experience",
    "Entry to eligible events and activities",
    "Festival updates and announcements",
    "Access to designated festival areas",
    "More details to be announced",
  ],
};

/* ═══════════════════════════════════════════════════════════════
   3. SPONSORS (Extracted from src/components/euphoria/Sponsors.tsx)
   ═══════════════════════════════════════════════════════════════ */
const sponsors = [
  // Featured sponsors
  {
    id: "sponsor-featured-1",
    name: "SAGE Euphoria 2026",
    logoUrl: "/assets/Sage_euphoria_logp.png",
    tier: "Flagship University Fest",
    isFeatured: true,
    order: 1,
  },
  {
    id: "sponsor-featured-2",
    name: "Radio SAGE",
    logoUrl: "/assets/Past_Sponsors__14_.png",
    tier: "Official Media Partner",
    isFeatured: true,
    order: 2,
  },
  // Partner & Past sponsors
  { id: "sponsor-past-7", name: "Partner Sponsor 7", logoUrl: "/assets/Past_Sponsors__7_.png", tier: "Event Partner", isFeatured: false, order: 3 },
  { id: "sponsor-past-8", name: "Partner Sponsor 8", logoUrl: "/assets/Past_Sponsors__8_.png", tier: "Event Partner", isFeatured: false, order: 4 },
  { id: "sponsor-past-9", name: "Partner Sponsor 9", logoUrl: "/assets/Past_Sponsors__9_.png", tier: "Event Partner", isFeatured: false, order: 5 },
  { id: "sponsor-past-12", name: "Partner Sponsor 12", logoUrl: "/assets/Past_Sponsors__12_.png", tier: "Event Partner", isFeatured: false, order: 6 },
  { id: "sponsor-past-21", name: "Partner Sponsor 21", logoUrl: "/assets/Past_Sponsors__21_.png", tier: "Event Partner", isFeatured: false, order: 7 },
  { id: "sponsor-past-22", name: "Partner Sponsor 22", logoUrl: "/assets/Past_Sponsors__22_.png", tier: "Event Partner", isFeatured: false, order: 8 },
  { id: "sponsor-past-23", name: "Partner Sponsor 23", logoUrl: "/assets/Past_Sponsors__23_.png", tier: "Event Partner", isFeatured: false, order: 9 },
  { id: "sponsor-past-24", name: "Partner Sponsor 24", logoUrl: "/assets/Past_Sponsors__24_.png", tier: "Event Partner", isFeatured: false, order: 10 },
  { id: "sponsor-past-26", name: "Partner Sponsor 26", logoUrl: "/assets/Past_Sponsors__26_.png", tier: "Event Partner", isFeatured: false, order: 11 },
  { id: "sponsor-past-27", name: "Partner Sponsor 27", logoUrl: "/assets/Past_Sponsors__27_.png", tier: "Event Partner", isFeatured: false, order: 12 },
  { id: "sponsor-past-29", name: "Partner Sponsor 29", logoUrl: "/assets/Past_Sponsors__29_.png", tier: "Event Partner", isFeatured: false, order: 13 },
  { id: "sponsor-past-30", name: "Partner Sponsor 30", logoUrl: "/assets/Past_Sponsors__30_.png", tier: "Event Partner", isFeatured: false, order: 14 },
  { id: "sponsor-past-39", name: "Partner Sponsor 39", logoUrl: "/assets/Past_Sponsors__39_.png", tier: "Event Partner", isFeatured: false, order: 15 },
  { id: "sponsor-past-jh", name: "JH Partner", logoUrl: "/assets/JH.png", tier: "Associate Partner", isFeatured: false, order: 16 },
  { id: "sponsor-past-re", name: "RE Partner", logoUrl: "/assets/RE.png", tier: "Associate Partner", isFeatured: false, order: 17 },
];

/* ═══════════════════════════════════════════════════════════════
   4. EVENTS (All 43 events extracted verbatim from src/data/events.ts)
   ═══════════════════════════════════════════════════════════════ */
interface RawEvent {
  id: string;
  name: string;
  category: string;
  description: string;
  poster: string | null;
  fee: number;
  registrationType: "individual" | "group";
  minTeamSize: number;
  maxTeamSize: number;
  registrationOpen: boolean;
  capacity?: number;
  status?: EventStatus;
  date: string;
  day: string;
  time: string;
  venue: string;
  teamSize: string;
  prizes: string;
  rules: string;
  facultyCoordinator?: string;
  studentCoordinator?: string;
  eventFamily?: string;
  stage?: string;
}

const rawEvents: RawEvent[] = [
  // ── Cultural (10 events) ──
  {
    id: "cultural-1",
    name: "Move & Groove — Solo Dance Competition",
    category: "cultural",
    description: "A solo dance competition celebrating artistry, rhythm, and stage presence.",
    poster: "/assets/Move & Groove Solo Audition - Copy.jpg",
    fee: 249,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "28 October 2026",
    day: "Wednesday",
    time: "11:00 AM to 2:00 PM",
    venue: "Kalpvriksha Auditorium",
    teamSize: "Individual",
    prizes: "1st: ₹3,100 | 2nd: ₹2,100",
    rules: "Solo performers only. Two rounds: preliminary and final.",
    facultyCoordinator: "Prof. Pranjali Shukla - 9179276626, Prof. Surbhi Sudame - 9713742310",
    studentCoordinator: "Ms. Yogeshwari Agrawal - 8085184206, Ms. Himashi Bhola - 9630843077",
    eventFamily: "Move & Groove",
    stage: "main",
  },
  {
    id: "cultural-2",
    name: "Move & Groove — Group Dance Competition",
    category: "cultural",
    description: "Choreographed group performances judged on synchronization, creativity, and impact.",
    poster: "/assets/Move n groove Final.jpg",
    fee: 799,
    registrationType: "group",
    minTeamSize: 5,
    maxTeamSize: 15,
    registrationOpen: true,
    date: "28 October 2026",
    day: "Wednesday",
    time: "11:00 AM to 2:00 PM",
    venue: "Kalpvriksha Auditorium",
    teamSize: "5–15 members",
    prizes: "1st: ₹5,100 | 2nd: ₹3,100",
    rules: "Groups of 5 to 15. Original choreography preferred.",
    facultyCoordinator: "Prof. Pranjali Shukla - 9179276626, Prof. Surbhi Sudame - 9713742310",
    studentCoordinator: "Ms. Yogeshwari Agrawal - 8085184206, Ms. Himashi Bhola - 9630843077",
    eventFamily: "Move & Groove",
    stage: "main",
  },
  {
    id: "cultural-3",
    name: "Swar Fiesta — Solo Singing Competition",
    category: "cultural",
    description: "A solo singing competition for vocalists who command the stage with range and emotion.",
    poster: "/assets/Swar Fiesta Final.jpg",
    fee: 249,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "29 October 2026",
    day: "Thursday",
    time: "10:00 AM to 12:00 PM",
    venue: "Kalpvriksha Auditorium",
    teamSize: "Individual",
    prizes: "1st: ₹3,100 | 2nd: ₹2,100",
    rules: "Solo vocals only. Two rounds: elimination and finale.",
    facultyCoordinator: "Prof. Pranjali Shukla - 9179276626, Prof. Rishikesh Parnekar - 7746881737",
    studentCoordinator: "Shivani Kumari - 8236032783",
    eventFamily: "Swara Fiesta",
    stage: "main",
  },
  {
    id: "cultural-4",
    name: "Battle of Bands",
    category: "cultural",
    description: "Live band performances competing for the title of best ensemble on campus.",
    poster: "/assets/Battle of Bands.jpg",
    fee: 2499,
    registrationType: "group",
    minTeamSize: 4,
    maxTeamSize: 8,
    registrationOpen: true,
    date: "29 October 2026",
    day: "Thursday",
    time: "12:00 PM to 04:00 PM",
    venue: "Kalpvriksha Auditorium",
    teamSize: "4–8 members",
    prizes: "1st: ₹11,000",
    rules: "Live performance required. Minimum 4, maximum 8 members.",
    facultyCoordinator: "Prof. OP Karada - 88786 81086, Prof. Amol Mandpe - 95844 38803",
    studentCoordinator: "Mayank Tanwar - 7014125717, Snehil Kumar - 7000034477",
  },
  {
    id: "cultural-5",
    name: "Fashion-Fiesta (Fashion Show) Designer — Single Dress",
    category: "cultural",
    description: "Solo runway competition for models presenting a single original dress design.",
    poster: "/assets/Fashion fiesta 1 dress.jpg",
    fee: 499,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "9 April 2026",
    day: "Thursday",
    time: "7:00 PM Onwards",
    venue: "Phase 2 Ground",
    teamSize: "Individual",
    prizes: "1st: ₹5,100 | 2nd: ₹3,100",
    rules: "Solo runway walk with a single original dress design.",
  },
  {
    id: "cultural-6",
    name: "Fashion-Fiesta — Graduation Student IOD",
    category: "cultural",
    description: "A fashion showcase for graduation students in the Institute of Design.",
    poster: null,
    fee: 2499,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: false,
    status: EventStatus.DRAFT,
    date: "TBA",
    day: "TBA",
    time: "TBA",
    venue: "TBA",
    teamSize: "Individual",
    prizes: "1st: ₹5,100",
    rules: "Open to graduation students of IOD.",
  },
  {
    id: "cultural-7",
    name: "Fashion-Fiesta (Fashion Show) Designer — Max 6 Dress",
    category: "cultural",
    description: "A design showcase where emerging fashion talent presents up to six original pieces.",
    poster: "/assets/Fashion fiesta 6 dress.jpg",
    fee: 1999,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "TBA",
    day: "TBA",
    time: "TBA",
    venue: "TBA",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹11,000",
    rules: "Present up to 6 original pieces. Theme provided 48 hours before event.",
  },
  {
    id: "cultural-8",
    name: "Model Hunt (Audition)",
    category: "cultural",
    description: "Open auditions for aspiring models seeking their break into the spotlight.",
    poster: "/assets/Model hunt audition.jpg",
    fee: 199,
    capacity: 100,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "TBA",
    day: "TBA",
    time: "10:30 AM Onwards",
    venue: "Kalpvriksha Auditorium",
    teamSize: "Individual",
    prizes: "₹0",
    rules: "Open to all. Walk, introduction, and talent round.",
  },
  {
    id: "cultural-9",
    name: "Model Hunt (Finalist)",
    category: "cultural",
    description: "The finalist round of Model Hunt showcasing the top selected models.",
    poster: "/assets/Model Hun Finalist.jpg",
    fee: 799,
    capacity: 45,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "TBA",
    day: "TBA",
    time: "TBA",
    venue: "TBA",
    teamSize: "Individual",
    prizes: "Mr. Euphoria: ₹2,100 | Ms. Euphoria: ₹2,100 | Best Walk (Male): ₹1,100 | Best Walk (Female): ₹1,100",
    rules: "Selected finalists from Model Hunt Audition round.",
  },
  {
    id: "cultural-10",
    name: "Reel and Photography Competition",
    category: "cultural",
    description: "A visual storytelling competition spanning reels, photography, and short-form content.",
    poster: "/assets/Reel and photography.jpg",
    fee: 149,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "23-10-2026 - 29-10-2026",
    day: "Friday",
    time: "Whole Day",
    venue: "Whole Campus",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Submit 1 reel (60–90 seconds) and 5 photographs. Theme: Euphoria on campus.",
    facultyCoordinator: "Mr. Rupesh Patidar - 9826278264",
    studentCoordinator: "Akshit Jadhav - 6261011612",
  },
  {
    id: "cultural-11",
    name: "Magic Show — By Sagar Kumar",
    category: "cultural",
    description: "An enchanting live magic performance by Sagar Kumar celebrating illusion, wonder, and mystery.",
    poster: "/assets/Magic show.jpeg",
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
    facultyCoordinator: "Dr. Nitika Vats Doohan, Prof Nidhi Sharma (IMS)",
    studentCoordinator: "Mr. Tejas Apte - 993052379, Mr. Divyasnh Soni - 6262252359",
  },
  {
    id: "cultural-12",
    name: "Standup Comedy — By Pankaj Upadhyay",
    category: "cultural",
    description: "A high-energy live standup comedy performance by Pankaj Upadhyay bringing humor and joy to Euphoria.",
    poster: "/assets/Standup Comedy.jpeg",
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
    facultyCoordinator: "Dr. Nitika Vats Doohan, Prof Nidhi Sharma (IMS)",
    studentCoordinator: "Mr. Tejas Apte - 993052379, Mr. Divyasnh Soni - 6262252359",
  },
  {
    id: "cultural-13",
    name: "Move & Groove — Solo Dance Audition",
    category: "cultural",
    description: "Solo dance audition for performers seeking to qualify for the Move & Groove showcase.",
    poster: "/assets/Move & Groove Solo Audition.jpg",
    fee: 99,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "16-10-2026",
    day: "Friday",
    time: "10:00 AM to 4:00 PM",
    venue: "Kalpvriksha Auditorium",
    teamSize: "Individual",
    prizes: "Advancement to Competition Round",
    rules: "Solo performers only. Prepare an audition piece up to 3 minutes.",
    facultyCoordinator: "Prof. Pranjali Shukla (IPA) - 91792 76626, Prof. Surbhi Sudame - 9713742310",
    studentCoordinator: "Ms. Yogeshwari Agrawal - 8085184206, Ms. Himashi Bhola - 9630843077",
    eventFamily: "Move & Groove",
    stage: "audition",
  },
  {
    id: "cultural-14",
    name: "Move & Groove — Group Dance Audition",
    category: "cultural",
    description: "Group dance audition for dance crews seeking to qualify for the Move & Groove showcase.",
    poster: "/assets/Move n groove audition.jpg",
    fee: 199,
    registrationType: "group",
    minTeamSize: 5,
    maxTeamSize: 15,
    registrationOpen: true,
    date: "16-10-2026",
    day: "Friday",
    time: "10:00 AM to 4:00 PM",
    venue: "Kalpvriksha Auditorium",
    teamSize: "5–15 members",
    prizes: "Advancement to Competition Round",
    rules: "Dance crews of 5 to 15 members. Prepare an audition routine.",
    facultyCoordinator: "Prof. Pranjali Shukla (IPA) - 91792 76626, Prof. Surbhi Sudame - 9713742310",
    studentCoordinator: "Ms. Yogeshwari Agrawal - 8085184206, Ms. Himashi Bhola - 9630843077",
    eventFamily: "Move & Groove",
    stage: "audition",
  },
  {
    id: "cultural-15",
    name: "Swara Fiesta — Singing Audition",
    category: "cultural",
    description: "Solo vocal audition for singers seeking to qualify for the Swara Fiesta stage.",
    poster: "/assets/Swar Fiesta Audition.jpg",
    fee: 99,
    capacity: 50,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "15-10-2026",
    day: "Thursday",
    time: "10:00 AM to 4:00 PM",
    venue: "Kalpvriksha Auditorium",
    teamSize: "Individual",
    prizes: "Advancement to Competition Round",
    rules: "Solo singing performance. Carry backing track on USB drive if required.",
    facultyCoordinator: "Prof. Pranjali Shukla (IPA) - 91792 76626, Prof. Rishikesh Parnekar - 77468 81737",
    studentCoordinator: "Shivani Kumari - 8236032783",
    eventFamily: "Swara Fiesta",
    stage: "audition",
  },

  // ── Literary & Management (5 events) ──
  {
    id: "lit-1",
    name: "Crack the Clue (Treasure Hunt)",
    category: "literary-management",
    description: "A multi-stage campus treasure hunt testing observation, logic, and speed.",
    poster: "/assets/Crack the clue.jpg",
    fee: 999,
    registrationType: "group",
    minTeamSize: 2,
    maxTeamSize: 4,
    registrationOpen: true,
    date: "28 October 2026",
    day: "Wednesday",
    time: "11:00 AM Onwards",
    venue: "A Block Central Stage",
    teamSize: "2–4 members",
    prizes: "1st: ₹3,100",
    rules: "Teams of 2–4. Multi-stage clues across campus. First to solve all wins.",
    facultyCoordinator: "Mr. Ronak Bharadwaj - 9977334153",
    studentCoordinator: "Palaksha Kirtwar - 8269760773",
  },
  {
    id: "lit-2",
    name: "Bid To Win (IPL Auction)",
    category: "literary-management",
    description: "A simulated IPL auction where teams compete to build the strongest squad under budget.",
    poster: "/assets/Bid to win.jpg",
    fee: 499,
    registrationType: "group",
    minTeamSize: 3,
    maxTeamSize: 5,
    registrationOpen: true,
    date: "29 October 2026",
    day: "Thursday",
    time: "01:00 PM - 04:00 PM",
    venue: "Vishweshvariya Auditorium",
    teamSize: "3–5 members",
    prizes: "1st: ₹5,000 | 2nd: ₹2,500",
    rules: "Teams bid on fictional players with a fixed purse.",
    facultyCoordinator: "Prof. Dipendra Yadav - 8770743431, Dr. Ankur Khandelwal - 9098791342",
    studentCoordinator: "Gauranvi Pandey - 626157599, Vaibhav Sharma - 8319111587, Raj... Bansodkar - 6261464779, Sudhir Kewat - 9630717176, Kushagra Shrivastava - 7889889555, Disha - 8815601993",
  },
  {
    id: "lit-4",
    name: "Battle of Brands",
    category: "literary-management",
    description: "Teams pitch and defend brand strategies in a competitive marketing showcase.",
    poster: "/assets/battle of Brands.jpg",
    fee: 199,
    registrationType: "group",
    minTeamSize: 3,
    maxTeamSize: 5,
    registrationOpen: true,
    date: "28 October 2026",
    day: "Wednesday",
    time: "12:00 PM - 04:00 PM",
    venue: "Phase 2 Seminar Hall, IMS",
    teamSize: "3–5 members",
    prizes: "1st: ₹2,500 | 2nd: ₹1,000",
    rules: "Teams present a brand strategy for a fictional product.",
    facultyCoordinator: "Dr. Jyoti Jaiswal - 7974852180, Prof. Ayush Patidar - 8349311882",
    studentCoordinator: "Mr. Aditya Viswas, Mr. Rudransh Gupta, Mr. Yash",
  },
  {
    id: "lit-6",
    name: "The Great Debate (Debate Competition)",
    category: "literary-management",
    description: "A formal debate competition for participants who argue with precision and conviction.",
    poster: "/assets/Ther gerat Debate.jpg",
    fee: 249,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "30 October 2026",
    day: "Friday",
    time: "11:00 AM to 01:00 PM",
    venue: "MOOT Court B Block",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹1,100 | 2nd: ₹500",
    rules: "British Parliamentary format. Topics released 24 hours before.",
    facultyCoordinator: "Prof. Vaishnavi Pandey - 9424979622, Prof. Purnima Naik - 7587440603",
    studentCoordinator: "Mr. Subham Bais - 9179212928, Ms. Priya Kumari - 9122100460",
  },
  {
    id: "lit-7",
    name: "Vocal Ink (Slam Poetry)",
    category: "literary-management",
    description: "A spoken-word competition where original poetry is performed live for a judging panel.",
    poster: "/assets/Vocal Ink.jpg",
    fee: 249,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "30 October 2026",
    day: "Friday",
    time: "10:30 AM - 12:30 PM",
    venue: "Kalpvriksha Auditorium",
    teamSize: "Individual",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Original work only. Judged on delivery, originality, and emotional impact.",
    facultyCoordinator: "Mr. Ashok Kumar",
    studentCoordinator: "Ms. Shradha Rathore - 9399633019, Ms. Mahima Raghuwanshi - 7389099944",
  },

  // ── Science & Technology (11 events) ──
  {
    id: "sci-1",
    name: "IdeaSpark — Single",
    category: "science-tech",
    description: "A solo innovation pitch competition for individuals with a prototype or concept.",
    poster: "/assets/Idea Spark.jpg",
    fee: 99,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "28 October 2026",
    day: "Wednesday",
    time: "02:00 PM - 04:00 PM",
    venue: "O Block (ICA)",
    teamSize: "Individual",
    prizes: "1st: ₹1,000 | 2nd: ₹700",
    rules: "Solo presenters only. 7-minute pitch + 5-minute Q&A.",
    facultyCoordinator: "Mr. Deep Singh - 62652 20662",
    studentCoordinator: "Mr. Nakshatra Maltare - 70676 09966",
    eventFamily: "IdeaSpark",
  },
  {
    id: "sci-2",
    name: "IdeaSpark — Group",
    category: "science-tech",
    description: "A team-based innovation pitch competition for collaborative projects.",
    poster: "/assets/Idea Spark.jpg",
    fee: 199,
    registrationType: "group",
    minTeamSize: 2,
    maxTeamSize: 5,
    registrationOpen: true,
    date: "28 October 2026",
    day: "Wednesday",
    time: "02:00 PM - 04:00 PM",
    venue: "O Block (ICA)",
    teamSize: "2–5 members",
    prizes: "1st: ₹2,500 | 2nd: ₹1,100",
    rules: "Teams of 2–5. 10-minute pitch + 5-minute Q&A.",
    facultyCoordinator: "Mr. Deep Singh - 62652 20662",
    studentCoordinator: "Mr. Nakshatra Maltare - 70676 09966",
    eventFamily: "IdeaSpark",
  },
  {
    id: "sci-3",
    name: "Sci-Pha-Agro — Model/Product Making Presentation",
    category: "science-tech",
    description: "A hands-on model and product-making competition across science, pharma, and agriculture.",
    poster: "/assets/Model and product making presentation.jpg",
    fee: 249,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "29 October 2026",
    day: "Thursday",
    time: "02:00 PM - 04:00 PM",
    venue: "D Block, IOP",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Bring a working model or product prototype.",
    facultyCoordinator:
      "Dr. Akash S Panwar - 9617958072, Mrs. Akansha Ghodhke - 7869508369, Dr. Amrit Varshini - 9472977501, Dr. Vinras Dawane - 9893842357",
    studentCoordinator: "Mr. Ayush Kumar Pandey - 7702241454",
  },
  {
    id: "sci-4",
    name: "Sci-Pha-Agro — Oral/Poster Presentation",
    category: "science-tech",
    description: "An oral and poster presentation competition for research across science domains.",
    poster: "/assets/Oral and postyer presentation.jpg",
    fee: 249,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "28 October 2026",
    day: "Wednesday",
    time: "02:00 PM - 04:00 PM",
    venue: "D Block, IOP",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Poster size: A0. Oral presentation: 10 minutes + 5-minute Q&A.",
    facultyCoordinator:
      "Dr. Akash S Panwar - 9617958072, Mrs. Akansha Ghodhke - 7869508369, Dr. Amrit Varshini - 9472977501, Dr. Vinras Dawane - 9893842357",
    studentCoordinator: "Mr. Ayush Kumar Pandey - 7702241454",
  },
  {
    id: "sci-5",
    name: "AI — Prompt Challenge",
    category: "science-tech",
    description: "A competition testing the ability to craft effective prompts for artificial intelligence systems.",
    poster: "/assets/AI Prompt.jpg",
    fee: 149,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "29 October 2026",
    day: "Thursday",
    time: "10:30 AM- 2:30 PM",
    venue: "F-33 (NVDIA LAB)",
    teamSize: "Individual",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Three rounds of increasing difficulty.",
    facultyCoordinator: "Prof. Lokendra Vishwakarma - 9993550257",
    studentCoordinator: "Ms. Umme Kulsum Khan - 6264632623, Mr. Asif Khan - 6201011783",
  },
  {
    id: "sci-6",
    name: "Lan Gamming",
    category: "science-tech",
    description: "A LAN gaming tournament bringing together the best gamers on campus.",
    poster: "/assets/Lan gaming.jpg",
    fee: 149,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "28-10-2026 & 29-10-2026",
    day: "Wednesday/Thursday",
    time: "10:30 AM- 2:30 PM",
    venue: "LAB -1 A Block",
    teamSize: "Individual",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Single elimination bracket. Game title TBA.",
    facultyCoordinator: "Prof. Lakhmichand Deshmukh - 9131947674",
    studentCoordinator: "Mr. Prasoon Singh Parihar - 7223810082, Mr. Aditya Yadav - 9244639933",
  },
  {
    id: "sci-7",
    name: "Robo Race",
    category: "science-tech",
    description: "A robotics race competition where engineered bots navigate a track at speed.",
    poster: "/assets/Robo race.jpg",
    fee: 149,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "29 October 2026",
    day: "Thursday",
    time: "10:30 AM- 2:30 PM",
    venue: "M Block Ground Floor",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Build and race a robot on a predefined track.",
    facultyCoordinator: "Prof. Megha Gupta - 9343790105",
    studentCoordinator: "Mr. Ujjwal",
  },
  {
    id: "sci-8",
    name: "Coading Mania",
    category: "science-tech",
    description: "A parallel coding competition testing programming speed, accuracy, and teamwork.",
    poster: "/assets/Coding Mania.jpg",
    fee: 149,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "28 October 2026",
    day: "Wednesday",
    time: "10:30 AM- 2:30 PM",
    venue: "F-33 (NVDIA LAB)",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Solve coding challenges in parallel. Time limit enforced.",
    facultyCoordinator: "Prof. Deepak Agrawal - 9111952954",
    studentCoordinator: "Mr. Amit Gupta - 8871533002, Mr. Atul Vishwakarma - 9877958806",
  },
  {
    id: "sci-9",
    name: "Decoder Spyder",
    category: "science-tech",
    description: "A cybersecurity and decoding challenge for tech enthusiasts.",
    poster: "/assets/Decoder spyder.jpg",
    fee: 149,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "30 October 2026",
    day: "Friday",
    time: "10:30 AM- 2:30 PM",
    venue: "F5 and F8 M block",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Multi-round decoding and cybersecurity challenge.",
    facultyCoordinator: "Prof. Gourav Agrawal - 9109342757",
    studentCoordinator: "Akash Yadav - 7266069509",
  },
  {
    id: "sci-10",
    name: "Bridge Making",
    category: "science-tech",
    description: "A bridge-making engineering competition testing structural design and load capacity.",
    poster: "/assets/Bridge making.jpg",
    fee: 149,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "30 October 2026",
    day: "Friday",
    time: "10:30 AM- 2:30 PM",
    venue: "T - 21 M2 Block",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules: "Build a bridge from provided materials. Tested on load capacity.",
    facultyCoordinator: "Prof. Priyanka Rajput - 7909903880",
    studentCoordinator: "Mr. Bhupesh Netam - 8109395787, Mr. Raj Lodhi - 9111944896",
  },
  {
    id: "sci-11",
    name: "Junkyard Wars",
    category: "science-tech",
    description:
      "A creative engineering challenge where participants design and assemble working prototypes using scrap and recycled materials.",
    poster: "/assets/Junkyard wars.jpg",
    fee: 149,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "29 October 2026",
    day: "Thursday",
    time: "10:30 AM- 2:30 PM",
    venue: "M Block",
    teamSize: "Individual or Pair",
    prizes: "1st: ₹2,100 | 2nd: ₹1,100",
    rules:
      "Teams or individuals must construct a working mechanical model using only the provided scrap and repurposed materials. Judged on creativity, functionality, and structural stability.",
    facultyCoordinator: "Dr. Gautam Singh - 9643988540",
    studentCoordinator: "Mr. Nitish Kumar - 8092133245, Mr. Abhishek Singh - 7724017524",
  },

  // ── Sports (11 events) ──
  {
    id: "sport-15",
    name: "Arm Wrestling",
    category: "sports",
    description: "A one-on-one arm wrestling competition for the strongest on campus.",
    poster: "/assets/Arm wresteling.jpg",
    fee: 150,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "27 October 2026",
    day: "Tuesday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 2 Sports Complex",
    teamSize: "Individual",
    prizes: "1st: ₹1,200 | 2nd: ₹600",
    rules: "Left hand and right hand categories. Single elimination.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator: "Malay Patel - 7489529344, Avinash - 8357847381",
  },
  {
    id: "sport-11",
    name: "Badminton — Female",
    category: "sports",
    description: "A women's singles badminton tournament.",
    poster: "/assets/Badminton Female.jpg",
    fee: 200,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "TBA",
    day: "TBA",
    time: "TBA",
    venue: "TBA",
    teamSize: "Individual",
    prizes: "Winner: ₹2,000 | Runner-up: ₹1,200",
    rules: "Singles format. Pool stage followed by knockout. Best of 3 games.",
  },
  {
    id: "sport-9",
    name: "Badminton — Male",
    category: "sports",
    description: "A men's singles badminton tournament on the court.",
    poster: "/assets/badminton male.jpg",
    fee: 300,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "25-10-2026-26-10-2026",
    day: "Sunday - Monday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 2 Sports Complex",
    teamSize: "Individual",
    prizes: "Winner: ₹3,000 | Runner-up: ₹1,500",
    rules: "Singles format. Pool stage followed by knockout. Best of 3 games.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator: "Mr. Pulkit Mani - 9111776090I, Aisha - 9329799556",
  },
  {
    id: "sport-5",
    name: "Carrom",
    category: "sports",
    description: "A carrom tournament testing precision, strategy, and composure.",
    poster: "/assets/Carrom.jpg",
    fee: 200,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationOpen: true,
    date: "23 October 2026",
    day: "Friday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 2 Sports Complex",
    teamSize: "Individual or Pair",
    prizes: "Winner: ₹1,600",
    rules: "Singles and doubles categories. Pool stage followed by knockout.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator: "Asmit - 8083106812, Pulkit Mani - 9111776090",
  },
  {
    id: "sport-6",
    name: "Chess",
    category: "sports",
    description: "A chess competition for players who think several moves ahead.",
    poster: "/assets/Chess.jpg",
    fee: 200,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "24 October 2026",
    day: "Saturday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 2 Sports Complex",
    teamSize: "Individual",
    prizes: "Winner: ₹1,600",
    rules: "Swiss system. 15 minutes per player per game.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator: "Asmit - 8083106812, Simran - 8360943655",
  },
  {
    id: "sport-1",
    name: "Cricket",
    category: "sports",
    description: "A tournament-format cricket competition open to all skill levels.",
    poster: "/assets/Cricket.jpg",
    fee: 1600,
    registrationType: "group",
    minTeamSize: 11,
    maxTeamSize: 11,
    registrationOpen: true,
    date: "23 October 2026",
    day: "Friday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 2 Ground",
    teamSize: "11 members",
    prizes: "Winner: ₹14,000 | Runner-up: ₹6,000",
    rules: "T20 format. Teams of 11. Round-robin followed by knockout.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator: "Mr. Sai Nishant - 799359186, Mr. Pulkit Mani - 9111776090I",
  },
  {
    id: "sport-2",
    name: "Football",
    category: "sports",
    description: "A football tournament bringing together the best players on campus.",
    poster: "/assets/Footaball.jpg",
    fee: 700,
    registrationType: "group",
    minTeamSize: 7,
    maxTeamSize: 7,
    registrationOpen: true,
    date: "26-10-2026 & 27-10-2026",
    day: "Monday - Tuesday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 2 Ground",
    teamSize: "7 members",
    prizes: "Winner: ₹7,000 | Runner-up: ₹3,000",
    rules: "7-a-side format. Round-robin followed by knockout.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator: "Mr. Snehil Kumar - 7000034477, Mr. Kalash Patwa - 8839043131",
  },
  {
    id: "sport-4",
    name: "Kabaddi",
    category: "sports",
    description: "A high-energy kabaddi tournament for teams.",
    poster: "/assets/Kabbadi.jpg",
    fee: 700,
    registrationType: "group",
    minTeamSize: 7,
    maxTeamSize: 7,
    registrationOpen: true,
    date: "26-10-2026-27-10-2026",
    day: "Monday - Tuesday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 2 Ground",
    teamSize: "7 members",
    prizes: "Winner: ₹4,000 | Runner-up: ₹2,000",
    rules: "7-a-side. Standard kabaddi rules. Round-robin followed by knockout.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator:
      "Shaurya singh - 8319993357, Prince R Prajapati - 9913276128, Vedant Patel - 9589396704",
  },
  {
    id: "sport-13",
    name: "Power Lifting",
    category: "sports",
    description: "A power lifting competition for athletes who train with purpose.",
    poster: "/assets/Power lifting.jpg",
    fee: 300,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "26 October 2026",
    day: "Monday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 2 Sports Complex",
    teamSize: "Individual",
    prizes: "1st: ₹2,000 | 2nd: ₹1,000",
    rules: "Squat, bench press, deadlift. Three attempts per lift.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator: "Malay Patel - 7489529344, Apurva mishra - 9354269005",
  },
  {
    id: "sport-8",
    name: "Table Tennis",
    category: "sports",
    description: "A table tennis competition for players with quick reflexes and sharp technique.",
    poster: "/assets/Table tennis.jpg",
    fee: 250,
    registrationType: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    registrationOpen: true,
    date: "25 October 2026",
    day: "Sunday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 2 Sports Complex",
    teamSize: "Individual",
    prizes: "Winner: ₹2,500",
    rules: "Singles only. Pool stage followed by knockout. Best of 5 games.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator: "Shrey Tiwari - 8817735521, Shubham Kushwah - 9301557813",
  },
  {
    id: "sport-7",
    name: "Volleyball",
    category: "sports",
    description: "A volleyball tournament for teams competing at the net.",
    poster: "/assets/Volleyball.jpg",
    fee: 700,
    registrationType: "group",
    minTeamSize: 6,
    maxTeamSize: 6,
    registrationOpen: true,
    date: "24-10-2026-25-10-2026",
    day: "Saturday - Sunday",
    time: "8:30AM to 4:30PM",
    venue: "Phase 1 Ground",
    teamSize: "6 members",
    prizes: "Winner: ₹4,000 | Runner-up: ₹2,000",
    rules: "6-a-side. Best of 3 sets. Round-robin followed by knockout.",
    facultyCoordinator: "Mr. Mohit Jagtap - 9754844475, Ms. Paridhi Sharma - 6264474614",
    studentCoordinator: "Jayesh Danga - 9414144107, Viraj Patidar - 6260403906",
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN SEED EXECUTION
   ═══════════════════════════════════════════════════════════════ */
async function main() {
  // ── PRODUCTION SAFETY GUARD ──────────────────────────────────────────
  // Seeding is STRICTLY PROHIBITED in production (NODE_ENV=production).
  // Running the seed script in production would overwrite manually managed data
  // (dynamic event pricing, festival pass prices/status, admin credentials,
  // announcements, and event schedules).
  if (process.env.NODE_ENV?.trim().toLowerCase() === "production") {
    console.error("================================================================================");
    console.error("🛑 [PRODUCTION SAFETY GUARD] Database seeding is BLOCKED in production!");
    console.error("================================================================================");
    console.error("Environment detected: NODE_ENV = 'production'");
    console.error("The seed script is strictly intended for local development and test databases.");
    console.error("Executing seed against a production database would overwrite live data including:");
    console.error("  • Dynamic event pricing (fees) and capacities");
    console.error("  • Dynamic festival pass pricing and availability status");
    console.error("  • Admin user credentials and password hashes");
    console.error("  • Event schedules and category configurations");
    console.error("");
    console.error("For production database setup and schema updates, use:");
    console.error("  npx prisma migrate deploy");
    console.error("");
    console.error("Seeding aborted. No database modifications were performed.");
    console.error("================================================================================");
    throw new Error(
      "Database seeding is blocked because NODE_ENV is set to 'production'. Development seed must not run against production."
    );
  }

  console.log("🌱 Starting Euphoria Database Seeding...\n");

  // 1. Seed Categories
  console.log("📁 Seeding Categories...");
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        number: cat.number,
        color: cat.color,
        description: cat.description,
        keywords: cat.keywords,
        posterUrl: cat.posterUrl,
      },
      create: cat,
    });
  }
  console.log(`   ✓ ${categories.length} Categories seeded.`);

  // 2. Seed Default Admin User
  console.log("👤 Seeding Default Admin User...");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sageuniversity.in";
  const adminName = process.env.ADMIN_NAME || "Euphoria Administrator";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, passwordHash: true },
  });

  let passwordHash: string | undefined = existingAdmin?.passwordHash || undefined;

  if (adminPassword && adminPassword !== "") {
    // Hash password from ADMIN_PASSWORD environment variable
    const saltRounds = 10;
    passwordHash = await bcrypt.hash(adminPassword, saltRounds);
  } else if (!existingAdmin) {
    // Generate secure random temporary password only if initial seed without env password
    const tempPassword = crypto.randomBytes(16).toString("base64url") + "!A1";
    const saltRounds = 10;
    passwordHash = await bcrypt.hash(tempPassword, saltRounds);
    console.log("   ⚠️  NOTICE: Initial admin created without ADMIN_PASSWORD in environment. Please set ADMIN_PASSWORD in backend/.env.");
  }

  if (!passwordHash) {
    throw new Error("ADMIN_PASSWORD environment variable is required to seed the admin user.");
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: Role.ADMIN,
      passwordHash,
      isEmailVerified: true,
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: Role.ADMIN,
      passwordHash,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`   ✓ Admin user seeded (${admin.email}).`);

  // 3. Seed Festival Pass
  console.log("🎟️  Seeding Festival Pass...");
  await prisma.pass.upsert({
    where: { slug: euphoriaPass.slug },
    update: {
      name: euphoriaPass.name,
      subtitle: euphoriaPass.subtitle,
      tagline: euphoriaPass.tagline,
      price: euphoriaPass.price,
      status: euphoriaPass.status,
      audiences: euphoriaPass.audiences,
      features: euphoriaPass.features,
    },
    create: euphoriaPass,
  });
  console.log(`   ✓ 1 Festival Pass seeded (${euphoriaPass.name} - ${euphoriaPass.subtitle}).`);

  // 4. Seed Sponsors
  console.log("🤝 Seeding Sponsors...");
  for (const sponsor of sponsors) {
    await prisma.sponsor.upsert({
      where: { id: sponsor.id },
      update: {
        name: sponsor.name,
        logoUrl: sponsor.logoUrl,
        tier: sponsor.tier,
        isFeatured: sponsor.isFeatured,
        order: sponsor.order,
      },
      create: sponsor,
    });
  }
  console.log(`   ✓ ${sponsors.length} Sponsors seeded.`);

  // 5. Seed Events
  console.log("🎯 Seeding Events (41 events)...");
  let eventCount = 0;
  for (const ev of rawEvents) {
    await prisma.event.upsert({
      where: { id: ev.id },
      update: {
        slug: ev.id,
        name: ev.name,
        description: ev.description,
        posterUrl: ev.poster,
        categoryId: ev.category,
        fee: ev.fee,
        registrationType:
          ev.registrationType === "group"
            ? RegistrationType.GROUP
            : RegistrationType.INDIVIDUAL,
        minTeamSize: ev.minTeamSize,
        maxTeamSize: ev.maxTeamSize,
        // NOTE: registrationOpen intentionally omitted from update to preserve live status on re-seed
        status: ev.status || EventStatus.PUBLISHED,
        capacity: ev.capacity ?? null,
        date: ev.date,
        day: ev.day,
        time: ev.time,
        venue: ev.venue,
        prizes: ev.prizes,
        rules: ev.rules,
        facultyCoordinator: ev.facultyCoordinator || null,
        studentCoordinator: ev.studentCoordinator || null,
        eventFamily: ev.eventFamily || null,
        stage: ev.stage || null,
      },
      create: {
        id: ev.id,
        slug: ev.id,
        name: ev.name,
        description: ev.description,
        posterUrl: ev.poster,
        categoryId: ev.category,
        fee: ev.fee,
        registrationType:
          ev.registrationType === "group"
            ? RegistrationType.GROUP
            : RegistrationType.INDIVIDUAL,
        minTeamSize: ev.minTeamSize,
        maxTeamSize: ev.maxTeamSize,
        registrationOpen: ev.registrationOpen,
        capacity: ev.capacity ?? null,
        status: ev.status || EventStatus.PUBLISHED,
        date: ev.date,
        day: ev.day,
        time: ev.time,
        venue: ev.venue,
        prizes: ev.prizes,
        rules: ev.rules,
        facultyCoordinator: ev.facultyCoordinator || null,
        studentCoordinator: ev.studentCoordinator || null,
        eventFamily: ev.eventFamily || null,
        stage: ev.stage || null,
      },
    });
    eventCount++;
  }
  console.log(`   ✓ ${eventCount} Events seeded.`);

  // 6. Seed Schedules (Events with confirmed venue and time)
  console.log("📅 Seeding Event Schedules...");
  let scheduleCount = 0;
  for (const ev of rawEvents) {
    if (ev.date !== "TBA" && ev.venue !== "TBA") {
      const schedId = `sched-${ev.id}`;
      await prisma.schedule.upsert({
        where: { id: schedId },
        update: {
          eventId: ev.id,
          title: ev.name,
          day: `${ev.day} (${ev.date})`,
          timeString: ev.time,
          venue: ev.venue,
        },
        create: {
          id: schedId,
          eventId: ev.id,
          title: ev.name,
          day: `${ev.day} (${ev.date})`,
          timeString: ev.time,
          venue: ev.venue,
        },
      });
      scheduleCount++;
    }
  }
  console.log(`   ✓ ${scheduleCount} Schedules seeded.`);

  // 7. Verify and Print Summary
  console.log("\n📊 Verification Summary from Database:");
  const dbUserCount = await prisma.user.count();
  const dbCatCount = await prisma.category.count();
  const dbEventCount = await prisma.event.count();
  const dbPassCount = await prisma.pass.count();
  const dbSponsorCount = await prisma.sponsor.count();
  const dbSchedCount = await prisma.schedule.count();

  console.log(`   • Users:      ${dbUserCount}`);
  console.log(`   • Categories: ${dbCatCount}`);
  console.log(`   • Events:     ${dbEventCount}`);
  console.log(`   • Passes:     ${dbPassCount}`);
  console.log(`   • Sponsors:   ${dbSponsorCount}`);
  console.log(`   • Schedules:  ${dbSchedCount}`);
  console.log("\n✨ Euphoria Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("\n❌ Seeding failed with error:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
