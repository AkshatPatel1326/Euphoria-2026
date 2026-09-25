import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminOverviewStats, AdminRegistration, AdminPassPurchase } from "@/types/admin";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  Users,
  Ticket,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface AdminOverviewTabProps {
  stats: AdminOverviewStats | null;
  isAdmin: boolean;
  onSelectTab: (tab: string) => void;
  onViewRegistration: (reg: AdminRegistration) => void;
  onViewPassPurchase: (purchase: AdminPassPurchase) => void;
}

export function AdminOverviewTab({
  stats,
  isAdmin,
  onSelectTab,
  onViewRegistration,
  onViewPassPurchase,
}: AdminOverviewTabProps) {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl p-5 shadow-lg shadow-black/25 hover:border-white/[0.18] transition-all">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Event Registrations
            </CardTitle>
            <div className="flex size-9 items-center justify-center rounded-xl bg-euphoria-purple/15 text-pink-300 border border-euphoria-purple/30">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-extrabold tracking-tight text-white">
              {stats.totalRegistrations}
            </div>
            <div className="mt-2.5 flex items-center flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                <CheckCircle className="size-3 mr-1" />
                {stats.registrationsByStatus.confirmed} confirmed
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                <Clock className="size-3 mr-1" />
                {stats.registrationsByStatus.pending} pending
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pass Orders — Admin Only */}
        {isAdmin && (
          <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl p-5 shadow-lg shadow-black/25 hover:border-white/[0.18] transition-all">
            <CardHeader className="p-0 flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Pass Orders
              </CardTitle>
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Ticket className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-extrabold tracking-tight text-white">
                {stats.totalPassPurchases}
              </div>
              <div className="mt-2.5 flex items-center flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  <CheckCircle className="size-3 mr-1" />
                  {stats.passesByStatus.confirmed} confirmed
                </span>
                <span className="inline-flex items-center text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  <Clock className="size-3 mr-1" />
                  {stats.passesByStatus.pending} pending
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Revenue */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl p-5 shadow-lg shadow-black/25 hover:border-white/[0.18] transition-all">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Total Revenue
            </CardTitle>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <IndianRupee className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-extrabold tracking-tight text-emerald-400">
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </div>
            <p className="mt-2.5 text-xs text-white/50">
              From completed & successful payments
            </p>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl p-5 shadow-lg shadow-black/25 hover:border-white/[0.18] transition-all">
          <CardHeader className="p-0 flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Pending Actions
            </CardTitle>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-extrabold tracking-tight text-amber-300">
              {stats.registrationsByStatus.pending + (isAdmin ? stats.passesByStatus.pending : 0)}
            </div>
            <p className="mt-2.5 text-xs text-white/50">
              Awaiting confirmation or verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution Donut Chart */}
      <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/25">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="size-4 text-euphoria-aqua" /> Category Distribution
          </CardTitle>
          <CardDescription className="text-xs text-white/60 mt-0.5">
            Registration volume across Euphoria event categories
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            const defaultCategories = [
              {
                id: "cultural",
                name: "Cultural",
                color: "#A232A0",
              },
              {
                id: "literary-management",
                name: "Literary & Management",
                color: "#AF9947",
              },
              {
                id: "science-tech",
                name: "Science & Technology",
                color: "#3EEED5",
              },
              {
                id: "sports",
                name: "Sports",
                color: "#176F63",
              },
            ] as const;

            const categoryItems = defaultCategories.map((cat) => {
              const match = stats.registrationsByCategory?.find(
                (c) =>
                  c.id === cat.id ||
                  c.name.toLowerCase().trim() === cat.name.toLowerCase().trim()
              );
              return {
                ...cat,
                count: match && typeof match.count === "number" ? Math.max(0, Math.round(match.count)) : 0,
              };
            });

            const extraCategories = (stats.registrationsByCategory || [])
              .filter(
                (c) =>
                  !defaultCategories.some(
                    (dc) =>
                      dc.id === c.id ||
                      dc.name.toLowerCase().trim() === c.name.toLowerCase().trim()
                  )
              )
              .map((c) => ({
                id: c.id,
                name: c.name,
                color: "#6366f1",
                count: Math.max(0, Math.round(c.count || 0)),
              }));

            const chartData = [...categoryItems, ...extraCategories];
            const totalVal = chartData.reduce((sum, c) => sum + c.count, 0);
            const isAllZero = totalVal === 0;

            // Only categories with actual registrations form slices in the donut chart.
            // Zero-value categories are NOT given fake or visible slices, per requirements.
            const activeSlices = chartData.filter((c) => c.count > 0);

            const renderTooltip = ({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const pct = totalVal > 0 ? Math.round((item.count / totalVal) * 100) : 0;
                return (
                  <div className="rounded-xl border border-white/10 bg-[#1e1738]/95 px-3 py-2 shadow-2xl backdrop-blur-md text-xs pointer-events-none">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-white">{item.name}</span>
                    </div>
                    <div className="mt-1 text-white/70">
                      <span className="font-bold text-white tabular-nums">{item.count}</span>{" "}
                      {item.count === 1 ? "registration" : "registrations"}{" "}
                      <span className="text-white/40">({pct}%)</span>
                    </div>
                  </div>
                );
              }
              return null;
            };

            return (
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-around gap-6 py-2">
                {/* Left/Center: Donut Chart with Center Total */}
                <div className="relative w-[210px] h-[210px] shrink-0 flex items-center justify-center">
                  <PieChart width={210} height={210} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    {activeSlices.length > 0 ? (
                      <Pie
                        data={activeSlices}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        stroke="#16112c"
                        strokeWidth={activeSlices.length > 1 ? 2.5 : 0}
                        isAnimationActive={true}
                        animationDuration={500}
                      >
                        {activeSlices.map((entry) => (
                          <Cell key={entry.id} fill={entry.color} />
                        ))}
                      </Pie>
                    ) : (
                      <Pie
                        data={[{ name: "empty", value: 1 }]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        fill="rgba(255, 255, 255, 0.06)"
                        stroke="none"
                        isAnimationActive={false}
                      />
                    )}
                    <Tooltip content={renderTooltip} wrapperStyle={{ outline: "none" }} />
                  </PieChart>

                  {/* Center Content: TOTAL and Real Count */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                      Total
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none my-0.5 tabular-nums">
                      {totalVal}
                    </span>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-white/40">
                      {totalVal === 1 ? "Registration" : "Registrations"}
                    </span>
                  </div>
                </div>

                {/* Right: Category Legend */}
                <div className="flex-1 w-full max-w-md space-y-2">
                  <div className="grid grid-cols-1 gap-1.5">
                    {chartData.map((cat) => {
                      const percentage = totalVal > 0 ? Math.round((cat.count / totalVal) * 100) : 0;
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-colors"
                        >
                          {/* Category Name with Color Bullet */}
                          <div className="flex items-center gap-2.5 min-w-0 pr-3">
                            <span
                              className="size-2.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span
                              className="text-xs sm:text-sm font-medium text-white/90 leading-snug break-words sm:truncate"
                              title={cat.name}
                            >
                              {cat.name}
                            </span>
                          </div>

                          {/* Registration Count and Percentage */}
                          <div className="flex items-center gap-4 shrink-0 tabular-nums">
                            <span className="text-xs sm:text-sm font-bold text-white min-w-[1.5rem] text-right">
                              {cat.count}
                            </span>
                            <span className="text-[11px] sm:text-xs font-semibold text-white/45 min-w-[2.75rem] text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isAllZero && (
                    <p className="pt-1 text-center md:text-left text-[11px] text-white/40">
                      No registrations recorded yet across categories.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Quick Activity Tables */}
      <div className={`grid grid-cols-1 ${isAdmin ? "lg:grid-cols-2" : ""} gap-6`}>
        {/* Recent Registrations */}
        <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl shadow-lg shadow-black/25 overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
            <div>
              <CardTitle className="text-sm font-bold text-white">Recent Registrations</CardTitle>
              <CardDescription className="text-[11px] text-white/60 mt-0.5">Latest event sign-ups</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectTab("registrations")}
              className="text-xs font-semibold gap-1 text-euphoria-aqua hover:text-euphoria-aqua hover:bg-euphoria-aqua/10 px-2.5 py-1 rounded-lg h-7 transition-colors"
            >
              View all <ArrowRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {stats.recentRegistrations.length === 0 ? (
              <div className="py-6 text-center text-xs text-white/50">
                No registrations recorded yet.
              </div>
            ) : (
              <div className="space-y-1">
                {stats.recentRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-3 text-xs border border-transparent hover:border-white/[0.06]"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate text-xs sm:text-sm">
                          {reg.fullName}
                        </span>
                        <span className="text-[10px] font-mono text-white/60 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">
                          {reg.registrationNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/70 truncate">
                        {reg.event?.name}
                        {reg.team && ` (${reg.team.name})`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          reg.status === "CONFIRMED"
                            ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/15 font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-md"
                            : reg.status === "PENDING"
                            ? "border-amber-500/30 text-amber-300 bg-amber-500/15 font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-md"
                            : "border-rose-500/30 text-rose-300 bg-rose-500/15 font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-md"
                        }
                      >
                        {reg.status}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-white/60 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
                        onClick={() => onViewRegistration(reg)}
                        title="View details"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Pass Orders — Admin Only */}
        {isAdmin && (
          <Card className="border border-white/[0.1] bg-[#16112c] rounded-2xl shadow-lg shadow-black/25 overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div>
                <CardTitle className="text-sm font-bold text-white">Recent Pass Orders</CardTitle>
                <CardDescription className="text-[11px] text-white/60 mt-0.5">Latest festival pass orders</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectTab("passes")}
                className="text-xs font-semibold gap-1 text-euphoria-aqua hover:text-euphoria-aqua hover:bg-euphoria-aqua/10 px-2.5 py-1 rounded-lg h-7 transition-colors"
              >
                View all <ArrowRight className="size-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              {stats.recentPassPurchases.length === 0 ? (
                <div className="py-6 text-center text-xs text-white/50">
                  No pass orders recorded yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {stats.recentPassPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-3 text-xs border border-transparent hover:border-white/[0.06]"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate text-xs sm:text-sm">
                            {purchase.fullName}
                          </span>
                          <span className="text-[10px] font-mono text-white/60 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">
                            {purchase.passNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/70 truncate">
                          {purchase.pass?.name} • Qty: {purchase.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            purchase.status === "CONFIRMED"
                              ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/15 font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-md"
                              : purchase.status === "PENDING"
                              ? "border-amber-500/30 text-amber-300 bg-amber-500/15 font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-md"
                              : "border-rose-500/30 text-rose-300 bg-rose-500/15 font-semibold text-[10px] tracking-wide px-2 py-0.5 rounded-md"
                          }
                        >
                          {purchase.status}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-white/60 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
                          onClick={() => onViewPassPurchase(purchase)}
                          title="View details"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
