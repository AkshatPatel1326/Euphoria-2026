import * as React from "react";
import { OTPInput, SlotProps, REGEXP_ONLY_DIGITS } from "input-otp";
import { cn } from "@/lib/utils";

export interface EuphoriaOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  hasError?: boolean;
  accentColor?: "aqua" | "gold" | "purple";
  id?: string;
  className?: string;
}

function Slot({
  char,
  hasFakeCaret,
  isActive,
  placeholderChar,
  hasError,
  accentColor,
}: SlotProps & {
  hasError?: boolean;
  accentColor: "aqua" | "gold" | "purple";
}) {
  const isFilled = char !== null && char !== undefined && char !== "";

  return (
    <div
      data-slot="euphoria-otp-slot"
      data-active={isActive}
      data-filled={isFilled}
      data-error={hasError}
      className={cn(
        // Strict geometry to prevent layout shifting
        "relative flex items-center justify-center select-none",
        "w-[38px] min-[390px]:w-10 sm:w-12 h-11 min-[390px]:h-12 sm:h-14",
        "rounded-xl border font-mono font-bold text-xl sm:text-2xl tabular-nums",
        "transition-all duration-200 ease-out",

        // Default empty & inactive state
        !isActive && !isFilled && !hasError && [
          "bg-white/[0.03] border-white/[0.1] text-white/30",
          "hover:border-white/[0.18] hover:bg-white/[0.05]",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]",
        ],

        // Filled & inactive state (clean contrast & subtle confirmation)
        !isActive && isFilled && !hasError && [
          "bg-white/[0.06] text-white",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
          accentColor === "aqua" && "border-euphoria-aqua/30 text-white",
          accentColor === "gold" && "border-euphoria-gold/30 text-white",
          accentColor === "purple" && "border-euphoria-purple/30 text-white",
        ],

        // Active / focused state (visually obvious, zero dimension change)
        isActive && !hasError && [
          "z-10",
          accentColor === "aqua" && [
            "border-euphoria-aqua bg-euphoria-aqua/[0.07]",
            "ring-2 ring-euphoria-aqua/30",
            "shadow-[0_0_16px_rgba(62,238,213,0.2)]",
          ],
          accentColor === "gold" && [
            "border-euphoria-gold bg-euphoria-gold/[0.07]",
            "ring-2 ring-euphoria-gold/30",
            "shadow-[0_0_16px_rgba(175,153,71,0.22)]",
          ],
          accentColor === "purple" && [
            "border-euphoria-purple bg-euphoria-purple/[0.07]",
            "ring-2 ring-euphoria-purple/30",
            "shadow-[0_0_16px_rgba(162,50,160,0.25)]",
          ],
        ],

        // Error state
        hasError && [
          "border-red-500/50 bg-red-500/[0.05] text-red-100",
          isActive
            ? "ring-2 ring-red-500/40 border-red-400 bg-red-500/[0.09]"
            : "ring-1 ring-red-500/20",
        ]
      )}
    >
      {/* Char or subtle placeholder dot */}
      {isFilled ? (
        <span className="animate-in fade-in zoom-in-95 duration-150 leading-none">
          {char}
        </span>
      ) : (
        <span className="text-white/20 text-xs sm:text-sm font-sans select-none pointer-events-none leading-none">
          {placeholderChar ?? "•"}
        </span>
      )}

      {/* Subtle bottom indicator dot when a digit is entered */}
      {isFilled && !hasError && (
        <span
          className={cn(
            "absolute bottom-1.5 size-1 rounded-full opacity-60",
            accentColor === "aqua" && "bg-euphoria-aqua",
            accentColor === "gold" && "bg-euphoria-gold",
            accentColor === "purple" && "bg-euphoria-purple"
          )}
        />
      )}

      {/* Pulsing blinking caret indicator */}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "w-0.5 h-5 sm:h-6 rounded-full animate-caret-blink",
              hasError
                ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]"
                : accentColor === "aqua"
                ? "bg-euphoria-aqua shadow-[0_0_8px_rgba(62,238,213,0.8)]"
                : accentColor === "gold"
                ? "bg-euphoria-gold shadow-[0_0_8px_rgba(175,153,71,0.8)]"
                : "bg-euphoria-purple shadow-[0_0_8px_rgba(162,50,160,0.8)]"
            )}
          />
        </div>
      )}
    </div>
  );
}

export function EuphoriaOtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  hasError = false,
  accentColor = "aqua",
  id,
  className,
}: EuphoriaOtpInputProps) {
  return (
    <div className={cn("w-full flex flex-col items-center justify-center", className)}>
      <OTPInput
        id={id}
        maxLength={6}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        pattern={REGEXP_ONLY_DIGITS}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={hasError}
        containerClassName="flex items-center justify-center gap-1.5 sm:gap-2 select-none w-full max-w-full"
        render={({ slots }) => (
          <div className="flex items-center justify-center gap-1 min-[390px]:gap-1.5 sm:gap-2 max-w-full">
            {/* First 3 digits */}
            <div className="flex items-center gap-1 min-[390px]:gap-1.5 sm:gap-2">
              {slots.slice(0, 3).map((slot, idx) => (
                <Slot
                  key={idx}
                  {...slot}
                  hasError={hasError}
                  accentColor={accentColor}
                />
              ))}
            </div>

            {/* Subtle middle divider */}
            <div
              className="flex items-center justify-center px-0.5 sm:px-1 text-white/20 select-none"
              aria-hidden="true"
            >
              <span className="w-1.5 sm:w-2 h-0.5 rounded-full bg-white/25" />
            </div>

            {/* Second 3 digits */}
            <div className="flex items-center gap-1 min-[390px]:gap-1.5 sm:gap-2">
              {slots.slice(3, 6).map((slot, idx) => (
                <Slot
                  key={idx + 3}
                  {...slot}
                  hasError={hasError}
                  accentColor={accentColor}
                />
              ))}
            </div>
          </div>
        )}
      />
    </div>
  );
}
