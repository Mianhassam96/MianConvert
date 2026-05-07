import { Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import CommandPalette from "@/components/CommandPalette";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const Header = () => {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 shadow-xl shadow-violet-900/30">
      {/* Bottom shimmer line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <motion.div whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.4 }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/30 shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none">
              <polygon points="6,4 20,12 6,20" fill="#5b21b6" />
              <rect x="3" y="4" width="2.5" height="16" rx="1.25" fill="#5b21b6" />
            </svg>
          </motion.div>
          <div className="leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                Mian<span className="text-yellow-300">Convert</span>
              </span>
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full shadow-sm shadow-green-400/50 shrink-0" />
            </div>
            <p className="text-[9px] sm:text-[10px] text-violet-200 font-medium tracking-widest uppercase">Video Workspace</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-0.5">
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className={cn("relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === n.to ? "text-white" : "text-violet-200 hover:text-white"
              )}>
              {pathname === n.to && (
                <motion.span layoutId="nav-pill"
                  className="absolute inset-0 bg-white/20 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10">{n.label}</span>
            </Link>
          ))}
        </nav>

        {/* Command palette — desktop only */}
        <div className="hidden sm:block">
          <CommandPalette onOpenTool={(toolId, preset) => {
            window.dispatchEvent(new CustomEvent("openTool", { detail: { toolId, preset } }));
          }} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme toggle */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={toggle} aria-label="Toggle theme"
            className="bg-white/15 hover:bg-white/25 text-white rounded-lg p-1.5 sm:p-2 transition-colors">
            <AnimatePresence mode="wait">
              <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* Mobile menu toggle */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(o => !o)} aria-label="Toggle menu"
            className="sm:hidden bg-white/15 hover:bg-white/25 text-white rounded-lg p-1.5 transition-colors">
            <AnimatePresence mode="wait">
              <motion.span key={open ? "x" : "m"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} className="block">
                {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="sm:hidden overflow-hidden border-t border-white/20 bg-gradient-to-b from-violet-700/50 to-purple-700/50 backdrop-blur-sm">
            <div className="px-3 py-3 flex flex-col gap-1">
              {NAV.map((n, i) => (
                <motion.div key={n.to} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}>
                  <Link to={n.to} onClick={() => setOpen(false)}
                    className={cn("flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      pathname === n.to
                        ? "bg-white/20 text-white"
                        : "text-violet-100 hover:bg-white/10 hover:text-white"
                    )}>
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
