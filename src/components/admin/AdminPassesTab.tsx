import { useState, useEffect, useCallback, useMemo } from "react";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import type {
  AdminPassPurchase,
  AdminPass,
  PaginationMeta,
  RegistrationStatus,
  PaymentStatus,
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
import { PassPurchaseDetailModal } from "./PassPurchaseDetailModal";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
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
  Ticket,
  IndianRupee,
  User,
  Mail,
  Phone,
  Calendar,
  X,
} from "lucide-react";

interface AdminPassesTabProps {
  isAdmin: boolean;
  passes: AdminPass[];
  selectedPassForDetail?: AdminPassPurchase | null;
  onClearSelectedPass?: () => void;
  onDataChanged?: () => void;
  overviewStats?: AdminOverviewStats | null;
}

interface PassPurchasesResponse {
  status: string;
  data: {
    passPurchases: AdminPassPurchase[];
    pagination: PaginationMeta;
  };
}

interface ExportPassResponse {
  status: string;
  count: number;
  data: {
    passPurchases: AdminPassPurchase[];
  };
}

export function AdminPassesTab({
  isAdmin,
  passes,
  selectedPassForDetail,
  onClearSelectedPass,
  onDataChanged,
  overviewStats,
}: AdminPassesTabProps) {
  // If somehow accessed by non-admin, don't render content
  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-sm text-white/60">
        Access Denied: Pass Orders management is reserved for festival administrators.
      </div>
    );
  }

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPassId, setSelectedPassId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");
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
  const [purchases, setPurchases] = useState<AdminPassPurchase[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Summary Metrics from real data
  const totalOrdersCount = overviewStats?.totalPassPurchases ?? pagination.total;
  const totalPassesUnits = purchases.reduce((acc, p) => acc + (p.quantity || 1), 0);
  const confirmedOrdersCount =
    overviewStats?.passesByStatus.confirmed ??
    purchases.filter((p) => p.status === "CONFIRMED").length;
  const pendingOrdersCount =
    overviewStats?.passesByStatus.pending ??
    purchases.filter((p) => p.status === "PENDING").length;

  // Detail Modal & Action Dialog State
  const [activePurchase, setActivePurchase] = useState<AdminPassPurchase | null>(null);
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
    if (selectedPassForDetail) {
      setActivePurchase(selectedPassForDetail);
      setIsDetailOpen(true);
    }
  }, [selectedPassForDetail]);

  // Fetch pass purchases
  const fetchPassPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedPassId !== "all") params.append("passId", selectedPassId);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedPaymentStatus !== "all") params.append("paymentStatus", selectedPaymentStatus);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await apiGet<PassPurchasesResponse>(`/admin/pass-purchases?${params.toString()}`);
      setPurchases(res.data.passPurchases);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error(err.message || "Failed to load pass purchases");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedPassId, selectedStatus, selectedPaymentStatus, page]);

  useEffect(() => {
    fetchPassPurchases();
  }, [fetchPassPurchases]);

  // Handle status update
  const handleUpdateStatus = async (purchaseId: string, newStatus: RegistrationStatus) => {
    try {
      await apiPatch(`/admin/pass-purchases/${purchaseId}/status`, { status: newStatus });
      toast.success(`Pass purchase marked as ${newStatus.toLowerCase()}`);
      fetchPassPurchases();
      onDataChanged?.();

      if (activePurchase?.id === purchaseId) {
        setActivePurchase((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update pass purchase status");
    }
  };

  // Handle delete pass purchase (guarded, Admin only)
  const handleDeletePassPurchase = (purchase: AdminPassPurchase) => {
    setConfirmAction({
      open: true,
      title: "Permanently Delete Pass Purchase?",
      description: `Are you sure you want to permanently delete pass purchase ${purchase.passNumber} for ${purchase.fullName}? This action cannot be undone.`,
      confirmLabel: "Delete Record",
      variant: "destructive",
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmAction((prev) => ({ ...prev, isLoading: true }));
          await apiDelete(`/admin/pass-purchases/${purchase.id}`);
          toast.success(`Pass purchase ${purchase.passNumber} deleted.`);
          setConfirmAction((prev) => ({ ...prev, open: false, isLoading: false }));
          setIsDetailOpen(false);
          fetchPassPurchases();
          onDataChanged?.();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete pass purchase");
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
      if (selectedPassId !== "all") params.append("passId", selectedPassId);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedPaymentStatus !== "all") params.append("paymentStatus", selectedPaymentStatus);

      const res = await apiGet<ExportPassResponse>(`/admin/pass-purchases/export?${params.toString()}`);
      const data = res.data.passPurchases;

      if (!data || data.length === 0) {
        toast.info("No pass purchases match current filters to export.");
        return;
      }

      const headers = [
        "Pass Number",
        "Full Name",
        "Email",
        "Phone",
        "Category",
        "College",
        "Institute",
        "Year",
        "Semester",
        "Pass Name",
        "Quantity",
        "Status",
        "Payment Status",
        "Amount (INR)",
        "Transaction ID",
        "Purchased At",
      ];

      const escapeCSV = (val: unknown) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = data.map((p) => [
        escapeCSV(p.passNumber),
        escapeCSV(p.fullName),
        escapeCSV(p.email),
        escapeCSV(p.phone),
        escapeCSV(p.participantCategory),
        escapeCSV(p.collegeName || ""),
        escapeCSV(p.institute || ""),
        escapeCSV(p.year || ""),
        escapeCSV(p.semester || ""),
        escapeCSV(p.pass?.name || ""),
        escapeCSV(p.quantity),
        escapeCSV(p.status),
        escapeCSV(p.payment?.status || "UNPAID"),
        escapeCSV(p.payment?.amount ?? ((p.pass?.price || 0) * p.quantity)),
        escapeCSV(p.payment?.transactionId || ""),
        escapeCSV(new Date(p.createdAt).toISOString()),
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `euphoria_pass_purchases_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.length} festival pass purchases to CSV`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export pass purchases");
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedPassId("all");
    setSelectedStatus("all");
    setSelectedPaymentStatus("all");
    setSelectedDateFilter("all");
    setPage(1);
  };

  const activeFilterCount =
    (search.trim() !== "" ? 1 : 0) +
    (selectedPassId !== "all" ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0) +
    (selectedPaymentStatus !== "all" ? 1 : 0) +
    (selectedDateFilter !== "all" ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  // Date and client-side filtering for immediate response
  const filteredPurchases = useMemo(() => {
    if (selectedDateFilter === "all") return purchases;
    const now = new Date();
    return purchases.filter((p) => {
      const pDate = new Date(p.createdAt);
      if (selectedDateFilter === "today") {
        return pDate.toDateString() === now.toDateString();
      }
      if (selectedDateFilter === "7days") {
        return now.getTime() - pDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      }
      if (selectedDateFilter === "30days") {
        return now.getTime() - pDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [purchases, selectedDateFilter]);

  return (
    <div className="space-y-4">
      {/* Page Title & Context Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold tracking-tight text-white">Pass Orders</h2>
          <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 text-[11px] font-semibold">
            Orders & Payments
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-white/60">
          Festival pass purchase orders collected through the Euphoria website. Note: Physical and digital passes are issued separately through the college pass system.
        </p>
      </div>

      {/* Top Summary Cards (Real Existing Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Orders */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl p-4 shadow-lg shadow-black/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Total Orders</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Ticket className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-1.5">{totalOrdersCount}</div>
          <p className="text-[11px] text-white/50 mt-0.5">Orders recorded</p>
        </Card>

        {/* Total Passes */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl p-4 shadow-lg shadow-black/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Total Passes</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-euphoria-purple/15 text-pink-300 border border-euphoria-purple/30">
              <Ticket className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-1.5">{totalPassesUnits}</div>
          <p className="text-[11px] text-white/50 mt-0.5">Passes across loaded orders</p>
        </Card>

        {/* Confirmed */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl p-4 shadow-lg shadow-black/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Confirmed</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1.5">{confirmedOrdersCount}</div>
          <p className="text-[11px] text-white/50 mt-0.5">Confirmed payment</p>
        </Card>

        {/* Pending */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl p-4 shadow-lg shadow-black/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Pending</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1.5">{pendingOrdersCount}</div>
          <p className="text-[11px] text-white/50 mt-0.5">Awaiting verification</p>
        </Card>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.1] bg-[#16112c] p-4 shadow-lg shadow-black/25">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-white/40 pointer-events-none" />
            <Input
              placeholder="Search pass orders..."
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
              className="gap-1.5 text-xs bg-white/[0.04] border-white/[0.12] text-white/85 hover:bg-white/[0.08] hover:text-white"
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

        {/* Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Pass Type Filter */}
          <Select
            value={selectedPassId}
            onValueChange={(val) => {
              setSelectedPassId(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white/[0.03] border-white/[0.1] text-white">
              <SelectValue placeholder="All Passes" />
            </SelectTrigger>
            <SelectContent className="bg-[#16112c] border-white/[0.1] text-white">
              <SelectItem value="all">All Passes</SelectItem>
              {passes.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} {p.subtitle ? `(${p.subtitle})` : ""}
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

          {/* Date Filter */}
          <Select
            value={selectedDateFilter}
            onValueChange={(val) => {
              setSelectedDateFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white/[0.03] border-white/[0.1] text-white">
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="size-3 text-white/50 shrink-0" />
                <SelectValue placeholder="All Dates" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#16112c] border-white/[0.1] text-white">
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Content (Responsive Table & Cards) */}
      <div className="rounded-2xl border border-white/[0.1] bg-[#16112c] overflow-hidden shadow-lg shadow-black/25">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-7 animate-spin text-euphoria-purple" />
            <p className="text-xs text-white/60">Loading pass orders...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <Ticket className="size-10 mx-auto text-white/30" />
            <h3 className="text-sm font-semibold text-white">
              {hasActiveFilters ? "No pass orders match your current filters" : "No pass orders found"}
            </h3>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try adjusting your search query or clearing one or more filters above."
                : "No festival pass orders have been made yet."}
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
            {/* Mobile Cards View (< md) */}
            <div className="block md:hidden divide-y divide-white/[0.06]">
              {filteredPurchases.map((purchase) => {
                const orderAmount =
                  purchase.payment?.amount ??
                  (purchase.pass?.price || 0) * purchase.quantity;
                return (
                  <div key={purchase.id} className="p-4 space-y-3 hover:bg-white/[0.02] transition-colors">
                    {/* Header: Order ID & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-white bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
                        {purchase.passNumber}
                      </span>
                      <span className="text-[11px] text-white/50">
                        {new Date(purchase.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Buyer Information */}
                    <div>
                      <p className="font-semibold text-white text-sm">{purchase.fullName}</p>
                      <p className="text-xs text-white/60 mt-0.5">
                        {purchase.email} • {purchase.phone}
                      </p>
                      {purchase.collegeName && (
                        <p className="text-[11px] text-white/50 truncate mt-0.5">
                          {purchase.collegeName}
                        </p>
                      )}
                    </div>

                    {/* Order Details: Pass Type, Quantity & Amount */}
                    <div className="flex items-center justify-between text-xs bg-white/[0.025] border border-white/[0.05] p-2.5 rounded-xl">
                      <div>
                        <span className="font-medium text-white/90">{purchase.pass?.name}</span>
                        <p className="text-[11px] text-white/50">Quantity: {purchase.quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400 text-sm">₹{orderAmount}</span>
                      </div>
                    </div>

                    {/* Status Badges & Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={
                            purchase.status === "CONFIRMED"
                              ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/15 text-[10px] font-semibold"
                              : purchase.status === "PENDING"
                              ? "border-amber-500/30 text-amber-300 bg-amber-500/15 text-[10px] font-semibold"
                              : "border-rose-500/30 text-rose-300 bg-rose-500/15 text-[10px] font-semibold"
                          }
                        >
                          {purchase.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            purchase.payment?.status === "SUCCESS"
                              ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/15 text-[10px] font-semibold"
                              : "border-amber-500/30 text-amber-300 bg-amber-500/15 text-[10px] font-semibold"
                          }
                        >
                          {purchase.payment?.status === "SUCCESS" ? "Paid" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-euphoria-aqua hover:bg-euphoria-aqua/10 gap-1"
                          onClick={() => {
                            setActivePurchase(purchase);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="size-3.5" /> Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/[0.04] hover:bg-white/[0.04] border-b border-white/[0.08] text-xs">
                    <TableHead className="font-semibold text-white/80">Order ID</TableHead>
                    <TableHead className="font-semibold text-white/80">Buyer</TableHead>
                    <TableHead className="font-semibold text-white/80">Pass Type</TableHead>
                    <TableHead className="font-semibold text-white/80">Qty</TableHead>
                    <TableHead className="font-semibold text-white/80">Amount</TableHead>
                    <TableHead className="font-semibold text-white/80">Order Status</TableHead>
                    <TableHead className="font-semibold text-white/80">Payment</TableHead>
                    <TableHead className="font-semibold text-white/80">Date</TableHead>
                    <TableHead className="font-semibold text-white/80 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => {
                    const orderAmount =
                      purchase.payment?.amount ??
                      (purchase.pass?.price || 0) * purchase.quantity;
                    return (
                      <TableRow
                        key={purchase.id}
                        className="text-xs hover:bg-white/[0.04] border-b border-white/[0.05] transition-colors"
                      >
                        {/* Order ID */}
                        <TableCell className="font-mono font-medium text-white whitespace-nowrap">
                          <span className="bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded">
                            {purchase.passNumber}
                          </span>
                        </TableCell>

                        {/* Buyer */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium text-white">{purchase.fullName}</p>
                            <p className="text-[11px] text-white/60">
                              {purchase.email} • {purchase.phone}
                            </p>
                          </div>
                        </TableCell>

                        {/* Pass Type */}
                        <TableCell>
                          <span className="font-medium text-white/90">{purchase.pass?.name}</span>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell>
                          <Badge variant="secondary" className="text-[11px] bg-white/[0.08] text-white">
                            {purchase.quantity}
                          </Badge>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="font-semibold text-emerald-400 whitespace-nowrap">
                          ₹{orderAmount}
                        </TableCell>

                        {/* Order Status */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              purchase.status === "CONFIRMED"
                                ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/15 font-semibold text-[10px]"
                                : purchase.status === "PENDING"
                                ? "border-amber-500/30 text-amber-300 bg-amber-500/15 font-semibold text-[10px]"
                                : "border-rose-500/30 text-rose-300 bg-rose-500/15 font-semibold text-[10px]"
                            }
                          >
                            {purchase.status}
                          </Badge>
                        </TableCell>

                        {/* Payment */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              purchase.payment?.status === "SUCCESS"
                                ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/15 font-semibold text-[10px]"
                                : "border-amber-500/30 text-amber-300 bg-amber-500/15 font-semibold text-[10px]"
                            }
                          >
                            {purchase.payment?.status === "SUCCESS" ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-white/60 whitespace-nowrap">
                          {new Date(purchase.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-white/60 hover:text-white hover:bg-white/[0.08]"
                              title="View Order Details"
                              onClick={() => {
                                setActivePurchase(purchase);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="size-3.5" />
                            </Button>

                            {/* Status Change dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 text-white/60 hover:text-white hover:bg-white/[0.08]"
                                >
                                  <MoreHorizontal className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 text-xs bg-[#16112c] border-white/[0.1] text-white"
                              >
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActivePurchase(purchase);
                                    setIsDetailOpen(true);
                                  }}
                                  className="text-white hover:bg-white/[0.08]"
                                >
                                  <Eye className="size-3.5 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/[0.08]" />
                                {purchase.status !== "CONFIRMED" && (
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(purchase.id, "CONFIRMED")}
                                    className="text-emerald-400 focus:text-emerald-300"
                                  >
                                    <CheckCircle className="size-3.5 mr-2" /> Mark Confirmed
                                  </DropdownMenuItem>
                                )}
                                {purchase.status !== "CANCELLED" && (
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(purchase.id, "CANCELLED")}
                                    className="text-amber-300 focus:text-amber-200"
                                  >
                                    <XCircle className="size-3.5 mr-2" /> Mark Cancelled
                                  </DropdownMenuItem>
                                )}
                                {purchase.status !== "REJECTED" && (
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(purchase.id, "REJECTED")}
                                    className="text-rose-400 focus:text-rose-300"
                                  >
                                    <Ban className="size-3.5 mr-2" /> Mark Rejected
                                  </DropdownMenuItem>
                                )}

                                {/* Delete — Admin only */}
                                <DropdownMenuSeparator className="bg-white/[0.08]" />
                                <DropdownMenuItem
                                  onClick={() => handleDeletePassPurchase(purchase)}
                                  className="text-rose-400 focus:text-rose-300"
                                  disabled={
                                    purchase.status === "CONFIRMED" ||
                                    purchase.payment?.status === "SUCCESS"
                                  }
                                >
                                  <Trash2 className="size-3.5 mr-2" /> Delete Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                  Showing <span className="font-medium text-white">{filteredPurchases.length}</span> of{" "}
                  <span className="font-medium text-white">{pagination.total}</span> filtered pass orders
                  {pagination.totalPages > 1 && (
                    <> (Page {pagination.page} of {pagination.totalPages})</>
                  )}
                </>
              ) : (
                <>
                  Showing <span className="font-medium text-white">{filteredPurchases.length}</span> of{" "}
                  <span className="font-medium text-white">{pagination.total}</span> total pass orders
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
      <PassPurchaseDetailModal
        purchase={activePurchase}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) onClearSelectedPass?.();
        }}
        isAdmin={isAdmin}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeletePassPurchase}
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
