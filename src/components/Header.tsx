import { Zap } from "lucide-react";

const Header = () => (
  <header className="bg-gradient-to-r from-violet-600 to-fuchsia-600 py-5 px-4 shadow-lg">
    <div className="max-w-4xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
        <span className="text-2xl font-bold text-white tracking-tight">MianConvert</span>
      </div>
      <span className="text-sm text-violet-200 hidden sm:block">Fast · Free · No Upload Limits</span>
    </div>
  </header>
);

export default Header;
