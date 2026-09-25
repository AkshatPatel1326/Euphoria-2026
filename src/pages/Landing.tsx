import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/features/home/Hero";
import { About } from "@/features/home/About";
import { Glimpses } from "@/features/home/Glimpses";
import { Sponsors } from "@/features/home/Sponsors";
import { FAQ } from "@/features/home/FAQ";
import { Updates } from "@/features/updates/components/UpdatesTicker";
import { CategoryCards } from "@/features/events/components/CategoryCards";
import { Passes } from "@/features/passes/components/PassesSection";
import { ProNight } from "@/features/pronight/components/ProNight";
import { PastNights } from "@/features/pronight/components/PastNights";
import { SmoothCursor } from "@/components/magicui/smooth-cursor";

export default function Landing() {
  return (
    <div className="min-h-screen bg-euphoria-dark text-white overflow-x-hidden">
      <SmoothCursor />
      <Navbar />
      <main>
        <Hero />
        <Updates />
        <About />
        <PastNights />
        <CategoryCards />
        <Glimpses />
        <ProNight />
        <Passes />
        <Sponsors />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
