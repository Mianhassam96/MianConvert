import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import DownloadCard from "@/components/DownloadCard";
import { X, RefreshCw } from "lucide-react";

const GifTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState("0");
  const [gifDuration, setGifDuration] = useState("5");
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState("480");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleVideo = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null);
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
      const s = parseFloat(start) || 0;
      const d = parseFloat(gifDuration) || 5;
      const w = parseInt(width) || 480;
      // Two-pass GIF: generate palette first for better quality
      await ff.exec([
        "-ss", s.toFixed(2), "-t", d.toFixed(2),
        "-i", `input.${vExt}`,
        "-vf", `fps=${fps},scale=${w}:-1:flags=lanczos,palettegen`,
        "palette.png"
      ]);
      setProgress(40);
      await ff.exec([
        "-ss", s.toFixed(2), "-t", d.toFixed(2),
        "-i", `input.${vExt}`,
        "-i", "palette.png",
        "-filter_complex", `fps=${fps},scale=${w}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
        "output.gif"
      ]);
      await ff.deleteFile(`input.${vExt}`);
      await ff.deleteFile("palette.png");
      const blob = await readOutputBlob(ff, "output.gif", "image/gif");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setResult({ url, filename: `${base}.gif`, size: formatBytes(blob.size) });
      toast({ title: "GIF created!", description: `${formatBytes(blob.size)}` });
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
          <video ref={videoRef} src={previewUrl} controls className="w-full max-h-52 object-contain"
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} />
          <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {video && (
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Start time (s)</Label>
                <Input type="number" min="0" max={duration} step="0.1" value={start} onChange={e => setStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Duration (s, max 30)</Label>
                <Input type="number" min="1" max="30" value={gifDuration} onChange={e => setGifDuration(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Width (px)</Label>
                <Input type="number" min="120" max="1280" step="40" value={width} onChange={e => setWidth(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">FPS: {fps}</Label>
                <Slider min={5} max={30} step={1} value={[fps]} onValueChange={([v]) => setFps(v)} className="mt-2" />
              </div>
            </div>
            <p className="text-xs text-gray-400">💡 Keep duration short (&lt;10s) and width small for reasonable file sizes.</p>
          </div>

          {!result && (
            <Button onClick={handleProcess} disabled={processing} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11">
              {processing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Creating GIF…</> : "Convert to GIF"}
            </Button>
          )}
          {processing && <div className="space-y-1"><Progress value={progress} className="h-2" /><p className="text-xs text-right text-gray-500">{progress}%</p></div>}
          {result && (
            <div className="rounded-2xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">✓ GIF ready!</p>
              <img src={result.url} alt="GIF preview" className="w-full rounded-xl border border-gray-200 dark:border-gray-700" />
              <DownloadCard url={result.url} filename={result.filename} label={result.filename} size={result.size} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { if(result) URL.revokeObjectURL(result.url); setResult(null); }} className="w-full gap-1"><RefreshCw className="w-3.5 h-3.5" />Again</Button>
                <Button variant="ghost" onClick={reset} className="w-full text-sm">New file</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GifTool;
