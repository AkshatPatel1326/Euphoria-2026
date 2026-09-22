import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Navbar } from "@/components/euphoria/Navbar";
import { Footer } from "@/components/euphoria/Footer";
import { SmoothCursor } from "@/components/magicui/smooth-cursor";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ticket,
  RotateCcw,
  Home,
  ShieldCheck,
} from "lucide-react";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = (searchParams.get("status") || "unknown").toLowerCase();
  const txnid = searchParams.get("txnid") || "";
  const type = searchParams.get("type") || "REGISTRATION";
  const number = searchParams.get("number") || "";
  const errorMsg = searchParams.get("error") || "";

  // Reset scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const isSuccess = status === "success";
  const isCancelled = status === "cancelled" || status === "usercancelled";
  const isFailed = status === "failed" || !isSuccess && !isCancelled;

  return (
    <div className="min-h-screen bg-euphoria-dark text-white flex flex-col selection:bg-euphoria-aqua/30 selection:text-white relative overflow-x-hidden">
      <SmoothCursor />
      <Navbar />

      {/* Atmospheric ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[700px] h-[500px] rounded-full"
          style={{
            background: isSuccess
              ? "radial-gradient(circle, rgba(62,238,213,0.08) 0%, rgba(23,111,99,0.05) 45%, transparent 70%)"
              : isCancelled
              ? "radial-gradient(circle, rgba(175,153,71,0.09) 0%, rgba(162,50,160,0.06) 45%, transparent 70%)"
              : "radial-gradient(circle, rgba(244,63,94,0.07) 0%, rgba(162,50,160,0.06) 45%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(23,111,99,0.05) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <main className="flex-1 pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full flex items-center justify-center">
        <div className="relative w-full">
          {/* Subtle card glow border */}
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent pointer-events-none" />

          {/* Card Body */}
          <div className="relative rounded-3xl border border-white/[0.08] bg-euphoria-surface/90 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center space-y-6 overflow-hidden">
            {/* Top accent line */}
            <div
              className={`h-px w-full absolute top-0 left-0 right-0 bg-gradient-to-r from-transparent ${
                isSuccess
                  ? "via-euphoria-aqua/50"
                  : isCancelled
                  ? "via-euphoria-gold/50"
                  : "via-rose-400/50"
              } to-transparent`}
            />

            {/* Status Halo Icon */}
            {isSuccess && (
              <div className="relative size-20 sm:size-24 rounded-full mx-auto flex items-center justify-center border border-emerald-500/30 bg-emerald-500/[0.08] shadow-[0_0_35px_rgba(16,185,129,0.18)]">
                <CheckCircle2 className="size-9 sm:size-11 text-emerald-400" />
              </div>
            )}

            {isCancelled && (
              <div className="relative size-20 sm:size-24 rounded-full mx-auto flex items-center justify-center border border-euphoria-gold/30 bg-euphoria-gold/[0.08] shadow-[0_0_35px_rgba(175,153,71,0.18)]">
                <AlertTriangle className="size-9 sm:size-11 text-euphoria-gold" />
              </div>
            )}

            {isFailed && (
              <div className="relative size-20 sm:size-24 rounded-full mx-auto flex items-center justify-center border border-rose-400/30 bg-rose-500/[0.08] shadow-[0_0_35px_rgba(244,63,94,0.15)]">
                <XCircle className="size-9 sm:size-11 text-rose-400" />
              </div>
            )}

            {/* Eyebrow Pill */}
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border backdrop-blur-sm text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase ${
                  isSuccess
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : isCancelled
                    ? "border-euphoria-gold/35 bg-euphoria-gold/[0.1] text-euphoria-gold"
                    : "border-rose-400/30 bg-rose-500/10 text-rose-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSuccess
                      ? "bg-emerald-400"
                      : isCancelled
                      ? "bg-euphoria-gold"
                      : "bg-rose-400"
                  }`}
                />
                {isSuccess
                  ? "Payment Completed"
                  : isCancelled
                  ? "Payment Cancelled"
                  : "Payment Unsuccessful"}
              </span>
            </div>

            {/* Heading & Subtitle */}
            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                {isSuccess && (type === "PASS" ? "Pass Purchase Confirmed" : "Registration Confirmed")}
                {isCancelled && "Payment Cancelled"}
                {isFailed && "Payment Unsuccessful"}
              </h1>
              <p className="text-sm sm:text-[15px] text-white/65 max-w-md mx-auto leading-relaxed [text-wrap:pretty]">
                {isSuccess &&
                  (type === "PASS"
                    ? "Your payment was processed successfully. Pass purchase confirmed. Your digital pass(es) will be delivered to the registered email address(es) within 1–2 working days."
                    : "Your payment was processed successfully. Registration confirmed. A confirmation email has been sent to your registered email address.")}
                {isCancelled &&
                  "The transaction was cancelled on the checkout page and no funds were debited. You can retry anytime from My Tickets or continue exploring Euphoria."}
                {isFailed &&
                  (errorMsg ||
                    "The payment gateway could not complete the transaction and no charges were made. You can retry anytime from My Tickets or browse events.")}
              </p>
            </div>

            {/* Transaction Metadata Card */}
            {(txnid || number) && (
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4 sm:p-5 text-xs space-y-3 max-w-md mx-auto text-left">
                {number && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/45 font-medium tracking-wide">
                      {type === "PASS" ? "Pass Number" : "Registration Number"}
                    </span>
                    <span className="font-mono font-bold text-euphoria-aqua tracking-wider text-xs sm:text-sm">
                      {number}
                    </span>
                  </div>
                )}
                {txnid && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/45 font-medium tracking-wide">Transaction ID</span>
                    <span className="font-mono text-white/70 text-xs truncate max-w-[180px] sm:max-w-[220px]">
                      {txnid}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                  <span className="text-white/45 font-medium tracking-wide">Status</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      isSuccess
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : isCancelled
                        ? "border-euphoria-gold/30 text-euphoria-gold bg-euphoria-gold/10"
                        : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                    }`}
                  >
                    {status.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Guidance Info Card */}
            {isSuccess && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-euphoria-aqua/[0.08] border border-euphoria-aqua/20 text-xs text-euphoria-aqua/90 flex items-center justify-center gap-2.5 max-w-md mx-auto text-center">
                <ShieldCheck className="size-4 shrink-0 text-euphoria-aqua" />
                <span>A confirmation copy has been sent to your registered email address.</span>
              </div>
            )}

            {isCancelled && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-euphoria-gold/[0.06] border border-euphoria-gold/20 text-xs text-white/70 flex items-start gap-3 max-w-md mx-auto text-left">
                <ShieldCheck className="size-4 sm:size-5 shrink-0 text-euphoria-gold mt-0.5" />
                <p className="leading-relaxed text-xs text-white/65">
                  Your registration details are securely preserved as <strong className="text-white/90">Pending</strong> in your account. You can complete the checkout process whenever you are ready.
                </p>
              </div>
            )}

            {isFailed && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-white/70 flex items-start gap-3 max-w-md mx-auto text-left">
                <ShieldCheck className="size-4 sm:size-5 shrink-0 text-rose-400 mt-0.5" />
                <p className="leading-relaxed text-xs text-white/65">
                  No money was deducted from your account. If an amount was debited by your bank, it will automatically be reversed by your bank.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
              {isSuccess ? (
                <>
                  <button
                    onClick={() => navigate("/my-registrations")}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 font-black text-xs sm:text-sm tracking-[0.15em] uppercase hover:brightness-105 transition-all shadow-lg shadow-euphoria-aqua/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none"
                  >
                    <Ticket className="size-4 text-neutral-950 shrink-0" />
                    View My Tickets
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-white/20 bg-white/[0.05] text-white hover:bg-white/[0.1] hover:border-white/30 font-semibold text-xs sm:text-sm tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                  >
                    <Home className="size-4 text-white shrink-0" />
                    Home
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/my-registrations")}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 font-black text-xs sm:text-sm tracking-[0.15em] uppercase hover:brightness-105 transition-all shadow-lg shadow-euphoria-aqua/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none"
                  >
                    <RotateCcw className="size-4 text-neutral-950 shrink-0" />
                    Retry in My Tickets
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-white/20 bg-white/[0.05] text-white hover:bg-white/[0.1] hover:border-white/30 font-semibold text-xs sm:text-sm tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                  >
                    <Home className="size-4 text-white shrink-0" />
                    Browse Events
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
