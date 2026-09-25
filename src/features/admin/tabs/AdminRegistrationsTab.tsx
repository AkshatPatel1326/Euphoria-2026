import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import type {
  AdminRegistration,
  PaginationMeta,
  RegistrationStatus,
  PaymentStatus,
  Category,
  AdminEvent,
  AdminOverviewStats,
} from "@/types/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RegistrationDetailModal } from "../components/RegistrationDetailModal";
import { AdminConfirmDialog } from "../components/AdminConfirmDialog";
import { toast } from "sonner";
import {
  Search,
  Download,
  FilterX,
  Loader2,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Building2,
  X,
} from "lucide-react";

interface AdminRegistrationsTabProps {
  isAdmin: boolean;
  categories: Category[];
  events: AdminEvent[];
  selectedRegForDetail?: AdminRegistration | null;
  onClearSelectedReg?: () => void;
  onDataChanged?: () => void;
  overviewStats?: AdminOverviewStats | null;
}

interface RegistrationsResponse {
  status: string;
  data: {
    registrations: AdminRegistration[];
    pagination: PaginationMeta;
  };
}

interface ExportResponse {
  status: string;
  count: number;
  data: {
    registrations: AdminRegistration[];
  };
}

export function AdminRegistrationsTab({
  isAdmin,
  categories,
  events,
  selectedRegForDetail,
  onClearSelectedReg,
  onDataChanged,
  overviewStats,
}: AdminRegistrationsTabProps) {
  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Debounce search input smoothly across keystrokes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Data & Loading State
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Detail Modal & Action Dialog State
  const [activeReg, setActiveReg] = useState<AdminRegistration | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Confirm Dialog State
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "default" | "destructive";
    isLoading: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    variant: "default",
    isLoading: false,
    onConfirm: () => {},
  });

  // Watch external selection from Overview tab
  useEffect(() => {
    if (selectedRegForDetail) {
      setActiveReg(selectedRegForDetail);
      setIsDetailOpen(true);
    }
  }, [selectedRegForDetail]);

  // Fetch registrations
  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedEventId !== "all") params.append("eventId", selectedEventId);
      if (selectedCategoryId !== "all") params.append("categoryId", selectedCategoryId);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedPaymentStatus !== "all") params.append("paymentStatus", selectedPaymentStatus);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await apiGet<RegistrationsResponse>(`/admin/registrations?${params.toString()}`);
      setRegistrations(res.data.registrations);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error(err.message || "Failed to load registrations");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedEventId, selectedCategoryId, selectedStatus, selectedPaymentStatus, page]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Handle status update
  const handleUpdateStatus = async (registrationId: string, newStatus: RegistrationStatus) => {
    try {
      await apiPatch(`/registrations/${registrationId}/status`, { status: newStatus });
      toast.success(`Registration marked as ${newStatus.toLowerCase()}`);
      fetchRegistrations();
      onDataChanged?.();

      // If active modal is open for this reg, update it
      if (activeReg?.id === registrationId) {
        setActiveReg((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update registration status");
    }
  };

  // Handle delete registration (guarded, Admin only)
  const handleDeleteRegistration = (reg: AdminRegistration) => {
    if (!isAdmin) return;

    setConfirmAction({
      open: true,
      title: "Permanently Delete Registration?",
      description: `Are you sure you want to permanently delete registration ${reg.registrationNumber} for ${reg.fullName}? This action cannot be undone.`,
      confirmLabel: "Delete Record",
      variant: "destructive",
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmAction((prev) => ({ ...prev, isLoading: true }));
          await apiDelete(`/admin/registrations/${reg.id}`);
          toast.success(`Registration ${reg.registrationNumber} deleted.`);
          setConfirmAction((prev) => ({ ...prev, open: false, isLoading: false }));
          setIsDetailOpen(false);
          fetchRegistrations();
          onDataChanged?.();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete registration");
          setConfirmAction((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // CSV Export: Exports FULL currently filtered dataset
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedEventId !== "all") params.append("eventId", selectedEventId);
      if (selectedCategoryId !== "all") params.append("categoryId", selectedCategoryId);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedPaymentStatus !== "all") params.append("paymentStatus", selectedPaymentStatus);

      const res = await apiGet<ExportResponse>(`/admin/registrations/export?${params.toString()}`);
      const data = res.data.registrations;

      if (!data || data.length === 0) {
        toast.info("No registrations match current filters to export.");
        return;
      }

      // Build CSV
      const headers = [
        "Registration Number",
        "Full Name",
        "Email",
        "Phone",
        "Category",
        "Scholar No",
        "Enrollment No",
        "College",
        "Institute",
        "Course",
        "Year",
        "Semester",
        "City",
        "Event Name",
        "Event Category",
        "Registration Type",
        "Team Name",
        "Team Members",
        "Registration Status",
        "Payment Status",
        "Amount (INR)",
        "Transaction ID",
        "Gateway Ref",
        "Registered At",
      ];

      const escapeCSV = (val: unknown) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = data.map((r) => {
        const teamMembers = r.team?.members.map((m) => `${m.fullName} (${m.email})`).join("; ") || "";
        return [
          escapeCSV(r.registrationNumber),
          escapeCSV(r.fullName),
          escapeCSV(r.email),
          escapeCSV(r.phone),
          escapeCSV(r.participantCategory),
          escapeCSV(r.scholarNumber || ""),
          escapeCSV(r.enrollmentNumber || ""),
          escapeCSV(r.collegeName || ""),
          escapeCSV(r.institute || ""),
          escapeCSV(r.course || ""),
          escapeCSV(r.year || ""),
          escapeCSV(r.semester || ""),
          escapeCSV(r.city || ""),
          escapeCSV(r.event?.name || ""),
          escapeCSV(r.event?.category?.name || ""),
          escapeCSV(r.event?.registrationType || ""),
          escapeCSV(r.team?.name || ""),
          escapeCSV(teamMembers),
          escapeCSV(r.status),
          escapeCSV(r.payment?.status || "UNPAID"),
          escapeCSV(r.payment?.amount ?? r.event?.fee ?? 0),
          escapeCSV(r.payment?.transactionId || ""),
          escapeCSV(r.payment?.gatewayReference || ""),
          escapeCSV(new Date(r.createdAt).toISOString()),
        ].join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `euphoria_registrations_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.length} registrations to CSV`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export registrations");
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedEventId("all");
    setSelectedCategoryId("all");
    setSelectedStatus("all");
    setSelectedPaymentStatus("all");
    setPage(1);
  };

  const activeFilterCount =
    (search.trim() !== "" ? 1 : 0) +
    (selectedEventId !== "all" ? 1 : 0) +
    (selectedCategoryId !== "all" ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0) +
    (selectedPaymentStatus !== "all" ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  // Calculate summary metrics safely from real existing data
  const totalRegistrationsCount = overviewStats?.totalRegistrations ?? pagination.total;
  const confirmedCount =
    overviewStats?.registrationsByStatus?.confirmed ??
    registrations.filter((r) => r.status === "CONFIRMED").length;
  const pendingCount =
    overviewStats?.registrationsByStatus?.pending ??
    registrations.filter((r) => r.status === "PENDING").length;
  const failedOrCancelledCount = overviewStats
    ? (overviewStats.registrationsByStatus?.cancelled ?? 0) +
      (overviewStats.registrationsByStatus?.rejected ?? 0)
    : registrations.filter((r) => r.status === "CANCELLED" || r.status === "REJECTED").length;

  const renderStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            CONFIRMED
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            PENDING
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            CANCELLED
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/10 text-white/70 border border-white/20">
            {status}
          </span>
        );
    }
  };

  const renderPaymentBadge = (status?: PaymentStatus, amount?: number) => {
    if (status === "SUCCESS") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Paid {amount !== undefined && amount > 0 ? `(₹${amount})` : amount === 0 ? "(Free)" : ""}
        </span>
      );
    }
    if (status === "FAILED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          Failed {amount !== undefined ? `(₹${amount})` : ""}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        Pending {amount !== undefined && amount > 0 ? `(₹${amount})` : ""}
      </span>
    );
  };

  const renderCategoryBadge = (cat?: string) => {
    if (cat === "SAGE") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25">
          SAGE
        </span>
      );
    }
    if (cat === "OTHER_COLLEGE") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25">
          External
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white/70 border border-white/20">
        General
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              EVENT REGISTRATIONS
            </h2>
            <Badge className="bg-euphoria-purple/20 text-pink-300 border border-euphoria-purple/35 text-[11px] font-semibold">
              Live Management
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-white/60">
            Participant, team, and category registrations for all SAGE Euphoria 2026 events.
          </p>
        </div>

        {/* Quick Export action */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting || pagination.total === 0}
            className="gap-1.5 text-xs border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]"
          >
            {isExporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Export CSV ({pagination.total})
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Real Existing Values Only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Registrations */}
        <Card className="rounded-2xl border border-white/[0.1] bg-[#16112c] p-4 shadow-lg shadow-black/25">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Total Registrations</p>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {totalRegistrationsCount.toLocaleString()}
            </span>
          </div>
        </Card>

        {/* Confirmed */}
        <Card className="rounded-2xl border border-white/[0.1] bg-[#16112c] p-4 shadow-lg shadow-black/25">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Confirmed</p>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              {confirmedCount.toLocaleString()}
            </span>
          </div>
        </Card>

        {/* Pending */}
        <Card className="rounded-2xl border border-white/[0.1] bg-[#16112c] p-4 shadow-lg shadow-black/25">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Pending</p>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">
              {pendingCount.toLocaleString()}
            </span>
          </div>
        </Card>

        {/* Failed / Cancelled */}
        <Card className="rounded-2xl border border-white/[0.1] bg-[#16112c] p-4 shadow-lg shadow-black/25">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Failed / Cancelled</p>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <XCircle className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-rose-400 tracking-tight">
              {failedOrCancelledCount.toLocaleString()}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.1] bg-[#16112c] p-4 shadow-lg shadow-black/25">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-white/40 pointer-events-none" />
            <Input
              placeholder="Search registrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 text-sm bg-white/[0.03] border-white/[0.1] text-white placeholder:text-white/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-white/40 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Export & Clear Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 text-xs text-white/70 hover:text-white hover:bg-white/[0.06]"
              >
                <FilterX className="size-3.5" />
                Clear Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isExporting || pagination.total === 0}
              className="gap-1.5 text-xs border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]"
            >
              {isExporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Export CSV ({pagination.total})
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Category Filter */}
          <Select
            value={selectedCategoryId}
            onValueChange={(val) => {
              setSelectedCategoryId(val);
              // If an event is selected that doesn't belong to newly selected category, reset it to "all"
              if (val !== "all") {
                const isValid = events.some((ev) => ev.id === selectedEventId && ev.categoryId === val);
                if (!isValid) {
                  setSelectedEventId("all");
                }
              }
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white/[0.03] border-white/[0.1] text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-[#16112c] border-white/[0.1] text-white">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Event Filter — Reacts dynamically to chosen category */}
          <Select
            value={selectedEventId}
            onValueChange={(val) => {
              setSelectedEventId(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs truncate bg-white/[0.03] border-white/[0.1] text-white">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent className="bg-[#16112c] border-white/[0.1] text-white">
              <SelectItem value="all">
                {selectedCategoryId === "all" ? "All Events" : "All Category Events"}
              </SelectItem>
              {events
                .filter((ev) => selectedCategoryId === "all" || ev.categoryId === selectedCategoryId)
                .map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={selectedStatus}
            onValueChange={(val) => {
              setSelectedStatus(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white/[0.03] border-white/[0.1] text-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-[#16112c] border-white/[0.1] text-white">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select
            value={selectedPaymentStatus}
            onValueChange={(val) => {
              setSelectedPaymentStatus(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white/[0.03] border-white/[0.1] text-white">
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent className="bg-[#16112c] border-white/[0.1] text-white">
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="SUCCESS">Paid (Success)</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Registrations List & Table */}
      <div className="rounded-2xl border border-white/[0.1] bg-[#16112c] overflow-hidden shadow-lg shadow-black/25">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-7 animate-spin text-euphoria-purple" />
            <p className="text-xs text-white/60">Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <Calendar className="size-10 mx-auto text-white/30" />
            <h3 className="text-sm font-semibold text-white">
              {hasActiveFilters ? "No registrations match your current filters" : "No registrations found"}
            </h3>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try adjusting your search query or clearing one or more filters above."
                : "No attendee registrations have been created yet."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-2 text-xs border-white/[0.15] bg-white/[0.06] text-white hover:bg-white/[0.12]"
              >
                <FilterX className="size-3.5 mr-1.5" />
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: Responsive Cards (360px - 768px) */}
            <div className="block md:hidden divide-y divide-white/[0.07]">
              {registrations.map((reg) => (
                <div key={reg.id} className="p-4 space-y-3 hover:bg-white/[0.02] transition-colors">
                  {/* Top Bar: Reg ID & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                      {reg.registrationNumber}
                    </span>
                    <div>{renderStatusBadge(reg.status)}</div>
                  </div>

                  {/* Participant & Team */}
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-white">{reg.fullName}</span>
                      {reg.team ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Users className="size-2.5" /> Team Leader
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-white/60 border border-white/10">
                          Solo
                        </span>
                      )}
                    </div>

                    {reg.team && (
                      <p className="text-xs text-amber-400/90 mt-0.5 flex items-center gap-1">
                        Team: <span className="font-medium text-white">{reg.team.name}</span>
                        <span className="text-white/40">
                          ({reg.team.members ? reg.team.members.length + 1 : 1} members)
                        </span>
                      </p>
                    )}

                    <p className="text-[11px] text-white/50 mt-0.5">
                      {reg.email} • {reg.phone}
                    </p>
                  </div>

                  {/* Event & College info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-white/40 block">Event</span>
                      <p className="font-medium text-white truncate">{reg.event.name}</p>
                      <p className="text-[11px] text-white/60 truncate">{reg.event.category?.name || "General"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-white/40 block">College</span>
                      <p className="font-medium text-white truncate">{reg.collegeName || "SAGE University"}</p>
                      <div className="mt-0.5">{renderCategoryBadge(reg.participantCategory)}</div>
                    </div>
                  </div>

                  {/* Footer Row: Payment, Date & Actions */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="space-y-0.5">
                      <div>{renderPaymentBadge(reg.payment?.status, reg.payment?.amount ?? reg.event.fee)}</div>
                      {(reg.event.id === "cultural-12" ||
                        reg.event.name?.toLowerCase().includes("standup comedy") ||
                        reg.event.name?.toLowerCase().includes("pankaj")) && (
                        <div className="mt-0.5">
                          {(reg as any).appliedPassId || reg.payment?.amount === 49 ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                              Pass Discount (₹49)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white/5 text-white/50 border border-white/10">
                              Regular (₹199)
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] text-white/40">
                        {new Date(reg.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveReg(reg);
                          setIsDetailOpen(true);
                        }}
                        className="h-8 text-xs border-white/[0.15] bg-white/[0.06] text-white hover:bg-white/[0.12] gap-1 px-3"
                      >
                        <Eye className="size-3.5" /> Details
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="size-8 text-white/70 hover:text-white">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs bg-[#16112c] border-white/[0.1] text-white">
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveReg(reg);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="size-3.5 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/[0.08]" />
                          {reg.status !== "CONFIRMED" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(reg.id, "CONFIRMED")}
                              className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-950/40"
                            >
                              <CheckCircle className="size-3.5 mr-2" /> Mark Confirmed
                            </DropdownMenuItem>
                          )}
                          {reg.status !== "CANCELLED" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(reg.id, "CANCELLED")}
                              className="text-amber-400 focus:text-amber-300 focus:bg-amber-950/40"
                            >
                              <XCircle className="size-3.5 mr-2" /> Mark Cancelled
                            </DropdownMenuItem>
                          )}
                          {reg.status !== "REJECTED" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(reg.id, "REJECTED")}
                              className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40"
                            >
                              <Ban className="size-3.5 mr-2" /> Mark Rejected
                            </DropdownMenuItem>
                          )}

                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator className="bg-white/[0.08]" />
                              <DropdownMenuItem
                                onClick={() => handleDeleteRegistration(reg)}
                                className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40"
                                disabled={
                                  reg.status === "CONFIRMED" ||
                                  reg.payment?.status === "SUCCESS"
                                }
                              >
                                <Trash2 className="size-3.5 mr-2" /> Delete Record
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW: Efficient Dense Table (md and above) */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/[0.04] hover:bg-white/[0.04] border-b border-white/[0.08] text-xs">
                    <TableHead className="font-semibold text-white/80">Registration ID</TableHead>
                    <TableHead className="font-semibold text-white/80">Participant / Team Leader</TableHead>
                    <TableHead className="font-semibold text-white/80">Event</TableHead>
                    <TableHead className="font-semibold text-white/80">College / Type</TableHead>
                    <TableHead className="font-semibold text-white/80">Status</TableHead>
                    <TableHead className="font-semibold text-white/80">Payment</TableHead>
                    <TableHead className="font-semibold text-white/80">Date</TableHead>
                    <TableHead className="font-semibold text-white/80 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow
                      key={reg.id}
                      className="text-xs hover:bg-white/[0.04] border-b border-white/[0.05] transition-colors"
                    >
                      {/* Registration ID */}
                      <TableCell className="font-mono font-semibold text-pink-300 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReg(reg);
                            setIsDetailOpen(true);
                          }}
                          className="hover:underline text-left cursor-pointer focus:outline-none"
                          title="Click to view details"
                        >
                          {reg.registrationNumber}
                        </button>
                      </TableCell>

                      {/* Participant / Team Leader */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-medium text-white">{reg.fullName}</p>
                            {reg.team ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Users className="size-2.5" /> Leader
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-normal bg-white/5 text-white/50 border border-white/10">
                                Solo
                              </span>
                            )}
                          </div>
                          {reg.team ? (
                            <p className="text-[11px] text-amber-400/90 font-normal">
                              Team: {reg.team.name}{" "}
                              <span className="text-white/40">
                                ({reg.team.members ? reg.team.members.length + 1 : 1} members)
                              </span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-white/50">
                              {reg.email} • {reg.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Event */}
                      <TableCell>
                        <div className="space-y-0.5 max-w-[180px]">
                          <p className="font-medium text-white truncate">{reg.event.name}</p>
                          <p className="text-[11px] text-white/60 truncate">
                            {reg.event.category?.name || "General"}
                          </p>
                        </div>
                      </TableCell>

                      {/* College / College Type */}
                      <TableCell>
                        <div className="space-y-1 max-w-[160px]">
                          <p className="font-medium text-white/90 truncate">
                            {reg.collegeName || "SAGE University"}
                          </p>
                          <div>{renderCategoryBadge(reg.participantCategory)}</div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="whitespace-nowrap">
                        {renderStatusBadge(reg.status)}
                      </TableCell>

                      {/* Payment */}
                      <TableCell className="whitespace-nowrap">
                        <div className="space-y-1">
                          {renderPaymentBadge(reg.payment?.status, reg.payment?.amount ?? reg.event.fee)}
                          {(reg.event.id === "cultural-12" ||
                            reg.event.name?.toLowerCase().includes("standup comedy") ||
                            reg.event.name?.toLowerCase().includes("pankaj")) && (
                            <div>
                              {(reg as any).appliedPassId || reg.payment?.amount === 49 ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                  Festival Pass Discount (₹49)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-white/50 border border-white/10">
                                  Regular Price (₹199)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-white/60 whitespace-nowrap">
                        {new Date(reg.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-white/70 hover:text-white"
                            title="View Full Details"
                            onClick={() => {
                              setActiveReg(reg);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="size-3.5" />
                          </Button>

                          {/* Status Change dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-7 text-white/70 hover:text-white">
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs bg-[#16112c] border-white/[0.1] text-white">
                              <DropdownMenuItem
                                onClick={() => {
                                  setActiveReg(reg);
                                  setIsDetailOpen(true);
                                }}
                              >
                                <Eye className="size-3.5 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/[0.08]" />
                              {reg.status !== "CONFIRMED" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(reg.id, "CONFIRMED")}
                                  className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-950/40"
                                >
                                  <CheckCircle className="size-3.5 mr-2" /> Mark Confirmed
                                </DropdownMenuItem>
                              )}
                              {reg.status !== "CANCELLED" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(reg.id, "CANCELLED")}
                                  className="text-amber-400 focus:text-amber-300 focus:bg-amber-950/40"
                                >
                                  <XCircle className="size-3.5 mr-2" /> Mark Cancelled
                                </DropdownMenuItem>
                              )}
                              {reg.status !== "REJECTED" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(reg.id, "REJECTED")}
                                  className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40"
                                >
                                  <Ban className="size-3.5 mr-2" /> Mark Rejected
                                </DropdownMenuItem>
                              )}

                              {/* Delete — Admin only */}
                              {isAdmin && (
                                <>
                                  <DropdownMenuSeparator className="bg-white/[0.08]" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteRegistration(reg)}
                                    className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40"
                                    disabled={
                                      reg.status === "CONFIRMED" ||
                                      reg.payment?.status === "SUCCESS"
                                    }
                                  >
                                    <Trash2 className="size-3.5 mr-2" /> Delete Record
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/[0.08] px-4 py-3 gap-2 text-xs text-white/60">
            <div>
              {hasActiveFilters ? (
                <>
                  Showing <span className="font-medium text-white">{registrations.length}</span> of{" "}
                  <span className="font-medium text-white">{pagination.total}</span> filtered registrations
                  {pagination.totalPages > 1 && (
                    <> (Page {pagination.page} of {pagination.totalPages})</>
                  )}
                </>
              ) : (
                <>
                  Showing <span className="font-medium text-white">{registrations.length}</span> of{" "}
                  <span className="font-medium text-white">{pagination.total}</span> total registrations
                  {pagination.totalPages > 1 && (
                    <> (Page {pagination.page} of {pagination.totalPages})</>
                  )}
                </>
              )}
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2.5 text-xs border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                >
                  <ChevronLeft className="size-3.5 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-2.5 text-xs border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                >
                  Next <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <RegistrationDetailModal
        registration={activeReg}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) onClearSelectedReg?.();
        }}
        isAdmin={isAdmin}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteRegistration}
      />

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        open={confirmAction.open}
        onOpenChange={(open) => setConfirmAction((prev) => ({ ...prev, open }))}
        title={confirmAction.title}
        description={confirmAction.description}
        confirmLabel={confirmAction.confirmLabel}
        variant={confirmAction.variant}
        isLoading={confirmAction.isLoading}
        onConfirm={confirmAction.onConfirm}
      />
    </div>
  );
}
