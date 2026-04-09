import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { Plus, Trash2, ImagePlus, Type } from "lucide-react";
import VideoPreview from "@/components/VideoPreview";
import ErrorRecovery from "@/components/ErrorRecovery";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type LayerType = "text" | "image";
type Align = "left" | "center" | "right";
type VPos = "top" | "middle" | "bottom";
type Animation = "none" | "fadein" | "fadeout" | "slide";

interface TextLayer {
  id: string; type: "text";
  text: string; fontSize: number; color: string;
  align: Align; vpos: VPos; startTime: number; endTime: number; animation: Animation;
}
interface ImageLayer {
  id: string; type: "image";
  file: File | null; previewUrl: string;
  position: "topleft" | "topright" | "bottomleft" | "bottomright" | "center";
  opacity: number; scale: number; startTime: number; endTime: number;
}
type Layer = TextLayer | ImageLayer;

const POS_FILTER: Record<ImageLayer["position"], string> = {
  topleft: "10:10",
  topright: "main_w-overlay_w-10:10",
  bottomleft: "10:main_h-overlay_h-10",
  bottomright: "main_w-overlay_w-10:main_h-overlay_h-10",
  center: "(main_w-overlay_w)/2:(main_h-overlay_h)/2",
};

const xExpr = (a: Align) => a === "left" ? "20" : a === "right" ? "w-tw-20" : "(w-tw)/2";
const yExpr = (v: VPos) => v === "top" ? "20" : v === "bottom" ? "h-th-20" : "(h-th)/2";

const defaultText = (): TextLayer => ({
  id: crypto.randomUUID(), type: "text",
  text: "Your text here", fontSize: 36, color: "#ffffff",
  align: "center", vpos: "bottom", startTime: 0, endTime: 5, animation: "none",
});

const OverlayStudioTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [layers, setLayers] = useState<Layer[]>([defaultText()]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleVideo = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    layers.forEach(l => { if (l.type === "image" && l.previewUrl) URL.revokeObjectURL(l.previewUrl); });
    setVideo(null); setPreviewUrl(""); setResult(null); setDone(false); setError(null);
    setLayers([defaultText()]);
  };

  const updateLayer = (id: string, patch: Partial<Layer>) =>
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } as Layer : l));

  const removeLayer = (id: string) => setLayers(prev => prev.filter(l => l.id !== id));

  const addTextLayer = () => setLayers(prev => [...prev, defaultText()]);

  const addImageLayer = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const layer: ImageLayer = {
        id: crypto.randomUUID(), type: "image",
        file: f, previewUrl: URL.createObjectURL(f),
        position: "bottomright", opacity: 0.8, scale: 15, startTime: 0, endTime: 999,
      };
      setLayers(prev => [...prev, layer]);
    };
    input.click();
  };

  const buildDrawtext = (l: TextLayer): string => {
    const hex = l.color.replace("#", "");
    const x = xExpr(l.align), y = yExpr(l.vpos);
    const escaped = l.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
    let alpha = "1";
    if (l.animation === "fadein") alpha = `if(lt(t-${l.startTime},1),(t-${l.startTime}),1)`;
    if (l.animation === "fadeout") alpha = `if(gt(t,${l.endTime - 1}),${l.endTime}-t,1)`;
    if (l.animation === "slide") alpha = "1";
    const slideX = l.animation === "slide" ? `if(lt(t-${l.startTime},0.5),(t-${l.startTime})*2*${x === "(w-tw)/2" ? "(w-tw)/2" : "100"},${x})` : x;
    return `drawtext=text='${escaped}':fontsize=${l.fontSize}:fontcolor=0x${hex}:x=${slideX}:y=${y}:enable='between(t,${l.startTime},${l.endTime})':alpha='${alpha}'`;
  };

  const handleProcess = async () => {
    if (!video || !layers.length) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));

      const textLayers = layers.filter(l => l.type === "text") as TextLayer[];
      const imageLayers = layers.filter(l => l.type === "image" && l.file) as ImageLayer[];

      // Write image files
      for (let i = 0; i < imageLayers.length; i++) {
        const il = imageLayers[i];
        const ext = il.file!.name.split(".").pop();
        await ff.writeFile(`logo_${i}.${ext}`, await fetchFile(il.file!));
      }

      let currentInput = `input.${vExt}`;
      let stepIdx = 0;

      // Apply text layers first
      if (textLayers.length) {
        const vf = textLayers.map(buildDrawtext).join(",");
        const out = `step_${stepIdx}.mp4`;
        await ff.exec(["-i", currentInput, "-vf", vf, "-c:a", "copy", "-preset", "fast", out]);
        if (currentInput !== `input.${vExt}`) await ff.deleteFile(currentInput);
        currentInput = out; stepIdx++;
      }

      // Apply image overlays
      for (let i = 0; i < imageLayers.length; i++) {
        const il = imageLayers[i];
        const ext = il.file!.name.split(".").pop();
        const logoFile = `logo_${i}.${ext}`;
        const out = `step_${stepIdx}.mp4`;
        const scaleFilter = `[1:v]scale=iw*${il.scale / 100}:-1,format=rgba,colorchannelmixer=aa=${il.opacity}[wm]`;
        const overlayFilter = `[0:v][wm]overlay=${POS_FILTER[il.position]}:enable='between(t,${il.startTime},${il.endTime})'`;
        await ff.exec(["-i", currentInput, "-i", logoFile, "-filter_complex", `${scaleFilter};${overlayFilter}`, "-c:a", "copy", "-preset", "fast", out]);
        if (currentInput !== `input.${vExt}`) await ff.deleteFile(currentInput);
        await ff.deleteFile(logoFile);
        currentInput = out; stepIdx++;
      }

      // If no layers processed, just copy
      if (stepIdx === 0) {
        await ff.exec(["-i", currentInput, "-c", "copy", `step_${stepIdx}.mp4`]);
        currentInput = `step_${stepIdx}.mp4`;
      }

      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, currentInput, "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-overlay.mp4`, size: formatBytes(blob.size) });
      toast({ title: "✓ Done!" });
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
        <DropZone onFile={handleVideo} label="Drop video for overlay studio" />
      ) : (
        <VideoPreview
          file={video}
          previewUrl={previewUrl}
          onReset={reset}
        />
      )}

      {video && !result && (
        <>
          {/* Layer list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Layers ({layers.length})</Label>
              <div className="flex gap-2">
                <AnimatedButton size="xs" variant="outline" onClick={addTextLayer}>
                  <Type className="w-3 h-3" /> Text
                </AnimatedButton>
                <AnimatedButton size="xs" variant="outline" onClick={addImageLayer}>
                  <ImagePlus className="w-3 h-3" /> Image
                </AnimatedButton>
              </div>
            </div>

            {layers.map((layer, i) => (
              <div key={layer.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    {layer.type === "text" ? <Type className="w-3.5 h-3.5 text-violet-500" /> : <ImagePlus className="w-3.5 h-3.5 text-fuchsia-500" />}
                    {layer.type === "text" ? "Text" : "Image"} Layer {i + 1}
                  </span>
                  {layers.length > 1 && (
                    <button onClick={() => removeLayer(layer.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {layer.type === "text" && (
                  <>
                    <Input value={layer.text} onChange={e => updateLayer(layer.id, { text: e.target.value })} placeholder="Enter text…" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Font size</Label>
                        <Input type="number" min={12} max={120} value={layer.fontSize} onChange={e => updateLayer(layer.id, { fontSize: +e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Color</Label>
                        <input type="color" value={layer.color} onChange={e => updateLayer(layer.id, { color: e.target.value })}
                          className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">H-align</Label>
                        <Select value={layer.align} onValueChange={v => updateLayer(layer.id, { align: v as Align })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">V-position</Label>
                        <Select value={layer.vpos} onValueChange={v => updateLayer(layer.id, { vpos: v as VPos })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="middle">Middle</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Start (s)</Label>
                        <Input type="number" min={0} step={0.5} value={layer.startTime} onChange={e => updateLayer(layer.id, { startTime: +e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">End (s)</Label>
                        <Input type="number" min={0} step={0.5} value={layer.endTime} onChange={e => updateLayer(layer.id, { endTime: +e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Animation</Label>
                        <Select value={layer.animation} onValueChange={v => updateLayer(layer.id, { animation: v as Animation })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="fadein">Fade in</SelectItem>
                            <SelectItem value="fadeout">Fade out</SelectItem>
                            <SelectItem value="slide">Slide in</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {layer.type === "image" && (
                  <>
                    <div className="flex items-center gap-3">
                      {layer.previewUrl && <img src={layer.previewUrl} alt="logo" className="h-10 w-10 object-contain rounded border border-gray-200 dark:border-gray-700" />}
                      <span className="text-xs text-gray-500 truncate">{layer.file?.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Position</Label>
                        <Select value={layer.position} onValueChange={v => updateLayer(layer.id, { position: v as ImageLayer["position"] })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="topleft">Top Left</SelectItem>
                            <SelectItem value="topright">Top Right</SelectItem>
                            <SelectItem value="bottomleft">Bottom Left</SelectItem>
                            <SelectItem value="bottomright">Bottom Right</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Size: {layer.scale}%</Label>
                        <Slider min={5} max={50} step={1} value={[layer.scale]} onValueChange={([v]) => updateLayer(layer.id, { scale: v })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Opacity: {layer.opacity.toFixed(1)}</Label>
                      <Slider min={0.1} max={1} step={0.1} value={[layer.opacity]} onValueChange={([v]) => updateLayer(layer.id, { opacity: v })} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing ? "Rendering…" : "Render with Overlays"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Rendering overlays…" done={done} />}
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

export default OverlayStudioTool;
