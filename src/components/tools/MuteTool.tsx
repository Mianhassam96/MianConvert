import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, FileVideo, VolumeX, Volume2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

type Mode = "mute" | "extract";

const MuteTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mode, setMode] = useState<Mode>("mute");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleFile = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setWarning(getFileSizeWarning(f));
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null); setPreviewUrl(""); setResult(null); setDone(false); setWarning(null);
  };

  const handleProcess = async () => {
    if (!file) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;

    // Smooth fake progress for stream-copy ops (they're near-instant)
    let fakeTimer: ReturnType<typeof setInterval> | null = null;
    if (mode === "mute") {
      // stream copy = very fast, fake smooth progress
      fakeTimer = setInterval(() => setProgress(p => Math.min(p + 15, 90)), 120);
    } else {
      const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
      ff.on("progress", handler);
    }

    try {
      const ext = file.name.split(".").pop() || "mp4";
      await ff.writeFile(`input.${ext}`, await fetchFile(file));
      const base = file.name.replace(/\.[^.]+$/, "");

      if (mode === "mute") {
        // Smart: stream copy video — no re-encode, near instant
        await ff.exec(["-i", `input.${ext}`, "-an", "-c:v", "copy", "muted.mp4"]);
        if (fakeTimer) clearInterval(fakeTimer);
        await ff.deleteFile(`input.${ext}`);
        const blob = await readOutputBlob(ff, "muted.mp4", "video/mp4");
        const url = URL.createObjectURL(blob);
        setProgress(100); setDone(true);
        setResult({ url, filename: `${base}-muted.mp4`, size: formatBytes(blob.size) });
        toast({ title: "✓ Audio removed!" });
      } else {
        await ff.exec(["-i", `input.${ext}`, "-vn", "-acodec", "libmp3lame", "-q:a", "2", "audio.mp3"]);
        await ff.deleteFile(`input.${ext}`);
        const blob = await readOutputBlob(ff, "audio.mp3", "audio/mpeg");
        const url = URL.createObjectURL(blob);
        setDone(true);
        setResult({ url, filename: `${base}-audio.mp3`, size: formatBytes(blob.size) });
        toast({ title: "✓ Audio extracted!" });
      }
    } catch (e) {
      if (fakeTimer) clearInterval(fakeTimer);
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <DropZone onFile={handleFile} label="Drop video to mute or extract audio" />
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            <video ref={videoRef} src={previewUrl} controls className="w-full max-h-56 object-contain" />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <FileVideo className="w-4 h-4 shrink-0 text-violet-500" />
            <span className="truncate font-medium text-gray-700 dark:text-gray-200">{file.name}</span>
            <span className="shrink-0 text-xs">({formatBytes(file.size)})</span>
          </div>
          {warning && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{warning}
            </div>
          )}
        </div>
      )}

      {file && !result && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: "mute" as Mode, icon: VolumeX, label: "Mute Video", desc: "Remove audio, keep video (instant — stream copy)" },
              { id: "extract" as Mode, icon: Volume2, label: "Extract Audio", desc: "Save audio as MP3" },
            ]).map(opt => (
              <motion.button key={opt.id} onClick={() => setMode(opt.id)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={`rounded-xl border-2 p-4 text-left transition-all space-y-1.5 ${
                  mode === opt.id
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
                }`}>
                <opt.icon className={`w-5 h-5 ${mode === opt.id ? "text-violet-600" : "text-gray-400"}`} />
                <p className={`text-sm font-semibold ${mode === opt.id ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-200"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </motion.button>
            ))}
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing
              ? (mode === "mute" ? "Removing audio…" : "Extracting audio…")
              : (mode === "mute" ? "⚡ Mute Video (Instant)" : "Extract Audio as MP3")}
          </AnimatedButton>

          {processing && (
            <AnimatedProgress
              value={progress}
              label={mode === "mute" ? "Stream copying (no re-encode)…" : "Extracting audio…"}
              done={done}
            />
          )}
        </>
      )}

      {result && (
        <ResultCard url={result.url} filename={result.filename} size={result.size}
          onAgain={() => { URL.revokeObjectURL(result.url); setResult(null); setDone(false); }}
          onReset={reset} />
      )}
    </div>
  );
};

export default MuteTool;
