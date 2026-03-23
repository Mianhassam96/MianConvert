import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Zap, Shield, Globe, Code2, Heart, Github } from "lucide-react";

const FEATURES = [
  { icon: "🔄", title: "11 Powerful Tools", desc: "Convert, clip, filter, add text, merge, watermark, subtitles, speed, rotate, extract frames, and create GIFs." },
  { icon: "🔒", title: "100% Private", desc: "Nothing leaves your device. All processing happens in your browser using WebAssembly — no servers, no uploads." },
  { icon: "⚡", title: "FFmpeg Powered", desc: "Built on FFmpeg compiled to WebAssembly. The same engine used by professionals, running entirely client-side." },
  { icon: "🆓", title: "Completely Free", desc: "No accounts, no subscriptions, no limits. MianConvert is and always will be free." },
  { icon: "📱", title: "Works Everywhere", desc: "Responsive design that works on desktop, tablet, and mobile. Dark and light mode included." },
  { icon: "🎨", title: "Creative Tools", desc: "Filters, text overlays with animations, clip creation with loops — go beyond basic conversion." },
];

const STACK = ["React 18", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui", "FFmpeg WASM", "GitHub Pages"];

const About = () => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
    <Header />
    <main className="flex-grow px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-14 animate-fade-in">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4" /> About MianConvert
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Video tools that respect<br />your <span className="text-violet-600">privacy</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
            MianConvert is a free, browser-based video toolkit. No file uploads, no accounts, no tracking — just powerful tools that run entirely on your device.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-2 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Upload", desc: "Drag & drop or click to select your video file. It stays on your device." },
              { step: "2", title: "Process", desc: "Choose your tool and settings. FFmpeg WASM processes everything in your browser." },
              { step: "3", title: "Download", desc: "Your processed file is ready instantly. Download it directly — no waiting." },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white font-bold text-lg flex items-center justify-center shrink-0">{s.step}</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{s.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Code2 className="w-5 h-5 text-violet-600" /> Built with</h2>
          <div className="flex flex-wrap gap-2">
            {STACK.map(t => (
              <span key={t} className="bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-3 py-1.5 rounded-full text-sm font-medium">{t}</span>
            ))}
          </div>
        </div>

        {/* Author */}
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl p-8 text-white text-center space-y-3">
          <Heart className="w-8 h-8 mx-auto fill-white" />
          <h2 className="text-2xl font-bold">Made by MultiMian</h2>
          <p className="text-violet-100 max-w-md mx-auto">Open source, built with passion. MianConvert is a personal project focused on privacy-first tooling for everyone.</p>
          <a href="https://github.com/Mianhassam96" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-medium transition-colors mt-2">
            <Github className="w-4 h-4" /> View on GitHub
          </a>
        </div>

      </div>
    </main>
    <Footer />
  </div>
);

export default About;
