import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import VideoPreview from "@/components/VideoPreview";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X } from "lucide-react";

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
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string; preview?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
    setVideo(null); setPreviewUrl(""); setResult(null); setDone(false);
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
      const s = parseFloat(start) || 0;
      const d = parseFloat(gifDuration) || 5;
      const w = parseInt(width) || 480;
      await ff.exec(["-ss", s.toFixed(2), "-t", d.toFixed(2), "-i", `input.${vExt}`, "-vf", `fps=${fps},scale=${w}:-1:flags=lanczos,palettegen`, "palette.png"]);
      setProgress(40);
      await ff.exec(["-ss", s.toFixed(2), "-t", d.toFixed(2), "-i", `input.${vExt}`, "-i", "palette.png", "-filter_complex", `fps=${fps},scale=${w}:-1:flags=lanczos[x];[x][1:v]paletteuse`, "output.gif"]);
      await ff.deleteFile(`input.${vExt}`);
      await ff.deleteFile("palette.png");
      const blob = await readOutputBlob(ff, "output.gif", "image/gif");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}.gif`, size: formatBytes(blob.size), preview: url });
      toast({ title: "GIF created!", description: formatBytes(blob.size) });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {!video ? <DropZone onFile={handleVideo} /> : (
        <VideoPreview ref={videoRef} file={video} previewUrl={previewUrl} onReset={reset}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} />
      )}

      {video && !result && (
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

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing ? "Creating GIF…" : "Convert to GIF"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Creating GIF…" done={done} />}
        </>
      )}

      {result && (
        <ResultCard url={result.url} filename={result.filename} size={result.size}
          preview={result.preview}
          onAgain={() => { URL.revokeObjectURL(result.url); setResult(null); setDone(false); }}
          onReset={reset} />
      )}
    </div>
  );
};

export default GifTool;
