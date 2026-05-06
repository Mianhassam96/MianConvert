import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { Plus, Trash2, Info } from "lucide-react";
import VideoPreview from "@/components/VideoPreview";
import ErrorRecovery from "@/components/ErrorRecovery";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { sessionStore } from "@/lib/session-store";

type RemoveMode = "delogo" | "blur";

interface Region {
  id: string;
  x: number; y: number; w: number; h: number;
}

const CleanVideoTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [vidW, setVidW] = useState(0);
  const [vidH, setVidH] = useState(0);
  const [mode, setMode] = useState<RemoveMode>("delogo");
  const [blurStrength, setBlurStrength] = useState(10);
  const [regions, setRegions] = useState<Region[]>([{ id: crypto.randomUUID(), x: 10, y: 10, w: 200, h: 80 }]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  useEffect(() => {
    const session = sessionStore.get();
    if (session.file && !video) handleVideo(session.file);
  }, []);

  const handleVideo = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
    sessionStore.set(f);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setDone(false); setError(null);
  };

  const updateRegion = (id: string, patch: Partial<Region>) =>
    setRegions(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const addRegion = () =>
    setRegions(prev => [...prev, { id: crypto.randomUUID(), x: 10, y: 10, w: 200, h: 80 }]);

  const removeRegion = (id: string) =>
    setRegions(prev => prev.filter(r => r.id !== id));

  const handleProcess = async () => {
    if (!video || !regions.length) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false); setError(null);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));

      let vf = "";
      if (mode === "delogo") {
        // Chain delogo filters for each region
        vf = regions.map(r => `delogo=x=${r.x}:y=${r.y}:w=${r.w}:h=${r.h}`).join(",");
      } else {
        // Blur each region using boxblur + overlay
        vf = regions.map(r =>
          `[in]crop=${r.w}:${r.h}:${r.x}:${r.y},boxblur=${blurStrength}:${blurStrength}[blurred];[in][blurred]overlay=${r.x}:${r.y}[out]`
        ).join(";");
        // For multiple regions with blur, use simpler approach
        if (regions.length === 1) {
          const r = regions[0];
          vf = `split[a][b];[a]crop=${r.w}:${r.h}:${r.x}:${r.y},boxblur=${blurStrength}:${blurStrength}[blurred];[b][blurred]overlay=${r.x}:${r.y}`;
        } else {
          // Fallback to delogo for multiple regions in blur mode
          vf = regions.map(r => `delogo=x=${r.x}:y=${r.y}:w=${r.w}:h=${r.h}`).join(",");
        }
      }

      await ff.exec(["-i", `input.${vExt}`, "-filter_complex", vf, "-c:a", "copy", "-preset", "fast", "cleaned.mp4"]);
      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "cleaned.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-cleaned.mp4`, size: formatBytes(blob.size) });
      toast({ title: "✓ Cleaned!" });
    } catch (e) {
      const msg = String(e); setError(msg);
      toast({ variant: "destructive", title: "Failed", description: msg });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!video ? (
        <DropZone onFile={handleVideo} label="Drop video to remove logo/text" />
      ) : (
        <VideoPreview
          ref={videoRef}
          file={video}
          previewUrl={previewUrl}
          onReset={reset}
          badge={vidW > 0 ? `${vidW}×${vidH}` : undefined}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) { setVidW(v.videoWidth); setVidH(v.videoHeight); }
          }}
        />
      )}

      {video && !result && (
        <>
          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: "delogo" as RemoveMode, label: "Smart Remove", emoji: "🧹", desc: "FFmpeg delogo — fills area intelligently" },
              { id: "blur"   as RemoveMode, label: "Blur Region",  emoji: "🌫", desc: "Gaussian blur over selected area" },
            ]).map(opt => (
              <motion.button key={opt.id} onClick={() => setMode(opt.id)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition-all space-y-1",
                  mode === opt.id
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
                )}>
                <p className="text-base">{opt.emoji}</p>
                <p className={cn("text-xs font-semibold", mode === opt.id ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-200")}>{opt.label}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{opt.desc}</p>
              </motion.button>
            ))}
          </div>

          {mode === "blur" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Blur strength: {blurStrength}</Label>
              <Slider min={3} max={30} step={1} value={[blurStrength]} onValueChange={([v]) => setBlurStrength(v)} />
              {regions.length > 1 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  ⚠️ Blur mode supports one region at a time. Multiple regions will use Smart Remove instead.
                </p>
              )}
            </div>
          )}

          {/* Regions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Regions ({regions.length})</Label>
              <AnimatedButton size="xs" variant="outline" onClick={addRegion}>
                <Plus className="w-3 h-3" /> Add region
              </AnimatedButton>
            </div>

            <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Enter the X, Y position and W, H size of the area to remove. Use your video dimensions ({vidW || "?"}×{vidH || "?"}) as reference.
            </div>

            {regions.map((r, i) => (
              <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Region {i + 1}</span>
                  {regions.length > 1 && (
                    <button onClick={() => removeRegion(r.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(["x", "y", "w", "h"] as const).map(field => (
                    <div key={field} className="space-y-1">
                      <Label className="text-xs text-gray-500 uppercase">{field}</Label>
                      <Input type="number" min={0} value={r[field]}
                        onChange={e => updateRegion(r.id, { [field]: +e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing ? "Cleaning…" : "Clean Video"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Removing logo/text…" done={done} />}
          {error && <ErrorRecovery error={error} onRetry={() => setError(null)} />}
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

export default CleanVideoTool;
