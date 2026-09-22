import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type {
  AdminOverviewStats,
  AdminRegistration,
  AdminPassPurchase,
} from "@/types/admin";
import { toast } from "sonner";
import {
  Download,
  Ticket,
  Users,
  Info,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface AdminExportTabProps {
  stats: AdminOverviewStats | null;
}

interface ExportRegistrationsResponse {
  status: string;
  count: number;
  data: {
    registrations: AdminRegistration[];
  };
}

interface ExportPassResponse {
  status: string;
  count: number;
  data: {
    passPurchases: AdminPassPurchase[];
  };
}

export function AdminExportTab({ stats }: AdminExportTabProps) {
  const [isExportingPasses, setIsExportingPasses] = useState(false);
  const [isExportingRegistrations, setIsExportingRegistrations] = useState(false);

  // Export Festival Pass Orders to CSV
  const handleExportPassOrders = async () => {
    setIsExportingPasses(true);
    try {
      const res = await apiGet<ExportPassResponse>("/admin/pass-purchases/export");
      const data = res.data.passPurchases;
      if (!data || data.length === 0) {
        toast.error("No festival pass orders available to export");
        return;
      }

      const headers = [
        "Order ID",
        "Buyer Full Name",
        "Email",
        "Phone",
        "Participant Category",
        "College Name",
        "Institute",
        "Year",
        "Semester",
        "Pass Name",
        "Quantity",
        "Pass Holders",
        "Order Status",
        "Payment Status",
        "Amount (INR)",
        "Transaction ID",
        "Order Date",
      ];

      const escapeCSV = (val: unknown) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = data.map((p) => {
        const passHoldersStr =
          p.holders && p.holders.length > 0
            ? (p.holders.some((h) => h.holderIndex === 1)
                ? p.holders
                : [
                    { holderIndex: 1, fullName: p.fullName, email: p.email, phone: p.phone },
                    ...p.holders,
                  ]
              )
                .map((h, i) => `${h.holderIndex || i + 1}. ${h.fullName} (${h.email}, ${h.phone})`)
                .join("; ")
            : p.quantity > 1
            ? `1. ${p.fullName} (${p.email}, ${p.phone})`
            : "";

        return [
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
          escapeCSV(passHoldersStr),
          escapeCSV(p.status),
          escapeCSV(p.payment?.status || "UNPAID"),
          escapeCSV(p.payment?.amount ?? ((p.pass?.price || 0) * p.quantity)),
          escapeCSV(p.payment?.transactionId || ""),
          escapeCSV(new Date(p.createdAt).toISOString()),
        ];
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `euphoria_pass_orders_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.length} pass orders to CSV`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export pass orders");
    } finally {
      setIsExportingPasses(false);
    }
  };

  // Export Event Registrations to CSV
  const handleExportRegistrations = async () => {
    setIsExportingRegistrations(true);
    try {
      const res = await apiGet<ExportRegistrationsResponse>("/admin/registrations/export");
      const data = res.data.registrations;
      if (!data || data.length === 0) {
        toast.error("No registrations available to export");
        return;
      }

      const headers = [
        "Registration Number",
        "Participant Full Name",
        "Email",
        "Phone",
        "Category",
        "Scholar Number",
        "Enrollment Number",
        "College Name",
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
        "Gateway Reference",
        "Registration Date",
      ];

      const escapeCSV = (val: unknown) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = data.map((r) => {
        const teamMembers =
          r.team?.members.map((m) => `${m.fullName} (${m.email})`).join("; ") || "";
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

      toast.success(`Exported ${data.length} event registrations to CSV`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export event registrations");
    } finally {
      setIsExportingRegistrations(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold tracking-tight text-white">Export Center</h2>
          <Badge className="bg-euphoria-purple/20 text-euphoria-aqua border border-euphoria-purple/35 text-[11px] font-semibold">
            Data Exports
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-3xl">
          Download attendee registrations and pass orders collected through the Euphoria website.
          Administrators can download these CSV files to review records and supply data to the college&apos;s separate pass issuance system.
        </p>
      </div>

      {/* External Pass System Clarification Banner */}
      <div className="rounded-2xl border border-white/[0.1] bg-[#16112c] p-4 sm:p-5 shadow-lg shadow-black/25 flex flex-col sm:flex-row items-start gap-3.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
          <Info className="size-4" />
        </div>
        <div className="space-y-1 text-xs text-white/70">
          <p className="font-semibold text-white text-sm">
            External Pass Issuance Workflow Notice
          </p>
          <p>
            The Euphoria Admin Portal manages order collection, payments, and registration data.
            Physical and digital festival passes are issued and distributed through a <span className="text-amber-300 font-medium">separate college system</span>.
          </p>
          <p className="text-white/50">
            Exporting a CSV downloads the data to your device so you can supply it to the external ticketing administration team.
          </p>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Festival Pass Orders */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl shadow-lg shadow-black/25 flex flex-col justify-between hover:border-white/[0.18] transition-all">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Ticket className="size-4" />
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold border-white/[0.12] text-white/70">
                CSV FORMAT
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-white">
              Festival Pass Orders
            </CardTitle>
            <CardDescription className="text-xs text-white/60 mt-1 leading-relaxed">
              Purchase and payment records for festival passes collected through Euphoria. Contains buyer contact details, order IDs, quantities, order status, amount, and payment references.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Data Source</span>
                <span className="font-medium text-white">Euphoria Website Pass Orders</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">File Type</span>
                <span className="font-mono text-[11px] text-white/80">.csv (UTF-8)</span>
              </div>
              {stats && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Available Orders</span>
                  <span className="font-semibold text-emerald-400">
                    {stats.totalPassPurchases} orders
                  </span>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleExportPassOrders}
              disabled={isExportingPasses}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9.5 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {isExportingPasses ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Preparing CSV Export...
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  Export Pass Orders CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Event Registrations */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl shadow-lg shadow-black/25 flex flex-col justify-between hover:border-white/[0.18] transition-all">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-euphoria-purple/15 text-pink-300 border border-euphoria-purple/30">
                <Users className="size-4" />
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold border-white/[0.12] text-white/70">
                CSV FORMAT
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-white">
              Event Registrations
            </CardTitle>
            <CardDescription className="text-xs text-white/60 mt-1 leading-relaxed">
              Participant and registration information for all Euphoria events. Contains participant details, college name, scholar numbers, event categories, team members, and payment confirmation.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Data Source</span>
                <span className="font-medium text-white">Euphoria Website Event Signups</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">File Type</span>
                <span className="font-mono text-[11px] text-white/80">.csv (UTF-8)</span>
              </div>
              {stats && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Available Registrations</span>
                  <span className="font-semibold text-emerald-400">
                    {stats.totalRegistrations} registrations
                  </span>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleExportRegistrations}
              disabled={isExportingRegistrations}
              className="w-full gap-2 bg-gradient-to-r from-euphoria-purple to-euphoria-plum hover:opacity-90 text-white font-semibold text-xs h-9.5 rounded-xl shadow-sm transition-opacity cursor-pointer"
            >
              {isExportingRegistrations ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Preparing CSV Export...
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  Export Registrations CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integration Guidance Footer */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-white/50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>CSVs are generated live from the current database records with UTF-8 encoding.</span>
        </div>
        <span className="text-[11px] text-white/40">
          Format schema subject to college requirements
        </span>
      </div>
    </div>
  );
}
