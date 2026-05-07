import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import { detectDevice, recommendedFormat, recommendedResolution } from "@/lib/device";
import { CONVERT_PRESETS } from "@/lib/presets";
import { sessionStore } from "@/lib/session-store";
import DropZone from "@/components/DropZone";
import VideoPreview from "@/components/VideoPreview";
import TrimControl from "@/components/TrimControl";
import ResultCard, { buildNextActions } from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { Scissors, RotateCcw, FlipHorizontal, Zap, Settings2 } from "lucide-react";
import ErrorRecovery from "@/components/ErrorRecovery";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Fmt = "mp4" | "webm" | "mp3" | "wav" | "avi" | "mov" | "mkv" | "muted";
type Res = "1080p" | "720p" | "480p" | "original";
type Quality = "high" | "medium" | "low";
type Rotate = "none" | "90" | "180" | "270" | "fliph" | "flipv";
type Mode = "quick" | "advanced";

const RES: Record<Res, string> = { "1080p": "1920:1080", "720p": "1280:720", "480p": "854:480", original: "" };
const CRF: Record<Quality, string> = { high: "18", medium: "28", low: "38" };

// Friendly labels for non-tech users
const QUALITY_LABELS: Record<Quality, string> = {
  high: "Best quality (larger file)",
  medium: "Balanced (recommended)",
  low: "Smaller file (lower quality)",
};

const FORMAT_GROUPS = [
  { group: "Video", opts: [["mp4","MP4"],["webm","WebM"],["avi","AVI"],["mov","MOV"],["mkv","MKV"],["muted","Remove Audio"]] },
  { group: "Audio only", opts: [["mp3","MP3"],["wav","WAV"]] },
];

const ROTATE_OPTS: { value: Rotate; label: string }[] = [
  { value: "none",  label: "No rotation" },
  { value: "90",    label: "Rotate 90°" },
  { value: "180",   label: "Rotate 180°" },
  { value: "270",   label: "Rotate 270°" },
  { value: "fliph", label: "Flip horizontal" },
  { value: "flipv", label: "Flip vertical" },
];

const getRotateFilter = (r: Rotate): string | null => {
  if (r === "none")  return null;
  if (r === "90")    return "transpose=1";
  if (r === "180")   return "transpose=1,transpose=1";
  if (r === "270")   return "transpose=2";
  if (r === "fliph") return "hflip";
  if (r === "flipv") return "vflip";
  return null;
};

const isAudio = (f: Fmt) => f === "mp3" || f === "wav";

// Quick Mode preset cards
const QUICK_PRESETS = [
  { id: "tiktok",    icon: "📱", label: "TikTok",        desc: "MP4 · 720p · vertical-ready" },
  { id: "youtube",   icon: "▶️", label: "YouTube HD",    desc: "MP4 · 1080p · high quality" },
  { id: "whatsapp",  icon: "💬", label: "WhatsApp",      desc: "MP4 · 480p · small file" },
  { id: "instagram", icon: "📸", label: "Instagram",     desc: "MP4 · 720p · balanced" },
  { id: "web",       icon: "🌐", label: "Web (WebM)",    desc: "WebM · 720p · fast loading" },
  { id: "audio_mp3", icon: "🎵", label: "Audio MP3",     desc: "Extract audio only" },
];

interface ConvertToolProps {
  initialPreset?: string;
}

const ConvertTool = ({ initialPreset }: ConvertToolProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [fmt, setFmt] = useState<Fmt>("mp4");
  const [res, setRes] = useState<Res>("original");
  const [quality, setQuality] = useState<Quality>("medium");
  const [rotate, setRotate] = useState<Rotate>("none");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string; rawSize: number } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [autoDetectMsg, setAutoDetectMsg] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>(initialPreset ?? "original");
  const [mode, setMode] = useState<Mode>("quick");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  // Device-based defaults
  useEffect(() => {
    const d = detectDevice();
    setFmt(recommendedFormat(d) as Fmt);
    setRes(recommendedResolution(d) as Res);
  }, []);

  // Apply initial preset from use-case bar
  useEffect(() => {
    if (initialPreset) applyPreset(initialPreset);
  }, [initialPreset]);

  // Pick up file from session store (quick drop or tool switch)
  useEffect(() => {
    const session = sessionStore.get();
    if (session.file && !file) {
      const f = session.file;
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setDuration(session.duration);
      setTrimEnd(session.duration);
      setWarning(getFileSizeWarning(f));
      buildAutoDetect(f);
    }
    // Also check legacy __quickDropFile
    const qdf = (window as any).__quickDropFile as File | undefined;
    if (qdf && !file) {
      handleFile(qdf);
      (window as any).__quickDropFile = undefined;
    }
  }, []);

  const buildAutoDetect = (f: File) => {
    const sizeMB = f.size / (1024 * 1024);
    const ext = f.name.split(".").pop()?.toLowerCase();
    const msgs: string[] = [];
    if (ext === "mov" || ext === "avi") msgs.push(`${ext.toUpperCase()} detected — MP4 recommended for best compatibility.`);
    if (sizeMB > 200) msgs.push(`Large file (${formatBytes(f.size)}) — consider Compress tool first.`);
    setAutoDetectMsg(msgs.length ? msgs.join(" ") : null);
  };

  const handleFile = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null); setProgress(0); setTrimEnabled(false); setDone(false);
    setWarning(getFileSizeWarning(f));
    buildAutoDetect(f);
    // Save to session store
    sessionStore.set(f);
  };

  const applyPreset = (presetId: string) => {
    const p = CONVERT_PRESETS.find(x => x.id === presetId);
    if (!p) return;
    setActivePreset(presetId);
    setFmt(p.fmt as Fmt);
    setRes(p.res as Res);
    setQuality(p.quality as Quality);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null); setPreviewUrl(""); setResult(null); setProgress(0);
    setRotate("none"); setDone(false); setError(null);
    setWarning(null); setAutoDetectMsg(null); setActivePreset("original");
  };

  const handleConvert = async () => {
    if (!file) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…", description: "First run takes ~5s." }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;

    const extMap: Record<Fmt, string> = { mp4:"mp4", webm:"webm", mp3:"mp3", wav:"wav", avi:"avi", mov:"mov", mkv:"mkv", muted:"mp4" };
    const mimeMap: Record<string, string> = { mp4:"video/mp4", webm:"video/webm", mp3:"audio/mpeg", wav:"audio/wav", avi:"video/x-msvideo", mov:"video/quicktime", mkv:"video/x-matroska" };
    const ext = extMap[fmt];
    const inp = `in.${file.name.split(".").pop()}`;
    const out = `out.${ext}`;

    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      await ff.writeFile(inp, await fetchFile(file));
      const args = ["-i", inp];
      if (trimEnabled) args.push("-ss", trimStart.toFixed(2), "-to", trimEnd.toFixed(2));
      if (isAudio(fmt)) {
        args.push("-vn");
        if (fmt === "mp3") args.push("-acodec", "libmp3lame", "-q:a", "2");
        else args.push("-acodec", "pcm_s16le");
      } else {
        if (fmt === "muted") args.push("-an");
        const vFilters: string[] = [];
        if (res !== "original") vFilters.push(`scale=${RES[res]}:force_original_aspect_ratio=decrease`);
        const rotFilter = getRotateFilter(rotate);
        if (rotFilter) vFilters.push(rotFilter);
        if (vFilters.length) args.push("-vf", vFilters.join(","));
        args.push("-crf", CRF[quality], "-preset", "fast");
        if (fmt === "webm") args.push("-c:v", "libvpx-vp9", "-c:a", "libopus");
        else if (fmt === "avi") args.push("-c:v", "libxvid", "-c:a", "mp3");
        else args.push("-c:v", "libx264", "-c:a", fmt === "muted" ? "copy" : "aac");
      }
      args.push(out);
      await ff.exec(args);
      await ff.deleteFile(inp);
      const blob = await readOutputBlob(ff, out, mimeMap[ext] || "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-mianconvert.${ext}`, size: formatBytes(blob.size), rawSize: blob.size });
      sessionStore.markDone("convert");
      toast({ title: "✓ Done!" });
    } catch (e) {
      const msg = String(e); setError(msg);
      toast({ variant: "destructive", title: "Conversion failed", description: msg });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* File upload */}
      {!file ? (
        <DropZone onFile={handleFile} />
      ) : (
        <VideoPreview
          ref={videoRef}
          file={file}
          previewUrl={previewUrl}
          onReset={reset}
          warning={warning}
          info={autoDetectMsg}
          infoVariant="violet"
          onLoadedMetadata={() => {
            const d = videoRef.current?.duration || 0;
            setDuration(d); setTrimEnd(d);
            // Update session with duration
            if (file) sessionStore.set(file, d,
              videoRef.current?.videoWidth ?? 0,
              videoRef.current?.videoHeight ?? 0);
          }}
        />
      )}

      {file && !result && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1">
            {([
              { id: "quick" as Mode,    icon: <Zap className="w-3.5 h-3.5" />,      label: "Quick Mode" },
              { id: "advanced" as Mode, icon: <Settings2 className="w-3.5 h-3.5" />, label: "Advanced" },
            ]).map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                  mode === m.id
                    ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}>
                {m.icon}{m.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "quick" ? (
              <motion.div key="quick"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Choose output:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_PRESETS.map(p => (
                    <motion.button key={p.id}
                      whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => applyPreset(p.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all",
                        activePreset === p.id
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 bg-white/60 dark:bg-gray-900/40"
                      )}>
                      <span className="text-xl">{p.icon}</span>
                      <span className={cn("text-xs font-bold", activePreset === p.id ? "text-violet-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-100")}>
                        {p.label}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{p.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="advanced"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4">
                {/* All presets */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONVERT_PRESETS.map(p => (
                      <motion.button key={p.id} onClick={() => applyPreset(p.id)}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        title={p.description}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                          activePreset === p.id
                            ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/25"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400 bg-white dark:bg-gray-900"
                        )}>
                        <span>{p.icon}</span>{p.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Output Format</Label>
                    <Select value={fmt} onValueChange={v => { setFmt(v as Fmt); setActivePreset("original"); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORMAT_GROUPS.map(g => (
                          <div key={g.group}>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{g.group}</div>
                            {g.opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!isAudio(fmt) && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Resolution</Label>
                      <Select value={res} onValueChange={v => { setRes(v as Res); setActivePreset("original"); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">Original</SelectItem>
                          <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                          <SelectItem value="720p">720p (HD)</SelectItem>
                          <SelectItem value="480p">480p (SD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Quality Level</Label>
                    <Select value={quality} onValueChange={v => { setQuality(v as Quality); setActivePreset("original"); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.entries(QUALITY_LABELS) as [Quality, string][]).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!isAudio(fmt) && fmt !== "muted" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Rotate / Flip
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {ROTATE_OPTS.map(o => (
                        <button key={o.value} onClick={() => setRotate(o.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                            rotate === o.value
                              ? "bg-violet-600 text-white border-violet-600"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400"
                          )}>
                          {o.value === "fliph"
                            ? <><FlipHorizontal className="w-3 h-3 inline mr-1" />{o.label}</>
                            : o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {duration > 0 && !isAudio(fmt) && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch id="trim" checked={trimEnabled} onCheckedChange={setTrimEnabled} />
                      <Label htmlFor="trim" className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Scissors className="w-3.5 h-3.5" /> Trim video
                      </Label>
                    </div>
                    {trimEnabled && (
                      <TrimControl duration={duration} start={trimStart} end={trimEnd}
                        onChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }} />
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatedButton onClick={handleConvert} loading={processing} className="w-full" size="lg">
            {processing ? "Converting…" : "Convert Now"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} stages done={done} />}
          {error && <ErrorRecovery error={error} onRetry={() => setError(null)} />}
        </>
      )}

      {result && (
        <ResultCard url={result.url} filename={result.filename} size={result.size}
          nextActions={buildNextActions(result.filename, result.rawSize, "convert")}
          onOpenTool={(toolId, preset) => {
            window.dispatchEvent(new CustomEvent("openTool", { detail: { toolId, preset } }));
          }}
          onAgain={() => { URL.revokeObjectURL(result.url); setResult(null); setProgress(0); setDone(false); }}
          onReset={reset} />
      )}
    </div>
  );
};

export default ConvertTool;
