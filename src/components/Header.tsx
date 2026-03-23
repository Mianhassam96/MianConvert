import { Zap, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const Header = () => {
  const { theme, toggle } = useTheme();

  return (
    <header className="bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 py-4 px-4 shadow-xl sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-yellow-400 rounded-lg p-1.5 shadow-md">
            <Zap className="w-5 h-5 text-violet-900 fill-violet-900" />
          </div>
          <div className="leading-tight">
            <span className="text-xl font-extrabold text-white tracking-tight">MianConvert</span>
            <span className="ml-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Pro</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-xs text-violet-200 mr-2">
            <span>⚡ Fast</span>
            <span>🔒 Private</span>
            <span>🆓 Free</span>
          </div>
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="bg-white/15 hover:bg-white/25 text-white rounded-lg p-2 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
