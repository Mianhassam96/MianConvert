import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, ImagePlus } from "lucide-react";

type Position = "topleft" | "topright" | "bottomleft" | "bottomright" | "center";

const POS_FILTER: Record<Position, string> = {
  topleft: "10:10",
  topright: "main_w-overlay_w-10:10",
  bottomleft: "10:main_h-overlay_h-10",
  bottomright: "main_w-overlay_w-10:main_h-overlay_h-10",
  center: "(main_w-overlay_w)/2:(main_h-overlay_h)/2",
};

const WatermarkTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [position, setPosition] = useState<Position>("bottomright");
  const [opacity, setOpacity] = useState("0.8");
  const [scale, setScale] = useState("15");
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

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setLogo(f); setLogoPreview(URL.createObjectURL(f)); }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setLogo(null); setLogoPreview(""); setDone(false);
  };

  const handleProcess = async () => {
    if (!video || !logo) { toast({ variant: "destructive", title: "Add both a video and a logo image" }); return; }
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      const lExt = logo.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));
      await ff.writeFile(`logo.${lExt}`, await fetchFile(logo));
      const scaleFilter = `[1:v]scale=iw*${parseInt(scale)/100}:-1,format=rgba,colorchannelmixer=aa=${opacity}[wm]`;
      const overlayFilter = `[0:v][wm]overlay=${POS_FILTER[position]}`;
      await ff.exec(["-i", `input.${vExt}`, "-i", `logo.${lExt}`, "-filter_complex", `${scaleFilter};${overlayFilter}`, "-c:a", "copy", "-preset", "fast", "watermarked.mp4"]);
      await ff.deleteFile(`input.${vExt}`);
      await ff.deleteFile(`logo.${lExt}`);
      const blob = await readOutputBlob(ff, "watermarked.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-watermarked.mp4`, size: formatBytes(blob.size) });
      toast({ title: "Done!", description: "Watermark applied." });
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
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <Label className="text-sm font-medium">Watermark / Logo Image</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg px-4 py-2 text-sm transition-colors">
                <ImagePlus className="w-4 h-4" /> Upload logo (PNG/SVG)
                <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </label>
              {logoPreview && <img src={logoPreview} alt="logo" className="h-12 w-12 object-contain rounded border border-gray-200" />}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Position</Label>
              <Select value={position} onValueChange={v => setPosition(v as Position)}>
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
              <Label className="text-xs text-gray-500">Size (% of video width)</Label>
              <Input type="number" min="5" max="50" value={scale} onChange={e => setScale(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Opacity (0–1)</Label>
              <Input type="number" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(e.target.value)} />
            </div>
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} disabled={!logo} className="w-full" size="lg">
            {processing ? "Processing…" : "Apply Watermark"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Applying watermark…" done={done} />}
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

export default WatermarkTool;
