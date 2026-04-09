import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, AlertTriangle, Sliders, Film, Crop } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type FilterId = "none" | "cinematic" | "vintage" | "vivid" | "bw" | "teal" | "warm" | "cool";
type AspectRatio = "none" | "16:9" | "9:16" | "1:1" | "4:3";
type Panel = "filters" | "color" | "crop";

interface FilterDef { id: FilterId; label: string; emoji: string; css: string; ffmpeg: string; }

const FILTERS: FilterDef[] = [
  { id: "none",      label: "Original",    emoji: "🎬", css: "none",                                                              ffmpeg: "" },
  { id: "cinematic", label: "Cinematic",   emoji: "🎥", css: "contrast(120%) saturate(80%) brightness(90%)",                     ffmpeg: "eq=contrast=1.2:saturation=0.8:brightness=-0.05" },
  { id: "vintage",   label: "Vintage",     emoji: "📷", css: "sepia(40%) contrast(110%) brightness(95%) saturate(80%)",          ffmpeg: "eq=contrast=1.1:saturation=0.8:brightness=-0.02,colorchannelmixer=.9:.1:.05:0:.05:.85:.1:0:.05:.1:.9" },
  { id: "vivid",     label: "Vivid",       emoji: "🌈", css: "saturate(180%) contrast(110%)",                                    ffmpeg: "eq=saturation=1.8:contrast=1.1" },
  { id: "bw",        label: "B&W",         emoji: "⬛", css: "grayscale(100%)",                                                  ffmpeg: "hue=s=0" },
  { id: "teal",      label: "Teal & Orange",emoji: "🌊", css: "hue-rotate(-15deg) saturate(130%) contrast(110%)",               ffmpeg: "colorbalance=bs=0.15:bm=0.05:gs=-0.05:gm=-0.02:rs=-0.1:rm=-0.05" },
  { id: "warm",      label: "Warm",        emoji: "🌅", css: "sepia(20%) saturate(130%) brightness(105%)",                      ffmpeg: "colorbalance=rs=0.1:rm=0.05" },
  { id: "cool",      label: "Cool",        emoji: "❄️", css: "hue-rotate(20deg) saturate(110%)",                                ffmpeg: "colorbalance=bs=0.1:bm=0.05" },
];

const ASPECT_PRESETS: { value: AspectRatio; label: string }[] = [
  { value: "none",  label: "Original" },
  { value: "16:9",  label: "16:9" },
  { value: "9:16",  label: "9:16" },
  { value: "1:1",   label: "1:1" },
  { value: "4:3",   label: "4:3" },
];

const ProEditorTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [vidW, setVidW] = useState(0);
  const [vidH, setVidH] = useState(0);
  const [filter, setFilter] = useState<FilterId>("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [exposure, setExposure] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [gamma, setGamma] = useState(100);
  const [aspect, setAspect] = useState<AspectRatio>("none");
  const [panel, setPanel] = useState<Panel>("filters");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const previewStyle = {
    filter: [
      FILTERS.find(f => f.id === filter)?.css !== "none" ? FILTERS.find(f => f.id === filter)?.css : "",
      brightness !== 100 ? `brightness(${brightness}%)` : "",
      contrast !== 100 ? `contrast(${contrast}%)` : "",
      saturation !== 100 ? `saturate(${saturation}%)` : "",
    ].filter(Boolean).join(" ") || "none",
  };

  const handleVideo = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setWarning(getFileSizeWarning(f));
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setDone(false); setWarning(null);
    setFilter("none"); setBrightness(100); setContrast(100); setSaturation(100);
    setExposure(0); setTemperature(0); setGamma(100); setAspect("none");
  };

  const resetAll = () => {
    setBrightness(100); setContrast(100); setSaturation(100);
    setExposure(0); setTemperature(0); setGamma(100); setFilter("none"); setAspect("none");
  };

  const handleProcess = async () => {
    if (!video) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));

      const vFilters: string[] = [];

      // Filter preset
      const def = FILTERS.find(f => f.id === filter);
      if (def?.ffmpeg) vFilters.push(def.ffmpeg);

      // Color adjustments
      const b = ((brightness / 100) - 1 + exposure / 100).toFixed(3);
      const c = (contrast / 100).toFixed(3);
      const s = (saturation / 100).toFixed(3);
      const g = (gamma / 100).toFixed(3);
      if (brightness !== 100 || contrast !== 100 || saturation !== 100 || exposure !== 0 || gamma !== 100) {
        vFilters.push(`eq=brightness=${b}:contrast=${c}:saturation=${s}:gamma=${g}`);
      }

      // Temperature (warm/cool tint)
      if (temperature !== 0) {
        const t = temperature / 100;
        vFilters.push(`colorbalance=rs=${(t * 0.15).toFixed(3)}:rm=${(t * 0.08).toFixed(3)}:bs=${(-t * 0.15).toFixed(3)}:bm=${(-t * 0.08).toFixed(3)}`);
      }

      // Aspect ratio crop
      if (aspect !== "none" && vidW && vidH) {
        const [rw, rh] = aspect.split(":").map(Number);
        let cw = vidW, ch = Math.round(vidW * rh / rw);
        if (ch > vidH) { ch = vidH; cw = Math.round(vidH * rw / rh); }
        const cx = Math.round((vidW - cw) / 2), cy = Math.round((vidH - ch) / 2);
        vFilters.push(`crop=${cw}:${ch}:${cx}:${cy}`);
      }

      const args = ["-i", `input.${vExt}`];
      if (vFilters.length) args.push("-vf", vFilters.join(","));
      args.push("-c:a", "copy", "-preset", "fast", "edited.mp4");

      await ff.exec(args);
      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "edited.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-edited.mp4`, size: formatBytes(blob.size) });
      toast({ title: "✓ Exported!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  const PANELS: { id: Panel; icon: React.ReactNode; label: string }[] = [
    { id: "filters", icon: <Film className="w-3.5 h-3.5" />, label: "Filters" },
    { id: "color",   icon: <Sliders className="w-3.5 h-3.5" />, label: "Color" },
    { id: "crop",    icon: <Crop className="w-3.5 h-3.5" />, label: "Crop" },
  ];

  return (
    <div className="space-y-4">
      {!video ? (
        <DropZone onFile={handleVideo} label="Drop video to edit" />
      ) : (
        <div className="space-y-3">
          {/* Live preview */}
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            <video ref={videoRef} src={previewUrl} controls
              className="w-full max-h-56 object-contain transition-all duration-300"
              style={previewStyle}
              onLoadedMetadata={() => {
                const v = videoRef.current;
                if (v) { setVidW(v.videoWidth); setVidH(v.videoHeight); }
              }} />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">Live preview</span>
              {vidW > 0 && <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{vidW}×{vidH}</span>}
            </div>
          </div>
          {warning && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{warning}
            </div>
          )}
        </div>
      )}

      {video && !result && (
        <>
          {/* Panel switcher */}
          <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1">
            {PANELS.map(p => (
              <button key={p.id} onClick={() => setPanel(p.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                  panel === p.id
                    ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}>
                {p.icon}{p.label}
              </button>
            ))}
          </div>

          {/* Filters panel */}
          {panel === "filters" && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {FILTERS.map(f => (
                <motion.button key={f.id} onClick={() => setFilter(f.id)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={cn(
                    "rounded-xl p-2 text-xs font-medium border-2 transition-all text-center space-y-0.5",
                    filter === f.id
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"
                  )}>
                  <div className="text-base">{f.emoji}</div>
                  <div className="text-[10px] leading-tight">{f.label}</div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Color panel */}
          {panel === "color" && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Color Grading</p>
                <button onClick={resetAll} className="text-xs text-violet-500 hover:underline">Reset all</button>
              </div>
              {[
                { label: "Brightness", value: brightness, set: setBrightness, min: 50, max: 150, default: 100 },
                { label: "Contrast",   value: contrast,   set: setContrast,   min: 50, max: 200, default: 100 },
                { label: "Saturation", value: saturation, set: setSaturation, min: 0,  max: 300, default: 100 },
                { label: "Exposure",   value: exposure,   set: setExposure,   min: -50, max: 50, default: 0 },
                { label: "Temperature",value: temperature,set: setTemperature,min: -100,max: 100,default: 0 },
                { label: "Gamma",      value: gamma,      set: setGamma,      min: 50, max: 200, default: 100 },
              ].map(({ label, value, set, min, max, default: def }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-gray-500">{label}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-violet-600 dark:text-violet-400 w-8 text-right">{value}</span>
                      <button onClick={() => set(def)} className="text-[10px] text-gray-400 hover:text-violet-500 transition-colors">↺</button>
                    </div>
                  </div>
                  <Slider min={min} max={max} step={1} value={[value]} onValueChange={([v]) => set(v)} />
                </div>
              ))}
            </div>
          )}

          {/* Crop panel */}
          {panel === "crop" && (
            <div className="space-y-3">
              <Label className="text-xs text-gray-500">Aspect Ratio</Label>
              <div className="grid grid-cols-5 gap-2">
                {ASPECT_PRESETS.map(p => (
                  <motion.button key={p.value} onClick={() => setAspect(p.value)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className={cn(
                      "rounded-xl border-2 py-3 text-xs font-semibold text-center transition-all",
                      aspect === p.value
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"
                    )}>
                    {p.label}
                  </motion.button>
                ))}
              </div>
              {aspect !== "none" && vidW > 0 && (
                <p className="text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2">
                  Will crop to {aspect} ratio — centered automatically.
                </p>
              )}
            </div>
          )}

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing ? "Exporting…" : "Export Edited Video"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Applying effects…" done={done} />}
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

export default ProEditorTool;
