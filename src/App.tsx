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

// ── SEO Landing Page factory ──────────────────────────────────────────────────
const lp = (
  title: string, headline: string, subheadline: string, description: string,
  toolId: string, preset: string | undefined, emoji: string,
  gradient: string, features: { icon: string; text: string }[]
): LandingConfig => ({ title, headline, subheadline, description, toolId, preset, emoji, gradient, keywords: [], features });

// ── Convert category ──────────────────────────────────────────────────────────
const C = {
  MOV_MP4:   lp("MOV to MP4 Converter","Free MOV to MP4 Converter","Convert MOV files to MP4 — instantly in your browser","Convert Apple MOV videos to MP4 format. No upload, no account. Runs entirely in your browser with FFmpeg WASM.","convert",undefined,"🔄","from-blue-500 to-cyan-500",[{icon:"🔄",text:"MOV → MP4"},{icon:"⚡",text:"Fast H.264"},{icon:"🔒",text:"No uploads"}]),
  AVI_MP4:   lp("AVI to MP4 Converter","Free AVI to MP4 Converter","Convert AVI videos to MP4 — no software needed","Convert old AVI files to modern MP4 format. Works in any browser. Zero uploads, 100% private.","convert",undefined,"🔄","from-blue-500 to-cyan-500",[{icon:"🔄",text:"AVI → MP4"},{icon:"⚡",text:"Fast encoding"},{icon:"🔒",text:"Private"}]),
  WEBM_MP4:  lp("WebM to MP4 Converter","Free WebM to MP4 Converter","Convert WebM to MP4 for maximum compatibility","Convert WebM videos to MP4. Perfect for sharing on social media or messaging apps.","convert",undefined,"🔄","from-blue-500 to-cyan-500",[{icon:"🔄",text:"WebM → MP4"},{icon:"📱",text:"Mobile ready"},{icon:"🔒",text:"No uploads"}]),
  MKV_MP4:   lp("MKV to MP4 Converter","Free MKV to MP4 Converter","Convert MKV files to MP4 — browser-based","Convert MKV video files to MP4 format. No software installation. Runs in your browser.","convert",undefined,"🔄","from-blue-500 to-cyan-500",[{icon:"🔄",text:"MKV → MP4"},{icon:"⚡",text:"Fast"},{icon:"🔒",text:"Private"}]),
  MP4_MP3:   lp("MP4 to MP3 Converter","Free MP4 to MP3 Converter","Extract audio from MP4 videos — instantly","Convert MP4 videos to MP3 audio. Extract the soundtrack from any video file. 100% private.","audiostudio",undefined,"🎵","from-violet-500 to-fuchsia-500",[{icon:"🎵",text:"MP4 → MP3"},{icon:"⚡",text:"Instant"},{icon:"🔒",text:"No uploads"}]),
  VIDEO_MP3: lp("Video to MP3","Free Video to MP3 Converter","Extract audio from any video — instantly","Convert MP4, MOV, AVI, WebM to MP3 or WAV. Extract audio tracks from any video file.","audiostudio",undefined,"🎵","from-violet-500 to-fuchsia-500",[{icon:"🎵",text:"MP3/WAV/AAC"},{icon:"🔒",text:"No uploads"},{icon:"⚡",text:"Instant"}]),
  VIDEO_GIF: lp("Video to GIF Converter","Free Video to GIF Converter","Convert video clips to animated GIF — in your browser","Create high-quality animated GIFs from any video. Custom FPS, size, and duration. No uploads.","gif",undefined,"🎞","from-sky-500 to-blue-600",[{icon:"🎞",text:"Animated GIF"},{icon:"🎨",text:"Custom FPS"},{icon:"🔒",text:"Private"}]),
};

// ── Compress category ─────────────────────────────────────────────────────────
const COMP = {
  WHATSAPP:  lp("Compress Video for WhatsApp","Compress Video for WhatsApp","Make videos small enough for WhatsApp — instantly","Compress videos to under 16MB for WhatsApp sharing. Smart compression keeps quality high.","compress",undefined,"💬","from-green-500 to-emerald-500",[{icon:"💬",text:"WhatsApp ready"},{icon:"📦",text:"Under 16MB"},{icon:"⚡",text:"Fast"}]),
  DISCORD:   lp("Compress Video for Discord","Compress Video for Discord","Compress videos under 8MB for Discord — free","Reduce video file size for Discord's 8MB limit. No Nitro needed. Runs in your browser.","compress",undefined,"🎮","from-indigo-500 to-violet-500",[{icon:"🎮",text:"Discord ready"},{icon:"📦",text:"Under 8MB"},{icon:"🔒",text:"Private"}]),
  EMAIL:     lp("Compress Video for Email","Compress Video for Email","Reduce video size for email attachments","Compress videos to send via email. Reduce file size by up to 80% while keeping good quality.","compress",undefined,"📧","from-cyan-500 to-teal-500",[{icon:"📧",text:"Email ready"},{icon:"📦",text:"80% smaller"},{icon:"⚡",text:"Fast"}]),
  MOBILE:    lp("Compress Video for Mobile","Compress Video for Mobile","Optimize videos for mobile sharing","Compress and resize videos for mobile devices. Perfect for Instagram, TikTok, and WhatsApp.","compress",undefined,"📱","from-pink-500 to-rose-500",[{icon:"📱",text:"Mobile optimized"},{icon:"📦",text:"Smaller files"},{icon:"⚡",text:"Fast"}]),
  K4:        lp("Compress 4K Video","Free 4K Video Compressor","Compress 4K videos without losing quality","Reduce 4K video file size for easier sharing and storage. Smart compression preserves detail.","compress",undefined,"🎬","from-violet-500 to-purple-600",[{icon:"🎬",text:"4K support"},{icon:"✨",text:"Quality preserved"},{icon:"📦",text:"Smaller files"}]),
};

// ── Creator category ──────────────────────────────────────────────────────────
const CREATOR = {
  TIKTOK:    lp("TikTok Video Editor","Free TikTok Video Editor","Edit and optimize videos for TikTok — in your browser","Convert, compress, and optimize videos for TikTok. 9:16 format, perfect file size, ready to upload.","convert","tiktok","📱","from-pink-500 to-rose-500",[{icon:"📱",text:"9:16 vertical"},{icon:"📦",text:"Optimized size"},{icon:"⚡",text:"TikTok ready"}]),
  REELS:     lp("Instagram Reels Editor","Free Instagram Reels Editor","Prepare videos for Instagram Reels — instantly","Convert and optimize videos for Instagram Reels. Perfect aspect ratio and file size.","convert","instagram","📸","from-pink-500 to-fuchsia-500",[{icon:"📸",text:"Reels format"},{icon:"📦",text:"Optimized"},{icon:"⚡",text:"Instant"}]),
  YOUTUBE:   lp("YouTube Video Converter","Free YouTube Video Converter","Convert & optimize videos for YouTube — 1080p HD","Convert any video to YouTube-ready MP4 at 1080p. High quality H.264 encoding.","convert","youtube","▶️","from-red-500 to-orange-500",[{icon:"▶️",text:"1080p HD"},{icon:"🎵",text:"AAC audio"},{icon:"⚡",text:"Fast"}]),
  THUMBNAIL: lp("YouTube Thumbnail Creator","Free YouTube Thumbnail Creator","Extract frames and create YouTube thumbnails","Generate professional YouTube thumbnails from your video. Add title text, choose the perfect frame.","thumbnail",undefined,"📸","from-amber-500 to-orange-500",[{icon:"📸",text:"HD thumbnails"},{icon:"🎨",text:"Add title text"},{icon:"⚡",text:"Instant"}]),
  SUBTITLE:  lp("Subtitle Burner","Free Subtitle Burner","Burn SRT captions into your video — permanently","Upload your video and SRT file. Subtitles are burned directly into the video frames.","subtitle",undefined,"💬","from-blue-500 to-cyan-500",[{icon:"💬",text:"SRT support"},{icon:"🎨",text:"Custom style"},{icon:"🔒",text:"Private"}]),
  PODCAST:   lp("Podcast Clip Maker","Free Podcast Clip Maker","Create short clips from podcast videos","Trim podcast videos into shareable clips. Extract audio, add captions, optimize for social.","timeline",undefined,"🎙","from-violet-500 to-purple-600",[{icon:"✂️",text:"Trim clips"},{icon:"🎧",text:"Extract audio"},{icon:"⚡",text:"Fast"}]),
  WATERMARK: lp("Add Watermark to Video","Free Video Watermark Tool","Add logo or text watermark to your video","Add custom watermarks, logos, or text overlays to your videos. No software needed.","overlay",undefined,"🧩","from-fuchsia-500 to-violet-600",[{icon:"🧩",text:"Logo overlay"},{icon:"💬",text:"Text watermark"},{icon:"🔒",text:"Private"}]),
};

// ── Utility category ──────────────────────────────────────────────────────────
const UTIL = {
  MUTE:      lp("Remove Audio from Video","Free Audio Remover","Remove audio from any video — instantly","Mute videos with one click. Stream copy — no re-encoding, near instant. Works on any video format.","audiostudio",undefined,"🔇","from-gray-500 to-slate-600",[{icon:"🔇",text:"Instant mute"},{icon:"⚡",text:"Stream copy"},{icon:"🔒",text:"Private"}]),
  TRIM:      lp("Trim Video Online","Free Online Video Trimmer","Cut and trim videos in your browser — no upload","Trim videos to the perfect length. Cut clips, set start/end points. No software needed.","timeline",undefined,"✂️","from-purple-500 to-indigo-600",[{icon:"✂️",text:"Precise trimming"},{icon:"⚡",text:"Fast"},{icon:"🔒",text:"No uploads"}]),
  RESIZE:    lp("Resize Video Online","Free Video Resizer","Change video resolution and aspect ratio","Resize videos to any resolution. 4K, 1080p, 720p, 480p. Change aspect ratio with letterbox support.","resize",undefined,"📐","from-teal-500 to-emerald-500",[{icon:"📐",text:"Any resolution"},{icon:"🎬",text:"Aspect ratio"},{icon:"🔒",text:"Private"}]),
  ROTATE:    lp("Rotate Video Online","Free Video Rotator","Rotate or flip videos — instantly in your browser","Rotate videos 90°, 180°, 270° or flip horizontally/vertically. No software needed.","convert",undefined,"🔄","from-blue-500 to-cyan-500",[{icon:"🔄",text:"Rotate/flip"},{icon:"⚡",text:"Instant"},{icon:"🔒",text:"Private"}]),
  MERGE:     lp("Merge Videos Online","Free Video Merger","Combine multiple videos into one — in your browser","Merge and join multiple video files into one. Drag to reorder. Smart stream copy for same formats.","merge",undefined,"🔗","from-orange-500 to-amber-500",[{icon:"🔗",text:"Merge videos"},{icon:"⚡",text:"Stream copy"},{icon:"🔒",text:"Private"}]),
  SPEED:     lp("Change Video Speed","Free Video Speed Changer","Speed up or slow down videos — in your browser","Change video playback speed from 0.25x to 4x. Create slow motion or time-lapse effects.","timeline",undefined,"⚡","from-violet-500 to-fuchsia-500",[{icon:"⚡",text:"0.25x to 4x"},{icon:"🎬",text:"Smooth output"},{icon:"🔒",text:"Private"}]),
};

// ── Route map ─────────────────────────────────────────────────────────────────
const SEO_ROUTES: [string, LandingConfig][] = [
  // Convert
  ["/mov-to-mp4",                C.MOV_MP4],
  ["/avi-to-mp4",                C.AVI_MP4],
  ["/webm-to-mp4",               C.WEBM_MP4],
  ["/mkv-to-mp4",                C.MKV_MP4],
  ["/mp4-to-mp3",                C.MP4_MP3],
  ["/video-to-mp3",              C.VIDEO_MP3],
  ["/video-to-gif",              C.VIDEO_GIF],
  // Compress
  ["/video-compressor",          COMP.MOBILE],
  ["/compress-video-whatsapp",   COMP.WHATSAPP],
  ["/compress-video-discord",    COMP.DISCORD],
  ["/compress-video-email",      COMP.EMAIL],
  ["/compress-video-mobile",     COMP.MOBILE],
  ["/compress-4k-video",         COMP.K4],
  // Creator
  ["/tiktok-video-compressor",   CREATOR.TIKTOK],
  ["/tiktok-video-editor",       CREATOR.TIKTOK],
  ["/instagram-reels-editor",    CREATOR.REELS],
  ["/youtube-video-converter",   CREATOR.YOUTUBE],
  ["/youtube-thumbnail-creator", CREATOR.THUMBNAIL],
  ["/subtitle-burner",           CREATOR.SUBTITLE],
  ["/add-subtitles-to-video",    CREATOR.SUBTITLE],
  ["/podcast-clip-maker",        CREATOR.PODCAST],
  ["/add-watermark-to-video",    CREATOR.WATERMARK],
  // Utility
  ["/remove-audio-from-video",   UTIL.MUTE],
  ["/mute-video",                UTIL.MUTE],
  ["/trim-video-online",         UTIL.TRIM],
  ["/cut-video-online",          UTIL.TRIM],
  ["/resize-video-online",       UTIL.RESIZE],
  ["/rotate-video-online",       UTIL.ROTATE],
  ["/merge-videos-online",       UTIL.MERGE],
  ["/change-video-speed",        UTIL.SPEED],
];

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
          {SEO_ROUTES.map(([path, config]) => (
            <Route key={path} path={path} element={<LandingPage config={config} />} />
          ))}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
