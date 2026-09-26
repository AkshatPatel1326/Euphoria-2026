import { Calendar } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { FEST_DATES, FEST_MONTH, FEST_YEAR } from "@/data/festival";

export function About() {
  return (
    <section id="about" className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-euphoria-dark" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 80% 50%, rgba(23, 111, 99, 0.12) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 10% 70%, rgba(175, 153, 71, 0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14 items-start">
          {/* Left — Large headline + copy */}
          <div className="lg:col-span-7">
            <BlurFade className="mb-4 sm:mb-5" delay={0} inViewMargin="-20px">
              <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-euphoria-gold/50 bg-euphoria-gold/[0.14] backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-euphoria-gold animate-pulse" />
                <span className="text-sm sm:text-base lg:text-[17px] font-extrabold tracking-[0.3em] uppercase text-euphoria-gold">
                  About
                </span>
              </div>
            </BlurFade>

            <BlurFade delay={0.05} inViewMargin="-20px">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                <span className="text-white block">The Fourth</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-euphoria-gold via-euphoria-purple to-euphoria-aqua block mt-1 sm:mt-2">
                  Edition
                </span>
              </h2>

              {/* Supporting Fest Dates Reference */}
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                <Calendar className="size-3.5 text-euphoria-gold/90 shrink-0" />
                <span className="text-xs sm:text-[13px] font-bold tracking-[0.2em] uppercase text-white/90">
                  <span className="text-white font-extrabold">{FEST_DATES.join(" · ")}</span>{" "}
                  <span className="text-euphoria-gold">{FEST_MONTH} {FEST_YEAR}</span>
                </span>
              </div>
            </BlurFade>

            <BlurFade delay={0.1} inViewMargin="-20px" className="mt-6 sm:mt-8 space-y-4 sm:space-y-5 max-w-xl lg:max-w-[620px]">
              <p className="text-base sm:text-lg lg:text-[18px] text-white/85 leading-[1.8] font-normal text-left sm:text-justify [text-justify:inter-word] hyphens-auto [text-wrap:pretty]">
                SAGE Euphoria 2026 marks the fourth edition of SAGE University
                Indore&apos;s flagship annual university fest — a three-day
                celebration of art, music, culture, and innovation.
              </p>
              <p className="text-base sm:text-lg lg:text-[18px] text-white/85 leading-[1.8] font-normal text-left sm:text-justify [text-justify:inter-word] hyphens-auto [text-wrap:pretty]">
                Featuring live music, thrilling competitions, tech showcases,
                dynamic forums, and high-energy performances, Euphoria brings
                together thousands of students for an unforgettable experience
                where diversity, creativity, and the emotions that colours bring
                to life take centre stage.
              </p>
            </BlurFade>
          </div>

          {/* Right — Stats / decorative */}
          <div className="lg:col-span-5 lg:pt-4">
            <BlurFade delay={0.1} yOffset={12} blur={4} inViewMargin="-20px" className="space-y-0">
              {[
                { value: "20K+", label: "Attendees", accent: "text-euphoria-aqua" },
                { value: "3K+", label: "Participants", accent: "text-euphoria-gold" },
                { value: "03", label: "Days of Celebration", accent: "text-euphoria-purple" },
                { value: "30", label: "Events Across Various Genres", accent: "text-euphoria-aqua" },
              ].map((h) => (
                <div
                  key={h.label}
                  className="grid grid-cols-[85px_1fr] min-[380px]:grid-cols-[115px_1fr] sm:grid-cols-[135px_1fr] items-baseline gap-3 sm:gap-6 py-3.5 sm:py-4 border-b border-white/[0.06] group"
                >
                  <span
                    className={`text-2xl sm:text-3xl lg:text-4xl font-black ${h.accent} group-hover:text-white transition-colors duration-300 tracking-tight`}
                  >
                    {h.value}
                  </span>
                  <span className="text-xs sm:text-[13px] tracking-[0.14em] sm:tracking-[0.18em] uppercase text-white/75 font-medium group-hover:text-white/90 transition-colors">
                    {h.label}
                  </span>
                </div>
              ))}
            </BlurFade>

            {/* Historical reach */}
            <BlurFade delay={0.15} yOffset={10} blur={4} inViewMargin="-20px" className="mt-8 sm:mt-10">
              <h3 className="text-sm sm:text-base lg:text-[16px] tracking-[0.2em] uppercase text-white/90 font-bold mb-4 sm:mb-5 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-euphoria-aqua animate-pulse" />
                Previous Edition — Digital Reach
              </h3>
              <div className="space-y-0">
                {[
                  { value: "500K+", label: "Facebook Reach" },
                  { value: "2M+", label: "Instagram Impressions" },
                  { value: "100K+", label: "Video Views" },
                  { value: "800K+", label: "Website Visits" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="grid grid-cols-[85px_1fr] min-[380px]:grid-cols-[115px_1fr] sm:grid-cols-[135px_1fr] items-baseline gap-3 sm:gap-6 py-3.5 sm:py-4 border-b border-white/[0.06] group"
                  >
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white/80 group-hover:text-white transition-colors duration-300 tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-xs sm:text-[13px] tracking-[0.14em] sm:tracking-[0.18em] uppercase text-white/75 sm:text-white/60 font-medium group-hover:text-white/90 transition-colors">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </BlurFade>
          </div>
        </div>
      </div>

      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-euphoria-gold/10 to-transparent" />
    </section>
  );
}
