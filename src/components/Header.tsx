import { Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 shadow-xl">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg group-hover:animate-pulse-glow transition-all">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <polygon points="6,4 20,12 6,20" fill="#5b21b6"/>
                <rect x="3" y="4" width="2.5" height="16" rx="1.25" fill="#5b21b6"/>
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="leading-none">
            <span className="text-xl font-black text-white tracking-tight bg-clip-text">
              Mian<span className="text-yellow-300">Convert</span>
            </span>
            <p className="text-[10px] text-violet-200 font-medium tracking-widest uppercase">Video Toolkit</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                pathname === n.to
                  ? "bg-white/20 text-white"
                  : "text-violet-200 hover:bg-white/10 hover:text-white"
              )}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label="Toggle theme"
            className="bg-white/15 hover:bg-white/25 text-white rounded-lg p-2 transition-colors">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {/* Mobile menu toggle */}
          <button onClick={() => setOpen(o => !o)} className="sm:hidden bg-white/15 hover:bg-white/25 text-white rounded-lg p-2">
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="sm:hidden border-t border-white/20 px-4 py-3 flex flex-col gap-1 animate-fade-in">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
              className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-all",
                pathname === n.to ? "bg-white/20 text-white" : "text-violet-200 hover:bg-white/10 hover:text-white"
              )}>
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
