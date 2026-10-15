import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/images/logo.png";

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ["about", "how-it-works", "network", "verification"];
      const scrollPos = window.scrollY + 120;

      if (window.scrollY < 80) {
        setActiveLink("Home");
        return;
      }

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            const nameMap: Record<string, string> = {
              about: "About",
              "how-it-works": "How It Works",
              network: "Ecosystem",
              verification: "Security",
            };
            setActiveLink(nameMap[sectionId] || "About");
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "About", href: "#about" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Ecosystem", href: "#network" },
    { name: "Security", href: "#verification" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-3 sm:px-6 lg:px-8 transition-all duration-300">
      <div
        ref={navRef}
        className={`max-w-6xl mx-auto rounded-full transition-all duration-300 relative border flex items-center justify-between px-5 sm:px-7 py-2.5 sm:py-3 gap-4 ${isScrolled
          ? "bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border-slate-200/50 dark:border-white/15 shadow-lg shadow-black/5 dark:shadow-cyan-950/20"
          : "bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm border-white/30 dark:border-white/10 shadow-md shadow-black/5"
          }`}
      >
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group focus:outline-none">
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-cyan-600/10 border border-cyan-500/40 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-[#0a152e] rounded-full flex items-center justify-center p-1.5">
                {logo ? (
                  <img
                    src={logo}
                    alt="CareLink Logo"
                    className="w-full h-full object-contain brightness-0 invert"
                  />
                ) : (
                  <svg
                    className="w-4 h-4 text-cyan-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12c2.5-4 5.5-4 8 0s5.5 4 8 0" />
                    <path d="M4 12c2.5 4 5.5 4 8 0s5.5-4 8 0" />
                  </svg>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              CareLink Ledger
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => {
            const isActive = activeLink === link.name;
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setActiveLink(link.name)}
                className={`relative text-sm font-medium transition-colors duration-200 py-1 ${isActive
                  ? "text-cyan-600 dark:text-cyan-400 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-cyan-500 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Actions & CTA Buttons */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Theme"
            className="p-2 rounded-full bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-slate-900 dark:hover:border-white transition-all duration-300"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Login Button (Transparent -> Hover: Light: Black / Dark: White) */}
          <Link
            to="/welcome/login"
            className="text-sm font-semibold text-slate-800 dark:text-slate-200 bg-transparent border border-slate-300 dark:border-slate-700 px-4 py-1.5 rounded-full hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-slate-900 dark:hover:border-white transition-all duration-300"
          >
            Login
          </Link>

          {/* Primary CTA Button ("Get in Touch") -> Transparent -> Hover: Neon Blue */}
          <Link
            to="/welcome/signup"
            className="group relative inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full text-sm font-semibold bg-transparent border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-500 dark:hover:text-white hover:border-cyan-500 transition-all duration-300"
          >
            <span>Get in Touch</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Mobile Menu Buttons */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Theme"
            className="p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-3 p-4 bg-white/95 dark:bg-[#0a1329]/95 backdrop-blur-xl border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl flex flex-col gap-2 md:hidden"
            >
              {navLinks.map((link) => {
                const isActive = activeLink === link.name;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => {
                      setActiveLink(link.name);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-between ${isActive
                      ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-500/30"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <span>{link.name}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />}
                  </a>
                );
              })}
              <div className="h-[1px] bg-white/10 my-1" />
              <div className="flex flex-col gap-2">
                <Link
                  to="/welcome/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-slate-900 dark:hover:border-white transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/welcome/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 bg-transparent border-2 border-cyan-500 rounded-xl hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-500 dark:hover:text-white transition-all duration-300"
                >
                  Get in Touch
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
