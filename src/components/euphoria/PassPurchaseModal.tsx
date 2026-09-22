import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ticket,
  Mail,
  Check,
  ShieldCheck,
  CreditCard,
  Loader2,
  ChevronRight,
  User,
  Phone,
  Building2,
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  ChevronDown,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";
import { apiPost } from "@/lib/api";
import { EuphoriaOtpInput } from "./EuphoriaOtpInput";
import {
  SAGE_INSTITUTES,
  SAGE_YEARS,
  getSemesterFromYear,
} from "@/data/academic";

interface PassData {
  id: string;
  name: string;
  subtitle?: string | null;
  price: number | null;
}

interface PassHolderInput {
  fullName: string;
  email: string;
  phone: string;
}

export function PassPurchaseModal({
  isOpen,
  onClose,
  pass,
}: {
  isOpen: boolean;
  onClose: () => void;
  pass: PassData;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "verify" | "processing" | "success" | "failed">("details");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<"SAGE" | "OTHER_COLLEGE">("SAGE");
  const [collegeName, setCollegeName] = useState("");
  const [institute, setInstitute] = useState("");
  const [year, setYear] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [holders, setHolders] = useState<PassHolderInput[]>([]);

  const [otpCode, setOtpCode] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [confirmedPass, setConfirmedPass] = useState<{
    passNumber: string;
    quantity: number;
    amount: number;
  } | null>(null);

  const unitPrice = pass.price || 0;
  const totalAmount = unitPrice * quantity;

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("details");
      setOtpCode("");
      setVerificationToken(null);
      setDebugOtp(null);
      setApiError(null);
      setErrors({});
      setInstitute("");
      setYear("");
      setCollegeName("");
      setQuantity(1);
      setHolders([]);
    }
  }, [isOpen]);

  const handleQuantityChange = (newQty: number) => {
    const clamped = Math.max(1, Math.min(10, newQty));
    setQuantity(clamped);
    const targetRecipientCount = clamped - 1;

    setHolders((prev) => {
      if (prev.length === targetRecipientCount) return prev;
      if (prev.length > targetRecipientCount) {
        // Truncate unnecessary recipient forms from active form state
        return prev.slice(0, targetRecipientCount);
      }
      // Expand with empty recipient forms if increased
      const addedCount = targetRecipientCount - prev.length;
      return [
        ...prev,
        ...Array.from({ length: addedCount }, () => ({
          fullName: "",
          email: "",
          phone: "",
        })),
      ];
    });

    // Clean up stale errors for recipients beyond the new recipient count
    setErrors((prev) => {
      const next = { ...prev };
      let hasChange = false;
      Object.keys(next).forEach((k) => {
        if (k.startsWith("holder_")) {
          const parts = k.split("_");
          const idx = parseInt(parts[1], 10);
          if (idx >= targetRecipientCount) {
            delete next[k];
            hasChange = true;
          }
        }
      });
      return hasChange ? next : prev;
    });
  };

  const updateHolder = (index: number, field: keyof PassHolderInput, value: string) => {
    setHolders((prev) => {
      const copy = [...prev];
      while (copy.length <= index) {
        copy.push({ fullName: "", email: "", phone: "" });
      }
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`holder_${index}_${field}`];
      return copy;
    });
  };

  const validateDetails = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Valid email address is required";
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      errs.phone = "Valid 10-digit phone number is required";
    }
    if (category === "SAGE") {
      if (!institute.trim()) errs.institute = "Please select your institute.";
      if (!year.trim()) errs.year = "Please select your year.";
    }
    if (category === "OTHER_COLLEGE" && !collegeName.trim()) {
      errs.collegeName = "College/school name is required";
    }

    // Validate additional pass recipients when quantity > 1
    if (quantity > 1) {
      const buyerEmail = email.trim().toLowerCase();
      const seenEmails = new Set<string>();

      for (let i = 0; i < quantity - 1; i++) {
        const h = holders[i] || { fullName: "", email: "", phone: "" };
        const num = i + 2;
        const hEmail = h.email.trim().toLowerCase();

        if (!h.fullName.trim()) {
          errs[`holder_${i}_fullName`] = `Pass Recipient ${num} full name is required`;
        }
        if (!h.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h.email.trim())) {
          errs[`holder_${i}_email`] = `Pass Recipient ${num} valid email is required`;
        } else if (hEmail === buyerEmail) {
          errs[`holder_${i}_email`] = `Pass Recipient ${num} cannot use the purchaser's email (Pass 1)`;
        } else if (seenEmails.has(hEmail)) {
          errs[`holder_${i}_email`] = `Duplicate email: already used for another recipient`;
        } else {
          seenEmails.add(hEmail);
        }

        if (!h.phone.trim() || h.phone.replace(/\D/g, "").length < 10) {
          errs[`holder_${i}_phone`] = `Pass Recipient ${num} valid 10-digit phone is required`;
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const sendOtp = async () => {
    setIsSendingOtp(true);
    setApiError(null);
    try {
      const res = await apiPost<{
        status: string;
        message: string;
        data?: { debugOtp?: string };
      }>("/verification/send-otp", {
        email: email.trim(),
        purpose: "PASS_PURCHASE",
      });

      setCountdown(60);
      if (res.data?.debugOtp) {
        setDebugOtp(res.data.debugOtp);
      }
      setStep("verify");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;
    await sendOtp();
  };

  const handleVerifyAndPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setApiError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifyingOtp(true);
    setApiError(null);
    try {
      // 1. Verify OTP
      const verifyRes = await apiPost<{
        status: string;
        data: { verificationToken: string };
      }>("/verification/verify-otp", {
        email: email.trim(),
        otp: cleanOtp,
        purpose: "PASS_PURCHASE",
      });

      const token = verifyRes.data.verificationToken;
      setVerificationToken(token);
      setStep("processing");

      // 2. Submit Pass Purchase with Recipients
      const recipientsPayload =
        quantity > 1
          ? holders.slice(0, quantity - 1).map((h) => ({
              fullName: h.fullName.trim(),
              email: h.email.trim().toLowerCase(),
              phone: h.phone.trim(),
            }))
          : undefined;

      const purchaseRes = await apiPost<{
        status: string;
        data: {
          purchase: {
            id: string;
            passNumber: string;
            quantity: number;
            status: string;
          };
          paymentToken?: string;
        };
      }>("/passes/purchase", {
        passId: pass.id,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        participantCategory: category,
        collegeName: category === "OTHER_COLLEGE" ? collegeName.trim() : undefined,
        institute: category === "SAGE" ? institute.trim() : undefined,
        year: category === "SAGE" ? year.trim() : undefined,
        semester: category === "SAGE" && year ? getSemesterFromYear(year) : undefined,
        quantity,
        recipients: recipientsPayload,
        verificationToken: token,
      });

      const purchase = purchaseRes.data.purchase;
      const paymentToken = purchaseRes.data.paymentToken;

      // 3. Initiate payment if paid pass
      if (totalAmount > 0 && paymentToken) {
        const payRes = await apiPost<{
          status: string;
          data: {
            mode: "EASEBUZZ" | "SIMULATION";
            paymentUrl?: string;
            txnid?: string;
            passPurchaseStatus?: string;
            payment?: { id: string; status: string };
          };
        }>("/payments/easebuzz/initiate", {
          passPurchaseId: purchase.id,
          paymentToken,
          paymentMethod: "upi",
        });

        if (payRes.data.mode === "EASEBUZZ" && payRes.data.paymentUrl) {
          window.location.href = payRes.data.paymentUrl;
          return;
        }

        const passPurchaseStatus =
          payRes.data.passPurchaseStatus ||
          (payRes.data as any).simulationResult?.status;

        if (payRes.data.mode === "SIMULATION" && passPurchaseStatus !== "CONFIRMED") {
          throw new Error("Payment confirmation failed. Please try again.");
        }
      }

      setConfirmedPass({
        passNumber: purchase.passNumber,
        quantity: purchase.quantity,
        amount: totalAmount,
      });
      setStep("success");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Purchase failed. Please try again.");
      setStep("failed");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step !== "processing" ? onClose : undefined}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-euphoria-surface/95 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Ticket className="size-4 text-euphoria-gold" />
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">{pass.name}</h3>
                <p className="text-[10px] uppercase tracking-widest text-euphoria-gold/80">
                  {pass.subtitle || "Festival Pass"}
                </p>
              </div>
            </div>
            {step !== "processing" && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* STEP 1: Details */}
            {step === "details" && (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="text-center pb-2">
                  <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-euphoria-aqua">
                    Guest Pass Registration
                  </span>
                  <h4 className="text-lg font-bold text-white mt-1">Enter Your Details</h4>
                  <p className="text-xs text-white/50">
                    No account needed. Your pass will be linked to your verified email.
                  </p>
                </div>

                {apiError && (
                  <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-center">
                    <p className="text-xs text-red-400">{apiError}</p>
                  </div>
                )}

                {/* Quantity & Total Calculation - Placed prominently at top */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block">
                      Number of Passes
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => handleQuantityChange(quantity - 1)}
                        className="size-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-white font-mono">{quantity}</span>
                      <button
                        type="button"
                        disabled={quantity >= 10}
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="size-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40 block">
                      Total Payable
                    </span>
                    <span className="text-xl font-extrabold text-euphoria-gold">
                      {unitPrice > 0 ? `₹${totalAmount.toLocaleString("en-IN")}` : "FREE"}
                    </span>
                  </div>
                </div>

                {/* Section Header: Buyer / Purchaser */}
                <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-euphoria-aqua flex items-center gap-1.5">
                    <User className="size-3 text-euphoria-aqua" /> Buyer / Purchaser
                  </span>
                  {quantity > 1 && (
                    <span className="text-[9px] uppercase tracking-wider text-white/40 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                      Pass 1 of {quantity} (Payer)
                    </span>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-euphoria-aqua/50 transition-all"
                    />
                  </div>
                  {errors.fullName && <p className="text-[10px] text-red-400">{errors.fullName}</p>}
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-euphoria-aqua/50 transition-all"
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-red-400">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit number"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-euphoria-aqua/50 transition-all"
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] text-red-400">{errors.phone}</p>}
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "SAGE" as const, label: "SAGE Student", icon: GraduationCap },
                      { id: "OTHER_COLLEGE" as const, label: "Other College/School Student", icon: Building2 },
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const active = category === cat.id;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => {
                            setCategory(cat.id);
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.institute;
                              delete next.year;
                              delete next.collegeName;
                              return next;
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            active
                              ? "bg-euphoria-gold/15 border-euphoria-gold/40 text-white"
                              : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-white/[0.04]"
                          }`}
                        >
                          <Icon className={`size-3.5 mx-auto mb-1 ${active ? "text-euphoria-gold" : "text-white/30"}`} />
                          <span className="text-[11px] font-medium block leading-tight">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SAGE University Student academic fields */}
                {category === "SAGE" && (
                  <div className="space-y-3">
                    {/* Institute dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                        Institute
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20 pointer-events-none" />
                        <select
                          value={institute}
                          onChange={(e) => {
                            setInstitute(e.target.value);
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.institute;
                              return next;
                            });
                          }}
                          className={`w-full appearance-none bg-neutral-900/90 border ${
                            errors.institute ? "border-red-400/50" : "border-white/[0.08]"
                          } rounded-xl pl-9 pr-9 py-2 text-xs ${
                            institute ? "text-white" : "text-white/30"
                          } focus:outline-none focus:border-euphoria-aqua/50 transition-all cursor-pointer`}
                        >
                          <option value="" disabled className="bg-neutral-900 text-white/30">
                            Select your institute
                          </option>
                          {SAGE_INSTITUTES.map((inst) => (
                            <option key={inst} value={inst} className="bg-neutral-900 text-white py-1">
                              {inst}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-white/30 pointer-events-none" />
                      </div>
                      {errors.institute && <p className="text-[10px] text-red-400">{errors.institute}</p>}
                    </div>

                    {/* Year dropdown & Auto-derived Semester */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                          Year
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20 pointer-events-none" />
                          <select
                            value={year}
                            onChange={(e) => {
                              setYear(e.target.value);
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.year;
                                return next;
                              });
                            }}
                            className={`w-full appearance-none bg-neutral-900/90 border ${
                              errors.year ? "border-red-400/50" : "border-white/[0.08]"
                            } rounded-xl pl-9 pr-9 py-2 text-xs ${
                              year ? "text-white" : "text-white/30"
                            } focus:outline-none focus:border-euphoria-aqua/50 transition-all cursor-pointer`}
                          >
                            <option value="" disabled className="bg-neutral-900 text-white/30">
                              Select year
                            </option>
                            {SAGE_YEARS.map((yr) => (
                              <option key={yr} value={yr} className="bg-neutral-900 text-white py-1">
                                {yr}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-white/30 pointer-events-none" />
                        </div>
                        {errors.year && <p className="text-[10px] text-red-400">{errors.year}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                          Semester
                        </label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20 pointer-events-none" />
                          <input
                            type="text"
                            readOnly
                            value={year ? getSemesterFromYear(year) : "Auto-derived from Year"}
                            className={`w-full bg-white/[0.02] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-xs ${
                              year ? "text-euphoria-aqua font-medium" : "text-white/25 italic"
                            } cursor-not-allowed select-none focus:outline-none`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* College Name if other-college */}
                {category === "OTHER_COLLEGE" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                      College / School Name
                    </label>
                    <input
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="Name of your institution"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-euphoria-aqua/50 transition-all"
                    />
                    {errors.collegeName && <p className="text-[10px] text-red-400">{errors.collegeName}</p>}
                  </div>
                )}

                {/* PASS RECIPIENT DETAILS Section (Quantity > 1) */}
                {quantity > 1 && (
                  <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                    <div className="p-3 rounded-xl bg-euphoria-gold/10 border border-euphoria-gold/20 flex items-start gap-2.5">
                      <Users className="size-4 text-euphoria-gold shrink-0 mt-0.5" />
                      <div className="text-xs text-white/80 leading-relaxed">
                        <p className="font-bold text-euphoria-gold tracking-wider text-[11px] uppercase">
                          PASS RECIPIENT DETAILS
                        </p>
                        <p className="text-[11px] text-white/70 mt-0.5">
                          Enter the details of the other pass holders. The purchaser will make the payment for all passes.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 flex items-center gap-1.5">
                        <Users className="size-3 text-euphoria-gold" /> PASS RECIPIENT DETAILS (Passes 2 to {quantity})
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">
                        {quantity - 1} recipient{quantity > 2 ? "s" : ""}
                      </span>
                    </div>

                    {holders.map((holder, idx) => {
                      const num = idx + 2;
                      const hasError =
                        errors[`holder_${idx}_fullName`] ||
                        errors[`holder_${idx}_email`] ||
                        errors[`holder_${idx}_phone`];

                      return (
                        <div
                          key={`recipient-${idx}`}
                          className={`p-3.5 rounded-xl border transition-all ${
                            hasError
                              ? "bg-red-500/[0.04] border-red-500/30"
                              : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                          } space-y-2.5`}
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
                            <span className="text-[11px] font-bold text-euphoria-gold tracking-wider uppercase flex items-center gap-1.5">
                              <Ticket className="size-3 text-euphoria-gold/70" /> Pass Recipient {num}
                            </span>
                            {holder.fullName && (
                              <span className="text-[11px] text-white/60 font-medium truncate max-w-[160px]">
                                {holder.fullName}
                              </span>
                            )}
                          </div>

                          {/* Full Name */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-semibold tracking-wider uppercase text-white/40">
                              Full Name *
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/20" />
                              <input
                                type="text"
                                required
                                value={holder.fullName}
                                onChange={(e) => updateHolder(idx, "fullName", e.target.value)}
                                placeholder={`e.g. Recipient ${num} Name`}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-euphoria-aqua/50 transition-all"
                              />
                            </div>
                            {errors[`holder_${idx}_fullName`] && (
                              <p className="text-[10px] text-red-400">{errors[`holder_${idx}_fullName`]}</p>
                            )}
                          </div>

                          {/* Email & Phone */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                              <label className="text-[9px] font-semibold tracking-wider uppercase text-white/40">
                                Email Address *
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/20" />
                                <input
                                  type="email"
                                  required
                                  value={holder.email}
                                  onChange={(e) => updateHolder(idx, "email", e.target.value)}
                                  placeholder={`recipient${num}@example.com`}
                                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-euphoria-aqua/50 transition-all"
                                />
                              </div>
                              {errors[`holder_${idx}_email`] && (
                                <p className="text-[10px] text-red-400">{errors[`holder_${idx}_email`]}</p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-semibold tracking-wider uppercase text-white/40">
                                Phone Number *
                              </label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/20" />
                                <input
                                  type="tel"
                                  required
                                  value={holder.phone}
                                  onChange={(e) => updateHolder(idx, "phone", e.target.value)}
                                  placeholder="10-digit number"
                                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-euphoria-aqua/50 transition-all"
                                />
                              </div>
                              {errors[`holder_${idx}_phone`] && (
                                <p className="text-[10px] text-red-400">{errors[`holder_${idx}_phone`]}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-neutral-950 hover:brightness-105 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:bg-white/[0.08] disabled:text-white/40 disabled:border disabled:border-white/[0.08] disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-neutral-950" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Verification
                      <ChevronRight className="size-4 text-neutral-950" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Email OTP Verification */}
            {step === "verify" && (
              <form onSubmit={handleVerifyAndPurchase} className="space-y-5 py-2">
                <div className="text-center space-y-1.5">
                  <div className="size-11 rounded-full bg-euphoria-gold/15 border border-euphoria-gold/30 flex items-center justify-center mx-auto text-euphoria-gold">
                    <ShieldCheck className="size-5" />
                  </div>
                  <h4 className="text-base font-bold text-white">Verify Your Email</h4>
                  <p className="text-xs text-white/50">
                    We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                  </p>
                  <p className="text-[11px] text-white/40">
                    Please check your inbox (and spam/junk folder). Code expires in 10 minutes.
                  </p>
                </div>

                {debugOtp && (
                  <div className="p-3 rounded-xl bg-euphoria-gold/10 border border-euphoria-gold/20 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-euphoria-gold font-semibold">
                      Development Mode OTP
                    </p>
                    <p className="text-lg font-mono font-bold text-white mt-0.5 tracking-widest">
                      {debugOtp}
                    </p>
                  </div>
                )}

                {apiError && (
                  <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-center">
                    <p className="text-xs text-red-400">{apiError}</p>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/45 block mb-3 text-center">
                    Enter 6-Digit Code
                  </label>
                  <EuphoriaOtpInput
                    value={otpCode}
                    onChange={setOtpCode}
                    autoFocus
                    disabled={isVerifyingOtp}
                    hasError={Boolean(apiError)}
                    accentColor="gold"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs">
                  <span className="text-white/50">{quantity}x {pass.name}</span>
                  <span className="font-bold text-euphoria-gold">₹{totalAmount}</span>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                  className="w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-neutral-950 hover:brightness-105 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:bg-white/[0.08] disabled:text-white/40 disabled:border disabled:border-white/[0.08] disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-neutral-950" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Verify & Complete Purchase
                      <CreditCard className="size-4 text-neutral-950" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    Back to Details
                  </button>

                  {countdown > 0 ? (
                    <span className="text-white/40 font-mono">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      className="text-amber-400 hover:text-amber-300 hover:underline font-semibold transition-colors"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* STEP 3: Processing */}
            {step === "processing" && (
              <div className="py-12 text-center space-y-4">
                <Loader2 className="size-10 text-euphoria-gold animate-spin mx-auto" />
                <div>
                  <h4 className="text-base font-bold text-white">Processing...</h4>
                  <p className="text-xs text-white/50 mt-1">
                    Generating your pass...
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: Success */}
            {step === "success" && confirmedPass && (
              <div className="py-4 text-center space-y-5">
                <div className="size-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="size-7" />
                </div>

                <div>
                  <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-emerald-400">
                    Pass Purchase Confirmed
                  </span>
                  <h4 className="text-xl font-bold text-white mt-1">Welcome to Euphoria 2026!</h4>
                  <p className="text-xs text-white/70 max-w-xs mx-auto mt-1 leading-relaxed">
                    Pass purchase confirmed. Your digital pass(es) will be delivered to the registered email address(es) within 1–2 working days.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-euphoria-gold/[0.06] border border-euphoria-gold/20 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">Pass Number</span>
                    <span className="font-mono font-bold text-euphoria-gold">{confirmedPass.passNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Primary Purchaser</span>
                    <span className="text-white/80 font-medium">{fullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Quantity</span>
                    <span className="text-white/80">{confirmedPass.quantity} Pass(es)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Linked Email</span>
                    <span className="text-white/80">{email}</span>
                  </div>
                  {quantity > 1 && (
                    <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-euphoria-gold block">
                        Pass Recipients & Buyer ({quantity})
                      </span>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-[11px]">
                        <div className="text-white/80 flex items-center justify-between bg-white/[0.02] px-2 py-1 rounded">
                          <span className="truncate">1. {fullName} <span className="text-[9px] text-euphoria-gold uppercase font-bold">(Buyer)</span></span>
                          <span className="text-white/40 font-mono text-[10px] ml-2 shrink-0">{phone}</span>
                        </div>
                        {Array.from({ length: quantity - 1 }).map((_, idx) => {
                          const h = holders[idx];
                          return (
                            <div key={idx} className="text-white/75 flex items-center justify-between bg-white/[0.02] px-2 py-1 rounded">
                              <span className="truncate">{idx + 2}. {h?.fullName || `Pass Recipient ${idx + 2}`}</span>
                              <span className="text-white/40 font-mono text-[10px] ml-2 shrink-0">{h?.phone}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      navigate("/my-registrations");
                    }}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-amber-400 to-amber-300 text-neutral-950 hover:brightness-105 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none transition-all shadow-md shadow-amber-500/15"
                  >
                    View in My Tickets
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white border border-white/15 hover:bg-white/[0.06] transition-all focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Failed */}
            {step === "failed" && (
              <div className="py-6 text-center space-y-4">
                <div className="size-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                  <X className="size-6" />
                </div>
                <h4 className="text-base font-bold text-white">Purchase Failed</h4>
                <p className="text-xs text-red-400/90 max-w-xs mx-auto">{apiError}</p>
                <button
                  onClick={() => setStep("verify")}
                  className="px-6 py-2 rounded-xl text-xs font-semibold uppercase bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.1] transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
