import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import DownloadCard from "@/components/DownloadCard";
import { X, RefreshCw } from "lucide-react";

type FilterId = "none" | "grayscale" | "sepia" | "cinematic" | "vintage" | "vivid" | "cool" | "warm";

interface FilterDef {
  id: FilterId;
  label: string;
  css: string; // for canvas preview
  ffmpeg: string; // for actual processing
}

const FILTERS: FilterDef[] = [
  { id: "none",       label: "Original",   css: "none",                                                    ffmpeg: "" },
  { id: "grayscale",  label: "Grayscale",  css: "grayscale(100%)",                                         ffmpeg: "hue=s=0" },
  { id: "sepia",      label: "Sepia",      css: "sepia(80%)",                                              ffmpeg: "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131" },
  { id: "cinematic",  label: "Cinematic",  css: "contrast(120%) saturate(80%) brightness(90%)",            ffmpeg: "eq=contrast=1.2:saturation=0.8:brightness=-0.05" },
  { id: "vintage",    label: "Vintage",    css: "sepia(40%) contrast(110%) brightness(95%) saturate(80%)", ffmpeg: "eq=contrast=1.1:saturation=0.8:brightness=-0.02,colorchannelmixer=.9:.1:.05:0:.05:.85:.1:0:.05:.1:.9" },
  { id: "vivid",      label: "Vivid",      css: "saturate(180%) contrast(110%)",                           ffmpeg: "eq=saturation=1.8:contrast=1.1" },
  { id: "cool",       label: "Cool",       css: "hue-rotate(20deg) saturate(110%)",                        ffmpeg: "colorbalance=bs=0.1:bm=0.05" },
  { id: "warm",       label: "Warm",       css: "sepia(20%) saturate(130%) brightness(105%)",              ffmpeg: "colorbalance=rs=0.1:rm=0.05" },
];

const FiltersTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [filter, setFilter] = useState<FilterId>("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const previewStyle = {
    filter: [
      FILTERS.find(f => f.id === filter)?.css || "none",
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
    ].filter(f => f !== "none").join(" ") || "none",
  };

  const handleVideo = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null);
    setFilter("none"); setBrightness(100); setContrast(100); setSaturation(100);
  };

  const handleProcess = async () => {
    if (!video) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));

      const filters: string[] = [];
      const def = FILTERS.find(f => f.id === filter);
      if (def?.ffmpeg) filters.push(def.ffmpeg);

      // eq filter for brightness/contrast/saturation adjustments
      const b = (brightness / 100 - 1).toFixed(2);
      const c = (contrast / 100).toFixed(2);
      const s = (saturation / 100).toFixed(2);
      if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
        filters.push(`eq=brightness=${b}:contrast=${c}:saturation=${s}`);
      }

      const vf = filters.length ? ["-vf", filters.join(",")] : [];
      await ff.exec(["-i", `input.${vExt}`, ...vf, "-c:a", "copy", "-preset", "fast", "filtered.mp4"]);
      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "filtered.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setResult({ url, filename: `${base}-filtered.mp4`, size: formatBytes(blob.size) });
      toast({ title: "Done!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {!video ? <DropZone onFile={handleVideo} /> : (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            <video src={previewUrl} controls className="w-full max-h-52 object-contain transition-all duration-300" style={previewStyle} />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"><X className="w-3.5 h-3.5" /></button>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">Live preview</div>
          </div>
        </div>
      )}

      {video && (
        <>
          {/* Filter presets */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Filter preset</Label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`rounded-xl p-2 text-xs font-medium border-2 transition-all text-center ${filter === f.id ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Adjustments */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Adjustments</p>
            {[
              { label: `Brightness ${brightness}%`, value: brightness, set: setBrightness, min: 50, max: 150 },
              { label: `Contrast ${contrast}%`, value: contrast, set: setContrast, min: 50, max: 200 },
              { label: `Saturation ${saturation}%`, value: saturation, set: setSaturation, min: 0, max: 300 },
            ].map(({ label, value, set, min, max }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-xs text-gray-500">{label}</Label>
                  <button onClick={() => set(100)} className="text-xs text-violet-500 hover:underline">Reset</button>
                </div>
                <Slider min={min} max={max} step={1} value={[value]} onValueChange={([v]) => set(v)} />
              </div>
            ))}
          </div>

          {!result && (
            <Button onClick={handleProcess} disabled={processing} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 font-semibold">
              {processing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Applying filters…</> : "Apply & Export"}
            </Button>
          )}
          {processing && <div className="space-y-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Processing…</span><span className="font-mono text-violet-600">{progress}%</span></div><Progress value={progress} className="h-2" /></div>}
          {result && (
            <div className="rounded-2xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">✓ Filters applied!</p>
              <DownloadCard url={result.url} filename={result.filename} label={result.filename} size={result.size} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { if (result) URL.revokeObjectURL(result.url); setResult(null); }} className="gap-1"><RefreshCw className="w-3.5 h-3.5" />Again</Button>
                <Button variant="ghost" onClick={reset} className="text-sm">New file</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FiltersTool;
