import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Calendar,
  MapPin,
  ArrowRight,
  RotateCcw,
  Loader2,
  ShieldCheck,
  CreditCard,
  Hash,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/euphoria/Navbar";
import { Footer } from "@/components/euphoria/Footer";
import { SmoothCursor } from "@/components/magicui/smooth-cursor";
import { apiPost, apiGet } from "@/lib/api";
import { EuphoriaOtpInput } from "@/components/euphoria/EuphoriaOtpInput";

interface GuestRegistration {
  id: string;
  registrationNumber: string;
  participantCategory: string;
  fullName: string;
  email: string;
  phone: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  event: {
    id: string;
    name: string;
    category: string | { name?: string; slug?: string };
    venue: string;
    date: string;
    time: string;
    registrationType: "INDIVIDUAL" | "GROUP";
  };
  team?: {
    id: string;
    name: string;
    leaderName?: string | null;
    leaderEmail?: string | null;
    members?: { fullName: string; email: string; phone: string }[];
  } | null;
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    method?: string | null;
    transactionId?: string | null;
    paidAt?: string | null;
  } | null;
}

interface GuestPassPurchase {
  id: string;
  passNumber: string;
  fullName: string;
  email: string;
  phone: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  pass: {
    id: string;
    name: string;
    type: string;
    price: number;
  };
  payment?: {
    id: string;
    amount: number;
    status: "PENDING" | "SUCCESS" | "FAILED";
    transactionId?: string | null;
    paidAt?: string | null;
  } | null;
  holders?: {
    id: string;
    holderIndex: number;
    fullName: string;
    email: string;
    phone: string;
  }[];
}

export default function MyRegistrations() {
  const [step, setStep] = useState<"email" | "verify" | "tickets">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const [registrations, setRegistrations] = useState<GuestRegistration[]>([]);
  const [passPurchases, setPassPurchases] = useState<GuestPassPurchase[]>([]);
  const [activeTab, setActiveTab] = useState<"events" | "passes">("events");

  // Reset scroll position to top when route loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiPost<{
        status: string;
        message: string;
        data?: { debugOtp?: string };
      }>("/verification/send-otp", {
        email: cleanEmail,
        purpose: "GUEST_LOOKUP",
      });

      setCountdown(60);
      if (res.data?.debugOtp) {
        setDebugOtp(res.data.debugOtp);
      }
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP & load tickets
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const verifyRes = await apiPost<{
        status: string;
        data: { verificationToken: string };
      }>("/verification/verify-otp", {
        email: email.trim(),
        otp: cleanOtp,
        purpose: "GUEST_LOOKUP",
      });

      const verificationToken = verifyRes.data.verificationToken;
      setToken(verificationToken);

      // Load tickets using lookup endpoint
      const lookupRes = await apiGet<{
        status: string;
        data: {
          registrations: GuestRegistration[];
          passPurchases: GuestPassPurchase[];
        };
      }>(`/registrations/guest-lookup?token=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent(email.trim())}`);

      setRegistrations(lookupRes.data.registrations || []);
      setPassPurchases(lookupRes.data.passPurchases || []);

      if (lookupRes.data.registrations?.length === 0 && (lookupRes.data.passPurchases?.length ?? 0) > 0) {
        setActiveTab("passes");
      } else {
        setActiveTab("events");
      }

      setStep("tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code or lookup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep("email");
    setOtp("");
    setToken(null);
    setRegistrations([]);
    setPassPurchases([]);
    setError(null);
    setDebugOtp(null);
  };

  return (
    <div className="min-h-screen bg-euphoria-dark text-white flex flex-col selection:bg-euphoria-aqua/30 selection:text-white">
      <SmoothCursor />
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-euphoria-aqua/10 border border-euphoria-aqua/20 text-euphoria-aqua text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">
            <Ticket className="size-3.5" />
            Guest Ticket Portal
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            My Tickets & Registrations
          </h1>
          <p className="text-sm text-white/55 max-w-lg mx-auto leading-relaxed">
            Quickly access your event passes and registration details anytime using verified email — no permanent account required.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Enter Email */}
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="size-12 rounded-full bg-euphoria-aqua/10 border border-euphoria-aqua/20 flex items-center justify-center mx-auto text-euphoria-aqua">
                    <Mail className="size-6" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Find Your Registrations</h2>
                  <p className="text-xs text-white/50">
                    Enter the email address you used during event or pass registration.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-center">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/45">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. participant@example.com"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-euphoria-aqua/50 focus:ring-1 focus:ring-euphoria-aqua/30 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-euphoria-aqua/20 flex items-center justify-center gap-2 disabled:bg-white/[0.08] disabled:text-white/40 disabled:border disabled:border-white/[0.08] disabled:shadow-none disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin text-neutral-950" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="size-4 text-neutral-950" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Verify OTP */}
          {step === "verify" && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="size-12 rounded-full bg-euphoria-aqua/10 border border-euphoria-aqua/20 flex items-center justify-center mx-auto text-euphoria-aqua">
                    <ShieldCheck className="size-6" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Security Verification</h2>
                  <p className="text-xs text-white/50 leading-relaxed">
                    We sent a 6-digit code to <br />
                    <span className="text-white font-medium">{email}</span>
                  </p>
                  <p className="text-[11px] text-white/40">
                    Please check your inbox (and spam/junk folder). Code expires in 10 minutes.
                  </p>
                </div>

                {debugOtp && (
                  <div className="p-3 rounded-xl bg-euphoria-aqua/10 border border-euphoria-aqua/20 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-euphoria-aqua font-semibold">
                      Development Mode OTP
                    </p>
                    <p className="text-lg font-mono font-bold text-white mt-0.5 tracking-widest">
                      {debugOtp}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-center">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/45 block mb-3 text-center">
                      Enter 6-Digit Code
                    </label>
                    <EuphoriaOtpInput
                      value={otp}
                      onChange={setOtp}
                      autoFocus
                      disabled={isLoading}
                      hasError={Boolean(error)}
                      accentColor="aqua"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.trim().length !== 6}
                    className="w-full py-3 rounded-xl font-bold text-xs tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-euphoria-aqua/20 flex items-center justify-center gap-2 disabled:bg-white/[0.08] disabled:text-white/40 disabled:border disabled:border-white/[0.08] disabled:shadow-none disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin text-neutral-950" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Access My Tickets
                        <ArrowRight className="size-4 text-neutral-950" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("email")}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      Change Email
                    </button>

                    {countdown > 0 ? (
                      <span className="text-white/40 font-mono">
                        Resend in {countdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-euphoria-aqua hover:underline font-medium"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Tickets & Registrations List */}
          {step === "tickets" && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Account summary banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-euphoria-aqua/15 flex items-center justify-center text-euphoria-aqua font-bold text-sm">
                    {email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/90">{email}</p>
                    <p className="text-[10px] text-white/40">
                      {registrations.length} Event{registrations.length === 1 ? "" : "s"} · {passPurchases.length} Pass{passPurchases.length === 1 ? "" : "es"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  <RotateCcw className="size-3.5" />
                  Look up another email
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
                <button
                  onClick={() => setActiveTab("events")}
                  className={`relative px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors ${
                    activeTab === "events"
                      ? "text-euphoria-aqua"
                      : "text-white/45 hover:text-white/80"
                  }`}
                >
                  Event Registrations ({registrations.length})
                  {activeTab === "events" && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-euphoria-aqua"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("passes")}
                  className={`relative px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors ${
                    activeTab === "passes"
                      ? "text-euphoria-gold"
                      : "text-white/45 hover:text-white/80"
                  }`}
                >
                  Festival Passes ({passPurchases.length})
                  {activeTab === "passes" && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-euphoria-gold"
                    />
                  )}
                </button>
              </div>

              {/* TAB 1: Event Registrations */}
              {activeTab === "events" && (
                <div className="space-y-4">
                  {registrations.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                      <Ticket className="size-10 text-white/20 mx-auto" />
                      <p className="text-sm font-medium text-white/70">No event registrations found</p>
                      <p className="text-xs text-white/40 max-w-sm mx-auto">
                        No active event registrations are linked to <span className="text-white/70">{email}</span>.
                      </p>
                      <a
                        href="/#events"
                        className="inline-flex items-center gap-1.5 text-xs text-euphoria-aqua font-semibold hover:underline pt-2"
                      >
                        Explore Events & Register <ArrowRight className="size-3.5" />
                      </a>
                    </div>
                  ) : (
                    registrations.map((reg) => (
                      <div
                        key={reg.id}
                        className="glass-card rounded-2xl p-5 sm:p-6 border border-white/[0.07] hover:border-white/[0.15] transition-all duration-300 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-euphoria-aqua/80">
                                {typeof reg.event.category === "object" && reg.event.category !== null
                                  ? (reg.event.category as any).name || (reg.event.category as any).slug || "Event"
                                  : reg.event.category || "Event"}
                              </span>
                              <span className="text-white/20">·</span>
                              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                                {reg.event.registrationType === "GROUP" ? "Team Registration" : "Individual Registration"}
                              </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-white">
                              {reg.event.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {reg.status === "CONFIRMED" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="size-3.5" />
                                Confirmed
                              </span>
                            ) : reg.status === "PENDING" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Clock className="size-3.5" />
                                Pending Payment
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                                <XCircle className="size-3.5" />
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Grid info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block mb-0.5">
                              Registration #
                            </span>
                            <span className="font-mono font-bold text-euphoria-aqua">
                              {reg.registrationNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block mb-0.5">
                              Date & Time
                            </span>
                            <span className="text-white/80">
                              {reg.event.date} {reg.event.time ? `· ${reg.event.time}` : ""}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block mb-0.5">
                              Venue
                            </span>
                            <span className="text-white/80">{reg.event.venue || "Campus Grounds"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block mb-0.5">
                              Payment
                            </span>
                            <span className="text-white/80">
                              {reg.payment ? `₹${reg.payment.amount} (${reg.payment.status})` : "Free Event"}
                            </span>
                          </div>
                        </div>

                        {/* Team Info if present */}
                        {reg.team && (
                          <div className="p-3 rounded-xl bg-euphoria-purple/[0.06] border border-euphoria-purple/15 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white/90">
                                Team: {reg.team.name}
                              </span>
                              <span className="text-[10px] text-white/40">
                                Leader: {reg.team.leaderName || reg.fullName}
                              </span>
                            </div>
                            {reg.team.members && reg.team.members.length > 0 && (
                              <div className="pt-1 border-t border-white/[0.06] text-[11px] text-white/60">
                                <span className="text-white/40">Members: </span>
                                {reg.team.members.map((m) => m.fullName).join(", ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: Festival Passes */}
              {activeTab === "passes" && (
                <div className="space-y-4">
                  {passPurchases.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                      <Ticket className="size-10 text-white/20 mx-auto" />
                      <p className="text-sm font-medium text-white/70">No festival passes found</p>
                      <p className="text-xs text-white/40 max-w-sm mx-auto">
                        No passes are currently linked to <span className="text-white/70">{email}</span>.
                      </p>
                      <a
                        href="/#passes"
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold hover:underline pt-2 transition-colors"
                      >
                        View Available Passes <ArrowRight className="size-3.5" />
                      </a>
                    </div>
                  ) : (
                    passPurchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="glass-card rounded-2xl p-5 sm:p-6 border border-euphoria-gold/20 hover:border-euphoria-gold/40 transition-all duration-300 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                          <div>
                            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-euphoria-gold">
                              Festival Access Pass
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                              {purchase.pass.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {purchase.status === "CONFIRMED" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="size-3.5" />
                                Valid Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <Clock className="size-3.5" />
                                {purchase.status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block mb-0.5">
                              Pass Number
                            </span>
                            <span className="font-mono font-bold text-euphoria-gold">
                              {purchase.passNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block mb-0.5">
                              Quantity
                            </span>
                            <span className="text-white/80">{purchase.quantity} Attendee(s)</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block mb-0.5">
                              Pass Holder
                            </span>
                            <span className="text-white/80">{purchase.fullName}</span>
                          </div>
                        </div>

                        {/* Pass Holders Info if bulk purchase */}
                        {((purchase.holders && purchase.holders.length > 0) || purchase.quantity > 1) && (
                          <div className="p-3.5 rounded-xl bg-euphoria-gold/[0.04] border border-euphoria-gold/15 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white/90 flex items-center gap-1.5">
                                <Users className="size-3.5 text-euphoria-gold" /> Pass Holders ({purchase.quantity})
                              </span>
                              <span className="text-[10px] text-white/40">
                                Primary: {purchase.fullName}
                              </span>
                            </div>
                            <div className="pt-1.5 border-t border-white/[0.06] space-y-1.5 text-[11px]">
                              {(purchase.holders && purchase.holders.length > 0
                                ? purchase.holders.some((h) => h.holderIndex === 1)
                                  ? purchase.holders
                                  : [
                                      {
                                        id: "primary",
                                        holderIndex: 1,
                                        fullName: purchase.fullName,
                                        phone: purchase.phone,
                                      },
                                      ...purchase.holders,
                                    ]
                                : [
                                    {
                                      id: "primary",
                                      holderIndex: 1,
                                      fullName: purchase.fullName,
                                      phone: purchase.phone,
                                    },
                                  ]
                              ).map((h, i) => {
                                const isPrimary = h.holderIndex === 1 || i === 0;
                                return (
                                  <div
                                    key={h.id || i}
                                    className="flex items-center justify-between text-white/75 bg-white/[0.02] px-2.5 py-1 rounded"
                                  >
                                    <span>
                                      {h.holderIndex || i + 1}. {h.fullName}{" "}
                                      {isPrimary && (
                                        <span className="text-[9px] text-euphoria-gold uppercase font-bold ml-1">
                                          (Primary)
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-white/40 font-mono text-[10px]">{h.phone}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
