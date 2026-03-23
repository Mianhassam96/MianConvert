import { motion } from "framer-motion";
import { Zap, Github, Globe, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const TOOLS = ["Convert", "Clip", "Filters", "Text", "Merge", "Watermark", "Subtitles", "Speed", "Rotate", "Frames", "GIF"];

const Footer = () => (
  <footer className="bg-gray-950 text-gray-400 mt-auto">
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className="bg-violet-600 rounded-lg p-1.5 cursor-default">
              <Zap className="w-4 h-4 text-white fill-white" />
            </motion.div>
            <span className="text-lg font-bold text-white">MianConvert</span>
          </div>
          <p className="text-sm leading-relaxed">
            A powerful browser-based video toolkit. Convert, edit, and process videos without uploading anything to a server.
          </p>
          <div className="flex items-center gap-1 text-xs text-violet-400">
            <span>Built with</span>
            <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}>
              <Heart className="w-3 h-3 fill-violet-400" />
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
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {TOOLS.map(t => (
              <motion.li key={t} whileHover={{ x: 3 }} className="text-sm hover:text-violet-300 transition-colors cursor-default">{t}</motion.li>
            ))}
          </ul>
        </div>

        {/* Pages */}
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm uppercase tracking-wider">Pages</p>
          <ul className="space-y-1.5">
            {[{ to: "/", label: "Home" }, { to: "/about", label: "About" }, { to: "/contact", label: "Contact" }].map(p => (
              <motion.li key={p.to} whileHover={{ x: 3 }}>
                <Link to={p.to} className="text-sm hover:text-violet-300 transition-colors">{p.label}</Link>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p>© {new Date().getFullYear()} MianConvert by <span className="text-violet-400 font-semibold">MultiMian</span>. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <motion.a href="https://github.com/Mianhassam96/MianConvert" target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.05 }} className="flex items-center gap-1 hover:text-white transition-colors">
            <Github className="w-3.5 h-3.5" /> GitHub
          </motion.a>
          <motion.a href="https://mianhassam96.github.io/MianConvert/" target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.05 }} className="flex items-center gap-1 hover:text-white transition-colors">
            <Globe className="w-3.5 h-3.5" /> Live Site
          </motion.a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
