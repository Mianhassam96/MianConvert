import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import { COMPRESS_PRESETS } from "@/lib/presets";
import { sessionStore } from "@/lib/session-store";
import { buildFFmpegArgs, getResolutionFilter, safeDelete } from "@/lib/ffmpeg-pipeline";
import { startJob, updateJob, finishJob, failJob } from "@/lib/job-tracker";
import DropZone from "@/components/DropZone";
import VideoPreview from "@/components/VideoPreview";
import ResultCard, { buildNextActions } from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import ErrorRecovery from "@/components/ErrorRecovery";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Preset = "ultrafast" | "fast" | "medium" | "slow";
type Crf = "18" | "23" | "28" | "33" | "38";
type Res = "original" | "1080p" | "720p" | "480p" | "360p";
type Mode = "quick" | "advanced";

const QUALITY_LABELS: Record<Crf, string> = {
  "18": "Best quality — large file",
  "23": "High quality",
  "28": "Balanced — recommended",
  "33": "Smaller file",
  "38": "Maximum compression",
};

const QUICK_OPTIONS = [
  { id: "smallest", icon: "📦", label: "Smallest File",   desc: "Max compression, 480p" },
  { id: "balanced", icon: "⚖️", label: "Balanced",        desc: "Good quality, 720p" },
  { id: "quality",  icon: "✨", label: "High Quality",    desc: "Near lossless, original size" },
  { id: "mobile",   icon: "📱", label: "Mobile Friendly", desc: "Optimized for phones, 360p" },
];

const CompressTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [crf, setCrf] = useState<Crf>("28");
  const [res, setRes] = useState<Res>("original");
  const [preset, setPreset] = useState<Preset>("fast");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string; rawSize: number; startTime: number } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>("balanced");
  const [mode, setMode] = useState<Mode>("quick");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  useEffect(() => {
    const session = sessionStore.get();
    if (session.file && !file) handleFile(session.file);
  }, []);

  const handleFile = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setWarning(getFileSizeWarning(f));
    setOriginalSize(f.size);
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
    sessionStore.set(f);
  };

  const applyPreset = (id: string) => {
    const p = COMPRESS_PRESETS.find(x => x.id === id);
    if (!p) return;
    setActivePreset(id);
    setCrf(p.crf as Crf);
    setRes(p.res as Res);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null); setPreviewUrl(""); setResult(null); setDone(false);
    setWarning(null); setError(null); setOriginalSize(0);
  };

  const handleCompress = async () => {
    if (!file) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…", description: "First run takes ~5s." }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const processStart = Date.now();
    const ff = ffmpeg.current!;
    const jobId = startJob({ toolId: "compress", toolLabel: "Compress", icon: "📦", fileName: file.name });
    const handler = ({ progress: p }: { progress: number }) => {
      const pct = Math.round(p * 100);
      setProgress(pct);
      updateJob(jobId, pct);
    };
    ff.on("progress", handler);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      await ff.writeFile(`input.${ext}`, await fetchFile(file));

      const vFilters: string[] = [];
      if (res !== "original") {
        const scaleF = getResolutionFilter(res, "balanced");
        if (scaleF) vFilters.push(scaleF);
      }

      const { args } = buildFFmpegArgs({
        inputName: `input.${ext}`,
        outputName: "output.mp4",
        vFilters,
        outputFormat: "mp4",
        crfOverride: crf,
        mode: preset === "ultrafast" ? "instant" : preset === "slow" ? "quality" : "balanced",
        forceEncode: true,
      });

      await ff.exec(args);
      await safeDelete(ff, `input.${ext}`);
      const blob = await readOutputBlob(ff, "output.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      const saved = file.size > blob.size ? ` — saved ${formatBytes(file.size - blob.size)}` : "";
      const filename = `${base}-compressed.mp4`;
      const sizeStr = `${formatBytes(blob.size)}${saved}`;
      setDone(true);
      setResult({ url, filename, size: sizeStr, rawSize: blob.size, startTime: processStart });
      sessionStore.markDone("compress");
      finishJob(jobId, { url, name: filename, size: sizeStr, rawSize: blob.size }, "compress", "Compress");
      toast({ title: "✓ Compressed!" });
    } catch (e) {
      const msg = String(e); setError(msg);
      failJob(jobId, msg);
      toast({ variant: "destructive", title: "Compression failed", description: msg });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  const savingsPct = result && originalSize > 0
    ? Math.round((1 - result.rawSize / originalSize) * 100)
    : 0;

  return (
    <div className="space-y-5">

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1">
        {(["quick", "advanced"] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
              mode === m
                ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            )}>
            {m === "quick" ? <Zap className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
            {m === "quick" ? "Quick Mode" : "Advanced Mode"}
          </button>
        ))}
      </div>

      {!file ? (
        <DropZone onFile={handleFile} label="Drop video to compress" />
      ) : (
        <VideoPreview ref={videoRef} file={file} previewUrl={previewUrl} onReset={reset} warning={warning} />
      )}

      {file && !result && (
        <AnimatePresence mode="wait">
          {mode === "quick" ? (
            <motion.div key="quick"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Choose compression level:</p>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_OPTIONS.map(p => (
                  <motion.button key={p.id}
                    whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => applyPreset(p.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                      activePreset === p.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md shadow-violet-500/15"
                        : "border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 hover:border-violet-300 dark:hover:border-violet-700"
                    )}>
                    <span className="text-2xl shrink-0">{p.icon}</span>
                    <div>
                      <p className={cn("text-xs font-bold",
                        activePreset === p.id ? "text-violet-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-100")}>
                        {p.label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
              <AnimatedButton onClick={handleCompress} loading={processing} className="w-full" size="lg">
                {processing ? "Compressing…" : "Compress Video"}
              </AnimatedButton>
            </motion.div>
          ) : (
            <motion.div key="advanced"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COMPRESS_PRESETS.map(p => (
                  <motion.button key={p.id} onClick={() => applyPreset(p.id)}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 text-xs font-semibold transition-all",
                      activePreset === p.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"
                    )}>
                    <span className="text-lg">{p.icon}</span>
                    <span>{p.label}</span>
                    <span className="text-[10px] text-gray-400 font-normal text-center leading-tight">{p.description}</span>
                  </motion.button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Quality Level</Label>
                  <Select value={crf} onValueChange={v => { setCrf(v as Crf); setActivePreset(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(QUALITY_LABELS) as [Crf, string][]).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Resolution</Label>
                  <Select value={res} onValueChange={v => { setRes(v as Res); setActivePreset(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Keep original</SelectItem>
                      <SelectItem value="1080p">1080p — Full HD</SelectItem>
                      <SelectItem value="720p">720p — HD</SelectItem>
                      <SelectItem value="480p">480p — Standard</SelectItem>
                      <SelectItem value="360p">360p — Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Processing speed</Label>
                  <Select value={preset} onValueChange={v => setPreset(v as Preset)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ultrafast">Ultrafast — larger file</SelectItem>
                      <SelectItem value="fast">Fast — recommended</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="slow">Slow — smallest file</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-3 text-xs text-violet-700 dark:text-violet-300">
                💡 Balanced + Fast is the sweet spot. Lower quality level = better compression but smaller file.
              </div>
              <AnimatedButton onClick={handleCompress} loading={processing} className="w-full" size="lg">
                {processing ? "Compressing…" : "Compress Video"}
              </AnimatedButton>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {processing && <AnimatedProgress value={progress} stages done={done} />}
      {error && <ErrorRecovery error={error} onRetry={() => setError(null)} />}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {savingsPct > 0 && (
            <div className="glass-card p-4 space-y-3">
              <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                📊 Size comparison
                <span className="text-green-500 font-black">↓{savingsPct}% smaller</span>
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 shrink-0">Original</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400 dark:bg-gray-500 rounded-full w-full" />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right shrink-0">{formatBytes(originalSize)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-600 dark:text-green-400 w-20 shrink-0 font-semibold">Compressed</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500 rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ width: `${100 - savingsPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 w-16 text-right shrink-0 font-semibold">{formatBytes(result.rawSize)}</span>
                </div>
              </div>
            </div>
          )}
          <ResultCard url={result.url} filename={result.filename} size={result.size}
            startTime={result.startTime}
            originalBytes={file?.size}
            nextActions={buildNextActions(result.filename, result.rawSize, "compress")}
            onOpenTool={(toolId, preset) => {
              window.dispatchEvent(new CustomEvent("openTool", { detail: { toolId, preset } }));
            }}
            onAgain={() => { URL.revokeObjectURL(result.url); setResult(null); setDone(false); }}
            onReset={reset} />
        </motion.div>
      )}
    </div>
  );
};

export default CompressTool;
