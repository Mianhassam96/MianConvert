import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolTabs from "@/components/ToolTabs";
import { Link } from "react-router-dom";

const STATS = [
  { value: "11", label: "Tools" },
  { value: "10+", label: "Formats" },
  { value: "0", label: "Uploads" },
  { value: "100%", label: "Private" },
];

const Index = () => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
    <Header />
    <main className="flex-grow px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-7">

        {/* Hero */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium animate-float">
            ⚡ Powered by FFmpeg WebAssembly
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Browser-based<br />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Video Toolkit</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm sm:text-base">
            Convert, clip, filter, add text, merge, rotate and more — 11 tools, 10+ formats, zero uploads. Everything stays on your device.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 pt-1">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-violet-600">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <Link to="/about" className="text-sm text-violet-600 hover:underline font-medium">Learn more →</Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Contact</Link>
          </div>
        </div>

        <ToolTabs />
      </div>
    </main>
    <Footer />
  </div>
);

export default Index;
