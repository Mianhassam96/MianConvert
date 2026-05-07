import { motion } from "framer-motion";
import { Github, Globe, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const TOOLS = ["Pro Editor", "Timeline", "Overlay Studio", "Clean Video", "Convert", "Compress", "Resize", "GIF Maker", "Audio Studio", "Merge", "Subtitle", "Thumbnail", "Auto Optimize", "AI Captions", "Silence Remover"];

const Footer = () => (
  <footer className="bg-gradient-to-b from-gray-950 to-gray-950 border-t border-violet-900/30 text-gray-400 mt-auto">
    {/* Top accent line matching header gradient */}
    <div className="h-px bg-gradient-to-r from-violet-700 via-purple-500 to-fuchsia-600" />

    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 mb-8 sm:mb-10">

        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/20 cursor-default shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <polygon points="6,4 20,12 6,20" fill="#5b21b6" />
                <rect x="3" y="4" width="2.5" height="16" rx="1.25" fill="#5b21b6" />
              </svg>
            </motion.div>
            <span className="text-lg font-black text-white tracking-tight">
              Mian<span className="text-yellow-300">Convert</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-400">
            A powerful browser-based video workspace. Convert, compress, edit and process videos — zero uploads, 100% private.
          </p>
          <div className="flex items-center gap-1 text-xs text-violet-400 flex-wrap">
            <span>Built with</span>
            <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}>
              <Heart className="w-3 h-3 fill-violet-400 inline" />
            </motion.span>
            <span>by</span>
            <a href="https://github.com/Mianhassam96" target="_blank" rel="noreferrer"
              className="text-violet-300 hover:text-white transition-colors font-semibold">
              MultiMian
            </a>
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm uppercase tracking-wider">Tools</p>
          <ul className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {TOOLS.map(t => (
              <motion.li key={t} whileHover={{ x: 3 }}
                className="text-sm text-gray-400 hover:text-violet-300 transition-colors cursor-default">{t}</motion.li>
            ))}
          </ul>
        </div>

        {/* Pages + info */}
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm uppercase tracking-wider">Pages</p>
          <ul className="space-y-1.5">
            {[{ to: "/", label: "Home" }, { to: "/about", label: "About" }, { to: "/contact", label: "Contact" }].map(p => (
              <motion.li key={p.to} whileHover={{ x: 3 }}>
                <Link to={p.to} className="text-sm text-gray-400 hover:text-violet-300 transition-colors">{p.label}</Link>
              </motion.li>
            ))}
          </ul>
          <div className="pt-2 space-y-1.5 text-xs text-gray-500">
            <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> No file uploads</p>
            <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" /> FFmpeg WebAssembly</p>
            <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" /> Free forever</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} MianConvert by <span className="text-violet-400 font-semibold">MultiMian</span>. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <motion.a href="https://github.com/Mianhassam96/MianConvert" target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Github className="w-3.5 h-3.5" /> GitHub
          </motion.a>
          <motion.a href="https://multimian.com/" target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Globe className="w-3.5 h-3.5" /> multimian.com
          </motion.a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
