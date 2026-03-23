import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import DownloadCard from "@/components/DownloadCard";
import TrimControl from "@/components/TrimControl";
import { X, RefreshCw, Scissors } from "lucide-react";

const PRESETS = [{ label: "15s", s: 15 }, { label: "30s", s: 30 }, { label: "60s", s: 60 }, { label: "90s", s: 90 }];

const ClipTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [loop, setLoop] = useState(false);
  const [loopCount, setLoopCount] = useState(2);
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

  const applyPreset = (s: number) => {
    setStart(0);
    setEnd(Math.min(s, duration));
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

      if (loop) {
        // Trim first, then loop using concat
        await ff.exec(["-i", `input.${vExt}`, "-ss", start.toFixed(2), "-to", end.toFixed(2), "-c", "copy", "clip.mp4"]);
        // Build concat list
        const lines = Array(loopCount).fill("file 'clip.mp4'").join("\n");
        await ff.writeFile("loop.txt", new TextEncoder().encode(lines));
        await ff.exec(["-f", "concat", "-safe", "0", "-i", "loop.txt", "-c", "copy", "output.mp4"]);
        await ff.deleteFile("clip.mp4");
        await ff.deleteFile("loop.txt");
      } else {
        await ff.exec(["-i", `input.${vExt}`, "-ss", start.toFixed(2), "-to", end.toFixed(2), "-c:v", "libx264", "-c:a", "aac", "-preset", "fast", "output.mp4"]);
      }

      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "output.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setResult({ url, filename: `${base}-clip.mp4`, size: formatBytes(blob.size) });
      toast({ title: "Clip ready!" });
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
          <video ref={videoRef} src={previewUrl} controls className="w-full max-h-56 object-contain"
            onLoadedMetadata={() => { const d = videoRef.current?.duration || 0; setDuration(d); setEnd(Math.min(30, d)); }} />
          <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {video && duration > 0 && (
        <>
          {/* Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Quick clip length</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(p => (
                <button key={p.s} onClick={() => applyPreset(p.s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${end - start === p.s && start === 0 ? "bg-violet-600 text-white border-violet-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400"}`}>
                  {p.label}
                </button>
              ))}
              <button onClick={() => { setStart(0); setEnd(duration); }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400">
                Full
              </button>
            </div>
          </div>

          {/* Trim sliders */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" /> Trim range</p>
            <TrimControl duration={duration} start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} />
          </div>

          {/* Loop */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Switch id="loop" checked={loop} onCheckedChange={setLoop} />
              <Label htmlFor="loop" className="text-sm cursor-pointer">🔁 Loop / repeat clip</Label>
            </div>
            {loop && (
              <div className="flex items-center gap-3">
                <Label className="text-xs text-gray-500 shrink-0">Repeat</Label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setLoopCount(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${loopCount === n ? "bg-violet-600 text-white border-violet-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
                      {n}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!result && (
            <Button onClick={handleProcess} disabled={processing} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 font-semibold">
              {processing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Creating clip…</> : `Create Clip (${(end - start).toFixed(1)}s${loop ? ` × ${loopCount}` : ""})`}
            </Button>
          )}
          {processing && <div className="space-y-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Processing…</span><span className="font-mono text-violet-600">{progress}%</span></div><Progress value={progress} className="h-2" /></div>}
          {result && (
            <div className="rounded-2xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">✓ Clip ready! {result.size}</p>
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

export default ClipTool;
