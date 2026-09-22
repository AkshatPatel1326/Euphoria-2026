import { useState, useMemo } from "react";
import { apiPatch } from "@/lib/api";
import type { AdminEvent, AdminPass, Category } from "@/types/admin";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Tag,
  Ticket,
  IndianRupee,
  Edit3,
  Loader2,
  CheckCircle,
  Sparkles,
  Layers,
  ArrowUpDown,
  FilterX,
} from "lucide-react";

interface AdminPricingTabProps {
  isAdmin: boolean;
  events: AdminEvent[];
  passes: AdminPass[];
  categories: Category[];
  onEventPriceUpdated: (updatedEvent: AdminEvent) => void;
  onPassPriceUpdated: (updatedPass: AdminPass) => void;
  onRefresh?: () => void;
}

export function AdminPricingTab({
  isAdmin,
  events,
  passes,
  categories,
  onEventPriceUpdated,
  onPassPriceUpdated,
  onRefresh,
}: AdminPricingTabProps) {
  // Guard clause: Organizers/public users are strictly rejected
  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-sm text-white/60">
        Access Denied: Dynamic Pricing Management is reserved strictly for festival administrators.
      </div>
    );
  }

  // Pass state
  const primaryPass = passes[0] || null;
  const [editingPass, setEditingPass] = useState<AdminPass | null>(null);
  const [passPriceInput, setPassPriceInput] = useState<string>("");
  const [isPassTba, setIsPassTba] = useState<boolean>(false);
  const [isSavingPass, setIsSavingPass] = useState<boolean>(false);

  // Event state
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceTypeFilter, setPriceTypeFilter] = useState<string>("all"); // "all" | "free" | "paid"
  const [sortBy, setSortBy] = useState<"name" | "fee-asc" | "fee-desc">("name");

  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [eventFeeInput, setEventFeeInput] = useState<string>("");
  const [isSavingEvent, setIsSavingEvent] = useState<boolean>(false);

  // Filtered & sorted events list
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        // Search filter
        if (search.trim()) {
          const term = search.toLowerCase().trim();
          const matchName = e.name.toLowerCase().includes(term);
          const matchCategory = e.category?.name?.toLowerCase().includes(term) ?? false;
          if (!matchName && !matchCategory) return false;
        }

        // Category filter
        if (categoryFilter !== "all") {
          const eventCatId = e.categoryId?.toLowerCase();
          const eventCatSlug = e.category?.slug?.toLowerCase();
          const target = categoryFilter.toLowerCase();
          if (eventCatId !== target && eventCatSlug !== target) return false;
        }

        // Price type filter
        if (priceTypeFilter === "free" && e.fee > 0) return false;
        if (priceTypeFilter === "paid" && e.fee <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "fee-asc") return a.fee - b.fee;
        if (sortBy === "fee-desc") return b.fee - a.fee;
        return a.name.localeCompare(b.name);
      });
  }, [events, search, categoryFilter, priceTypeFilter, sortBy]);

  // Pricing statistics
  const stats = useMemo(() => {
    const total = events.length;
    const free = events.filter((e) => e.fee <= 0).length;
    const paid = events.filter((e) => e.fee > 0).length;
    const totalFeeSum = events.reduce((sum, e) => sum + e.fee, 0);
    const avgFee = total > 0 ? Math.round(totalFeeSum / total) : 0;
    return { total, free, paid, avgFee };
  }, [events]);

  // Open Pass Edit Modal
  const handleOpenEditPass = (pass: AdminPass) => {
    setEditingPass(pass);
    if (pass.price === null || pass.price === undefined) {
      setPassPriceInput("");
      setIsPassTba(true);
    } else {
      setPassPriceInput(String(pass.price));
      setIsPassTba(false);
    }
  };

  // Save Pass Price
  const handleSavePassPrice = async () => {
    if (!editingPass) return;

    let targetPrice: number | null = null;
    if (!isPassTba) {
      const parsed = parseFloat(passPriceInput.trim());
      if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
        toast.error("Please enter a valid non-negative price amount.");
        return;
      }
      if (parsed > 100000) {
        toast.error("Price exceeds maximum permissible amount (₹1,00,000).");
        return;
      }
      targetPrice = Math.round(parsed * 100) / 100;
    }

    setIsSavingPass(true);
    try {
      const res = await apiPatch<{
        status: string;
        message: string;
        data: { pass: AdminPass };
      }>(`/admin/passes/${editingPass.id}/price`, {
        price: targetPrice,
      });

      toast.success(res.message || "Festival pass price updated successfully.");
      onPassPriceUpdated(res.data.pass);
      setEditingPass(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update festival pass price.");
    } finally {
      setIsSavingPass(false);
    }
  };

  // Open Event Edit Modal
  const handleOpenEditEvent = (event: AdminEvent) => {
    setEditingEvent(event);
    setEventFeeInput(String(event.fee));
  };

  // Save Event Fee
  const handleSaveEventFee = async () => {
    if (!editingEvent) return;

    const parsed = parseFloat(eventFeeInput.trim());
    if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
      toast.error("Please enter a valid non-negative fee amount.");
      return;
    }
    if (parsed > 100000) {
      toast.error("Fee exceeds maximum permissible amount (₹1,00,000).");
      return;
    }

    const targetFee = Math.round(parsed * 100) / 100;

    setIsSavingEvent(true);
    try {
      const res = await apiPatch<{
        status: string;
        message: string;
        data: { event: AdminEvent };
      }>(`/admin/events/${editingEvent.id}/price`, {
        fee: targetFee,
      });

      toast.success(res.message || "Event fee updated successfully.");
      onEventPriceUpdated(res.data.event);
      setEditingEvent(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update event fee.");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const getCategoryBadgeClass = (categorySlug?: string) => {
    switch (categorySlug?.toLowerCase()) {
      case "cultural":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "literary-management":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "science-tech":
        return "bg-teal-500/15 text-teal-300 border-teal-500/30";
      case "sports":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      default:
        return "bg-white/10 text-white/70 border-white/15";
    }
  };

  return (
    <div className="space-y-8">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. FESTIVAL PASS DYNAMIC PRICING SECTION                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Ticket className="size-5 text-euphoria-gold" />
              Festival Pass Pricing
            </h2>
            <p className="text-xs text-white/50">
              Authoritative pass price stored in PostgreSQL and used by the public checkout and payment gateway.
            </p>
          </div>
        </div>

        {primaryPass ? (
          <Card className="border-white/[0.08] bg-[#140f26]/90 backdrop-blur-md shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-euphoria-gold/10 via-transparent to-transparent pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-euphoria-gold">
                      {primaryPass.name}
                    </span>
                    {primaryPass.subtitle && (
                      <span className="text-[11px] text-white/40 tracking-wider">
                        • {primaryPass.subtitle}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 border-white/15 bg-white/[0.04] text-white/70"
                    >
                      {primaryPass.status}
                    </Badge>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    {primaryPass.tagline || "Official Festival Entry Pass"}
                  </h3>
                  <p className="text-xs text-white/50 max-w-xl">
                    Changing this value immediately updates the public pass display and becomes the exact unit amount charged by Easebuzz upon attendee checkout.
                  </p>
                </div>

                <div className="flex items-center gap-5 sm:border-l sm:border-white/[0.08] sm:pl-6">
                  <div className="text-right sm:text-left">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block">
                      Authoritative Price
                    </span>
                    <span className="text-3xl font-black text-euphoria-gold tracking-tight block mt-0.5">
                      {primaryPass.price != null
                        ? `₹${primaryPass.price.toLocaleString("en-IN")}`
                        : "TBA"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleOpenEditPass(primaryPass)}
                    className="bg-euphoria-gold text-black hover:bg-euphoria-gold/90 font-bold text-xs gap-1.5 px-4 cursor-pointer shadow-lg shadow-euphoria-gold/20"
                  >
                    <Edit3 className="size-3.5" />
                    Edit Price
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-white/[0.08] bg-[#140f26]/60 p-6 text-center text-sm text-white/50">
            No festival pass configured in database. Run database seed to initialize.
          </Card>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. EVENT DYNAMIC PRICING SECTION                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Tag className="size-5 text-euphoria-aqua" />
              Event Registration Pricing
            </h2>
            <p className="text-xs text-white/50">
              Manage individual and team event entry fees. Updated prices take effect instantly across the catalog and registration gateway.
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-[#140f26] border border-white/[0.08] rounded-lg px-3 py-1 text-xs">
              <span className="text-white/40 mr-1.5">Total Events:</span>
              <span className="font-bold text-white">{stats.total}</span>
            </div>
            <div className="bg-[#140f26] border border-white/[0.08] rounded-lg px-3 py-1 text-xs">
              <span className="text-white/40 mr-1.5">Free Events:</span>
              <span className="font-bold text-emerald-400">{stats.free}</span>
            </div>
            <div className="bg-[#140f26] border border-white/[0.08] rounded-lg px-3 py-1 text-xs">
              <span className="text-white/40 mr-1.5">Paid Events:</span>
              <span className="font-bold text-euphoria-aqua">{stats.paid}</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#140f26] border border-white/[0.08] p-3 rounded-xl flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search event name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/[0.04] border-white/[0.08] text-xs text-white placeholder:text-white/30 h-9"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-xs text-white h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1433] border-white/10 text-white">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug || c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Type Filter */}
          <div className="w-full md:w-36">
            <Select value={priceTypeFilter} onValueChange={setPriceTypeFilter}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-xs text-white h-9">
                <SelectValue placeholder="All Pricing" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1433] border-white/10 text-white">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="free">Free (₹0)</SelectItem>
                <SelectItem value="paid">Paid (&gt; ₹0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="w-full md:w-44">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-xs text-white h-9">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1433] border-white/10 text-white">
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="fee-asc">Fee: Low to High</SelectItem>
                <SelectItem value="fee-desc">Fee: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(search || categoryFilter !== "all" || priceTypeFilter !== "all") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setPriceTypeFilter("all");
              }}
              className="text-xs text-white/50 hover:text-white h-9 px-2.5"
            >
              <FilterX className="size-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Events Table */}
        <div className="border border-white/[0.08] rounded-xl bg-[#140f26]/80 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/[0.02] border-b border-white/[0.08]">
              <TableRow className="border-white/[0.08] hover:bg-transparent">
                <TableHead className="text-white/60 text-xs font-semibold">Event Name</TableHead>
                <TableHead className="text-white/60 text-xs font-semibold">Category</TableHead>
                <TableHead className="text-white/60 text-xs font-semibold">Registration Type</TableHead>
                <TableHead className="text-white/60 text-xs font-semibold">Current Fee</TableHead>
                <TableHead className="text-white/60 text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-xs text-white/40">
                    No events matched the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    className="border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                  >
                    <TableCell className="py-3">
                      <div>
                        <span className="font-semibold text-sm text-white block">
                          {event.name}
                        </span>
                        <span className="text-[11px] text-white/40 block">
                          ID: {event.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium px-2.5 py-0.5 border ${getCategoryBadgeClass(
                          event.category?.slug
                        )}`}
                      >
                        {event.category?.name || event.categoryId}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-white/70">
                        {event.registrationType === "GROUP"
                          ? `Team (${event.minTeamSize}-${event.maxTeamSize})`
                          : "Individual"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      {event.fee <= 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                          Free (₹0)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-euphoria-aqua bg-euphoria-aqua/10 px-2.5 py-1 rounded-md border border-euphoria-aqua/20">
                          ₹{event.fee.toLocaleString("en-IN")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditEvent(event)}
                        className="bg-white/[0.04] hover:bg-white/[0.1] text-white border-white/10 text-xs gap-1.5 h-8 cursor-pointer"
                      >
                        <Edit3 className="size-3" />
                        Edit Fee
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MODAL: EDIT FESTIVAL PASS PRICE                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(editingPass)}
        onOpenChange={(open) => !open && setEditingPass(null)}
      >
        <DialogContent className="bg-[#140f26] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-white">
              <Ticket className="size-4 text-euphoria-gold" />
              Edit Festival Pass Price
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50">
              Set the authoritative amount in INR for the Festival Pass. This price will be charged at payment initiation.
            </DialogDescription>
          </DialogHeader>

          {editingPass && (
            <div className="space-y-4 py-2">
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.08] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Pass:</span>
                  <span className="font-semibold text-white">{editingPass.name} ({editingPass.subtitle})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Current Price:</span>
                  <span className="font-semibold text-euphoria-gold">
                    {editingPass.price != null ? `₹${editingPass.price}` : "TBA"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80 block">
                  New Price (in INR ₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    disabled={isPassTba}
                    placeholder={isPassTba ? "TBA (No price set)" : "e.g. 799"}
                    value={isPassTba ? "" : passPriceInput}
                    onChange={(e) => setPassPriceInput(e.target.value)}
                    className="pl-9 bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/20 h-10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="passTbaCheckbox"
                  checked={isPassTba}
                  onChange={(e) => setIsPassTba(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 size-4 text-euphoria-gold cursor-pointer"
                />
                <label
                  htmlFor="passTbaCheckbox"
                  className="text-xs text-white/70 cursor-pointer select-none"
                >
                  Mark price as TBA / Coming Soon (null)
                </label>
              </div>

              {/* Quick Presets */}
              {!isPassTba && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-white/40 mr-1">Presets:</span>
                  {[299, 499, 799, 999].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPassPriceInput(String(amt))}
                      className="text-[11px] bg-white/[0.06] hover:bg-white/[0.12] text-white/80 px-2 py-0.5 rounded border border-white/10 transition-colors"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPass(null)}
              disabled={isSavingPass}
              className="border-white/10 text-white/70 hover:bg-white/5 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePassPrice}
              disabled={isSavingPass}
              className="bg-euphoria-gold text-black hover:bg-euphoria-gold/90 font-bold text-xs gap-1.5"
            >
              {isSavingPass ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Pass Price"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MODAL: EDIT EVENT FEE                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(editingEvent)}
        onOpenChange={(open) => !open && setEditingEvent(null)}
      >
        <DialogContent className="bg-[#140f26] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-white">
              <Tag className="size-4 text-euphoria-aqua" />
              Edit Event Entry Fee
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50">
              Update the registration fee for this event. If set to 0, registrations will be free of charge.
            </DialogDescription>
          </DialogHeader>

          {editingEvent && (
            <div className="space-y-4 py-2">
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.08] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Event:</span>
                  <span className="font-semibold text-white">{editingEvent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Category:</span>
                  <span className="text-white/80">
                    {editingEvent.category?.name || editingEvent.categoryId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Current Fee:</span>
                  <span className="font-semibold text-euphoria-aqua">
                    {editingEvent.fee <= 0 ? "Free (₹0)" : `₹${editingEvent.fee}`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80 block">
                  New Fee (in INR ₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 200 (or 0 for Free)"
                    value={eventFeeInput}
                    onChange={(e) => setEventFeeInput(e.target.value)}
                    className="pl-9 bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/20 h-10"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[10px] text-white/40 mr-1">Presets:</span>
                {[0, 50, 100, 150, 200, 300, 500, 700].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setEventFeeInput(String(amt))}
                    className="text-[11px] bg-white/[0.06] hover:bg-white/[0.12] text-white/80 px-2 py-0.5 rounded border border-white/10 transition-colors"
                  >
                    {amt === 0 ? "Free (₹0)" : `₹${amt}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingEvent(null)}
              disabled={isSavingEvent}
              className="border-white/10 text-white/70 hover:bg-white/5 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEventFee}
              disabled={isSavingEvent}
              className="bg-euphoria-aqua text-black hover:bg-euphoria-aqua/90 font-bold text-xs gap-1.5"
            >
              {isSavingEvent ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Event Fee"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
