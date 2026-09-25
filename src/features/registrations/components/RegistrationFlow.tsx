import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  CreditCard,
  Smartphone,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  BookOpen,
  Calendar,
  Hash,
  AlertTriangle,
  RotateCcw,
  Loader2,
  LogIn,
  Users,
  ChevronDown,
} from "lucide-react";
import type { EuphoriaEvent, ParticipantCategory, PaymentStatus } from "@/data/events";
import { apiPost } from "@/lib/api";
import { EuphoriaOtpInput } from "./EuphoriaOtpInput";
import {
  SAGE_INSTITUTES,
  SAGE_YEARS,
  getSemesterFromYear,
} from "@/data/academic";

/* ── Helpers ── */
function isTeamEvent(event: EuphoriaEvent): boolean {
  return event.registrationType === "group" || event.maxTeamSize > 1;
}

type Step = "summary" | "type" | "details" | "verify" | "review" | "payment" | "pending" | "success" | "failed";

const stepLabels: Record<Step, string> = {
  summary: "Event Summary",
  type: "Participant Type",
  details: "Your Details",
  verify: "Email Verification",
  review: "Review",
  payment: "Payment",
  pending: "Processing",
  success: "Registration Confirmed",
  failed: "Payment Failed",
};

const participantTypes: { key: ParticipantCategory; label: string; sub: string; icon: typeof User }[] = [
  { key: "sage", label: "SAGE Student", sub: "Currently enrolled at SAGE University Indore", icon: GraduationCap },
  { key: "other-college", label: "Other College/School Student", sub: "Student at another college or school", icon: BookOpen },
  { key: "general", label: "General", sub: "Open / independent participant", icon: User },
];

const categoryLabel: Record<string, string> = {
  cultural: "Cultural",
  "literary-management": "Literary & Management",
  "science-tech": "Science & Technology",
  sports: "Sports",
  test: "Sandbox QA Test",
};

/* ── Animated container for step transitions ── */
function StepContainer({ step, children }: { step: Step; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Input Field ── */
function Input({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  icon: typeof User;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/45">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white/[0.04] border ${
            error ? "border-red-400/50" : "border-white/[0.08]"
          } rounded-lg pl-10 pr-4 py-2.5 text-sm text-white/80 placeholder-white/15 focus:outline-none focus:border-euphoria-aqua/40 transition-colors`}
        />
      </div>
      {error && <p className="text-[10px] text-red-400/80">{error}</p>}
    </div>
  );
}

function Select({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  label: string;
  icon: typeof User;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | string[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/45">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20 pointer-events-none" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none bg-neutral-900/90 border ${
            error ? "border-red-400/50" : "border-white/[0.08]"
          } rounded-lg pl-10 pr-10 py-2.5 text-sm ${
            value ? "text-white/90" : "text-white/25"
          } focus:outline-none focus:border-euphoria-aqua/40 transition-colors cursor-pointer`}
        >
          <option value="" disabled className="bg-neutral-900 text-white/30">
            {placeholder || `Select ${label}`}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-neutral-900 text-white/90 py-1">
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-white/30 pointer-events-none" />
      </div>
      {error && <p className="text-[10px] text-red-400/80">{error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN REGISTRATION FLOW
   ═══════════════════════════════════════════ */
export function RegistrationFlow({
  event,
  onClose,
}: {
  event: EuphoriaEvent;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("summary");
  const [participantType, setParticipantType] = useState<ParticipantCategory | null>(null);
  const [details, setDetails] = useState<{
    fullName: string;
    email: string;
    phone: string;
    scholarNumber?: string;
    enrollmentNumber?: string;
    institute?: string;
    course?: string;
    year?: string;
    semester?: string;
    collegeName?: string;
    city?: string;
  }>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [teamName, setTeamName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);

  // Email verification state
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);

  // Backend API integration state
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Check if event is Standup Comedy */
  const isStandupComedy =
    event.id === "cultural-12" ||
    event.name.toLowerCase().includes("standup comedy") ||
    event.name.toLowerCase().includes("pankaj");

  // Festival Pass coupon state for Standup Comedy discount
  const [festivalPassInput, setFestivalPassInput] = useState("");
  const [appliedPassId, setAppliedPassId] = useState<string | null>(null);
  const [passDiscount, setPassDiscount] = useState<number>(0);
  const [isValidatingPass, setIsValidatingPass] = useState(false);
  const [passCouponError, setPassCouponError] = useState<string | null>(null);
  const [passCouponSuccess, setPassCouponSuccess] = useState<string | null>(null);

  /* Use centralized event.fee — no string parsing; ₹49 if Festival Pass applied for Standup Comedy */
  const amount = isStandupComedy && appliedPassId ? 49 : event.fee;
  const team = isTeamEvent(event);

  const handleApplyFestivalPass = useCallback(async () => {
    const code = festivalPassInput.trim().toUpperCase();
    if (!code) {
      setPassCouponError("Please enter your Festival Pass ID.");
      return;
    }
    setIsValidatingPass(true);
    setPassCouponError(null);
    setPassCouponSuccess(null);
    try {
      const res = await apiPost<{
        status: string;
        valid?: boolean;
        message?: string;
        data?: {
          valid: boolean;
          discountedPrice: number;
          discountAmount: number;
          originalPrice: number;
          passId: string;
          message?: string;
        };
      }>("/passes/validate-coupon", {
        passId: code,
        eventId: event.id,
      });

      const couponData = res.data?.valid !== undefined ? res.data : (res as any);
      if (couponData.valid) {
        setAppliedPassId(couponData.passId || code);
        setPassDiscount(couponData.discountAmount || 150);
        setPassCouponSuccess("Festival Pass verified");
        setPassCouponError(null);
      } else {
        setAppliedPassId(null);
        setPassDiscount(0);
        setPassCouponError(couponData.message || res.message || "Invalid or inactive Festival Pass.");
        setPassCouponSuccess(null);
      }
    } catch (err: any) {
      setAppliedPassId(null);
      setPassDiscount(0);
      setPassCouponError(err.message || "Invalid or inactive Festival Pass.");
      setPassCouponSuccess(null);
    } finally {
      setIsValidatingPass(false);
    }
  }, [festivalPassInput, event.id]);

  const handleRemoveFestivalPass = useCallback(() => {
    setAppliedPassId(null);
    setPassDiscount(0);
    setFestivalPassInput("");
    setPassCouponError(null);
    setPassCouponSuccess(null);
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const sendOtp = useCallback(async (emailToUse?: string) => {
    const targetEmail = (emailToUse || details.email).trim();
    if (!targetEmail) return;
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      const res = await apiPost<{
        status: string;
        message: string;
        data?: {
          debugOtp?: string;
          expiresInSeconds?: number;
        };
      }>("/verification/send-otp", {
        email: targetEmail,
        purpose: "EVENT_REGISTRATION",
      });
      setOtpCountdown(60);
      if (res.data?.debugOtp) {
        setDebugOtp(res.data.debugOtp);
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  }, [details.email]);

  const verifyOtp = useCallback(async () => {
    const trimmedOtp = otpCode.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await apiPost<{
        status: string;
        data: {
          verificationToken: string;
        };
      }>("/verification/verify-otp", {
        email: details.email.trim(),
        otp: trimmedOtp,
        purpose: "EVENT_REGISTRATION",
      });
      setVerificationToken(res.data.verificationToken);
      setVerifiedEmail(details.email.trim());
      setStep("review");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Invalid or expired verification code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [details.email, otpCode]);

  const updateDetail = useCallback((key: string, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
    // Invalidate verification if email changed
    if (key === "email") {
      setVerificationToken(null);
      setVerifiedEmail(null);
      setOtpCode("");
      setOtpError(null);
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /* ── Validation ── */
  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    if (step === "type" && !participantType) {
      errs.participantType = "Please select a participant type";
    }

    if (step === "details") {
      if (!details.fullName.trim()) errs.fullName = "Name is required";
      if (!details.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) errs.email = "Invalid email";
      if (!details.phone.trim()) errs.phone = "Phone is required";
      else if (!/^\d{10}$/.test(details.phone.replace(/\D/g, ""))) errs.phone = "Enter a valid 10-digit number";

      if (participantType === "sage") {
        if (!details.scholarNumber?.trim()) errs.scholarNumber = "Scholar number is required";
        if (!details.enrollmentNumber?.trim()) errs.enrollmentNumber = "Enrollment number is required";
        if (!details.institute?.trim()) errs.institute = "Please select your institute.";
        if (!details.year?.trim()) errs.year = "Please select your year.";
      }
      if (participantType === "other-college") {
        if (!details.collegeName?.trim()) errs.collegeName = "College / School name is required";
      }
      // General requires only normal participant details (Full Name, Email, Phone) which are validated above

      /* Team validation: require team name for team events, no member details required */
      if (team) {
        if (!teamName.trim()) errs.teamName = "Team name is required";
      }
    }

    if (step === "payment" && !paymentMethod) {
      errs.paymentMethod = "Select a payment method";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [step, participantType, details, team, teamName, paymentMethod]);

  const next = useCallback(async () => {
    if (!validate()) return;

    if (step === "details") {
      // If email is already verified and unchanged, skip directly to review
      if (verificationToken && verifiedEmail === details.email.trim()) {
        setStep("review");
        return;
      }
      // Send OTP to email and go to verify step
      await sendOtp();
      setStep("verify");
      return;
    }

    if (step === "review" && amount > 0) {
      setStep("payment");
      return;
    }

    if (step === "payment" || (step === "review" && amount === 0)) {
      // Submit registration to backend
      setIsSubmitting(true);
      setApiError(null);
      setStep("pending");

      try {
        let currentRegId = registrationId;
        let currentPaymentToken = paymentToken;

        // If registration wasn't created yet, create it
        if (!currentRegId) {
          const derivedSemester = participantType === "sage" && details.year
            ? getSemesterFromYear(details.year)
            : undefined;

          const regBody: Record<string, unknown> = {
            eventId: event.id,
            participantCategory: participantType,
            personalDetails: {
              fullName: details.fullName,
              email: details.email,
              phone: details.phone,
            },
            verificationToken,
            scholarNumber: participantType === "sage" ? details.scholarNumber || undefined : undefined,
            enrollmentNumber: participantType === "sage" ? details.enrollmentNumber || undefined : undefined,
            institute: participantType === "sage" ? details.institute || undefined : undefined,
            collegeName: participantType === "other-college" ? details.collegeName || undefined : undefined,
            course: participantType === "other-college" ? details.course || undefined : undefined,
            year: details.year || undefined,
            semester: derivedSemester,
            city: participantType === "general" ? details.city || undefined : undefined,
            paymentMethod: paymentMethod || undefined,
            festivalPassId: appliedPassId || undefined,
          };

          if (team) {
            regBody.teamName = teamName.trim();
          }

          const regRes = await apiPost<{
            status: string;
            data: {
              registration: {
                id: string;
                registrationNumber: string;
                status: string;
                payment?: { id: string; status: string } | null;
              };
              paymentToken?: string;
            };
          }>("/registrations", regBody);

          const reg = regRes.data.registration;
          currentRegId = reg.id;
          currentPaymentToken = regRes.data.paymentToken || null;
          setRegistrationId(reg.id);
          setRegistrationNumber(reg.registrationNumber);
          if (currentPaymentToken) {
            setPaymentToken(currentPaymentToken);
          }

          // If free event — registration already CONFIRMED
          if (amount === 0 || reg.status === "CONFIRMED") {
            setPaymentStatus("success");
            setStep("success");
            setIsSubmitting(false);
            return;
          }
        }

        // Paid event — initiate payment via Easebuzz (or simulation fallback)
        const payRes = await apiPost<{
          status: string;
          data: {
            mode: "EASEBUZZ" | "SIMULATION";
            paymentUrl?: string;
            txnid?: string;
            registrationStatus?: string;
            payment?: { id: string; status: string };
          };
        }>("/payments/easebuzz/initiate", {
          registrationId: currentRegId,
          paymentToken: currentPaymentToken,
          paymentMethod: paymentMethod || "upi",
        });

        if (payRes.data.mode === "EASEBUZZ" && payRes.data.paymentUrl) {
          window.location.href = payRes.data.paymentUrl;
          return;
        }

        const regStatus =
          payRes.data.registrationStatus ||
          (payRes.data as any).simulationResult?.registrationStatus;

        if (payRes.data.mode === "SIMULATION" && regStatus === "CONFIRMED") {
          setPaymentStatus("success");
          setStep("success");
        } else {
          setPaymentStatus("failed");
          setApiError("Payment was not confirmed. Please try again.");
          setStep("failed");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed. Please try again.";
        setApiError(message);
        setPaymentStatus("failed");
        setStep("failed");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const order: Step[] = amount === 0
      ? ["summary", "type", "details", "verify", "review"]
      : ["summary", "type", "details", "verify", "review", "payment"];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  }, [
    step,
    validate,
    event,
    participantType,
    details,
    paymentMethod,
    team,
    teamName,
    amount,
    appliedPassId,
    verificationToken,
    verifiedEmail,
    registrationId,
    paymentToken,
    sendOtp,
  ]);

  const prev = useCallback(() => {
    if (step === "failed") {
      setPaymentStatus(null);
      setApiError(null);
      if (amount === 0) {
        setStep("review");
      } else {
        setStep("payment");
      }
      return;
    }
    if (step === "verify") {
      setStep("details");
      return;
    }
    if (step === "review") {
      setStep("details");
      return;
    }
    const order: Step[] = amount === 0
      ? ["summary", "type", "details", "verify", "review"]
      : ["summary", "type", "details", "verify", "review", "payment"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  }, [step, amount]);

  const allSteps: Step[] = amount === 0
    ? ["summary", "type", "details", "verify", "review"]
    : ["summary", "type", "details", "verify", "review", "payment"];
  const currentIdx = allSteps.indexOf(step);
  const progress =
    step === "success" ? 100
    : step === "failed" ? 85
    : step === "pending" ? 90
    : ((currentIdx + 1) / allSteps.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={step !== "pending" ? onClose : undefined}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-4 sm:inset-6 md:inset-8 lg:inset-y-6 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-2xl z-[61] bg-euphoria-surface/98 backdrop-blur-2xl border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.06]">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-euphoria-aqua/60">
              {stepLabels[step]}
            </p>
            <h3 className="text-sm font-semibold text-white/80 mt-0.5">
              {event.name}
            </h3>
          </div>
          {step !== "pending" && (
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/50 hover:text-white/90 hover:bg-white/5 transition-all"
              aria-label="Close registration"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* ── Progress bar ── */}
        <div className="h-0.5 bg-white/[0.04]">
          <motion.div
            className={`h-full ${
              step === "success"
                ? "bg-euphoria-aqua"
                : step === "failed"
                ? "bg-red-400"
                : "bg-gradient-to-r from-euphoria-aqua to-euphoria-purple"
            }`}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* ── Step indicators ── */}
        {step === "summary" || step === "type" || step === "details" || step === "verify" || step === "review" || step === "payment" ? (
          <div className="flex items-center gap-1 px-5 sm:px-6 py-3 overflow-x-auto">
            {allSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`size-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                    i < currentIdx
                      ? "bg-euphoria-aqua/20 text-euphoria-aqua"
                      : i === currentIdx
                      ? "bg-euphoria-aqua/30 text-euphoria-aqua ring-1 ring-euphoria-aqua/40"
                      : "bg-white/[0.04] text-white/25"
                  }`}
                >
                  {i < currentIdx ? <Check className="size-2.5" /> : i + 1}
                </div>
                {i < allSteps.length - 1 && (
                  <div className={`w-4 sm:w-6 h-px ${i < currentIdx ? "bg-euphoria-aqua/30" : "bg-white/[0.06]"}`} />
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          <StepContainer step={step}>
            {step === "summary" && (
              <SummaryStep event={event} amount={amount} team={team} />
            )}
            {step === "type" && (
              <TypeStep
                selected={participantType}
                onSelect={setParticipantType}
                error={errors.participantType}
              />
            )}
            {step === "details" && (
              <DetailsStep
                participantType={participantType!}
                details={details}
                updateDetail={updateDetail}
                errors={errors}
                team={team}
                event={event}
                teamName={teamName}
                setTeamName={setTeamName}
              />
            )}
            {step === "verify" && (
              <VerifyStep
                email={details.email}
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                onVerify={verifyOtp}
                onResend={() => sendOtp()}
                isSending={isSendingOtp}
                isVerifying={isVerifyingOtp}
                countdown={otpCountdown}
                error={otpError}
                debugOtp={debugOtp}
              />
            )}
            {step === "review" && (
              <ReviewStep
                event={event}
                amount={amount}
                participantType={participantType!}
                details={details}
                teamName={teamName}
                team={team}
                isStandupComedy={isStandupComedy}
                festivalPassInput={festivalPassInput}
                setFestivalPassInput={setFestivalPassInput}
                appliedPassId={appliedPassId}
                passDiscount={passDiscount}
                isValidatingPass={isValidatingPass}
                passCouponError={passCouponError}
                passCouponSuccess={passCouponSuccess}
                onApplyPass={handleApplyFestivalPass}
                onRemovePass={handleRemoveFestivalPass}
              />
            )}
            {step === "payment" && (
              <PaymentStep
                event={event}
                amount={amount}
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                error={errors.paymentMethod}
                team={team}
              />
            )}
            {step === "pending" && <PendingStep event={event} />}
            {step === "success" && (
              <SuccessStep
                event={event}
                amount={amount}
                details={details}
                participantType={participantType!}
                team={team}
                teamName={teamName}
                onClose={onClose}
              />
            )}
            {step === "failed" && (
              <FailedStep
                event={event}
                apiError={apiError}
                onRetry={prev}
                onClose={onClose}
              />
            )}
          </StepContainer>
        </div>

        {/* ── Footer / Navigation ── */}
        {step !== "success" && step !== "failed" && step !== "pending" && (
          <div className="border-t border-white/[0.06] px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
            {step === "summary" ? (
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-xs text-white/50 hover:text-white/70 transition-colors tracking-wider uppercase"
              >
                Close
              </button>
            ) : (
              <button
                onClick={prev}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-white/50 hover:text-white/70 transition-colors tracking-wider uppercase"
              >
                <ChevronLeft className="size-3.5" />
                Back
              </button>
            )}

            {step === "payment" ? (
              <button
                onClick={next}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 rounded-lg hover:brightness-105 transition-all duration-300 shadow-lg shadow-euphoria-aqua/20 disabled:bg-white/[0.08] disabled:text-white/40 disabled:border disabled:border-white/[0.08] disabled:shadow-none disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-neutral-950" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{amount.toLocaleString("en-IN")}
                    <CreditCard className="size-3.5 text-neutral-950" />
                  </>
                )}
              </button>
            ) : step === "verify" ? (
              <button
                onClick={verifyOtp}
                disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 rounded-lg hover:brightness-105 disabled:bg-white/[0.08] disabled:text-white/40 disabled:border disabled:border-white/[0.08] disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-euphoria-aqua/20 focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none active:scale-[0.98]"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-neutral-950" />
                    Processing...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <ChevronRight className="size-3.5 text-neutral-950" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={next}
                disabled={isSubmitting || isSendingOtp}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 rounded-lg hover:brightness-105 transition-all duration-300 shadow-lg shadow-euphoria-aqua/20 disabled:bg-white/[0.08] disabled:text-white/40 disabled:border disabled:border-white/[0.08] disabled:shadow-none disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none active:scale-[0.98]"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-neutral-950" />
                    Processing...
                  </>
                ) : step === "review" && isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-neutral-950" />
                    Submitting...
                  </>
                ) : step === "review" ? (
                  amount === 0 ? "Confirm Registration" : "Proceed to Payment"
                ) : (
                  "Continue"
                )}
                {!isSendingOtp && !(step === "review" && isSubmitting) && <ChevronRight className="size-3.5 text-neutral-950" />}
              </button>
            )}
          </div>
        )}

        {/* Failed step footer */}
        {step === "failed" && (
          <div className="border-t border-white/[0.06] px-5 sm:px-6 py-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setPaymentStatus(null);
                setStep("payment");
              }}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 rounded-lg hover:brightness-105 transition-all duration-300 shadow-lg shadow-euphoria-aqua/20 focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none active:scale-[0.98]"
            >
              <RotateCcw className="size-3.5 text-neutral-950" />
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs text-white/50 hover:text-white/70 transition-colors tracking-wider uppercase"
            >
              Return to Registration
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════════
   STEP COMPONENTS
   ═══════════════════════════════════════════ */

/* ── Step 1: Summary ── */
function SummaryStep({
  event,
  amount,
  team,
}: {
  event: EuphoriaEvent;
  amount: number;
  team: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-euphoria-gold/60">
          Registration Overview
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-white">{event.name}</h2>
        <p className="text-xs text-white/55">{categoryLabel[event.category]}</p>
      </div>

      {/* Event poster */}
      {event.poster && (
        <div className="w-full max-w-xs mx-auto aspect-[3/4] rounded-xl overflow-hidden border border-white/[0.06]">
          <img src={event.poster} alt={event.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Entry Fee", value: `₹${amount.toLocaleString("en-IN")}`, highlight: true },
          { label: "Date", value: event.date },
          { label: "Venue", value: event.venue },
          { label: "Team Size", value: event.teamSize },
          { label: "Time", value: event.time },
          { label: "Prizes", value: event.prizes },
        ]
          .filter((item) => item.value && item.value !== "TBA")
          .map((item) => (
            <div
              key={item.label}
              className={`rounded-lg p-3 ${
                item.highlight
                  ? "bg-euphoria-aqua/[0.06] border border-euphoria-aqua/15"
                  : "bg-white/[0.03] border border-white/[0.05]"
              }`}
            >
              <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-1">
                {item.label}
              </p>
              <p
                className={`text-sm font-medium ${
                  item.highlight ? "text-euphoria-aqua" : "text-white/70"
                }`}
              >
                {item.value}
              </p>
            </div>
          ))}
      </div>

      {team && (
        <div className="glass-card rounded-xl p-4 text-center space-y-2">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-euphoria-purple/60">
            Team Event
          </p>
          <p className="text-xs text-white/55 leading-relaxed">
            You are registering as the <span className="text-white/80 font-semibold">Team Leader / Captain</span>.
            As Team Leader, you will provide the team name and complete the registration and payment on behalf of your team.
          </p>
          <div className="text-[10px] text-white/35 space-x-2">
            <span>
              Configured team size:{" "}
              {event.teamSize ||
                (event.minTeamSize === event.maxTeamSize
                  ? `${event.maxTeamSize} members`
                  : `${event.minTeamSize}–${event.maxTeamSize} members`)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Step 2: Participant Type ── */
function TypeStep({
  selected,
  onSelect,
  error,
}: {
  selected: ParticipantCategory | null;
  onSelect: (t: ParticipantCategory) => void;
  error?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-euphoria-gold/60">
          How are you participating?
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-white">Select Your Category</h2>
      </div>

      {error && (
        <p className="text-center text-xs text-red-400/80">{error}</p>
      )}

      <div className="space-y-3">
        {participantTypes.map((pt) => {
          const Icon = pt.icon;
          const active = selected === pt.key;
          return (
            <button
              key={pt.key}
              onClick={() => onSelect(pt.key)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                active
                  ? "bg-euphoria-aqua/[0.08] border-euphoria-aqua/30 shadow-lg shadow-euphoria-aqua/5"
                  : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
                    active ? "bg-euphoria-aqua/15" : "bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`size-5 ${active ? "text-euphoria-aqua" : "text-white/25"}`} />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      active ? "text-white" : "text-white/65"
                    }`}
                  >
                    {pt.label}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{pt.sub}</p>
                </div>
                <div
                  className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    active ? "border-euphoria-aqua bg-euphoria-aqua/20" : "border-white/15"
                  }`}
                >
                  {active && <Check className="size-3 text-euphoria-aqua" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step 3: Participant Details ── */
function DetailsStep({
  participantType,
  details,
  updateDetail,
  errors,
  team,
  event,
  teamName,
  setTeamName,
}: {
  participantType: ParticipantCategory;
  details: {
    fullName: string;
    email: string;
    phone: string;
    scholarNumber?: string;
    enrollmentNumber?: string;
    institute?: string;
    course?: string;
    year?: string;
    semester?: string;
    collegeName?: string;
    city?: string;
  };
  updateDetail: (key: string, value: string) => void;
  errors: Record<string, string>;
  team: boolean;
  event: EuphoriaEvent;
  teamName: string;
  setTeamName: (v: string) => void;
}) {
  const derivedSemester = details.year ? getSemesterFromYear(details.year) : "";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-euphoria-gold/60">
          {participantType === "sage"
            ? "SAGE Student"
            : participantType === "other-college"
            ? "Other College/School Student"
            : "General"}
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-white">
          {team ? "Team Leader / Captain Details" : "Your Details"}
        </h2>
        {team && (
          <p className="text-xs text-white/50">
            Primary participant responsible for this team registration
          </p>
        )}
      </div>

      {/* Team Leader notice for team events */}
      {team && (
        <div className="glass-card rounded-xl p-4 bg-euphoria-purple/[0.04] border border-euphoria-purple/10">
          <div className="flex items-start gap-3">
            <Users className="size-4 text-euphoria-purple/70 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white/75">Team Leader Registration</p>
              <p className="text-[10px] text-white/45 mt-1 leading-relaxed">
                You are registering as the Team Leader / Captain on behalf of your team (
                {event.teamSize ||
                  (event.minTeamSize === event.maxTeamSize
                    ? `${event.maxTeamSize} members`
                    : `${event.minTeamSize}–${event.maxTeamSize} members`)}
                ). The team leader provides their details, team name, and completes payment for the team.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label={team ? "Team Leader Full Name" : "Full Name"}
          icon={User}
          value={details.fullName}
          onChange={(v) => updateDetail("fullName", v)}
          placeholder={team ? "Enter team leader's full name" : "Enter your full name"}
          error={errors.fullName}
        />
        <Input
          label={team ? "Team Leader Email Address" : "Email Address"}
          icon={Mail}
          value={details.email}
          onChange={(v) => updateDetail("email", v)}
          type="email"
          placeholder="you@example.com"
          error={errors.email}
        />
        <Input
          label={team ? "Team Leader Phone Number" : "Phone Number"}
          icon={Phone}
          value={details.phone}
          onChange={(v) => updateDetail("phone", v)}
          type="tel"
          placeholder="10-digit number"
          error={errors.phone}
        />

        {/* ── SAGE Student fields ── */}
        {participantType === "sage" && (
          <>
            <Input
              label="Scholar Number"
              icon={Hash}
              value={details.scholarNumber || ""}
              onChange={(v) => updateDetail("scholarNumber", v)}
              placeholder="Your scholar number"
              error={errors.scholarNumber}
            />
            <Input
              label="Enrollment Number"
              icon={Hash}
              value={details.enrollmentNumber || ""}
              onChange={(v) => updateDetail("enrollmentNumber", v)}
              placeholder="Your enrollment number"
              error={errors.enrollmentNumber}
            />
            <Select
              label="Institute"
              icon={Building2}
              value={details.institute || ""}
              onChange={(v) => updateDetail("institute", v)}
              options={SAGE_INSTITUTES}
              placeholder="Select your institute"
              error={errors.institute}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Year"
                icon={Calendar}
                value={details.year || ""}
                onChange={(v) => updateDetail("year", v)}
                options={SAGE_YEARS}
                placeholder="Select your year"
                error={errors.year}
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/45">
                  Semester
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20 pointer-events-none" />
                  <input
                    type="text"
                    readOnly
                    value={derivedSemester || "Auto-derived from Year"}
                    className={`w-full bg-white/[0.02] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2.5 text-sm ${
                      derivedSemester ? "text-euphoria-aqua font-medium" : "text-white/20 italic"
                    } cursor-not-allowed select-none focus:outline-none`}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Other College/School Student fields ── */}
        {participantType === "other-college" && (
          <Input
            label="College / School Name"
            icon={Building2}
            value={details.collegeName || ""}
            onChange={(v) => updateDetail("collegeName", v)}
            placeholder="Your college or school name"
            error={errors.collegeName}
          />
        )}
      </div>

      {/* ── Team section ── */}
      {team && (
        <div className="space-y-4 pt-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          <div className="space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
              Team Information
            </p>
            <Input
              label="Team Name"
              icon={Users}
              value={teamName}
              onChange={(v) => setTeamName(v)}
              placeholder="Enter your team name"
              error={errors.teamName}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Step: Email Verification ── */
function VerifyStep({
  email,
  otpCode,
  setOtpCode,
  onVerify,
  onResend,
  isSending,
  isVerifying,
  countdown,
  error,
  debugOtp,
}: {
  email: string;
  otpCode: string;
  setOtpCode: (v: string) => void;
  onVerify: () => void;
  onResend: () => void;
  isSending: boolean;
  isVerifying: boolean;
  countdown: number;
  error?: string | null;
  debugOtp?: string | null;
}) {
  return (
    <div className="space-y-6 max-w-md mx-auto py-2">
      <div className="text-center space-y-2">
        <div className="size-12 rounded-full bg-euphoria-aqua/10 border border-euphoria-aqua/20 flex items-center justify-center mx-auto mb-3">
          <Mail className="size-6 text-euphoria-aqua" />
        </div>
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-euphoria-gold/70">
          Email Verification
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-white">Verify Your Email</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          We sent a 6-digit verification code to <br />
          <span className="text-white/90 font-semibold">{email}</span>
        </p>
        <p className="text-[11px] text-white/40 mt-1">
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
        <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-center">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/45 block mb-3 text-center">
            Enter 6-Digit Code
          </label>
          <EuphoriaOtpInput
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            disabled={isVerifying}
            hasError={Boolean(error)}
            accentColor="aqua"
            onComplete={onVerify}
          />
        </div>

        <button
          onClick={onVerify}
          disabled={isVerifying || otpCode.trim().length !== 6}
          className="w-full py-3 rounded-xl font-bold text-xs tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua via-cyan-300 to-euphoria-aqua text-neutral-950 hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-euphoria-aqua/20 flex items-center justify-center gap-2 disabled:bg-white/[0.08] disabled:text-white/40 disabled:border disabled:border-white/[0.08] disabled:shadow-none disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-euphoria-aqua focus-visible:outline-none"
        >
          {isVerifying ? (
            <>
              <Loader2 className="size-4 animate-spin text-neutral-950" />
              Processing...
            </>
          ) : (
            <>
              Verify & Continue
              <Check className="size-4 text-neutral-950" />
            </>
          )}
        </button>

        <div className="text-center pt-2">
          {countdown > 0 ? (
            <p className="text-xs text-white/50">
              Resend code in <span className="text-white/80 font-mono font-semibold">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={onResend}
              disabled={isSending}
              className="text-xs text-euphoria-aqua hover:underline font-semibold disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-euphoria-aqua/40 rounded px-1"
            >
              {isSending ? "Sending code..." : "Didn't receive code? Resend Code"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Step 4: Review ── */
function ReviewStep({
  event,
  amount,
  participantType,
  details,
  teamName,
  team,
  isStandupComedy,
  festivalPassInput,
  setFestivalPassInput,
  appliedPassId,
  passDiscount,
  isValidatingPass,
  passCouponError,
  passCouponSuccess,
  onApplyPass,
  onRemovePass,
}: {
  event: EuphoriaEvent;
  amount: number;
  participantType: ParticipantCategory;
  details: {
    fullName: string;
    email: string;
    phone: string;
    scholarNumber?: string;
    enrollmentNumber?: string;
    institute?: string;
    course?: string;
    year?: string;
    semester?: string;
    collegeName?: string;
    city?: string;
  };
  teamName: string;
  team: boolean;
  isStandupComedy?: boolean;
  festivalPassInput?: string;
  setFestivalPassInput?: (v: string) => void;
  appliedPassId?: string | null;
  passDiscount?: number;
  isValidatingPass?: boolean;
  passCouponError?: string | null;
  passCouponSuccess?: string | null;
  onApplyPass?: () => void;
  onRemovePass?: () => void;
}) {
  const typeLabel =
    participantType === "sage"
      ? "SAGE Student"
      : participantType === "other-college"
      ? "Other College/School Student"
      : "General";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-euphoria-gold/60">
          Review &amp; Confirm
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-white">Registration Summary</h2>
      </div>

      <div className="space-y-2">
        {[
          { label: "Event", value: event.name },
          { label: "Category", value: categoryLabel[event.category] },
          { label: "Participant Type", value: typeLabel },
          { label: team ? "Team Leader" : "Name", value: details.fullName },
          { label: "Email", value: details.email },
          { label: "Phone", value: details.phone },
          ...(participantType === "sage"
            ? [
                { label: "Scholar No.", value: details.scholarNumber || "" },
                { label: "Enrollment", value: details.enrollmentNumber || "" },
                { label: "Institute", value: details.institute || "" },
                { label: "Year", value: details.year || "" },
                { label: "Semester", value: details.year ? getSemesterFromYear(details.year) : "" },
              ]
            : []),
          ...(participantType === "other-college"
            ? [
                { label: "College / School", value: details.collegeName || "" },
              ]
            : []),
        ]
          .filter((r) => r.value)
          .map((r) => (
            <div
              key={r.label}
              className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.04]"
            >
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 shrink-0">
                {r.label}
              </span>
              <span className="text-xs text-white/70 text-right">{r.value}</span>
            </div>
          ))}
      </div>

      {team && (
        <div className="space-y-3">
          <div className="glass-card rounded-xl p-4 bg-euphoria-purple/[0.04] border border-euphoria-purple/10">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-euphoria-purple/70 shrink-0" />
              <p className="text-xs font-semibold text-white/75">
                Team Leader: {details.fullName}
              </p>
            </div>
            <p className="text-[10px] text-white/40 mt-1">
              Registered on behalf of the team (
              {event.teamSize ||
                (event.minTeamSize === event.maxTeamSize
                  ? `${event.maxTeamSize} members`
                  : `${event.minTeamSize}–${event.maxTeamSize} members`)}
              ). The team leader completes the registration and makes the full payment on behalf of the team.
            </p>
          </div>

          {teamName && (
            <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.04]">
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 shrink-0">
                Team Name
              </span>
              <span className="text-xs font-semibold text-white/85 text-right">{teamName}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Festival Pass Coupon (Only for Standup Comedy) ── */}
      {isStandupComedy && (
        <div className="glass-card rounded-xl p-4 bg-white/[0.02] border border-white/[0.08] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-euphoria-gold">
                FESTIVAL PASS HOLDER?
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                Enter your Festival Pass ID
              </p>
            </div>
            {appliedPassId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Check className="size-3" /> Festival Pass verified
              </span>
            )}
          </div>

          {!appliedPassId ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={festivalPassInput || ""}
                  onChange={(e) => setFestivalPassInput?.(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onApplyPass?.();
                    }
                  }}
                  placeholder="EUPH-2026-PAS-XXXXXXXX"
                  className="flex-1 bg-neutral-900/90 border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono tracking-wider text-white uppercase placeholder:text-white/25 focus:outline-none focus:border-euphoria-aqua/50"
                  disabled={isValidatingPass}
                />
                <button
                  type="button"
                  onClick={onApplyPass}
                  disabled={isValidatingPass || !festivalPassInput?.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-euphoria-aqua to-cyan-400 hover:brightness-110 text-neutral-950 font-extrabold text-xs tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-euphoria-aqua/10 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isValidatingPass ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-neutral-950" />
                      APPLYING
                    </>
                  ) : (
                    "APPLY"
                  )}
                </button>
              </div>
              {passCouponError && (
                <p className="text-[11px] text-rose-400 font-medium">{passCouponError}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-300">
                  {appliedPassId}
                </span>
              </div>
              <button
                type="button"
                onClick={onRemovePass}
                className="text-[11px] text-white/50 hover:text-rose-400 transition-colors underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className="pt-2 border-t border-white/[0.06] space-y-1.5 text-xs">
            <div className="flex justify-between text-white/60">
              <span>Event Fee</span>
              <span>₹199</span>
            </div>
            {appliedPassId && (passDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Festival Pass Discount</span>
                <span>-₹{passDiscount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="glass-card rounded-xl p-5 bg-euphoria-aqua/[0.04] border border-euphoria-aqua/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
              TOTAL PAYABLE
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">
              Entry fee for {event.name}
              {team ? " (team registration)" : ""}
            </p>
          </div>
          <p className="text-2xl font-bold text-euphoria-aqua">
            ₹{amount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Step 5: Payment ── */
function PaymentStep({
  event,
  amount,
  selected,
  onSelect,
  error,
  team,
}: {
  event: EuphoriaEvent;
  amount: number;
  selected: string | null;
  onSelect: (m: string) => void;
  error?: string;
  team: boolean;
}) {
  const methods = [
    { key: "upi", label: "UPI", sub: "Google Pay, PhonePe, Paytm", icon: Smartphone },
    { key: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay", icon: CreditCard },
    { key: "netbanking", label: "Net Banking", sub: "All major banks", icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-euphoria-gold/60">
          EUPHORIA 2026
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-white">Secure Payment</h2>
        <p className="text-xs text-white/55">{event.name}</p>
      </div>

      {/* Amount display */}
      <div className="text-center py-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-2">
          Amount Payable
        </p>
        <p className="text-3xl sm:text-4xl font-black text-euphoria-aqua">
          ₹{amount.toLocaleString("en-IN")}
        </p>
        {team && (
          <p className="text-[10px] text-white/40 mt-2">
            Total team payment — handled by Team Leader
          </p>
        )}
      </div>

      {error && (
        <p className="text-center text-xs text-red-400/80">{error}</p>
      )}

      {/* Payment methods */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
          Select Payment Method
        </p>
        {methods.map((m) => {
          const Icon = m.icon;
          const active = selected === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onSelect(m.key)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                active
                  ? "bg-euphoria-aqua/[0.06] border-euphoria-aqua/25"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center ${
                    active ? "bg-euphoria-aqua/15" : "bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`size-4 ${active ? "text-euphoria-aqua" : "text-white/25"}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${active ? "text-white" : "text-white/55"}`}>
                    {m.label}
                  </p>
                  <p className="text-[10px] text-white/30">{m.sub}</p>
                </div>
                <div
                  className={`size-4 rounded-full border flex items-center justify-center ${
                    active ? "border-euphoria-aqua bg-euphoria-aqua/20" : "border-white/15"
                  }`}
                >
                  {active && <Check className="size-2.5 text-euphoria-aqua" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-white/25 leading-relaxed">
        Payment will be processed through Easebuzz gateway. This is a frontend demo — no real payment will be charged.
      </p>
    </div>
  );
}

/* ── Step 6: Payment Pending ── */
function PendingStep({ event }: { event: EuphoriaEvent }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-6 py-8">
      <div className="size-16 rounded-full bg-euphoria-aqua/10 border border-euphoria-aqua/20 flex items-center justify-center">
        <Loader2 className="size-8 text-euphoria-aqua animate-spin" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg sm:text-xl font-bold text-white">Processing...</h2>
        <p className="text-sm text-white/55">
          Please do not refresh or close this page.
        </p>
        <p className="text-xs text-white/35">
          Redirecting to payment gateway...
        </p>
      </div>

      <div className="glass-card rounded-xl p-4 max-w-sm">
        <p className="text-[10px] text-white/40 leading-relaxed">
          Your registration is being processed. In production, this step connects to the
          Easebuzz payment gateway for UPI / Card / Net Banking transactions.
        </p>
      </div>
    </div>
  );
}

/* ── Step 7: Payment Success ── */
function SuccessStep({
  event,
  amount,
  details,
  participantType,
  team,
  teamName,
  onClose,
}: {
  event: EuphoriaEvent;
  amount: number;
  details: { fullName: string; email: string; phone: string };
  participantType: ParticipantCategory;
  team?: boolean;
  teamName?: string;
  onClose: () => void;
}) {
  const typeLabel =
    participantType === "sage"
      ? "SAGE Student"
      : participantType === "other-college"
      ? "Other College/School Student"
      : "General";

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8 py-8">
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="size-20 rounded-full bg-euphoria-aqua/10 border border-euphoria-aqua/20 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Check className="size-10 text-euphoria-aqua" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="space-y-2"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Registration Confirmed
        </h2>
        <p className="text-sm text-white/70">
          {team
            ? "Your team registration has been confirmed."
            : "Your registration has been confirmed."}
        </p>
      </motion.div>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="glass-card rounded-xl p-5 space-y-3 w-full max-w-sm"
      >
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Event</span>
          <span className="text-white/70 text-right">{event.name}</span>
        </div>
        {team && teamName && (
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Team Name</span>
            <span className="text-white/70 text-right font-medium text-white/90">{teamName}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-white/40">{team ? "Team Leader" : "Participant"}</span>
          <span className="text-white/70">{details.fullName}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Category</span>
          <span className="text-white/70">{typeLabel}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Email</span>
          <span className="text-white/70">{details.email}</span>
        </div>
        <div className="h-px bg-white/[0.06]" />
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-white/50">Amount Paid</span>
          <span className="text-euphoria-aqua">₹{amount.toLocaleString("en-IN")}</span>
        </div>
      </motion.div>

      {/* Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="glass-card rounded-xl p-4 max-w-sm"
      >
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-euphoria-gold/55 mb-1">
          Confirmation Notice
        </p>
        <p className="text-xs text-white/60 leading-relaxed">
          Your registration has been confirmed. A transactional confirmation email has been sent to your registered email address.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        onClick={onClose}
        className="px-8 py-3 text-xs font-semibold tracking-[0.15em] uppercase bg-white/[0.06] text-white/65 rounded-lg hover:bg-white/[0.1] hover:text-white transition-all duration-300 border border-white/[0.08]"
      >
        Back to Events
      </motion.button>
    </div>
  );
}

/* ── Step 8: Payment Failed ── */
function FailedStep({
  event,
  apiError,
  onRetry,
  onClose,
}: {
  event: EuphoriaEvent;
  apiError?: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 py-8">
      {/* Failed icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="size-20 rounded-full bg-rose-500/[0.08] border border-rose-400/30 shadow-[0_0_35px_rgba(244,63,94,0.15)] flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <X className="size-9 text-rose-400" />
        </motion.div>
      </motion.div>

      {/* Eyebrow badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-300 text-[10px] font-bold tracking-[0.2em] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Payment Unsuccessful
        </span>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="space-y-2"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Payment Not Completed
        </h2>
        <p className="text-sm text-white/65 max-w-sm mx-auto leading-relaxed">
          {apiError || "The transaction was not completed and no funds were debited."}
        </p>
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="glass-card rounded-xl p-5 space-y-3 w-full max-w-sm text-left border border-white/[0.08]"
      >
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Event</span>
          <span className="text-white/80 font-medium text-right">{event.name}</span>
        </div>
        <div className="h-px bg-white/[0.06]" />
        <p className="text-xs text-white/55 leading-relaxed">
          Your registration details are preserved. You can try again now or return to explore other events.
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm pt-2"
      >
        <button
          onClick={onRetry}
          className="w-full py-3 px-4 text-xs font-semibold tracking-[0.15em] uppercase bg-gradient-to-r from-euphoria-aqua to-euphoria-teal text-white rounded-xl hover:opacity-95 transition-all duration-300 shadow-lg shadow-euphoria-aqua/15 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <RotateCcw className="size-3.5" />
          Try Again
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 px-4 text-xs font-semibold tracking-[0.15em] uppercase bg-white/[0.04] text-white/70 rounded-xl hover:bg-white/[0.08] hover:text-white transition-all duration-300 border border-white/10 cursor-pointer active:scale-[0.98]"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
