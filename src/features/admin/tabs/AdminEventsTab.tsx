import { useState, useMemo, useEffect } from "react";
import { apiPatch } from "@/lib/api";
import type { AdminEvent, Category, CoordinatorItem } from "@/types/admin";
import { deriveDayFromDate, parseCoordinatorString } from "@/hooks/use-events";
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
  SlidersHorizontal,
  Lock,
  Unlock,
  Loader2,
  CheckCircle2,
  FilterX,
  RefreshCw,
  Users,
  AlertTriangle,
  FileText,
  Calendar,
  IndianRupee,
  Award,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  MapPin,
  Sparkles,
  UserCheck,
  GraduationCap,
  Plus,
  Trash2,
} from "lucide-react";

interface AdminEventsTabProps {
  isAdmin: boolean;
  events: AdminEvent[];
  categories: Category[];
  currentUserId?: string;
  onEventUpdated: (updatedEvent: AdminEvent) => void;
  onRefresh?: () => void;
}

/**
 * Parses structured 1st, 2nd, 3rd prizes and any custom notes from the database prizes string.
 */
function parsePrizeComponents(raw?: string | null) {
  if (!raw) return { first: "", second: "", third: "", custom: "" };
  const firstMatch = raw.match(/1st:\s*([^|]+)/i);
  const secondMatch = raw.match(/2nd:\s*([^|]+)/i);
  const thirdMatch = raw.match(/3rd:\s*([^|]+)/i);

  if (firstMatch || secondMatch || thirdMatch) {
    return {
      first: firstMatch ? firstMatch[1].trim() : "",
      second: secondMatch ? secondMatch[1].trim() : "",
      third: thirdMatch ? thirdMatch[1].trim() : "",
      custom: "",
    };
  }
  return { first: "", second: "", third: "", custom: raw.trim() };
}

/**
 * Builds the combined prizes string for storage in the database.
 */
function buildPrizeString(first: string, second: string, third: string, custom: string): string | null {
  const parts: string[] = [];
  if (first.trim()) parts.push(`1st: ${first.trim()}`);
  if (second.trim()) parts.push(`2nd: ${second.trim()}`);
  if (third.trim()) parts.push(`3rd: ${third.trim()}`);

  if (parts.length > 0) {
    if (custom.trim()) {
      parts.push(custom.trim());
    }
    return parts.join(" | ");
  }

  return custom.trim() ? custom.trim() : null;
}

export function AdminEventsTab({
  isAdmin,
  events,
  categories,
  currentUserId,
  onEventUpdated,
  onRefresh,
}: AdminEventsTabProps) {
  // Filter events based on RBAC: Admin sees all, Organizer sees only assigned events
  const authorizedEvents = useMemo(() => {
    if (isAdmin) return events;
    if (!currentUserId) return [];
    return events.filter((e) => e.organizerId === currentUserId);
  }, [events, isAdmin, currentUserId]);

  // Filters state
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [limitFilter, setLimitFilter] = useState<string>("all");

  // CMS Modal / Editing state
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form fields state
  const [title, setTitle] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [venue, setVenue] = useState<string>("");
  const [regType, setRegType] = useState<"INDIVIDUAL" | "GROUP">("INDIVIDUAL");
  const [minTeamSize, setMinTeamSize] = useState<string>("1");
  const [maxTeamSize, setMaxTeamSize] = useState<string>("1");

  const [fee, setFee] = useState<string>("0");

  const [firstPrize, setFirstPrize] = useState<string>("");
  const [secondPrize, setSecondPrize] = useState<string>("");
  const [thirdPrize, setThirdPrize] = useState<string>("");
  const [customPrize, setCustomPrize] = useState<string>("");

  const [statusInput, setStatusInput] = useState<"OPEN" | "CLOSED">("CLOSED");
  const [isUnlimited, setIsUnlimited] = useState<boolean>(true);
  const [limitInput, setLimitInput] = useState<string>("");

  const [posterUrl, setPosterUrl] = useState<string>("");
  const [rulebookUrl, setRulebookUrl] = useState<string>("");

  // Dynamic coordinator states
  const [facultyCoordinators, setFacultyCoordinators] = useState<CoordinatorItem[]>([]);
  const [studentCoordinators, setStudentCoordinators] = useState<CoordinatorItem[]>([]);

  // Coordinator CRUD helpers
  const handleAddFacultyCoordinator = () => {
    setFacultyCoordinators((prev) => [...prev, { name: "", phone: "" }]);
  };

  const handleRemoveFacultyCoordinator = (index: number) => {
    setFacultyCoordinators((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateFacultyCoordinator = (
    index: number,
    field: "name" | "phone",
    value: string
  ) => {
    setFacultyCoordinators((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddStudentCoordinator = () => {
    setStudentCoordinators((prev) => [...prev, { name: "", phone: "" }]);
  };

  const handleRemoveStudentCoordinator = (index: number) => {
    setStudentCoordinators((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateStudentCoordinator = (
    index: number,
    field: "name" | "phone",
    value: string
  ) => {
    setStudentCoordinators((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Auto-calculated read-only day derived from date
  const calculatedDay = useMemo(() => {
    return deriveDayFromDate(date);
  }, [date]);

  // Filtered events for the table
  const filteredEvents = useMemo(() => {
    return authorizedEvents.filter((e) => {
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const matchName = e.name.toLowerCase().includes(term);
        const matchCat = e.category?.name?.toLowerCase().includes(term) ?? false;
        const matchVenue = e.venue?.toLowerCase().includes(term) ?? false;
        if (!matchName && !matchCat && !matchVenue) return false;
      }

      if (categoryFilter !== "all" && e.categoryId !== categoryFilter) {
        return false;
      }

      if (statusFilter === "open" && !e.registrationOpen) return false;
      if (statusFilter === "closed" && e.registrationOpen) return false;

      if (limitFilter === "limited" && (e.capacity === null || e.capacity === undefined)) return false;
      if (limitFilter === "unlimited" && e.capacity !== null && e.capacity !== undefined) return false;

      return true;
    });
  }, [authorizedEvents, search, categoryFilter, statusFilter, limitFilter]);

  // Open CMS modal with event data pre-filled
  const handleOpenEdit = (event: AdminEvent) => {
    setEditingEvent(event);
    setTitle(event.name || "");
    setSubtitle(event.eventFamily || "");
    setStage(event.stage || "");
    setSelectedCategoryId(event.categoryId || categories[0]?.id || "");
    setDescription(event.description || "");

    setDate(event.date || "");
    setTime(event.time || "");
    setVenue(event.venue || "");
    setRegType(event.registrationType === "GROUP" ? "GROUP" : "INDIVIDUAL");
    setMinTeamSize(String(event.minTeamSize || 1));
    setMaxTeamSize(String(event.maxTeamSize || 1));

    setFee(String(event.fee ?? 0));

    const parsedPrizes = parsePrizeComponents(event.prizes);
    setFirstPrize(parsedPrizes.first);
    setSecondPrize(parsedPrizes.second);
    setThirdPrize(parsedPrizes.third);
    setCustomPrize(parsedPrizes.custom);

    setStatusInput(event.registrationOpen ? "OPEN" : "CLOSED");
    if (event.capacity === null || event.capacity === undefined) {
      setIsUnlimited(true);
      setLimitInput("");
    } else {
      setIsUnlimited(false);
      setLimitInput(String(event.capacity));
    }

    setPosterUrl(event.posterUrl || "");
    setRulebookUrl(event.rules || "");

    // Load coordinators from structured array or parsed string
    if (event.facultyCoordinators && event.facultyCoordinators.length > 0) {
      setFacultyCoordinators(
        event.facultyCoordinators.map((c) => ({ name: c.name || "", phone: c.phone || "" }))
      );
    } else if (event.facultyCoordinator) {
      setFacultyCoordinators(parseCoordinatorString(event.facultyCoordinator));
    } else {
      setFacultyCoordinators([]);
    }

    if (event.studentCoordinators && event.studentCoordinators.length > 0) {
      setStudentCoordinators(
        event.studentCoordinators.map((c) => ({ name: c.name || "", phone: c.phone || "" }))
      );
    } else if (event.studentCoordinator) {
      setStudentCoordinators(parseCoordinatorString(event.studentCoordinator));
    } else {
      setStudentCoordinators([]);
    }
  };

  // Close CMS modal
  const handleCloseEdit = () => {
    if (isSaving) return;
    setEditingEvent(null);
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!editingEvent) return;

    if (!title.trim()) {
      toast.error("Event title cannot be empty");
      return;
    }

    const feeNum = Number(fee);
    if (isNaN(feeNum) || feeNum < 0) {
      toast.error("Entry fee must be a non-negative number");
      return;
    }

    let parsedMin = Number(minTeamSize);
    let parsedMax = Number(maxTeamSize);
    if (regType === "INDIVIDUAL") {
      parsedMin = 1;
      parsedMax = 1;
    } else {
      if (isNaN(parsedMin) || parsedMin < 1 || !Number.isInteger(parsedMin)) {
        toast.error("Minimum team size must be an integer >= 1");
        return;
      }
      if (isNaN(parsedMax) || parsedMax < 1 || !Number.isInteger(parsedMax)) {
        toast.error("Maximum team size must be an integer >= 1");
        return;
      }
      if (parsedMin > parsedMax) {
        toast.error("Minimum team size cannot exceed maximum team size");
        return;
      }
    }

    let capacityValue: number | null = null;
    if (!isUnlimited) {
      const trimmed = limitInput.trim();
      if (!trimmed) {
        toast.error("Please enter a registration limit or select Unlimited");
        return;
      }
      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed) || parsed < 0) {
        toast.error("Registration limit must be a valid non-negative integer");
        return;
      }
      capacityValue = parsed;
    }

    const formattedPrizes = buildPrizeString(firstPrize, secondPrize, thirdPrize, customPrize);

    // Validate faculty coordinators
    for (let i = 0; i < facultyCoordinators.length; i++) {
      const fc = facultyCoordinators[i];
      const name = fc.name.trim();
      const phone = fc.phone.trim();
      if (!name && !phone) {
        toast.error(`Faculty coordinator #${i + 1} cannot be completely empty`);
        return;
      }
      if (!name) {
        toast.error(`Faculty coordinator #${i + 1} requires a name`);
        return;
      }
      if (!phone) {
        toast.error(`Faculty coordinator #${i + 1} requires a phone number`);
        return;
      }
    }

    // Validate student coordinators
    for (let i = 0; i < studentCoordinators.length; i++) {
      const sc = studentCoordinators[i];
      const name = sc.name.trim();
      const phone = sc.phone.trim();
      if (!name && !phone) {
        toast.error(`Student coordinator #${i + 1} cannot be completely empty`);
        return;
      }
      if (!name) {
        toast.error(`Student coordinator #${i + 1} requires a name`);
        return;
      }
      if (!phone) {
        toast.error(`Student coordinator #${i + 1} requires a phone number`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        name: title.trim(),
        description: description.trim(),
        categoryId: selectedCategoryId,
        eventFamily: subtitle.trim() || null,
        stage: stage.trim() || null,
        fee: feeNum,
        registrationType: regType,
        minTeamSize: parsedMin,
        maxTeamSize: parsedMax,
        date: date.trim() || null,
        time: time.trim() || null,
        venue: venue.trim() || null,
        prizes: formattedPrizes,
        rules: rulebookUrl.trim() || null,
        posterUrl: posterUrl.trim() || null,
        registrationOpen: statusInput === "OPEN",
        capacity: capacityValue,
        facultyCoordinators: facultyCoordinators.map((c) => ({
          name: c.name.trim(),
          phone: c.phone.trim(),
        })),
        studentCoordinators: studentCoordinators.map((c) => ({
          name: c.name.trim(),
          phone: c.phone.trim(),
        })),
      };

      const res = await apiPatch<{
        status: string;
        message: string;
        data: { event: AdminEvent };
      }>(`/events/${editingEvent.id}`, payload);

      toast.success(res.message || `Event '${res.data.event.name}' updated successfully!`);
      onEventUpdated(res.data.event);
      if (onRefresh) onRefresh();
      setEditingEvent(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update event content");
    } finally {
      setIsSaving(false);
    }
  };

  // Capacity comparison warning when setting limit below current registrations
  const currentCount = editingEvent?.activeRegistrationsCount ?? 0;
  const isLimitBelowCurrent =
    !isUnlimited &&
    limitInput.trim() !== "" &&
    !isNaN(Number(limitInput)) &&
    Number(limitInput) >= 0 &&
    Number(limitInput) < currentCount;

  // Prizes preview string for the modal
  const livePrizesPreview = useMemo(() => {
    return buildPrizeString(firstPrize, secondPrize, thirdPrize, customPrize);
  }, [firstPrize, secondPrize, thirdPrize, customPrize]);

  return (
    <div className="space-y-6">
      {/* Top Event Selector & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-white/[0.08] bg-[#16112c] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Total Events
            </span>
            <Users className="size-4 text-euphoria-aqua" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {authorizedEvents.length}
          </div>
          <p className="text-xs text-white/40 mt-1">Available in Content Management System</p>
        </Card>

        <Card className="border border-white/[0.08] bg-[#16112c] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Registration Open
            </span>
            <Unlock className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {authorizedEvents.filter((e) => e.registrationOpen).length}
          </div>
          <p className="text-xs text-white/40 mt-1">Accepting active participant registrations</p>
        </Card>

        <Card className="border border-white/[0.08] bg-[#16112c] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/50">
              Registration Closed
            </span>
            <Lock className="size-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">
            {authorizedEvents.filter((e) => !e.registrationOpen).length}
          </div>
          <p className="text-xs text-white/40 mt-1">Registrations currently paused or full</p>
        </Card>
      </div>

      {/* Main CMS Management Panel */}
      <Card className="border border-white/[0.08] bg-[#16112c] rounded-2xl shadow-lg">
        <CardHeader className="pb-4 border-b border-white/[0.08]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="size-5 text-euphoria-aqua" />
                Event Content Management System (ECMS)
              </CardTitle>
              <p className="text-xs text-white/50 mt-1">
                Select an event to edit title, description, schedule, venue, pricing, prizes, registration limits, and rulebooks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Event Selector Dropdown */}
              <div className="min-w-[220px]">
                <Select
                  value=""
                  onValueChange={(eventId) => {
                    const ev = authorizedEvents.find((e) => e.id === eventId);
                    if (ev) handleOpenEdit(ev);
                  }}
                >
                  <SelectTrigger className="bg-euphoria-aqua/10 border-euphoria-aqua/30 text-euphoria-aqua text-xs h-9 font-semibold">
                    <SelectValue placeholder="Select Event to Edit ▼" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1435] border-white/10 text-white text-xs max-h-72">
                    {authorizedEvents.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id} className="cursor-pointer">
                        {ev.name} {ev.eventFamily ? `(${ev.eventFamily})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="gap-2 border-white/10 hover:bg-white/5 text-white/80 cursor-pointer h-9"
                >
                  <RefreshCw className="size-3.5" />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/40" />
              <Input
                placeholder="Search by event, category, venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-black/20 border-white/10 text-white placeholder:text-white/30 text-xs h-9"
              />
            </div>

            {/* Category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white text-xs h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1435] border-white/10 text-white text-xs">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white text-xs h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1435] border-white/10 text-white text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Registration Open</SelectItem>
                <SelectItem value="closed">Registration Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Limit Filter */}
            <Select value={limitFilter} onValueChange={setLimitFilter}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white text-xs h-9">
                <SelectValue placeholder="All Limits" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1435] border-white/10 text-white text-xs">
                <SelectItem value="all">All Limits</SelectItem>
                <SelectItem value="limited">Finite Limit</SelectItem>
                <SelectItem value="unlimited">Unlimited Capacity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-white/40 flex flex-col items-center justify-center gap-2">
              <FilterX className="size-8 opacity-40" />
              <p className="text-sm">No events match the selected criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-b border-white/[0.08] hover:bg-transparent">
                    <TableHead className="text-white/60 text-xs font-semibold uppercase tracking-wider py-3.5 pl-6">
                      Event Details
                    </TableHead>
                    <TableHead className="text-white/60 text-xs font-semibold uppercase tracking-wider py-3.5">
                      Schedule & Venue
                    </TableHead>
                    <TableHead className="text-white/60 text-xs font-semibold uppercase tracking-wider py-3.5">
                      Entry Fee
                    </TableHead>
                    <TableHead className="text-white/60 text-xs font-semibold uppercase tracking-wider py-3.5">
                      Registration Status
                    </TableHead>
                    <TableHead className="text-white/60 text-xs font-semibold uppercase tracking-wider py-3.5">
                      Limit & Active
                    </TableHead>
                    <TableHead className="text-white/60 text-xs font-semibold uppercase tracking-wider py-3.5 pr-6 text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => {
                    const activeCount = event.activeRegistrationsCount ?? 0;
                    const isFinite = event.capacity !== null && event.capacity !== undefined;
                    const isFull = isFinite && activeCount >= (event.capacity as number);
                    const eventDay = event.day || deriveDayFromDate(event.date);

                    return (
                      <TableRow
                        key={event.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Event Name & Category */}
                        <TableCell className="py-4 pl-6">
                          <div className="font-semibold text-white text-sm">
                            {event.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-white/50">
                              {event.category?.name || "General"}
                            </span>
                            {event.eventFamily && (
                              <>
                                <span className="text-white/30">•</span>
                                <span className="text-[11px] text-euphoria-aqua/80">
                                  {event.eventFamily}
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>

                        {/* Schedule & Venue */}
                        <TableCell className="py-4">
                          <div className="text-xs text-white/80 font-medium">
                            {event.date || "TBA"}
                            {eventDay && <span className="text-white/40 ml-1">({eventDay})</span>}
                          </div>
                          <div className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1">
                            <MapPin className="size-3 text-white/30" />
                            {event.venue || "TBA"}
                          </div>
                        </TableCell>

                        {/* Fee */}
                        <TableCell className="py-4">
                          <span className="font-mono text-xs font-bold text-euphoria-aqua">
                            {event.fee === 0 ? "Free" : `₹${event.fee.toLocaleString("en-IN")}`}
                          </span>
                        </TableCell>

                        {/* Registration Status */}
                        <TableCell className="py-4">
                          {event.registrationOpen ? (
                            <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 gap-1.5 px-2.5 py-1">
                              <Unlock className="size-3 text-emerald-400" />
                              OPEN
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/30 gap-1.5 px-2.5 py-1">
                              <Lock className="size-3 text-rose-400" />
                              CLOSED
                            </Badge>
                          )}
                        </TableCell>

                        {/* Limit & Active Count */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">
                              {activeCount} / {isFinite ? event.capacity : "Unlimited"}
                            </span>
                            {isFull && (
                              <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0">
                                FULL
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="py-4 pr-6 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleOpenEdit(event)}
                            className="bg-white/[0.08] hover:bg-euphoria-aqua hover:text-neutral-950 text-white text-xs gap-1.5 transition-all cursor-pointer"
                          >
                            <SlidersHorizontal className="size-3.5" />
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comprehensive ECMS Edit Modal */}
      <Dialog open={Boolean(editingEvent)} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="bg-[#17112c] border border-white/10 text-white sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
                <SlidersHorizontal className="size-5 text-euphoria-aqua" />
                Event Content Management
              </DialogTitle>
              {editingEvent && (
                <Badge className="bg-white/[0.06] text-white/70 border-white/10 font-mono text-[11px]">
                  ID: {editingEvent.id}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-white/50">
              Update event details, pricing, schedule, prizes, rulebook, and registration controls for <strong className="text-white">{editingEvent?.name}</strong>. The database is the authoritative single source of truth.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-3">
            {/* ── 1. BASIC INFORMATION ── */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-euphoria-aqua border-b border-white/[0.06] pb-2">
                <FileText className="size-4" />
                1. Basic Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-white/70">
                    Event Title <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Fashion-Fiesta (Fashion Show) Designer — Single Dress"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">
                    Subtitle / Event Family
                  </label>
                  <Input
                    placeholder="e.g. Fashion Fiesta, Move & Groove"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger className="bg-black/30 border-white/15 text-white text-xs h-9">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1738] border-white/10 text-white text-xs">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-white/70">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide detailed description of the event..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-md bg-black/30 border border-white/15 p-2.5 text-white placeholder:text-white/20 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-euphoria-aqua"
                  />
                </div>
              </div>
            </div>

            {/* ── 2. EVENT DETAILS & SCHEDULE ── */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-euphoria-aqua border-b border-white/[0.06] pb-2">
                <Calendar className="size-4" />
                2. Event Details & Schedule
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Date */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                    <span>Date</span>
                    <span className="text-[10px] text-white/40">e.g. 9 April 2026 or 2026-04-09</span>
                  </label>
                  <Input
                    placeholder="e.g. 9 April 2026"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                </div>

                {/* Day (Read-only, automatically calculated) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                    <span>Day</span>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0">
                      Auto-calculated
                    </Badge>
                  </label>
                  <Input
                    readOnly
                    value={calculatedDay || "Enter a valid date to calculate"}
                    className="bg-black/40 border-white/10 text-white/70 text-xs h-9 font-semibold cursor-not-allowed"
                  />
                </div>

                {/* Time */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                    <Clock className="size-3 text-white/40" />
                    Time
                  </label>
                  <Input
                    placeholder="e.g. 7:00 PM Onwards"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                </div>

                {/* Venue */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                    <MapPin className="size-3 text-white/40" />
                    Venue
                  </label>
                  <Input
                    placeholder="e.g. Phase 2 Ground"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                </div>

                {/* Registration Type */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/70">
                    Registration Type
                  </label>
                  <Select
                    value={regType}
                    onValueChange={(val: "INDIVIDUAL" | "GROUP") => {
                      setRegType(val);
                      if (val === "INDIVIDUAL") {
                        setMinTeamSize("1");
                        setMaxTeamSize("1");
                      }
                    }}
                  >
                    <SelectTrigger className="bg-black/30 border-white/15 text-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1738] border-white/10 text-white text-xs">
                      <SelectItem value="INDIVIDUAL">Individual (1 Person)</SelectItem>
                      <SelectItem value="GROUP">Group / Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Sizes */}
                {regType === "GROUP" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/70">
                        Min Team Size
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={minTeamSize}
                        onChange={(e) => setMinTeamSize(e.target.value)}
                        className="bg-black/30 border-white/15 text-white font-mono text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/70">
                        Max Team Size
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={maxTeamSize}
                        onChange={(e) => setMaxTeamSize(e.target.value)}
                        className="bg-black/30 border-white/15 text-white font-mono text-xs h-9"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-white/70">
                      Team Size
                    </label>
                    <Input
                      readOnly
                      value="1 (Solo Entry)"
                      className="bg-black/40 border-white/10 text-white/50 font-mono text-xs h-9 cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── 3. PRICING ── */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-euphoria-aqua border-b border-white/[0.06] pb-2">
                <IndianRupee className="size-4" />
                3. Pricing (Authoritative for Payment Gateway)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">
                    Entry Fee (₹ INR) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 499"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="pl-7 bg-black/30 border-white/15 text-white font-mono text-sm h-9"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <p className="text-xs text-white/50 bg-black/20 p-2.5 rounded-lg border border-white/[0.04]">
                    Set ₹0 for Free events. The payment gateway strictly fetches this amount from the database upon registration.
                  </p>
                </div>
              </div>
            </div>

            {/* ── 4. PRIZES ── */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-euphoria-aqua border-b border-white/[0.06] pb-2">
                <Award className="size-4" />
                4. Prizes
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">1st Prize</label>
                  <Input
                    placeholder="e.g. ₹5,100"
                    value={firstPrize}
                    onChange={(e) => setFirstPrize(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">2nd Prize</label>
                  <Input
                    placeholder="e.g. ₹3,100"
                    value={secondPrize}
                    onChange={(e) => setSecondPrize(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">3rd Prize (Optional)</label>
                  <Input
                    placeholder="e.g. ₹1,000"
                    value={thirdPrize}
                    onChange={(e) => setThirdPrize(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="text-xs font-semibold text-white/70">
                    Custom / Additional Prize Note
                  </label>
                  <Input
                    placeholder="e.g. Trophies & Merit Certificates for all finalists"
                    value={customPrize}
                    onChange={(e) => setCustomPrize(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                </div>

                {livePrizesPreview && (
                  <div className="sm:col-span-3 bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Preview:</span>
                    <span className="font-semibold text-euphoria-aqua">{livePrizesPreview}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── 5. REGISTRATION CONTROLS ── */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-euphoria-aqua border-b border-white/[0.06] pb-2">
                <Lock className="size-4" />
                5. Dynamic Registration Controls
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70 block">
                    Registration Status
                  </label>
                  <Select
                    value={statusInput}
                    onValueChange={(val: "OPEN" | "CLOSED") => setStatusInput(val)}
                  >
                    <SelectTrigger className="bg-black/30 border-white/15 text-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1738] border-white/10 text-white text-xs">
                      <SelectItem value="OPEN" className="text-emerald-400 font-semibold">
                        OPEN (Accept Registrations)
                      </SelectItem>
                      <SelectItem value="CLOSED" className="text-rose-400 font-semibold">
                        CLOSED (Reject Registrations)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Registration Limit Controls */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/70">
                      Registration Limit
                    </label>
                    <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimited}
                        onChange={(e) => {
                          setIsUnlimited(e.target.checked);
                          if (e.target.checked) setLimitInput("");
                        }}
                        className="rounded border-white/20 bg-black/40 text-euphoria-aqua focus:ring-0 cursor-pointer"
                      />
                      <span>Unlimited</span>
                    </label>
                  </div>

                  {!isUnlimited ? (
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 100"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value)}
                      className="bg-black/30 border-white/15 text-white font-mono text-xs h-9"
                    />
                  ) : (
                    <Input
                      readOnly
                      value="Unlimited Capacity"
                      className="bg-black/40 border-white/10 text-white/40 font-mono text-xs h-9 cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Current Registrations Readout */}
                <div className="sm:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-white/40 block">
                      Current Active Registrations (CONFIRMED + PENDING)
                    </span>
                    <span className="font-mono text-base font-bold text-white">
                      {currentCount} / {isUnlimited ? "Unlimited" : (limitInput.trim() || "—")}
                    </span>
                  </div>
                  <Badge
                    className={
                      statusInput === "OPEN"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs"
                    }
                  >
                    {statusInput}
                  </Badge>
                </div>

                {/* Warning if setting limit below current count */}
                {isLimitBelowCurrent && (
                  <div className="sm:col-span-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-semibold">Capacity Below Current Count</p>
                      <p className="text-amber-300/80 mt-0.5">
                        Setting the limit to {limitInput} will mark this event as Full immediately because {currentCount} active registrations already exist. Existing registrations will not be altered.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 6. MEDIA & RESOURCES ── */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-euphoria-aqua border-b border-white/[0.06] pb-2">
                <ImageIcon className="size-4" />
                6. Media & Resources
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Poster */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                    <span>Event Poster URL / Path</span>
                    {posterUrl && (
                      <a
                        href={posterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-euphoria-aqua hover:underline flex items-center gap-1"
                      >
                        Preview original <ExternalLink className="size-2.5" />
                      </a>
                    )}
                  </label>
                  <Input
                    placeholder="e.g. /assets/Fashion Fiesta.jpeg or https://..."
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                  {posterUrl && (
                    <div className="w-24 h-32 rounded-lg border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center">
                      <img
                        src={posterUrl}
                        alt="Poster preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Rulebook */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                    <span>Rulebook URL / Link</span>
                    {rulebookUrl && rulebookUrl.startsWith("http") && (
                      <a
                        href={rulebookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-euphoria-aqua hover:underline flex items-center gap-1"
                      >
                        Open Rulebook <ExternalLink className="size-2.5" />
                      </a>
                    )}
                  </label>
                  <Input
                    placeholder="e.g. https://docs.google.com/document/d/..."
                    value={rulebookUrl}
                    onChange={(e) => setRulebookUrl(e.target.value)}
                    className="bg-black/30 border-white/15 text-white text-xs h-9"
                  />
                  <p className="text-[11px] text-white/40">
                    Google Docs or PDF link. Non-sports events will render a &apos;View Rulebook&apos; button pointing to this URL on the public page.
                  </p>
                </div>
              </div>
            </div>

            {/* ── 7. COORDINATORS (FACULTY & STUDENT) ── */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-euphoria-aqua border-b border-white/[0.06] pb-2">
                <Users className="size-4" />
                7. Event Coordinators (Faculty & Student)
              </div>

              {/* Faculty Coordinators Sub-section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="size-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">
                      Faculty Coordinators
                    </span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-1.5 py-0 font-mono">
                      {facultyCoordinators.length}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFacultyCoordinator}
                    className="border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 text-white/80 text-xs h-8 gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    Add Faculty Coordinator
                  </Button>
                </div>

                {facultyCoordinators.length === 0 ? (
                  <div className="bg-black/20 border border-white/[0.04] rounded-lg p-3 text-xs text-white/40 italic">
                    No faculty coordinators assigned. Click &quot;Add Faculty Coordinator&quot; to add one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {facultyCoordinators.map((coord, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-black/30 border border-white/[0.08]"
                      >
                        <span className="text-[11px] font-mono font-bold text-white/40 w-6 shrink-0 text-center">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Name (e.g. Prof. OP Karada)"
                            value={coord.name}
                            onChange={(e) =>
                              handleUpdateFacultyCoordinator(idx, "name", e.target.value)
                            }
                            className="bg-black/30 border-white/15 text-white text-xs h-8"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Phone (e.g. 88786 81086)"
                            value={coord.phone}
                            onChange={(e) =>
                              handleUpdateFacultyCoordinator(idx, "phone", e.target.value)
                            }
                            className="bg-black/30 border-white/15 text-white text-xs h-8 font-mono"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFacultyCoordinator(idx)}
                          className="text-white/40 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 shrink-0 cursor-pointer"
                          aria-label="Remove faculty coordinator"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.06]" />

              {/* Student Coordinators Sub-section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">
                      Student Coordinators
                    </span>
                    <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] px-1.5 py-0 font-mono">
                      {studentCoordinators.length}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddStudentCoordinator}
                    className="border-white/10 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 text-white/80 text-xs h-8 gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    Add Student Coordinator
                  </Button>
                </div>

                {studentCoordinators.length === 0 ? (
                  <div className="bg-black/20 border border-white/[0.04] rounded-lg p-3 text-xs text-white/40 italic">
                    No student coordinators assigned. Click &quot;Add Student Coordinator&quot; to add one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentCoordinators.map((coord, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-black/30 border border-white/[0.08]"
                      >
                        <span className="text-[11px] font-mono font-bold text-white/40 w-6 shrink-0 text-center">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Name (e.g. Mayank Tanwar)"
                            value={coord.name}
                            onChange={(e) =>
                              handleUpdateStudentCoordinator(idx, "name", e.target.value)
                            }
                            className="bg-black/30 border-white/15 text-white text-xs h-8"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Phone (e.g. 7014125717)"
                            value={coord.phone}
                            onChange={(e) =>
                              handleUpdateStudentCoordinator(idx, "phone", e.target.value)
                            }
                            className="bg-black/30 border-white/15 text-white text-xs h-8 font-mono"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStudentCoordinator(idx)}
                          className="text-white/40 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 shrink-0 cursor-pointer"
                          aria-label="Remove student coordinator"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Public Display Format Helper Note */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 text-xs text-white/50 space-y-1">
                <span className="text-white/70 font-semibold uppercase text-[10px] tracking-wider block">
                  Public Event Page Preview:
                </span>
                <p className="text-[11px] text-white/60">
                  Faculty:{" "}
                  {facultyCoordinators.length > 0
                    ? facultyCoordinators
                        .filter((c) => c.name || c.phone)
                        .map((c) => (c.phone ? `${c.name} - ${c.phone}` : c.name))
                        .join(", ")
                    : "None configured"}
                </p>
                <p className="text-[11px] text-white/60">
                  Student:{" "}
                  {studentCoordinators.length > 0
                    ? studentCoordinators
                        .filter((c) => c.name || c.phone)
                        .map((c) => (c.phone ? `${c.name} - ${c.phone}` : c.name))
                        .join(", ")
                    : "None configured"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/[0.08] pt-3 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={handleCloseEdit}
              className="border-white/10 hover:bg-white/5 text-white/70 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              onClick={handleSave}
              className="bg-euphoria-aqua hover:bg-cyan-400 text-neutral-950 font-bold gap-1.5 cursor-pointer shadow-md shadow-euphoria-aqua/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
