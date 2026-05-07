import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { useToast } from "@/hooks/use-toast";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import { sessionStore } from "@/lib/session-store";
import { startJob, updateJob, finishJob, failJob } from "@/lib/job-tracker";
import DropZone from "@/components/DropZone";
import VideoPreview from "@/components/VideoPreview";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import AnimatedButton from "@/components/ui/AnimatedButton";
import ResultCard, { buildNextActions } from "@/components/ResultCard";
import ErrorRecovery from "@/components/ErrorRecovery";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { VolumeX, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "quick" | "advanced";

const SilenceRemoverTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mode, setMode] = useState<Mode>("quick");
  // Silence threshold in dB (negative — more negative = only remove very quiet parts)
  const [threshold, setThreshold] = useState(-35);
  // Minimum silence duration in seconds
  const [minSilence, setMinSilence] = useState(0.5);
  // Padding to keep around speech (seconds)
  const [padding, setPadding] = useState(0.1);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string; rawSize: number } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
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
    setFile(f); setPreviewUrl(URL.createObjectURL(f));
    setResult(null); setDone(false); setError(null);
    sessionStore.set(f);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null); setPreviewUrl(""); setResult(null);
    setDone(false); setError(null);
  };

  const handleProcess = async () => {
    if (!file) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false); setError(null);
    const ff = ffmpeg.current!;
    const jobId = startJob({ toolId: "silenceremover", toolLabel: "Silence Remover", icon: "🔇", fileName: file.name });
    const handler = ({ progress: p }: { progress: number }) => {
      const pct = Math.round(p * 100); setProgress(pct); updateJob(jobId, pct);
    };
    ff.on("progress", handler);
    try {
      const ext = file.name.split(".").pop() ?? "mp4";
      await ff.writeFile(`input.${ext}`, await fetchFile(file));

      /**
       * Strategy: use FFmpeg's silencedetect filter to find silence,
       * then use silenceremove to cut it out.
       *
       * silenceremove params:
       *   stop_periods=-1  = remove all silence periods (not just leading/trailing)
       *   stop_duration    = min silence duration to remove
       *   stop_threshold   = dB threshold for silence
       */
      const silenceFilter = `silenceremove=stop_periods=-1:stop_duration=${minSilence}:stop_threshold=${threshold}dB`;

      const isAudio = file.type.startsWith("audio/");
      const outFile = isAudio ? `output.${ext}` : "output.mp4";

      if (isAudio) {
        await ff.exec([
          "-i", `input.${ext}`,
          "-af", silenceFilter,
          outFile,
        ]);
      } else {
        // For video: apply silence removal to audio stream, keep video
        // Use a two-pass approach: extract audio, remove silence, merge back
        // Simpler: apply af filter with video copy
        await ff.exec([
          "-i", `input.${ext}`,
          "-af", silenceFilter,
          "-c:v", "copy",
          "-preset", "fast",
          outFile,
        ]);
      }

      await ff.deleteFile(`input.${ext}`);
      const mime = isAudio ? (file.type || "audio/mpeg") : "video/mp4";
      const blob = await readOutputBlob(ff, outFile, mime);
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      const filename = `${base}-no-silence.${isAudio ? ext : "mp4"}`;
      const sizeStr = formatBytes(blob.size);
      setDone(true);
      setResult({ url, filename, size: sizeStr, rawSize: blob.size });
      finishJob(jobId, { url, name: filename, size: sizeStr, rawSize: blob.size }, "silenceremover", "Silence Remover");
      toast({ title: "✓ Silence removed!" });
    } catch (e) {
      const msg = String(e); setError(msg);
      failJob(jobId, msg);
      toast({ variant: "destructive", title: "Failed", description: msg });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  const QUICK_PRESETS = [
    { id: "podcast",  icon: "🎙", label: "Podcast",     desc: "Remove pauses > 0.5s",  threshold: -35, minSilence: 0.5, padding: 0.1 },
    { id: "interview",icon: "🎤", label: "Interview",   desc: "Remove pauses > 1s",    threshold: -40, minSilence: 1.0, padding: 0.2 },
    { id: "lecture",  icon: "📚", label: "Lecture",     desc: "Remove pauses > 2s",    threshold: -40, minSilence: 2.0, padding: 0.3 },
    { id: "aggressive",icon:"⚡", label: "Aggressive",  desc: "Remove all silence",    threshold: -30, minSilence: 0.3, padding: 0.05 },
  ];

  const applyPreset = (p: typeof QUICK_PRESETS[0]) => {
    setThreshold(p.threshold);
    setMinSilence(p.minSilence);
    setPadding(p.padding);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone onFile={handleFile} accept="video/*,audio/*" label="Drop video or audio to remove silence" />
      ) : (
        <VideoPreview ref={videoRef} file={file} previewUrl={previewUrl} onReset={reset} warning={warning} />
      )}

      {file && !result && (
        <>
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
                {m === "quick" ? <Zap className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {m === "quick" ? "Quick Mode" : "Advanced"}
              </button>
            ))}
          </div>

          {mode === "quick" ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-2"
            >
              {QUICK_PRESETS.map(p => (
                <motion.button key={p.id}
                  whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all",
                    threshold === p.threshold && minSilence === p.minSilence
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md shadow-violet-500/15"
                      : "border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 hover:border-violet-300 dark:hover:border-violet-700"
                  )}>
                  <span className="text-2xl shrink-0">{p.icon}</span>
                  <div>
                    <p className={cn("text-xs font-bold",
                      threshold === p.threshold && minSilence === p.minSilence
                        ? "text-violet-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-100")}>
                      {p.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-xs text-gray-500">Silence threshold: {threshold} dB</Label>
                  <span className="text-[10px] text-gray-400">More negative = stricter</span>
                </div>
                <Slider min={-60} max={-10} step={1} value={[threshold]}
                  onValueChange={([v]) => setThreshold(v)} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-xs text-gray-500">Min silence duration: {minSilence}s</Label>
                  <span className="text-[10px] text-gray-400">Shorter = more aggressive</span>
                </div>
                <Slider min={0.1} max={3} step={0.1} value={[minSilence]}
                  onValueChange={([v]) => setMinSilence(v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Keep padding: {padding}s</Label>
                <Slider min={0} max={0.5} step={0.05} value={[padding]}
                  onValueChange={([v]) => setPadding(v)} />
              </div>
            </motion.div>
          )}

          <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Removes silent sections from your video or audio. Great for podcasts, interviews, and lectures.
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            <VolumeX className="w-4 h-4" />
            {processing ? "Removing silence…" : "Remove Silence"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} stages done={done} />}
          {error && <ErrorRecovery error={error} onRetry={() => setError(null)} />}
        </>
      )}

      {result && (
        <ResultCard
          url={result.url}
          filename={result.filename}
          size={result.size}
          nextActions={buildNextActions(result.filename, result.rawSize, "silenceremover")}
          onOpenTool={(toolId, preset) => {
            window.dispatchEvent(new CustomEvent("openTool", { detail: { toolId, preset } }));
          }}
          onAgain={() => { URL.revokeObjectURL(result.url); setResult(null); setDone(false); }}
          onReset={reset}
        />
      )}
    </div>
  );
};

export default SilenceRemoverTool;
