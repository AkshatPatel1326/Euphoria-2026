import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AdminRegistration, RegistrationStatus } from "@/types/admin";
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  CreditCard,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  Trash2,
  MapPin,
  BookOpen,
} from "lucide-react";

interface RegistrationDetailModalProps {
  registration: AdminRegistration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onUpdateStatus?: (id: string, status: RegistrationStatus) => void;
  onDelete?: (registration: AdminRegistration) => void;
}

export function RegistrationDetailModal({
  registration,
  open,
  onOpenChange,
  isAdmin,
  onUpdateStatus,
  onDelete,
}: RegistrationDetailModalProps) {
  if (!registration) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 gap-1 text-[11px] font-semibold">
            <CheckCircle className="size-3" /> Confirmed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 gap-1 text-[11px] font-semibold">
            <Clock className="size-3" /> Pending
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30 gap-1 text-[11px] font-semibold">
            <XCircle className="size-3" /> Cancelled
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30 gap-1 text-[11px] font-semibold">
            <Ban className="size-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline" className="border-white/[0.12] text-white/80">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-semibold">
            Paid
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[11px] font-semibold">
            Payment Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30 text-[11px] font-semibold">
            Payment Failed
          </Badge>
        );
      default:
        return <Badge variant="outline" className="border-white/[0.12] text-white/80">{status || "Unpaid"}</Badge>;
    }
  };

  const canDelete =
    isAdmin &&
    (registration.status === "CANCELLED" || registration.status === "REJECTED") &&
    registration.payment?.status !== "SUCCESS";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#16112c] border border-white/[0.1] text-white shadow-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-mono">
                {registration.registrationNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/60 mt-0.5">
                Registered on{" "}
                {new Date(registration.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(registration.status)}
              {getPaymentBadge(registration.payment?.status)}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Section 1: REGISTRATION */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5 mb-2.5">
              <Calendar className="size-3.5 text-euphoria-aqua" /> Registration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
              <div>
                <span className="text-xs text-white/50 block">Registration ID</span>
                <span className="font-mono text-xs font-semibold text-white bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08] inline-block mt-0.5">
                  {registration.registrationNumber}
                </span>
              </div>
              <div>
                <span className="text-xs text-white/50 block">Current Status</span>
                <div className="mt-0.5">{getStatusBadge(registration.status)}</div>
              </div>
              <div>
                <span className="text-xs text-white/50 block">Registration Date</span>
                <span className="text-xs text-white/80">
                  {new Date(registration.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-white/[0.08]" />

          {/* Section 2: PARTICIPANT */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5 mb-2.5">
              <User className="size-3.5 text-euphoria-purple" /> Participant
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
              <div>
                <span className="text-xs text-white/50 block">Full Name</span>
                <span className="font-medium text-white">{registration.fullName}</span>
              </div>
              <div>
                <span className="text-xs text-white/50 block">Category</span>
                <Badge variant="secondary" className="text-xs mt-0.5 bg-white/[0.08] text-white/90 border border-white/[0.1]">
                  {registration.participantCategory}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <Mail className="size-3.5 text-white/40 shrink-0" />
                <span className="truncate">{registration.email}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <Phone className="size-3.5 text-white/40 shrink-0" />
                <span>{registration.phone}</span>
              </div>
              {registration.collegeName && (
                <div className="flex items-center gap-2 sm:col-span-2 text-white/80 text-xs">
                  <Building className="size-3.5 text-white/40 shrink-0" />
                  <span className="truncate">{registration.collegeName}</span>
                </div>
              )}
              {registration.participantCategory === "SAGE" ? (
                <>
                  {registration.scholarNumber && (
                    <div>
                      <span className="text-xs text-white/50 block">Scholar Number</span>
                      <span className="text-xs text-white/90 font-mono">{registration.scholarNumber}</span>
                    </div>
                  )}
                  {registration.enrollmentNumber && (
                    <div>
                      <span className="text-xs text-white/50 block">Enrollment Number</span>
                      <span className="text-xs text-white/90 font-mono">{registration.enrollmentNumber}</span>
                    </div>
                  )}
                  {registration.institute && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-white/50 block">Institute</span>
                      <span className="text-xs text-white/90 font-medium flex items-center gap-1.5 mt-0.5">
                        <Building className="size-3 text-euphoria-aqua/70 shrink-0" />
                        {registration.institute}
                      </span>
                    </div>
                  )}
                  {registration.year && (
                    <div>
                      <span className="text-xs text-white/50 block">Year</span>
                      <span className="text-xs text-white/90 font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="size-3 text-white/40 shrink-0" />
                        {registration.year}
                      </span>
                    </div>
                  )}
                  {registration.semester && (
                    <div>
                      <span className="text-xs text-white/50 block">Semester</span>
                      <span className="text-xs text-euphoria-aqua font-medium flex items-center gap-1.5 mt-0.5">
                        <BookOpen className="size-3 text-euphoria-aqua/70 shrink-0" />
                        {registration.semester}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {registration.course && (
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <GraduationCap className="size-3.5 text-white/40 shrink-0" />
                      <span>
                        {registration.course} {registration.year ? `(${registration.year})` : ""}
                      </span>
                    </div>
                  )}
                  {registration.city && (
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <MapPin className="size-3.5 text-white/40 shrink-0" />
                      <span>{registration.city}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator className="bg-white/[0.08]" />

          {/* Section 3: EVENT */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5 mb-2.5">
              <Calendar className="size-3.5 text-pink-400" /> Event
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
              <div>
                <span className="text-xs text-white/50 block">Event Name</span>
                <span className="font-semibold text-white">{registration.event.name}</span>
              </div>
              <div>
                <span className="text-xs text-white/50 block">Category</span>
                <span className="text-white/80 text-xs">{registration.event.category?.name || "General"}</span>
              </div>
              <div>
                <span className="text-xs text-white/50 block">Registration Type</span>
                <Badge variant="outline" className="text-xs mt-0.5 border-white/[0.12] text-white/80">
                  {registration.event.registrationType}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-white/50 block">Event Fee</span>
                <span className="font-semibold text-white text-xs">
                  {registration.event.fee > 0 ? `₹${registration.event.fee}` : "Free"}
                </span>
              </div>
              {registration.event.venue && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-white/50 block">Venue</span>
                  <span className="text-xs text-white/80">{registration.event.venue}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: TEAM (Group Events Only) */}
          {registration.team && (
            <>
              <Separator className="bg-white/[0.08]" />
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                    <Users className="size-3.5 text-indigo-400" /> Team — {registration.team.name}
                  </h4>
                  <Badge variant="secondary" className="text-xs bg-white/[0.08] text-white/90 border border-white/[0.1]">
                    {registration.team.members.length + 1} Total Members
                  </Badge>
                </div>
                <div className="space-y-2.5">
                  {/* Team Leader */}
                  <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/25 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 text-[10px] font-semibold">
                          TEAM LEADER
                        </Badge>
                        <span className="font-semibold text-white">{registration.fullName}</span>
                      </div>
                    </div>
                    <p className="text-white/60 text-[11px]">
                      {registration.email} • {registration.phone}
                    </p>
                  </div>

                  {/* Team Members */}
                  {registration.team.members.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                        TEAM MEMBERS ({registration.team.members.length})
                      </span>
                      {registration.team.members.map((member, idx) => (
                        <div
                          key={member.id || idx}
                          className="bg-white/[0.025] p-2.5 rounded-xl border border-white/[0.05] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-white/[0.04] transition-colors"
                        >
                          <div>
                            <span className="font-medium text-white">{member.fullName}</span>
                            <p className="text-white/60 text-[11px]">
                              {member.email} • {member.phone}
                            </p>
                          </div>
                          {member.collegeName && (
                            <span className="text-white/50 text-[11px] truncate max-w-xs">
                              {member.collegeName}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator className="bg-white/[0.08]" />

          {/* Section 5: PAYMENT */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5 mb-2.5">
              <CreditCard className="size-3.5 text-emerald-400" /> Payment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
              <div>
                <span className="text-xs text-white/50 block">Amount</span>
                <span className="text-base font-bold text-emerald-400">
                  ₹{registration.payment?.amount ?? registration.event.fee}
                </span>
              </div>
              <div>
                <span className="text-xs text-white/50 block">Payment Status</span>
                <div className="mt-0.5">{getPaymentBadge(registration.payment?.status)}</div>
              </div>
              {(registration.event.id === "cultural-12" ||
                registration.event.name?.toLowerCase().includes("standup comedy") ||
                registration.event.name?.toLowerCase().includes("pankaj")) && (
                <div className="sm:col-span-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs text-white/50">Registration Pricing</span>
                  {(registration as any).appliedPassId || registration.payment?.amount === 49 ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Festival Pass Discount (₹49)
                      </span>
                      {(registration as any).appliedPassId && (
                        <p className="font-mono text-[10px] text-white/60 mt-0.5">
                          Pass: {(registration as any).appliedPassId}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 text-white/80 border border-white/20">
                      Regular Price (₹199)
                    </span>
                  )}
                </div>
              )}
              {registration.payment?.method && (
                <div>
                  <span className="text-xs text-white/50 block">Payment Method</span>
                  <span className="text-white font-medium text-xs">{registration.payment.method}</span>
                </div>
              )}
              {registration.payment?.transactionId && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-white/50 block">Transaction ID</span>
                  <code className="text-xs font-mono bg-white/[0.06] text-white/90 px-2 py-0.5 rounded border border-white/[0.08]">
                    {registration.payment.transactionId}
                  </code>
                </div>
              )}
              {registration.payment?.gatewayReference && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-white/50 block">Gateway Reference</span>
                  <code className="text-xs font-mono bg-white/[0.06] text-white/90 px-2 py-0.5 rounded border border-white/[0.08]">
                    {registration.payment.gatewayReference}
                  </code>
                </div>
              )}
              {registration.payment?.paidAt && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-white/50 block">Paid Timestamp</span>
                  <span className="text-xs text-white/80">
                    {new Date(registration.payment.paidAt).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 6: ACTIONS */}
          <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            {/* Status change actions */}
            {onUpdateStatus && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/50 font-medium mr-1">Status:</span>
                {registration.status !== "CONFIRMED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30 text-xs h-8"
                    onClick={() => onUpdateStatus(registration.id, "CONFIRMED")}
                  >
                    <CheckCircle className="size-3.5 mr-1" /> Mark Confirmed
                  </Button>
                )}
                {registration.status !== "CANCELLED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border-amber-500/30 text-xs h-8"
                    onClick={() => onUpdateStatus(registration.id, "CANCELLED")}
                  >
                    <XCircle className="size-3.5 mr-1" /> Mark Cancelled
                  </Button>
                )}
                {registration.status !== "REJECTED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border-rose-500/30 text-xs h-8"
                    onClick={() => onUpdateStatus(registration.id, "REJECTED")}
                  >
                    <Ban className="size-3.5 mr-1" /> Mark Rejected
                  </Button>
                )}
              </div>
            )}

            {/* Admin-only Permanent Delete */}
            {isAdmin && onDelete && (
              <Button
                size="sm"
                variant="destructive"
                disabled={!canDelete}
                title={
                  canDelete
                    ? "Permanently delete this registration"
                    : "Registration must be Cancelled or Rejected and Unpaid before deletion"
                }
                onClick={() => onDelete(registration)}
                className="gap-1.5 ml-auto text-xs h-8"
              >
                <Trash2 className="size-3.5" /> Delete Registration
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
