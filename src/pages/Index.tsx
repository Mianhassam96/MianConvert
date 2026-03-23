import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolTabs from "@/components/ToolTabs";

const STATS = [
  { value: "8", label: "Tools" },
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
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Your browser-based<br className="hidden sm:block" />
            <span className="text-violet-600"> Video Toolkit</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm sm:text-base">
            Convert, trim, merge, rotate, add subtitles, extract frames and more — powered by FFmpeg, 100% in your browser.
          </p>
          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 pt-2">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-extrabold text-violet-600">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <ToolTabs />
      </div>
    </main>
    <Footer />
  </div>
);

export default Index;
