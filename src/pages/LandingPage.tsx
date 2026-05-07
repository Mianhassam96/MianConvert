/**
 * Reusable SEO landing page — used for /tiktok-video-compressor,
 * /youtube-video-converter, /video-to-mp3, /subtitle-burner etc.
 * Each page has a focused keyword, CTA, and opens the correct tool+preset.
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DropZone from "@/components/DropZone";
import { sessionStore } from "@/lib/session-store";
import { Shield, Zap, Lock } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";

export interface LandingConfig {
  title: string;
  headline: string;
  subheadline: string;
  description: string;
  toolId: string;
  preset?: string;
  keywords: string[];
  emoji: string;
  gradient: string;
  features: { icon: string; text: string }[];
}

interface LandingPageProps {
  config: LandingConfig;
}

const LandingPage = ({ config }: LandingPageProps) => {
  const navigate = useNavigate();

  const handleFile = (f: File) => {
    sessionStore.set(f);
    (window as any).__quickDropFile = f;
    if (config.preset) (window as any).__quickDropPreset = config.preset;
    // Navigate first, then open tool after React has mounted Index
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("openTool", {
        detail: { toolId: config.toolId, preset: config.preset }
      }));
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0b14] transition-colors relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-500/8 dark:bg-violet-600/12 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <Header />

      <main className="flex-grow px-3 sm:px-4 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto space-y-8">

          <motion.section variants={stagger} initial="hidden" animate="show" className="text-center space-y-5">
            <motion.div variants={fadeUp} className="flex justify-center">
              <span className="text-5xl">{config.emoji}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
              {config.headline}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              {config.subheadline}
            </motion.p>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
              {config.description}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
              {[
                { icon: <Lock className="w-3.5 h-3.5" />, text: "No uploads" },
                { icon: <Zap className="w-3.5 h-3.5" />, text: "Instant processing" },
                { icon: <Shield className="w-3.5 h-3.5" />, text: "100% private" },
              ].map(f => (
                <span key={f.text} className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                  <span className="text-violet-500">{f.icon}</span>{f.text}
                </span>
              ))}
            </motion.div>
          </motion.section>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <DropZone variant="hero" onFile={handleFile} label={`Drop your video to ${config.title.toLowerCase()}`} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {config.features.map((f, i) => (
              <motion.div key={f.text} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.07 }}
                className="glass-card p-4 text-center space-y-2">
                <span className="text-2xl">{f.icon}</span>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{f.text}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
