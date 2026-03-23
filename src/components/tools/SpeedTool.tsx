import { useState } from "react";
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

const PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

const SpeedTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleVideo = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setSpeed(1);
  };

  const handleProcess = async () => {
    if (!video) return;
    if (speed === 1) { toast({ variant: "destructive", title: "Speed is already 1x" }); return; }
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));
      // atempo only supports 0.5–2.0, chain for extreme values
      const videoFilter = `setpts=${(1 / speed).toFixed(4)}*PTS`;
      let audioFilter = "";
      if (speed <= 0.5) audioFilter = `atempo=0.5,atempo=${(speed / 0.5).toFixed(4)}`;
      else if (speed >= 2) audioFilter = `atempo=2.0,atempo=${(speed / 2).toFixed(4)}`;
      else audioFilter = `atempo=${speed.toFixed(4)}`;
      await ff.exec([
        "-i", `input.${vExt}`,
        "-filter_complex", `[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]`,
        "-map", "[v]", "-map", "[a]",
        "-preset", "fast",
        "speed.mp4"
      ]);
      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "speed.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setResult({ url, filename: `${base}-${speed}x.mp4`, size: formatBytes(blob.size) });
      toast({ title: "Done!", description: `Speed set to ${speed}x.` });
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
          <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {video && (
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Playback Speed</Label>
              <span className="text-2xl font-bold text-violet-600">{speed}x</span>
            </div>
            <Slider min={0.25} max={4} step={0.25} value={[speed]} onValueChange={([v]) => setSpeed(v)} />
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p} onClick={() => setSpeed(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${speed === p ? "bg-violet-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-100"}`}>
                  {p}x
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {speed < 1 ? "🐢 Slow motion" : speed > 1 ? "⚡ Fast forward" : "▶ Normal speed"}
            </p>
          </div>

          {!result && (
            <Button onClick={handleProcess} disabled={processing || speed === 1} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11">
              {processing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing…</> : `Apply ${speed}x Speed`}
            </Button>
          )}
          {processing && <div className="space-y-1"><Progress value={progress} className="h-2" /><p className="text-xs text-right text-gray-500">{progress}%</p></div>}
          {result && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-green-600">✓ Speed adjusted!</p>
              <DownloadCard url={result.url} filename={result.filename} label={result.filename} size={result.size} />
              <Button variant="outline" onClick={reset} className="w-full">Start over</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SpeedTool;
