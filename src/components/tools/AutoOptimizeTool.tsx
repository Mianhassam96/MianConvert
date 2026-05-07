import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { useToast } from "@/hooks/use-toast";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile } from "@/lib/ffmpeg-run";
import { sessionStore } from "@/lib/session-store";
import DropZone from "@/components/DropZone";
import VideoPreview from "@/components/VideoPreview";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import ResultCard, { buildNextActions } from "@/components/ResultCard";
import { Zap, CheckCircle } from "lucide-react";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { startJob, updateJob, finishJob, failJob } from "@/lib/job-tracker";

interface DetectedInfo {
  format: string;
  sizeMB: number;
  needsConvert: boolean;
  needsCompress: boolean;
  targetRes: string;
  targetCrf: string;
  summary: string[];
}

const detect = (file: File, width: number, height: number): DetectedInfo => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const sizeMB = file.size / (1024 * 1024);
  const needsConvert = ["avi", "mov", "mkv", "webm"].includes(ext);
  const needsCompress = sizeMB > 30;
  const isPortrait = height > width;

  let targetRes = "original";
  if (width > 1920 || height > 1920) targetRes = isPortrait ? "1080:1920" : "1920:1080";
  else if (width > 1280 || height > 1280) targetRes = isPortrait ? "720:1280" : "1280:720";

  const targetCrf = sizeMB > 200 ? "32" : sizeMB > 80 ? "28" : "24";

  const summary: string[] = [];
  if (needsConvert) summary.push(`Convert ${ext.toUpperCase()} → MP4`);
  if (needsCompress) summary.push(`Compress ${formatBytes(file.size)} → ~${Math.round(sizeMB * 0.35)}MB`);
  if (targetRes !== "original") summary.push(`Resize to ${targetRes.replace(":", "×")}`);
  if (!summary.length) summary.push("Apply smart quality optimization");

  return { format: ext, sizeMB, needsConvert, needsCompress, targetRes, targetCrf, summary };
};

const AutoOptimizeTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [info, setInfo] = useState<DetectedInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string; rawSize: number } | null>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const session = sessionStore.get();
    if (session.file && !file) handleFile(session.file);
  }, []);

  const handleFile = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f); setPreviewUrl(URL.createObjectURL(f));
    setResult(null); setDone(false); setError(null); setInfo(null);
    sessionStore.set(f);
    // Pre-compute info with session dimensions if available
    const session = sessionStore.get();
    if (session.width > 0 || session.height > 0) {
      setInfo(detect(f, session.width, session.height));
    }
  };

  const onMetadata = () => {
    const v = videoRef.current;
    const w = v?.videoWidth ?? 0;
    const h = v?.videoHeight ?? 0;
    if (file) setInfo(detect(file, w, h));
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null); setPreviewUrl(""); setResult(null); setDone(false); setError(null); setInfo(null);
  };

  const handleOptimize = async () => {
    if (!file || !info) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false); setError(null);
    const ff = ffmpeg.current!;
    const jobId = startJob({ toolId: "autooptimize", toolLabel: "Auto Optimize", icon: "⚡", fileName: file.name });
    const handler = ({ progress: p }: { progress: number }) => {
      const pct = Math.round(p * 100); setProgress(pct); updateJob(jobId, pct);
    };
    ff.on("progress", handler);
    try {
      const ext = file.name.split(".").pop() ?? "mp4";
      await ff.writeFile(`input.${ext}`, await fetchFile(file));
      const args = ["-i", `input.${ext}`];
      const vf: string[] = [];
      if (info.targetRes !== "original") {
        vf.push(`scale=${info.targetRes}:force_original_aspect_ratio=decrease`);
      }
      if (vf.length) args.push("-vf", vf.join(","));
      args.push("-c:v", "libx264", "-crf", info.targetCrf, "-preset", "fast", "-c:a", "aac", "-b:a", "128k", "optimized.mp4");
      await ff.exec(args);
      await ff.deleteFile(`input.${ext}`);
      const blob = await readOutputBlob(ff, "optimized.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      const filename = `${base}-optimized.mp4`;
      const sizeStr = formatBytes(blob.size);
      setDone(true);
      setResult({ url, filename, size: sizeStr, rawSize: blob.size });
      finishJob(jobId, { url, name: filename, size: sizeStr, rawSize: blob.size }, "autooptimize", "Auto Optimize");
      toast({ title: "✓ Optimized!" });
    } catch (e) {
      const msg = String(e); setError(msg);
      failJob(jobId, msg);
      toast({ variant: "destructive", title: "Failed", description: msg });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone onFile={handleFile} label="Drop video to auto-optimize" />
      ) : (
        <VideoPreview ref={videoRef} file={file} previewUrl={previewUrl} onReset={reset} onLoadedMetadata={onMetadata} />
      )}

      {file && !info && !result && (
        <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
          Play the video above for a moment to detect its properties, then the optimize button will appear.
        </div>
      )}

      {file && info && !result && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Detection summary */}
            <div className="glass-card p-4 space-y-3">
              <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-500" /> Auto-detected optimizations
              </p>
              <div className="space-y-2">
                {info.summary.map((s, i) => (
                  <motion.div key={s}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    {s}
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/50">
                <span>Input: {formatBytes(file.size)}</span>
                <span>→</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  Est. output: ~{Math.round(info.sizeMB * (info.needsCompress ? 0.35 : 0.85))}MB
                </span>
              </div>
            </div>

            <AnimatedButton onClick={handleOptimize} loading={processing} className="w-full" size="lg">
              <Zap className="w-4 h-4" />
              {processing ? "Optimizing…" : "⚡ Auto Optimize (1 Click)"}
            </AnimatedButton>

            {processing && <AnimatedProgress value={progress} stages done={done} />}

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline text-xs">Retry</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {result && (
        <ResultCard
          url={result.url}
          filename={result.filename}
          size={result.size}
          nextActions={buildNextActions(result.filename, result.rawSize, "autooptimize")}
          onOpenTool={(toolId, preset) => {
            // Signal Index to open tool
            (window as any).__openTool = { toolId, preset };
            window.dispatchEvent(new CustomEvent("openTool", { detail: { toolId, preset } }));
          }}
          onAgain={() => { URL.revokeObjectURL(result.url); setResult(null); setDone(false); }}
          onReset={reset}
        />
      )}
    </div>
  );
};

export default AutoOptimizeTool;
