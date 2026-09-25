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
import type { AdminPassPurchase, RegistrationStatus } from "@/types/admin";
import {
  User,
  Mail,
  Phone,
  Building,
  CreditCard,
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  Trash2,
  Calendar,
  BookOpen,
  Users,
} from "lucide-react";

interface PassPurchaseDetailModalProps {
  purchase: AdminPassPurchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onUpdateStatus?: (id: string, status: RegistrationStatus) => void;
  onDelete?: (purchase: AdminPassPurchase) => void;
}

export function PassPurchaseDetailModal({
  purchase,
  open,
  onOpenChange,
  isAdmin,
  onUpdateStatus,
  onDelete,
}: PassPurchaseDetailModalProps) {
  if (!purchase) return null;

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
    (purchase.status === "CANCELLED" || purchase.status === "REJECTED") &&
    purchase.payment?.status !== "SUCCESS";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#16112c] border border-white/[0.1] text-white shadow-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-mono">
                  Order #{purchase.passNumber}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-white/60 mt-0.5">
                Placed on{" "}
                {new Date(purchase.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(purchase.status)}
              {getPaymentBadge(purchase.payment?.status)}
            </div>
          </div>
        </DialogHeader>

        {/* External Issuance Clarification Notice */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs text-white/65 flex items-start gap-2.5">
          <Ticket className="size-4 text-indigo-400 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-white">Pass Issuance Note:</span> Physical or digital passes are generated and distributed through the college&apos;s separate ticketing system. This record represents the order collected via Euphoria.
          </p>
        </div>

        <div className="space-y-5 pt-1">
          {/* Buyer Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5 mb-2.5">
              <User className="size-3.5 text-euphoria-purple" /> Buyer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
              <div>
                <span className="text-xs text-white/50 block">Full Name</span>
                <span className="font-medium text-white">{purchase.fullName}</span>
              </div>
              <div>
                <span className="text-xs text-white/50 block">Category</span>
                <Badge variant="secondary" className="text-xs mt-0.5 bg-white/[0.08] text-white/90 border border-white/[0.1]">
                  {purchase.participantCategory}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <Mail className="size-3.5 text-white/40 shrink-0" />
                <span className="truncate">{purchase.email}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <Phone className="size-3.5 text-white/40 shrink-0" />
                <span>{purchase.phone}</span>
              </div>
              {purchase.collegeName && (
                <div className="flex items-center gap-2 sm:col-span-2 text-white/80 text-xs">
                  <Building className="size-3.5 text-white/40 shrink-0" />
                  <span className="truncate">{purchase.collegeName}</span>
                </div>
              )}
              {purchase.participantCategory === "SAGE" && (
                <>
                  {purchase.institute && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-white/50 block">Institute</span>
                      <span className="text-xs text-white/90 font-medium flex items-center gap-1.5 mt-0.5">
                        <Building className="size-3 text-euphoria-aqua/70 shrink-0" />
                        {purchase.institute}
                      </span>
                    </div>
                  )}
                  {purchase.year && (
                    <div>
                      <span className="text-xs text-white/50 block">Year</span>
                      <span className="text-xs text-white/90 font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="size-3 text-white/40 shrink-0" />
                        {purchase.year}
                      </span>
                    </div>
                  )}
                  {purchase.semester && (
                    <div>
                      <span className="text-xs text-white/50 block">Semester</span>
                      <span className="text-xs text-euphoria-aqua font-medium flex items-center gap-1.5 mt-0.5">
                        <BookOpen className="size-3 text-euphoria-aqua/70 shrink-0" />
                        {purchase.semester}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator className="bg-white/[0.08]" />

          {/* Pass & Order Information */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5 mb-2.5">
              <Ticket className="size-3.5 text-indigo-400" /> Order Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
              <div>
                <span className="text-xs text-white/50 block">Pass Type</span>
                <span className="font-semibold text-white">{purchase.pass.name}</span>
                {purchase.pass.subtitle && (
                  <span className="text-xs text-white/60 block">
                    {purchase.pass.subtitle}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs text-white/50 block">Quantity</span>
                <span className="font-bold text-white text-base">{purchase.quantity}</span>
              </div>
              {purchase.pass.features && purchase.pass.features.length > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-white/50 block mb-1">Included Features</span>
                  <div className="flex flex-wrap gap-1.5">
                    {purchase.pass.features.map((feat, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08] text-white/70"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pass Holders for Bulk Orders */}
          {((purchase.holders && purchase.holders.length > 0) || purchase.quantity > 1) && (
            <>
              <Separator className="bg-white/[0.08]" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5 mb-2.5">
                  <Users className="size-3.5 text-amber-400" /> Pass Holders ({purchase.quantity} Total)
                </h4>
                <div className="space-y-2 bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
                  {(purchase.holders && purchase.holders.length > 0
                    ? purchase.holders.some((h) => h.holderIndex === 1)
                      ? purchase.holders
                      : [
                          {
                            id: "primary",
                            holderIndex: 1,
                            fullName: purchase.fullName,
                            email: purchase.email,
                            phone: purchase.phone,
                          },
                          ...purchase.holders,
                        ]
                    : [
                        {
                          id: "primary",
                          holderIndex: 1,
                          fullName: purchase.fullName,
                          email: purchase.email,
                          phone: purchase.phone,
                        },
                      ]
                  ).map((holder, idx) => {
                    const isPurchaser = holder.holderIndex === 1 || idx === 0;
                    return (
                      <div
                        key={holder.id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs"
                      >
                        <div>
                          <span
                            className={`text-[10px] uppercase font-bold mr-2 ${
                              isPurchaser ? "text-amber-400" : "text-white/40"
                            }`}
                          >
                            Pass {holder.holderIndex || idx + 1} {isPurchaser ? "(Purchaser)" : ""}
                          </span>
                          <span className="font-semibold text-white">{holder.fullName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60 text-[11px]">
                          <span>{holder.email}</span>
                          <span>{holder.phone}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Separator className="bg-white/[0.08]" />

          {/* Payment & Transaction Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5 mb-2.5">
              <CreditCard className="size-3.5 text-emerald-400" /> Payment Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
              <div>
                <span className="text-xs text-white/50 block">Total Amount</span>
                <span className="text-lg font-bold text-emerald-400">
                  ₹{purchase.payment?.amount ?? ((purchase.pass.price || 0) * purchase.quantity)}
                </span>
              </div>
              <div>
                <span className="text-xs text-white/50 block">Payment Status</span>
                <div className="mt-0.5">{getPaymentBadge(purchase.payment?.status)}</div>
              </div>
              {purchase.payment?.method && (
                <div>
                  <span className="text-xs text-white/50 block">Payment Method</span>
                  <span className="text-white font-medium">{purchase.payment.method}</span>
                </div>
              )}
              {purchase.payment?.transactionId && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-white/50 block">Transaction ID</span>
                  <code className="text-xs font-mono bg-white/[0.06] text-white/90 px-2 py-0.5 rounded border border-white/[0.08]">
                    {purchase.payment.transactionId}
                  </code>
                </div>
              )}
              {purchase.payment?.gatewayReference && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-white/50 block">Gateway Reference</span>
                  <code className="text-xs font-mono bg-white/[0.06] text-white/90 px-2 py-0.5 rounded border border-white/[0.08]">
                    {purchase.payment.gatewayReference}
                  </code>
                </div>
              )}
              {purchase.payment?.paidAt && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-white/50 block">Paid Timestamp</span>
                  <span className="text-xs text-white/80">
                    {new Date(purchase.payment.paidAt).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Update & Delete Actions */}
          <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            {onUpdateStatus && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/50 font-medium mr-1">Order Status:</span>
                {purchase.status !== "CONFIRMED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30 text-xs h-8"
                    onClick={() => onUpdateStatus(purchase.id, "CONFIRMED")}
                  >
                    <CheckCircle className="size-3.5 mr-1" /> Mark Confirmed
                  </Button>
                )}
                {purchase.status !== "CANCELLED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border-amber-500/30 text-xs h-8"
                    onClick={() => onUpdateStatus(purchase.id, "CANCELLED")}
                  >
                    <XCircle className="size-3.5 mr-1" /> Mark Cancelled
                  </Button>
                )}
                {purchase.status !== "REJECTED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border-rose-500/30 text-xs h-8"
                    onClick={() => onUpdateStatus(purchase.id, "REJECTED")}
                  >
                    <Ban className="size-3.5 mr-1" /> Mark Rejected
                  </Button>
                )}
              </div>
            )}

            {isAdmin && onDelete && (
              <Button
                size="sm"
                variant="destructive"
                disabled={!canDelete}
                title={
                  canDelete
                    ? "Permanently delete this pass order"
                    : "Order must be Cancelled or Rejected and Unpaid before deletion"
                }
                onClick={() => onDelete(purchase)}
                className="gap-1.5 ml-auto text-xs h-8"
              >
                <Trash2 className="size-3.5" /> Delete Order
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
