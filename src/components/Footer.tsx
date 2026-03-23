import { Zap, Github, Globe, Heart } from "lucide-react";

const TOOLS = ["Convert", "Merge", "Watermark", "Subtitles", "Speed", "Frames", "GIF"];
const FEATURES = ["No file uploads", "100% browser-based", "FFmpeg powered", "Free forever", "Privacy first"];

const Footer = () => (
  <footer className="bg-gray-950 text-gray-400 mt-auto">
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="bg-violet-600 rounded-lg p-1.5">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-white">MianConvert</span>
          </div>
          <p className="text-sm leading-relaxed">
            A powerful browser-based video toolkit. Convert, edit, and process videos without uploading anything to a server.
          </p>
          <div className="flex items-center gap-1 text-xs text-violet-400">
            <span>Built with</span>
            <Heart className="w-3 h-3 fill-violet-400" />
            <span>by</span>
            <a href="https://github.com/Mianhassam96" target="_blank" rel="noreferrer" className="text-violet-300 hover:text-white transition-colors font-semibold">
              MultiMian
            </a>
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm uppercase tracking-wider">Tools</p>
          <ul className="space-y-1.5">
            {TOOLS.map((t) => (
              <li key={t} className="text-sm hover:text-violet-300 transition-colors cursor-default">{t}</li>
            ))}
          </ul>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm uppercase tracking-wider">Why MianConvert</p>
          <ul className="space-y-1.5">
            {FEATURES.map((f) => (
              <li key={f} className="text-sm flex items-center gap-2">
                <span className="text-violet-500">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p>© {new Date().getFullYear()} MianConvert by <span className="text-violet-400 font-semibold">MultiMian</span>. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="https://github.com/Mianhassam96/MianConvert" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
          <a href="https://mianhassam96.github.io/MianConvert/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
            <Globe className="w-3.5 h-3.5" /> Live Site
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
