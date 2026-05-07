import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FFmpegLoader from "./components/FFmpegLoader";
import LandingPage, { LandingConfig } from "./pages/LandingPage";

const queryClient = new QueryClient();
const basename = import.meta.env.BASE_URL || "/";

// ── SEO Landing Page Configs ──────────────────────────────────────────────────
const TIKTOK_CONFIG: LandingConfig = {
  title: "TikTok Video Compressor",
  headline: "Free TikTok Video Compressor",
  subheadline: "Compress & convert videos for TikTok — in your browser",
  description: "Reduce video size, convert to MP4 9:16, and optimize for TikTok upload. No account needed. Runs entirely in your browser.",
  toolId: "convert", preset: "tiktok", emoji: "📱",
  gradient: "from-pink-500 to-rose-500",
  keywords: ["tiktok video compressor", "compress video for tiktok", "tiktok mp4 converter"],
  features: [
    { icon: "📱", text: "9:16 vertical format" },
    { icon: "📦", text: "Optimized file size" },
    { icon: "⚡", text: "Instant in-browser" },
  ],
};

const YOUTUBE_CONFIG: LandingConfig = {
  title: "YouTube Video Converter",
  headline: "Free YouTube Video Converter",
  subheadline: "Convert & optimize videos for YouTube — 1080p HD",
  description: "Convert any video to YouTube-ready MP4 at 1080p. High quality H.264 encoding. No uploads, no account, runs in your browser.",
  toolId: "convert", preset: "youtube", emoji: "▶️",
  gradient: "from-red-500 to-orange-500",
  keywords: ["youtube video converter", "convert video for youtube", "youtube 1080p mp4"],
  features: [
    { icon: "▶️", text: "1080p HD quality" },
    { icon: "🎵", text: "AAC audio" },
    { icon: "⚡", text: "Fast H.264 encoding" },
  ],
};

const MP3_CONFIG: LandingConfig = {
  title: "Video to MP3 Converter",
  headline: "Free Video to MP3 Converter",
  subheadline: "Extract audio from any video — instantly",
  description: "Convert MP4, MOV, AVI, WebM to MP3 or WAV. Extract audio tracks from any video file. 100% private, runs in your browser.",
  toolId: "audiostudio", preset: undefined, emoji: "🎵",
  gradient: "from-violet-500 to-fuchsia-500",
  keywords: ["video to mp3", "extract audio from video", "mp4 to mp3 converter"],
  features: [
    { icon: "🎵", text: "MP3 / WAV / AAC output" },
    { icon: "🔒", text: "No file uploads" },
    { icon: "⚡", text: "Instant extraction" },
  ],
};

const SUBTITLE_CONFIG: LandingConfig = {
  title: "Subtitle Burner",
  headline: "Free Subtitle Burner",
  subheadline: "Burn SRT captions into your video — permanently",
  description: "Upload your video and SRT file. Subtitles are burned directly into the video frames. Works with any SRT file. No account needed.",
  toolId: "subtitle", preset: undefined, emoji: "💬",
  gradient: "from-blue-500 to-cyan-500",
  keywords: ["subtitle burner", "burn subtitles into video", "srt to video", "add captions to video"],
  features: [
    { icon: "💬", text: "SRT subtitle support" },
    { icon: "🎨", text: "Custom font & color" },
    { icon: "🔒", text: "100% private" },
  ],
};

const COMPRESS_CONFIG: LandingConfig = {
  title: "Video Compressor",
  headline: "Free Online Video Compressor",
  subheadline: "Reduce video file size without losing quality",
  description: "Compress MP4, MOV, AVI and more. Smart compression reduces file size by up to 80% while keeping great quality. Runs in your browser.",
  toolId: "compress", preset: undefined, emoji: "📦",
  gradient: "from-cyan-500 to-teal-500",
  keywords: ["video compressor", "compress video online", "reduce video file size", "mp4 compressor"],
  features: [
    { icon: "📦", text: "Up to 80% smaller" },
    { icon: "✨", text: "Quality preserved" },
    { icon: "⚡", text: "Fast processing" },
  ],
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FFmpegLoader />
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* SEO Landing Pages */}
          <Route path="/tiktok-video-compressor"  element={<LandingPage config={TIKTOK_CONFIG} />} />
          <Route path="/youtube-video-converter"  element={<LandingPage config={YOUTUBE_CONFIG} />} />
          <Route path="/video-to-mp3"             element={<LandingPage config={MP3_CONFIG} />} />
          <Route path="/subtitle-burner"          element={<LandingPage config={SUBTITLE_CONFIG} />} />
          <Route path="/video-compressor"         element={<LandingPage config={COMPRESS_CONFIG} />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
