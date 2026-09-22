import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAnnouncements, type PublicAnnouncement } from "@/hooks/use-announcements";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Pin,
  Calendar,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Loader2,
  Clock,
} from "lucide-react";

export function Updates() {
  const { announcements, isLoading } = useAnnouncements();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PublicAnnouncement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="updates" className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-euphoria-dark" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 20% 40%, rgba(138, 43, 226, 0.09) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 85% 60%, rgba(23, 111, 99, 0.1) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 sm:mb-14">
          <BlurFade delay={0} inViewMargin="-20px">
            <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-euphoria-aqua/40 bg-euphoria-aqua/[0.12] backdrop-blur-sm mb-4">
              <span
                className="relative flex items-center justify-center size-2.5"
                aria-hidden="true"
              >
                {/* Restrained ambient glow halo */}
                <motion.span
                  className="absolute inset-0 rounded-full bg-euphoria-aqua/60 blur-[3px]"
                  animate={
                    shouldReduceMotion
                      ? { opacity: 0.45, scale: 1 }
                      : {
                          opacity: [0.5, 0.8, 0.55, 0.85, 0.35, 0.75, 0.45, 0.9, 0.55, 0.5],
                          scale: [1, 1.2, 1.05, 1.25, 0.95, 1.15, 1, 1.3, 1.05, 1],
                        }
                  }
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : {
                          duration: 6.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          times: [0, 0.22, 0.42, 0.6, 0.63, 0.67, 0.72, 0.88, 0.95, 1],
                        }
                  }
                />

                {/* Core LED emitter with subtle irregular neon flicker & momentary natural dim */}
                <motion.span
                  className="relative size-2 rounded-full bg-euphoria-aqua shadow-[0_0_7px_#3EEED5]"
                  animate={
                    shouldReduceMotion
                      ? { opacity: 1, filter: "brightness(1) drop-shadow(0 0 3px #3EEED5)" }
                      : {
                          opacity: [1, 0.92, 1, 0.96, 0.55, 0.88, 0.62, 0.98, 1, 0.94, 1],
                          filter: [
                            "brightness(1) drop-shadow(0 0 3px rgba(62,238,213,0.85))",
                            "brightness(1.1) drop-shadow(0 0 5px rgba(62,238,213,0.95))",
                            "brightness(1.02) drop-shadow(0 0 3.5px rgba(62,238,213,0.85))",
                            "brightness(1.15) drop-shadow(0 0 6px rgba(62,238,213,1))",
                            "brightness(0.65) drop-shadow(0 0 1.5px rgba(62,238,213,0.4))",
                            "brightness(1.05) drop-shadow(0 0 4.5px rgba(62,238,213,0.9))",
                            "brightness(0.72) drop-shadow(0 0 2px rgba(62,238,213,0.5))",
                            "brightness(1.2) drop-shadow(0 0 6.5px rgba(62,238,213,1))",
                            "brightness(1.05) drop-shadow(0 0 4px rgba(62,238,213,0.9))",
                            "brightness(0.95) drop-shadow(0 0 3px rgba(62,238,213,0.85))",
                            "brightness(1) drop-shadow(0 0 3px rgba(62,238,213,0.85))",
                          ],
                        }
                  }
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : {
                          duration: 6.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          times: [0, 0.22, 0.42, 0.6, 0.63, 0.66, 0.69, 0.76, 0.88, 0.96, 1],
                        }
                  }
                />
              </span>
              <span className="text-xs sm:text-sm font-extrabold tracking-[0.25em] uppercase text-euphoria-aqua">
                Live Updates
              </span>
            </div>
          </BlurFade>

          <BlurFade delay={0.05} inViewMargin="-20px">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Festival{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua">
                Announcements
              </span>
            </h2>
          </BlurFade>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-euphoria-gold" />
            <p className="text-xs text-white/60">Fetching latest festival updates...</p>
          </div>
        ) : announcements.length === 0 ? (
          /* Clean Empty State as requested */
          <BlurFade delay={0.1} inViewMargin="-20px">
            <div className="rounded-2xl border border-white/[0.08] bg-[#140f26]/60 backdrop-blur-md p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl">
              <div className="size-14 rounded-2xl bg-euphoria-gold/10 border border-euphoria-gold/20 flex items-center justify-center mx-auto mb-4 text-euphoria-gold">
                <Megaphone className="size-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Stay tuned for exciting announcements!
              </h3>
              <p className="text-sm text-white/65 leading-relaxed max-w-lg mx-auto">
                Official audition dates, pro-night reveals, schedule adjustments, and competition notices will appear right here as the festival approaches.
              </p>
            </div>
          </BlurFade>
        ) : (
          /* Announcements Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {announcements.map((item, idx) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <BlurFade
                  key={item.id}
                  delay={0.08 * idx}
                  inViewMargin="-20px"
                  className="h-full"
                >
                  <div className="group relative h-full rounded-2xl border border-white/[0.08] bg-[#140f26]/80 hover:border-white/20 backdrop-blur-md p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/20 flex flex-col justify-between">
                    <div>
                      {/* Header Row: Category + Pinned + Date */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-white/15 bg-white/[0.05] text-white/90 text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5"
                          >
                            {item.category || "GENERAL"}
                          </Badge>
                          {item.isPinned && (
                            <Badge className="bg-euphoria-aqua/15 text-euphoria-aqua border border-euphoria-aqua/30 gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5">
                              <Pin className="size-2.5 fill-current" />
                              Pinned
                            </Badge>
                          )}
                        </div>

                        <span className="text-[11px] text-white/45 flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-euphoria-gold transition-colors line-clamp-2 mb-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* Snippet Content */}
                      <p className="text-xs sm:text-sm text-white/65 leading-relaxed line-clamp-3 mb-4">
                        {item.content}
                      </p>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedAnnouncement(item)}
                        className="text-xs font-semibold text-euphoria-aqua hover:text-euphoria-aqua/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        Read Details
                        <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {item.linkUrl && (
                        <a
                          href={item.linkUrl}
                          className="text-[11px] font-medium text-white/80 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 transition-colors"
                        >
                          {item.linkText || "Learn More"}
                          <ExternalLink className="size-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        )}
      </div>

      {/* Read More Detail Dialog */}
      <Dialog
        open={Boolean(selectedAnnouncement)}
        onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
      >
        <DialogContent className="bg-[#16102a] border border-white/10 text-white max-w-xl max-h-[85vh] overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="border-white/15 bg-white/[0.05] text-white/90 text-[11px] font-semibold uppercase tracking-wider"
                  >
                    {selectedAnnouncement.category || "GENERAL"}
                  </Badge>
                  {selectedAnnouncement.isPinned && (
                    <Badge className="bg-euphoria-aqua/15 text-euphoria-aqua border border-euphoria-aqua/30 gap-1 text-[11px]">
                      <Pin className="size-2.5 fill-current" />
                      Pinned
                    </Badge>
                  )}
                  <span className="text-xs text-white/45 ml-auto flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(selectedAnnouncement.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <DialogTitle className="text-xl font-bold text-white leading-snug">
                  {selectedAnnouncement.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detailed view of festival announcement
                </DialogDescription>
              </DialogHeader>

              {/* Full Content */}
              <div className="text-sm text-white/80 leading-relaxed whitespace-pre-line py-2">
                {selectedAnnouncement.content}
              </div>

              {/* Action Button */}
              {selectedAnnouncement.linkUrl && (
                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <a
                    href={selectedAnnouncement.linkUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-euphoria-gold text-euphoria-dark font-semibold text-xs hover:bg-euphoria-gold/90 transition-colors shadow-lg"
                  >
                    {selectedAnnouncement.linkText || "View Linked Details"}
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
