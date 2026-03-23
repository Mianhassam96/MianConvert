import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolTabs from "@/components/ToolTabs";
import { Link } from "react-router-dom";
import { fadeUp, stagger } from "@/lib/motion";
import { Shield, Zap, Globe } from "lucide-react";

const STATS = [
  { value: "12", label: "Tools", icon: "🛠" },
  { value: "10+", label: "Formats", icon: "🎞" },
  { value: "0", label: "Uploads", icon: "🔒" },
  { value: "100%", label: "Private", icon: "✅" },
];

const FEATURES = [
  { icon: <Zap className="w-4 h-4" />, text: "FFmpeg WebAssembly" },
  { icon: <Shield className="w-4 h-4" />, text: "No server uploads" },
  { icon: <Globe className="w-4 h-4" />, text: "Works in any browser" },
];

const Index = () => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0b14] transition-colors relative overflow-x-hidden">

    {/* ── Animated background ── */}
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Blobs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-500/8 dark:bg-violet-600/12 blur-3xl animate-blob"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-fuchsia-500/8 dark:bg-fuchsia-600/12 blur-3xl animate-blob"
        style={{ animationDelay: "4s" }}
      />
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-purple-500/5 dark:bg-purple-600/8 blur-3xl"
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(124,58,237,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.06)_1px,transparent_1px)]" />
    </div>

    <Header />

    <main className="flex-grow px-3 sm:px-4 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">

        {/* ── Hero ── */}
        <motion.section variants={stagger} initial="hidden" animate="show"
          className="text-center space-y-5 sm:space-y-6 pt-2 sm:pt-4">

          {/* Badge */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <span className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-violet-700 dark:text-violet-300 shadow-sm shadow-violet-500/10">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                className="text-base">⚡</motion.span>
              Powered by FFmpeg WebAssembly — runs 100% in your browser
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={fadeUp} className="space-y-2">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
              The Browser-Based
            </h1>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent text-glow">
                Video Toolkit
              </span>
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p variants={fadeUp}
            className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed px-2">
            12 powerful tools — convert, compress, mute, clip, filter, add text, merge, rotate and more.
            Zero uploads. Everything stays on your device.
          </motion.p>

          {/* Feature pills */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2">
            {FEATURES.map(f => (
              <span key={f.text}
                className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-violet-500">{f.icon}</span>
                {f.text}
              </span>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp}
            className="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm sm:max-w-lg mx-auto">
            {STATS.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                whileHover={{ y: -3, scale: 1.04 }}
                className="stat-card">
                <p className="text-lg sm:text-2xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent leading-none mb-0.5">
                  {s.value}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA links */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 text-sm">
            <Link to="/about"
              className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors flex items-center gap-1 group">
              Learn more
              <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link to="/contact"
              className="text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Contact
            </Link>
          </motion.div>
        </motion.section>

        {/* ── Tool Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}>
          <ToolTabs />
        </motion.div>

        {/* ── How it works ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="glass-card p-5 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-5 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { n: "1", emoji: "📂", title: "Upload", desc: "Drag & drop or click to pick your video. It never leaves your device." },
              { n: "2", emoji: "⚙️", title: "Process", desc: "Pick a tool, tweak settings. FFmpeg WASM handles everything in-browser." },
              { n: "3", emoji: "⬇️", title: "Download", desc: "Your file is ready instantly. Download it — no waiting, no account." },
            ].map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex gap-3 sm:flex-col sm:gap-2 sm:text-center sm:items-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/25">
                  {s.n}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.emoji} {s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

      </div>
    </main>

    <Footer />
  </div>
);

export default Index;
