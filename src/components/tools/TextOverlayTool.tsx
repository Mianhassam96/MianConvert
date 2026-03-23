import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, Plus, Trash2 } from "lucide-react";

type Align = "left" | "center" | "right";
type VPos = "top" | "middle" | "bottom";
type Animation = "none" | "fadein" | "fadeout";

interface TextLayer {
  id: string; text: string; fontSize: number; color: string;
  align: Align; vpos: VPos; startTime: number; endTime: number; animation: Animation;
}

const defaultLayer = (): TextLayer => ({
  id: crypto.randomUUID(), text: "Your text here", fontSize: 36, color: "#ffffff",
  align: "center", vpos: "bottom", startTime: 0, endTime: 5, animation: "none",
});

const xExpr = (align: Align) => align === "left" ? "20" : align === "right" ? "w-tw-20" : "(w-tw)/2";
const yExpr = (vpos: VPos) => vpos === "top" ? "20" : vpos === "bottom" ? "h-th-20" : "(h-th)/2";

const TextOverlayTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [layers, setLayers] = useState<TextLayer[]>([defaultLayer()]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleVideo = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setDone(false);
  };

  const update = (id: string, patch: Partial<TextLayer>) =>
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));

  const buildDrawtext = (l: TextLayer): string => {
    const hex = l.color.replace("#", "");
    const x = xExpr(l.align);
    const y = yExpr(l.vpos);
    const escaped = l.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
    let alpha = "1";
    if (l.animation === "fadein") alpha = `if(lt(t-${l.startTime},1),(t-${l.startTime}),1)`;
    if (l.animation === "fadeout") alpha = `if(gt(t,${l.endTime - 1}),${l.endTime}-t,1)`;
    return `drawtext=text='${escaped}':fontsize=${l.fontSize}:fontcolor=0x${hex}:x=${x}:y=${y}:enable='between(t,${l.startTime},${l.endTime})':alpha='${alpha}'`;
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
      const vf = layers.map(buildDrawtext).join(",");
      await ff.exec(["-i", `input.${vExt}`, "-vf", vf, "-c:a", "copy", "-preset", "fast", "text.mp4"]);
      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "text.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-text.mp4`, size: formatBytes(blob.size) });
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
        <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
          <video src={previewUrl} controls className="w-full max-h-52 object-contain" />
          <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {video && !result && (
        <>
          <div className="space-y-3">
            {layers.map((l, i) => (
              <div key={l.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Text layer {i + 1}</span>
                  {layers.length > 1 && (
                    <button onClick={() => setLayers(prev => prev.filter(x => x.id !== l.id))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                <Input value={l.text} onChange={e => update(l.id, { text: e.target.value })} placeholder="Enter text…" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Font size</Label>
                    <Input type="number" min={12} max={120} value={l.fontSize} onChange={e => update(l.id, { fontSize: +e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Color</Label>
                    <input type="color" value={l.color} onChange={e => update(l.id, { color: e.target.value })} className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">H-align</Label>
                    <Select value={l.align} onValueChange={v => update(l.id, { align: v as Align })}>
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
                    <Select value={l.vpos} onValueChange={v => update(l.id, { vpos: v as VPos })}>
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
                    <Input type="number" min={0} step={0.5} value={l.startTime} onChange={e => update(l.id, { startTime: +e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">End (s)</Label>
                    <Input type="number" min={0} step={0.5} value={l.endTime} onChange={e => update(l.id, { endTime: +e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Animation</Label>
                    <Select value={l.animation} onValueChange={v => update(l.id, { animation: v as Animation })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="fadein">Fade in</SelectItem>
                        <SelectItem value="fadeout">Fade out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            <AnimatedButton variant="outline" onClick={() => setLayers(prev => [...prev, defaultLayer()])} className="w-full border-dashed">
              <Plus className="w-4 h-4" /> Add text layer
            </AnimatedButton>
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing ? "Rendering…" : "Render with Text"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Rendering text…" done={done} />}
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

export default TextOverlayTool;
