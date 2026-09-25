export type Role = "ADMIN" | "ORGANIZER" | "PARTICIPANT";

export type RegistrationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "REJECTED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export type PaymentMethod = "UPI" | "CARD" | "NETBANKING" | "OTHER";

export type ParticipantCategory = "SAGE" | "OTHER_COLLEGE" | "GENERAL";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface EventSchedule {
  id: string;
  day?: string | null;
  venue?: string | null;
  timeString?: string | null;
}

export interface CoordinatorItem {
  name: string;
  phone: string;
}

export interface AdminEvent {
  id: string;
  name: string;
  slug?: string | null;
  description?: string;
  posterUrl?: string | null;
  categoryId: string;
  category?: Category | null;
  registrationType: "INDIVIDUAL" | "GROUP";
  minTeamSize: number;
  maxTeamSize: number;
  fee: number;
  date?: string | null;
  day?: string | null;
  time?: string | null;
  venue?: string | null;
  prizes?: string | null;
  rules?: string | null;
  facultyCoordinator?: string | null;
  studentCoordinator?: string | null;
  facultyCoordinators?: CoordinatorItem[];
  studentCoordinators?: CoordinatorItem[];
  eventFamily?: string | null;
  stage?: string | null;
  variant?: string | null;
  status: string;
  organizerId?: string | null;
  registrationOpen: boolean;
  capacity?: number | null;
  activeRegistrationsCount?: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  fullName: string;
  email: string;
  phone: string;
  scholarNumber?: string | null;
  collegeName?: string | null;
}

export interface AdminTeam {
  id: string;
  name: string;
  leaderId?: string | null;
  leaderName?: string | null;
  leaderEmail?: string | null;
  leaderPhone?: string | null;
  members: TeamMember[];
}

export interface AdminPayment {
  id: string;
  amount: number;
  currency: string;
  method?: PaymentMethod | null;
  status: PaymentStatus;
  transactionId?: string | null;
  gatewayReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface AdminRegistration {
  id: string;
  registrationNumber: string;
  userId?: string | null;
  eventId: string;
  event: AdminEvent;
  teamId?: string | null;
  team?: AdminTeam | null;
  participantCategory: ParticipantCategory;
  status: RegistrationStatus;
  fullName: string;
  email: string;
  phone: string;
  scholarNumber?: string | null;
  enrollmentNumber?: string | null;
  collegeName?: string | null;
  institute?: string | null;
  course?: string | null;
  year?: string | null;
  semester?: string | null;
  city?: string | null;
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  payment?: AdminPayment | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPass {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  tagline?: string | null;
  price?: number | null;
  status: string;
  features: string[];
}

export interface AdminPassHolder {
  id: string;
  passPurchaseId: string;
  holderIndex: number;
  fullName: string;
  email: string;
  phone: string;
  createdAt?: string;
}

export interface AdminPassPurchase {
  id: string;
  passNumber: string;
  passId: string;
  pass: AdminPass;
  userId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  participantCategory: ParticipantCategory;
  collegeName?: string | null;
  institute?: string | null;
  year?: string | null;
  semester?: string | null;
  quantity: number;
  holders?: AdminPassHolder[];
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  status: RegistrationStatus;
  payment?: AdminPayment | null;
  createdAt: string;
  updatedAt: string;
}

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
  recentRegistrations: AdminRegistration[];
  recentPassPurchases: AdminPassPurchase[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  authorId?: string | null;
  author?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

