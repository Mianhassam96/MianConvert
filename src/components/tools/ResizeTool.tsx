import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import VideoPreview from "@/components/VideoPreview";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, AlertTriangle } from "lucide-react";
import ErrorRecovery from "@/components/ErrorRecovery";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { sessionStore } from "@/lib/session-store";

type RatioPreset = "custom" | "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9";
type ResPreset = "custom" | "3840x2160" | "1920x1080" | "1280x720" | "854x480" | "640x360";

const RATIO_PRESETS: { value: RatioPreset; label: string; icon: string }[] = [
  { value: "16:9",  label: "16:9",  icon: "🖥" },
  { value: "9:16",  label: "9:16",  icon: "📱" },
  { value: "1:1",   label: "1:1",   icon: "⬛" },
  { value: "4:3",   label: "4:3",   icon: "📺" },
  { value: "3:4",   label: "3:4",   icon: "🖼" },
  { value: "21:9",  label: "21:9",  icon: "🎬" },
  { value: "custom",label: "Custom",icon: "✏️" },
];

const RES_PRESETS: { value: ResPreset; label: string }[] = [
  { value: "3840x2160", label: "4K (3840×2160)" },
  { value: "1920x1080", label: "1080p (1920×1080)" },
  { value: "1280x720",  label: "720p (1280×720)" },
  { value: "854x480",   label: "480p (854×480)" },
  { value: "640x360",   label: "360p (640×360)" },
  { value: "custom",    label: "Custom" },
];

const ResizeTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [vidW, setVidW] = useState(0);
  const [vidH, setVidH] = useState(0);
  const [ratio, setRatio] = useState<RatioPreset>("16:9");
  const [resPreset, setResPreset] = useState<ResPreset>("1920x1080");
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [letterbox, setLetterbox] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
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
    setWarning(getFileSizeWarning(f));
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
    sessionStore.set(f);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setDone(false); setWarning(null); setError(null);
  };

  const getTargetDimensions = (): { w: number; h: number } | null => {
    if (resPreset !== "custom") {
      const [w, h] = resPreset.split("x").map(Number);
      return { w, h };
    }
    const w = parseInt(customW), h = parseInt(customH);
    if (!w || !h) return null;
    return { w, h };
  };

  const getOutputPreview = () => {
    const dims = getTargetDimensions();
    if (!dims) return null;
    if (ratio !== "custom") {
      const [rw, rh] = ratio.split(":").map(Number);
      let w = dims.w, h = Math.round(dims.w * rh / rw);
      if (h > dims.h) { h = dims.h; w = Math.round(dims.h * rw / rh); }
      // Make even
      return { w: w % 2 === 0 ? w : w - 1, h: h % 2 === 0 ? h : h - 1 };
    }
    return dims;
  };

  const handleProcess = async () => {
    if (!video) return;
    const dims = getTargetDimensions();
    if (!dims) { toast({ variant: "destructive", title: "Set target dimensions" }); return; }
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));

      let vf = "";
      const out = getOutputPreview();
      if (!out) throw new Error("Invalid dimensions");

      if (letterbox) {
        // Scale to fit, pad with black bars
        vf = `scale=${out.w}:${out.h}:force_original_aspect_ratio=decrease,pad=${out.w}:${out.h}:(ow-iw)/2:(oh-ih)/2:black`;
      } else if (ratio !== "custom") {
        // Scale and crop to exact ratio
        vf = `scale=${out.w}:${out.h}:force_original_aspect_ratio=increase,crop=${out.w}:${out.h}`;
      } else {
        vf = `scale=${out.w}:${out.h}:force_original_aspect_ratio=decrease`;
      }

      await ff.exec(["-i", `input.${vExt}`, "-vf", vf, "-c:a", "copy", "-preset", "fast", "resized.mp4"]);
      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "resized.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-resized.mp4`, size: formatBytes(blob.size) });
      toast({ title: "✓ Resized!" });
    } catch (e) {
      const msg = String(e); setError(msg);
      toast({ variant: "destructive", title: "Failed", description: msg });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  const preview = getOutputPreview();

  return (
    <div className="space-y-4">
      {!video ? (
        <DropZone onFile={handleVideo} label="Drop video to resize" />
      ) : (
        <VideoPreview ref={videoRef} file={video} previewUrl={previewUrl} onReset={reset} warning={warning}
          badge={vidW > 0 ? `Source: ${vidW}×${vidH}` : undefined}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) { setVidW(v.videoWidth); setVidH(v.videoHeight); }
          }} />
      )}

      {video && !result && (
        <>
          {/* Aspect ratio */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Aspect Ratio</Label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {RATIO_PRESETS.map(p => (
                <motion.button key={p.value} onClick={() => setRatio(p.value)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className={cn(
                    "rounded-xl border-2 py-2.5 text-xs font-semibold text-center transition-all",
                    ratio === p.value
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"
                  )}>
                  <div className="text-sm mb-0.5">{p.icon}</div>
                  <div className="text-[10px]">{p.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Target Resolution</Label>
            <Select value={resPreset} onValueChange={v => setResPreset(v as ResPreset)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RES_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {resPreset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Width (px)</Label>
                <Input type="number" min="1" value={customW} onChange={e => setCustomW(e.target.value)} placeholder="e.g. 1280" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Height (px)</Label>
                <Input type="number" min="1" value={customH} onChange={e => setCustomH(e.target.value)} placeholder="e.g. 720" />
              </div>
            </div>
          )}

          {/* Letterbox */}
          <div className="flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            <Switch id="letterbox" checked={letterbox} onCheckedChange={setLetterbox} />
            <div>
              <Label htmlFor="letterbox" className="text-sm cursor-pointer">Add letterbox / pillarbox</Label>
              <p className="text-xs text-gray-400">Pad with black bars instead of cropping</p>
            </div>
          </div>

          {/* Output preview */}
          {preview && (
            <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-3 text-xs text-violet-700 dark:text-violet-300">
              Output: {preview.w}×{preview.h}px
              {vidW > 0 && ` (from ${vidW}×${vidH})`}
            </div>
          )}

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing ? "Resizing…" : "Resize Video"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Resizing…" done={done} />}
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

export default ResizeTool;
