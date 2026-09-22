import type { Request } from "express";
import type {
  Role,
  ParticipantCategory,
  RegistrationType,
  RegistrationStatus,
  PaymentStatus,
  PaymentMethod,
  Category,
  Event,
  Schedule,
  Pass,
  PassPurchase,
  PassHolder,
  Sponsor,
  Registration,
  Team,
  TeamMember,
  Payment,
} from "../../generated/prisma/client";

export interface ApiResponse<T = unknown> {
  status: "success" | "ok" | "error" | "fail";
  message?: string;
  data?: T;
  timestamp?: string;
}

export interface HealthCheckResponse {
  status: "ok";
  message: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface JwtUserPayload {
  id: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  participantCategory?: ParticipantCategory;
  scholarNumber?: string;
  enrollmentNumber?: string;
  collegeName?: string;
  course?: string;
  year?: string;
  city?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  participantCategory: ParticipantCategory | null;
  scholarNumber: string | null;
  enrollmentNumber: string | null;
  collegeName: string | null;
  course: string | null;
  year: string | null;
  city: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseData {
  user: SafeUser;
  token: string;
}

// ─────────────────────────────────────────────────────────────
// CATALOG & EVENT DISCOVERY TYPES
// ─────────────────────────────────────────────────────────────

export interface EventFilterQuery {
  category?: string;
  registrationType?: RegistrationType | string;
  registrationOpen?: boolean | string;
  search?: string;
}

export interface CategoryWithCount extends Category {
  _count?: {
    events: number;
  };
  events?: Event[];
}

export interface EventDetail extends Event {
  category: Category;
  schedules?: Schedule[];
}

export interface ScheduleWithEvent extends Schedule {
  event?: {
    id: string;
    slug: string | null;
    name: string;
    categoryId: string;
    venue: string | null;
    time: string | null;
  } | null;
}

// ─────────────────────────────────────────────────────────────
// REGISTRATION & PAYMENT TYPES
// ─────────────────────────────────────────────────────────────

export interface CreateTeamMemberInput {
  fullName: string;
  email: string;
  phone: string;
  scholarNumber?: string;
  collegeName?: string;
}

export interface CreateRegistrationInput {
  eventId: string;
  participantCategory: ParticipantCategory | string;
  // Personal details - supports flat or nested structure matching frontend
  personalDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
  fullName?: string;
  email?: string;
  phone?: string;
  scholarNumber?: string;
  enrollmentNumber?: string;
  collegeName?: string;
  course?: string;
  institute?: string;
  year?: string;
  semester?: string;
  city?: string;
  // Team details for group events
  teamName?: string;
  teamMembers?: CreateTeamMemberInput[];
  // Initial payment method if provided
  paymentMethod?: PaymentMethod | string;
  // Verification token for guest registrations
  verificationToken?: string;
  // Festival Pass ID for Standup Comedy discount
  festivalPassId?: string;
}

export interface PaymentSimulationInput {
  method?: PaymentMethod | string;
  simulateStatus?: "SUCCESS" | "FAILED";
  paymentToken?: string;
}

export interface InitiatePaymentInput {
  registrationId?: string;
  passPurchaseId?: string;
  paymentToken?: string;
  paymentMethod?: PaymentMethod | string;
}

export interface InitiatePaymentResult {
  mode: "EASEBUZZ" | "SIMULATION";
  accessKey?: string;
  paymentUrl?: string;
  txnid: string;
  amount: number;
  registrationStatus?: string;
  passPurchaseStatus?: string;
  payment?: { id: string; status: string };
  // If simulation mode
  simulationResult?: unknown;
}

export interface UpdateRegistrationStatusInput {
  status: RegistrationStatus;
}

export interface UpdateEventRegistrationStatusInput {
  registrationOpen: boolean;
}

export interface RegistrationDetail extends Registration {
  event: Event & { category?: Category };
  team?: (Team & { members: TeamMember[] }) | null;
  payment?: Payment | null;
}

export interface PassRecipientInput {
  fullName: string;
  email: string;
  phone: string;
}

export interface CreatePassPurchaseInput {
  passId: string;
  quantity?: number;
  fullName: string;
  email: string;
  phone: string;
  participantCategory: ParticipantCategory | string;
  collegeName?: string;
  institute?: string;
  year?: string;
  semester?: string;
  verificationToken?: string;
  paymentMethod?: PaymentMethod | string;
  recipients?: PassRecipientInput[];
}

export interface PassPurchaseDetail extends PassPurchase {
  pass: Pass;
  payment?: Payment | null;
  holders?: PassHolder[];
}

// ─────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT PORTAL TYPES
// ─────────────────────────────────────────────────────────────

export interface AdminOverviewStats {
  totalRegistrations: number;
  registrationsByStatus: {
    confirmed: number;
    pending: number;
    cancelled: number;
    rejected: number;
  };
  totalPassPurchases: number;
  passesByStatus: {
    confirmed: number;
    pending: number;
    cancelled: number;
    rejected: number;
  };
  totalRevenue: number;
  registrationsByCategory: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  recentRegistrations: RegistrationDetail[];
  recentPassPurchases: PassPurchaseDetail[];
}

export interface AdminRegistrationQuery {
  search?: string;
  eventId?: string;
  categoryId?: string;
  status?: RegistrationStatus;
  paymentStatus?: PaymentStatus;
  participantCategory?: ParticipantCategory;
  page?: number;
  limit?: number;
}

export interface AdminPassPurchaseQuery {
  search?: string;
  passId?: string;
  status?: RegistrationStatus;
  paymentStatus?: PaymentStatus;
  participantCategory?: ParticipantCategory;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

