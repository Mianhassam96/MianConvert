import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolTabs from "@/components/ToolTabs";
import { Link } from "react-router-dom";
import { fadeUp, stagger } from "@/lib/motion";

const STATS = [
  { value: "13", label: "Tools" },
  { value: "10+", label: "Formats" },
  { value: "0", label: "Uploads" },
  { value: "100%", label: "Private" },
];

const Index = () => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors relative overflow-hidden">
    {/* Animated background blobs */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-3xl" />
      <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-400/10 dark:bg-fuchsia-600/10 rounded-full blur-3xl" />
      <motion.div animate={{ x: [0, 15, 0], y: [0, -15, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400/5 dark:bg-purple-600/5 rounded-full blur-3xl" />
    </div>

    <Header />

    <main className="flex-grow px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Hero */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="text-center space-y-5">
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-sm font-medium text-violet-700 dark:text-violet-300 shadow-sm">
            <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>⚡</motion.span>
            Powered by FFmpeg WebAssembly
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            Browser-based<br />
            <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              Video Toolkit
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            13 tools, 10+ formats — convert, compress, mute, clip, filter, add text, merge, rotate and more. Zero uploads. Everything stays on your device.
          </motion.p>

          {/* Stats */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-8 sm:gap-14">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }} className="text-center">
                <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3">
            <Link to="/about" className="text-sm text-violet-600 hover:text-violet-700 font-semibold hover:underline transition-colors">
              Learn more →
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">Contact</Link>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
          <ToolTabs />
        </motion.div>
      </div>
    </main>

    <Footer />
  </div>
);

export default Index;
