import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { useToast } from "@/hooks/use-toast";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile } from "@/lib/ffmpeg-run";
import { sessionStore } from "@/lib/session-store";
import { startJob, updateJob, finishJob, failJob } from "@/lib/job-tracker";
import {
  CAPTION_STYLES, CaptionSegment, CaptionStyle,
  isSpeechSupported, transcribeWithSpeechAPI,
  segmentsToSRT, buildCaptionFilter,
} from "@/lib/caption-engine";
import DropZone from "@/components/DropZone";
import VideoPreview from "@/components/VideoPreview";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import AnimatedButton from "@/components/ui/AnimatedButton";
import ResultCard, { buildNextActions } from "@/components/ResultCard";
import { Mic, MicOff, FileText, Upload, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "upload" | "transcribe" | "style" | "burn";

const AICaptionTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [step, setStep] = useState<Step>("upload");
  const [segments, setSegments] = useState<CaptionSegment[]>([]);
  const [liveText, setLiveText] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeDone, setTranscribeDone] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<CaptionStyle>(CAPTION_STYLES[0]);
  const [srtContent, setSrtContent] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string; rawSize: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();
  const speechSupported = isSpeechSupported();

  useEffect(() => {
    const session = sessionStore.get();
    if (session.file && !video) handleVideo(session.file);
  }, []);

  const handleVideo = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f));
    setStep("transcribe"); setSegments([]); setResult(null); setDone(false);
    sessionStore.set(f);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setStep("upload");
    setSegments([]); setResult(null); setDone(false); setError(null);
    setTranscribing(false); setTranscribeDone(false); setLiveText("");
  };

  const handleTranscribe = async () => {
    if (!videoRef.current) return;
    setTranscribing(true); setSegments([]); setLiveText(""); setError(null);
    try {
      const segs = await transcribeWithSpeechAPI(videoRef.current, {
        onSegment: (seg) => setSegments(prev => [...prev, seg]),
        onProgress: (text) => setLiveText(text),
      });
      setSegments(segs);
      setTranscribeDone(true);
      setStep("style");
      toast({ title: `✓ Transcribed ${segs.length} caption segments` });
    } catch (e) {
      const msg = String(e);
      setError(msg);
      toast({ variant: "destructive", title: "Transcription failed", description: msg });
    } finally {
      setTranscribing(false); setLiveText("");
    }
  };

  const handleSrtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string || "";
      setSrtContent(content);
      // Parse SRT into segments
      const blocks = content.trim().split(/\n\s*\n/);
      const parsed: CaptionSegment[] = [];
      for (const block of blocks) {
        const lines = block.trim().split("\n");
        if (lines.length < 3) continue;
        const match = lines[1].match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
        if (!match) continue;
        const toSec = (h: string, m: string, s: string, ms: string) =>
          parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
        parsed.push({
          start: toSec(match[1], match[2], match[3], match[4]),
          end: toSec(match[5], match[6], match[7], match[8]),
          text: lines.slice(2).join(" ").replace(/<[^>]+>/g, "").trim(),
        });
      }
      setSegments(parsed);
      setTranscribeDone(true);
      setStep("style");
      toast({ title: `✓ Loaded ${parsed.length} caption segments from SRT` });
    };
    reader.readAsText(f);
  };

  const handleBurn = async () => {
    if (!video || !segments.length) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false); setError(null);
    setStep("burn");
    const ff = ffmpeg.current!;
    const jobId = startJob({ toolId: "aicaption", toolLabel: "AI Captions", icon: "✨", fileName: video.name });
    const handler = ({ progress: p }: { progress: number }) => {
      const pct = Math.round(p * 100); setProgress(pct); updateJob(jobId, pct);
    };
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop() ?? "mp4";
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));

      const filters = buildCaptionFilter(segments, selectedStyle);
      const BATCH = 40;
      let currentInput = `input.${vExt}`;

      for (let i = 0; i < filters.length; i += BATCH) {
        const batch = filters.slice(i, i + BATCH);
        const isLast = i + BATCH >= filters.length;
        const outFile = isLast ? "captioned.mp4" : `cap_batch_${i}.mp4`;
        await ff.exec(["-i", currentInput, "-vf", batch.join(","), "-c:a", "copy", "-preset", "fast", outFile]);
        if (currentInput !== `input.${vExt}`) {
          try { await ff.deleteFile(currentInput); } catch {}
        }
        currentInput = outFile;
      }

      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "captioned.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      const filename = `${base}-captioned.mp4`;
      const sizeStr = formatBytes(blob.size);
      setDone(true);
      setResult({ url, filename, size: sizeStr, rawSize: blob.size });
      finishJob(jobId, { url, name: filename, size: sizeStr, rawSize: blob.size }, "aicaption", "AI Captions");
      toast({ title: "✓ Captions burned in!" });
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

      {/* Upload */}
      {!video ? (
        <DropZone onFile={handleVideo} label="Drop video to generate captions" />
      ) : (
        <VideoPreview ref={videoRef} file={video} previewUrl={previewUrl} onReset={reset}
          badge={transcribeDone ? `${segments.length} captions ready` : "Ready to transcribe"} />
      )}

      {/* Step indicator */}
      {video && !result && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {(["transcribe", "style", "burn"] as Step[]).map((s, i) => {
            const labels = ["1. Transcribe", "2. Choose Style", "3. Burn In"];
            const done = (step === "style" && i === 0) || (step === "burn" && i <= 1) || (step === "transcribe" && i < 0);
            const active = step === s;
            return (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <span className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
                  active ? "bg-violet-600 text-white" :
                  done ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                  "bg-gray-100 dark:bg-gray-800 text-gray-400"
                )}>{labels[i]}</span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Step 1 — Transcribe */}
      {video && step === "transcribe" && !result && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {speechSupported ? (
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">AI Auto-Transcribe</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Uses your browser's built-in speech recognition — no upload, instant, 100% private.
                      The video will play while captions are generated.
                    </p>
                  </div>
                </div>

                {transcribing && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">Recording…</span>
                    </div>
                    {liveText && (
                      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2 text-xs text-gray-600 dark:text-gray-300 italic">
                        "{liveText}"
                      </div>
                    )}
                    {segments.length > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ {segments.length} segment{segments.length > 1 ? "s" : ""} captured
                      </p>
                    )}
                  </div>
                )}

                <AnimatedButton
                  onClick={handleTranscribe}
                  loading={transcribing}
                  className="w-full"
                  size="lg"
                >
                  <Mic className="w-4 h-4" />
                  {transcribing ? "Transcribing… (video is playing)" : "⚡ Auto-Generate Captions"}
                </AnimatedButton>
              </div>
            ) : (
              <div className="glass-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <MicOff className="w-4 h-4" />
                  <p className="text-sm font-semibold">Speech recognition not available</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use Chrome or Edge for auto-transcription, or upload an SRT file below.
                </p>
              </div>
            )}

            {/* SRT upload fallback */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Or upload an existing SRT file
              </p>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg px-4 py-2.5 text-sm transition-colors w-fit">
                <Upload className="w-4 h-4" />
                Upload .srt file
                <input type="file" accept=".srt,.vtt" className="hidden" onChange={handleSrtUpload} />
              </label>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline text-xs">Dismiss</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Step 2 — Choose Style */}
      {video && step === "style" && !result && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ✓ {segments.length} captions ready — choose your style
              </p>
            </div>

            {/* Style grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAPTION_STYLES.map((style, i) => (
                <motion.button
                  key={style.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedStyle(style)}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-all space-y-2",
                    selectedStyle.id === style.id
                      ? "border-violet-500 shadow-md shadow-violet-500/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
                  )}
                >
                  {/* Preview */}
                  <div
                    className="w-full h-12 rounded-lg flex items-end justify-center pb-1 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}
                  >
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-bold leading-tight text-center max-w-full truncate"
                      style={{
                        color: style.color,
                        backgroundColor: `${style.bgColor}${Math.round(style.bgOpacity * 255).toString(16).padStart(2, "0")}`,
                        textTransform: style.uppercase ? "uppercase" : "none",
                        fontWeight: style.bold ? "bold" : "normal",
                      }}
                    >
                      {style.uppercase ? "SAMPLE TEXT" : "Sample text"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{style.emoji}</span>
                      <p className={cn(
                        "text-xs font-bold leading-tight",
                        selectedStyle.id === style.id ? "text-violet-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-100"
                      )}>{style.label}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{style.platform}</p>
                  </div>

                  {selectedStyle.id === style.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Caption preview */}
            {segments.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 space-y-1.5 max-h-32 overflow-y-auto">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Caption preview</p>
                {segments.slice(0, 5).map((seg, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-gray-400 font-mono shrink-0 w-12">
                      {Math.floor(seg.start)}s
                    </span>
                    <span className="text-gray-700 dark:text-gray-200">{seg.text}</span>
                  </div>
                ))}
                {segments.length > 5 && (
                  <p className="text-[10px] text-gray-400">+{segments.length - 5} more segments…</p>
                )}
              </div>
            )}

            <AnimatedButton onClick={handleBurn} loading={processing} className="w-full" size="lg">
              <Sparkles className="w-4 h-4" />
              Burn {segments.length} Captions ({selectedStyle.label} style)
            </AnimatedButton>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Step 3 — Burning */}
      {step === "burn" && processing && (
        <AnimatedProgress value={progress} stages done={done} label="Burning captions…" />
      )}

      {error && step === "burn" && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => { setError(null); setStep("style"); }} className="ml-2 underline text-xs">Back to styles</button>
        </div>
      )}

      {result && (
        <ResultCard
          url={result.url}
          filename={result.filename}
          size={result.size}
          nextActions={buildNextActions(result.filename, result.rawSize, "aicaption")}
          onOpenTool={(toolId, preset) => {
            window.dispatchEvent(new CustomEvent("openTool", { detail: { toolId, preset } }));
          }}
          onAgain={() => { URL.revokeObjectURL(result.url); setResult(null); setDone(false); setStep("style"); }}
          onReset={reset}
        />
      )}
    </div>
  );
};

export default AICaptionTool;
