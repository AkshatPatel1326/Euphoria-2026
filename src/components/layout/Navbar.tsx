import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

interface NavLinkItem {
  label: string;
  href: string;
  isRoute?: boolean;
}

const navLinks: NavLinkItem[] = [
  { label: "Home", href: "#home" },
  { label: "Updates", href: "#updates" },
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Pro Night", href: "#pro-night" },
  { label: "Passes", href: "#passes" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
  { label: "My Tickets", href: "/my-registrations", isRoute: true },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("#home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track active section only on homepage
  useEffect(() => {
    if (location.pathname !== "/") {
      return;
    }

    const sectionIds = navLinks
      .filter((l) => l.href.startsWith("#"))
      .map((l) => l.href.replace("#", ""));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isLinkActive = useCallback(
    (link: NavLinkItem) => {
      if (link.isRoute) {
        return location.pathname === link.href;
      }
      if (location.pathname === "/") {
        return activeSection === link.href;
      }
      return false;
    },
    [location.pathname, activeSection]
  );

  const handleNavClick = useCallback(
    (link: NavLinkItem) => {
      setMobileOpen(false);

      if (link.isRoute || link.href.startsWith("/")) {
        if (location.pathname !== link.href) {
          navigate(link.href);
        }
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }

      // If on homepage, smooth-scroll to section
      if (location.pathname === "/") {
        const el = document.querySelector(link.href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        // Navigate to homepage, then scroll to section after render
        navigate("/");
        setTimeout(() => {
          const el = document.querySelector(link.href);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    },
    [navigate, location.pathname]
  );

  const handleLogoClick = useCallback(() => {
    setMobileOpen(false);
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "instant" }), 50);
    }
  }, [navigate]);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-euphoria-dark/80 backdrop-blur-2xl border-b border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.3)] py-1"
            : "bg-transparent backdrop-blur-sm border-b border-white/[0.02] py-2"
        }`}
      >
        <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between transition-all duration-500 ${
              scrolled ? "h-18 md:h-20 lg:h-22" : "h-20 md:h-24 lg:h-26"
            }`}
          >
            {/* Brand Group — Euphoria (Primary) & SAGE University (Secondary) */}
            <div className="flex items-center gap-2 min-[380px]:gap-3 sm:gap-4 lg:gap-5">
              {/* Primary: SAGE Euphoria */}
              <motion.button
                onClick={handleLogoClick}
                className="flex items-center cursor-pointer group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                aria-label="SAGE Euphoria Home"
              >
                <img
                  src="/assets/Sage_euphoria_logp.png"
                  alt="SAGE Euphoria logo"
                  className="h-10 min-[380px]:h-12 sm:h-15 md:h-18 lg:h-[90px] xl:h-[98px] w-auto object-contain transition-all duration-300 group-hover:opacity-100 opacity-95 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.22)]"
                />
              </motion.button>

              {/* Elegant divider */}
              <div className="h-5 min-[380px]:h-6 sm:h-8 md:h-10 lg:h-11 w-px bg-white/20 shrink-0" aria-hidden="true" />

              {/* Secondary: SAGE University White Logo */}
              <motion.button
                onClick={handleLogoClick}
                className="flex items-center cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="SAGE University"
              >
                <img
                  src="/assets/sage-university-logo.png"
                  alt="SAGE University logo"
                  className="h-5 min-[380px]:h-6 sm:h-7 md:h-9 lg:h-[42px] xl:h-[46px] w-auto object-contain transition-all duration-300 group-hover:opacity-100 opacity-90 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                />
              </motion.button>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-0.5 lg:gap-1">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link);
                return (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link)}
                    className={`relative px-2 sm:px-2.5 lg:px-2.5 xl:px-3.5 py-2 text-xs lg:text-[13px] xl:text-[14.5px] font-semibold tracking-[0.1em] xl:tracking-[0.12em] uppercase transition-colors duration-300 group ${
                      isActive
                        ? "text-euphoria-aqua font-bold"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {link.label}
                    {/* Underline */}
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] rounded-full transition-all duration-300 ${
                        isActive
                          ? "w-3/4 bg-euphoria-aqua/90 shadow-[0_0_12px_rgba(62,238,213,0.6)]"
                          : "w-0 bg-euphoria-aqua/60 group-hover:w-3/4 group-hover:shadow-[0_0_8px_rgba(62,238,213,0.3)]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden relative z-50 min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 text-white/80 hover:text-euphoria-aqua transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="size-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="size-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-euphoria-dark/95 lg:hidden overflow-y-auto"
          >
            <div className="flex flex-col items-center justify-center min-h-screen py-24 px-6 gap-5 sm:gap-7">
              {navLinks.map((link, i) => {
                const isActive = isLinkActive(link);
                return (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
                    onClick={() => handleNavClick(link)}
                    className={`min-h-[44px] flex flex-col items-center justify-center text-xl sm:text-2xl font-light tracking-[0.2em] uppercase transition-colors duration-300 py-1.5 cursor-pointer ${
                      isActive
                        ? "text-euphoria-aqua font-semibold"
                        : "text-white/85 hover:text-white"
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-active"
                        className="h-0.5 w-full bg-euphoria-aqua/60 mt-1.5 rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-[10px] sm:text-xs tracking-[0.3em] uppercase text-euphoria-gold/70"
              >
                SAGE Euphoria 2026
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/40"
              >
                SAGE University
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
