import { Zap } from "lucide-react";

const Header = () => (
  <header className="bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 py-4 px-4 shadow-xl">
    <div className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="bg-yellow-400 rounded-lg p-1.5">
          <Zap className="w-5 h-5 text-violet-900 fill-violet-900" />
        </div>
        <div>
          <span className="text-xl font-extrabold text-white tracking-tight">MianConvert</span>
          <span className="ml-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Pro</span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-6 text-sm text-violet-200">
        <span>⚡ Fast</span>
        <span>🔒 Private</span>
        <span>🆓 Free</span>
        <span>📵 No uploads</span>
      </div>
    </div>
  </header>
);

export default Header;
