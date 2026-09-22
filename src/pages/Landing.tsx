import { Navbar } from "@/components/euphoria/Navbar";
import { Hero } from "@/components/euphoria/Hero";
import { Updates } from "@/components/euphoria/Updates";
import { About } from "@/components/euphoria/About";
import { PastNights } from "@/components/euphoria/PastNights";
import { CategoryCards } from "@/components/euphoria/CategoryCards";
import { Glimpses } from "@/components/euphoria/Glimpses";
import { ProNight } from "@/components/euphoria/ProNight";
import { Passes } from "@/components/euphoria/Passes";
import { Sponsors } from "@/components/euphoria/Sponsors";
import { FAQ } from "@/components/euphoria/FAQ";
import { Footer } from "@/components/euphoria/Footer";
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
