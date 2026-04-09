import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { motion } from "framer-motion";

type AspectRatio = "custom" | "1:1" | "9:16" | "16:9" | "4:3" | "3:4";

const ASPECT_PRESETS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: "16:9",  label: "16:9 Landscape", icon: "🖥" },
  { value: "9:16",  label: "9:16 Portrait",  icon: "📱" },
  { value: "1:1",   label: "1:1 Square",     icon: "⬛" },
  { value: "4:3",   label: "4:3 Classic",    icon: "📺" },
  { value: "3:4",   label: "3:4 Portrait",   icon: "🖼" },
  { value: "custom",label: "Custom",         icon: "✏️" },
];

const CropTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [vidW, setVidW] = useState(0);
  const [vidH, setVidH] = useState(0);
  const [aspect, setAspect] = useState<AspectRatio>("16:9");
  const [cropW, setCropW] = useState("");
  const [cropH, setCropH] = useState("");
  const [cropX, setCropX] = useState("0");
  const [cropY, setCropY] = useState("0");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleVideo = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setWarning(getFileSizeWarning(f));
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const onMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setVidW(v.videoWidth); setVidH(v.videoHeight);
    applyAspect("16:9", v.videoWidth, v.videoHeight);
  };

  const applyAspect = (a: AspectRatio, w = vidW, h = vidH) => {
    setAspect(a);
    if (a === "custom" || !w || !h) return;
    const [rw, rh] = a.split(":").map(Number);
    let cw = w, ch = Math.round(w * rh / rw);
    if (ch > h) { ch = h; cw = Math.round(h * rw / rh); }
    setCropW(String(cw)); setCropH(String(ch));
    setCropX(String(Math.round((w - cw) / 2)));
    setCropY(String(Math.round((h - ch) / 2)));
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setDone(false); setWarning(null);
  };

  const handleProcess = async () => {
    if (!video) return;
    const w = parseInt(cropW), h = parseInt(cropH), x = parseInt(cropX), y = parseInt(cropY);
    if (!w || !h) { toast({ variant: "destructive", title: "Set crop dimensions" }); return; }
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));
      await ff.exec(["-i", `input.${vExt}`, "-vf", `crop=${w}:${h}:${x}:${y}`, "-c:a", "copy", "-preset", "fast", "cropped.mp4"]);
      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "cropped.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-cropped.mp4`, size: formatBytes(blob.size) });
      toast({ title: "✓ Cropped!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {!video ? (
        <DropZone onFile={handleVideo} label="Drop video to crop" />
      ) : (
        <VideoPreview ref={videoRef} file={video} previewUrl={previewUrl} onReset={reset} warning={warning}
          badge={vidW > 0 ? `${vidW}×${vidH}` : undefined}
          onLoadedMetadata={onMetadata} />
      )}

      {video && !result && (
        <>
          {/* Aspect ratio presets */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Aspect Ratio</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ASPECT_PRESETS.map(p => (
                <motion.button key={p.value} onClick={() => applyAspect(p.value)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className={`rounded-xl border-2 p-2.5 text-xs font-medium text-center transition-all ${
                    aspect === p.value
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"
                  }`}>
                  <div className="text-base mb-0.5">{p.icon}</div>
                  <div className="text-[10px] leading-tight">{p.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Crop values */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Crop Region</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Width (px)</Label>
                <Input type="number" min="1" max={vidW || 9999} value={cropW} onChange={e => { setCropW(e.target.value); setAspect("custom"); }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Height (px)</Label>
                <Input type="number" min="1" max={vidH || 9999} value={cropH} onChange={e => { setCropH(e.target.value); setAspect("custom"); }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">X offset (px)</Label>
                <Input type="number" min="0" value={cropX} onChange={e => setCropX(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Y offset (px)</Label>
                <Input type="number" min="0" value={cropY} onChange={e => setCropY(e.target.value)} />
              </div>
            </div>
            {cropW && cropH && (
              <p className="text-xs text-violet-600 dark:text-violet-400">
                Output: {cropW}×{cropH}px at ({cropX}, {cropY})
              </p>
            )}
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing ? "Cropping…" : "Crop Video"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Cropping…" done={done} />}
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

export default CropTool;
