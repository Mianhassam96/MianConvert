import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Zap, Code2, Heart, Github, Shield, Globe } from "lucide-react";
import { fadeUp, stagger, scaleIn } from "@/lib/motion";

const FEATURES = [
  { icon: "🎬", title: "12 Professional Tools", desc: "Pro Editor, Timeline, Overlay Studio, Clean Video, Convert, Compress, Resize, GIF Maker, Audio Studio, Merge, Subtitle & Thumbnail." },
  { icon: "🔒", title: "100% Private", desc: "Nothing leaves your device. All processing happens in your browser using WebAssembly — no servers, no uploads, ever." },
  { icon: "⚡", title: "FFmpeg Powered", desc: "Built on FFmpeg compiled to WebAssembly — the same engine used by professionals, running entirely client-side with a singleton loader." },
  { icon: "🆓", title: "Completely Free", desc: "No accounts, no subscriptions, no limits. MianConvert is and always will be free." },
  { icon: "📱", title: "Works Everywhere", desc: "Fully responsive — desktop, tablet, and mobile. Dark and light mode. Works in any modern browser." },
  { icon: "🎨", title: "Smart Dashboard", desc: "Grouped tool cards, live search, favorites, drag-to-reorder merge, smart presets and auto format detection." },
];

const STACK = ["React 18", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui", "FFmpeg WASM", "Framer Motion", "GitHub Pages"];

const About = () => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0b14] transition-colors relative overflow-x-hidden">

    {/* Background blobs */}
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-500/8 dark:bg-violet-600/12 blur-3xl" />
      <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-fuchsia-500/8 dark:bg-fuchsia-600/12 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(124,58,237,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.06)_1px,transparent_1px)]" />
    </div>

    <Header />

    <main className="flex-grow px-3 sm:px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-14">

        {/* Hero */}
        <motion.section variants={stagger} initial="hidden" animate="show" className="text-center space-y-4 pt-2">
          <motion.div variants={fadeUp} className="flex justify-center">
            <span className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-violet-700 dark:text-violet-300 shadow-sm shadow-violet-500/10">
              <Zap className="w-4 h-4" /> About MianConvert
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            Video tools that respect<br />your{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent text-glow">
              privacy
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed px-2">
            MianConvert is a free, browser-based video toolkit. No file uploads, no accounts, no tracking — just powerful tools that run entirely on your device.
          </motion.p>

          {/* Quick stats */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 pt-1">
            {[
              { icon: <Shield className="w-3.5 h-3.5" />, text: "No uploads" },
              { icon: <Zap className="w-3.5 h-3.5" />, text: "FFmpeg WASM" },
              { icon: <Globe className="w-3.5 h-3.5" />, text: "Any browser" },
            ].map(f => (
              <span key={f.text} className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-violet-500">{f.icon}</span>{f.text}
              </span>
            ))}
          </motion.div>
        </motion.section>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              variants={scaleIn} initial="hidden" whileInView="show"
              viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card p-5 space-y-2 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{f.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="glass-card p-5 sm:p-8 space-y-5 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {[
              { step: "1", emoji: "📂", title: "Upload", desc: "Drag & drop or click to select your video. It stays on your device." },
              { step: "2", emoji: "⚙️", title: "Process", desc: "Choose your tool and settings. FFmpeg WASM processes everything in your browser." },
              { step: "3", emoji: "⬇️", title: "Download", desc: "Your processed file is ready instantly. Download it directly — no waiting." },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex gap-3 sm:flex-col sm:gap-3 sm:text-center sm:items-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/25">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.emoji} {s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech stack */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="glass-card p-5 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-violet-600" /> Built with
          </h2>
          <div className="flex flex-wrap gap-2">
            {STACK.map((t, i) => (
              <motion.span key={t} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.06, y: -1 }}
                className="bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium cursor-default">
                {t}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Author CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white text-center space-y-3"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)" }}>
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            className="relative z-10">
            <Heart className="w-8 h-8 mx-auto fill-white" />
          </motion.div>
          <h2 className="relative z-10 text-xl sm:text-2xl font-bold">Made by MultiMian</h2>
          <p className="relative z-10 text-violet-100 max-w-md mx-auto text-sm sm:text-base">
            Open source, built with passion. MianConvert is a personal project focused on privacy-first tooling for everyone.
          </p>
          <motion.a href="https://github.com/Mianhassam96" target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            className="relative z-10 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-medium transition-colors mt-1">
            <Github className="w-4 h-4" /> View on GitHub
          </motion.a>
        </motion.div>

      </div>
    </main>

    <Footer />
  </div>
);

export default About;
