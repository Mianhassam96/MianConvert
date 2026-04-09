import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, AlertTriangle } from "lucide-react";

const PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

const SpeedTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [speed, setSpeed] = useState(1);
  const [hasAudio, setHasAudio] = useState(true);
  const [muteAudio, setMuteAudio] = useState(false);
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

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setSpeed(1); setDone(false); setWarning(null);
  };

  const handleProcess = async () => {
    if (!video) return;
    if (speed === 1) { toast({ variant: "destructive", title: "Speed is already 1x" }); return; }
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));
      const videoFilter = `setpts=${(1 / speed).toFixed(4)}*PTS`;

      const useAudio = hasAudio && !muteAudio;

      if (useAudio) {
        // Build atempo chain (atempo only supports 0.5–2.0 range, chain for extremes)
        let audioFilter = "";
        if (speed <= 0.5) audioFilter = `atempo=0.5,atempo=${(speed / 0.5).toFixed(4)}`;
        else if (speed >= 2) audioFilter = `atempo=2.0,atempo=${(speed / 2).toFixed(4)}`;
        else audioFilter = `atempo=${speed.toFixed(4)}`;

        await ff.exec([
          "-i", `input.${vExt}`,
          "-filter_complex", `[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]`,
          "-map", "[v]", "-map", "[a]",
          "-preset", "fast", "speed.mp4"
        ]);
      } else {
        // No audio track or user muted — video only
        await ff.exec([
          "-i", `input.${vExt}`,
          "-vf", videoFilter,
          "-an",
          "-preset", "fast", "speed.mp4"
        ]);
      }

      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "speed.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
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
      {!video ? (
        <DropZone onFile={handleVideo} />
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="w-full max-h-52 object-contain"
              onLoadedMetadata={() => {
                const v = videoRef.current;
                if (v) setHasAudio(v.mozHasAudio !== false && (v as any).webkitAudioDecodedByteCount !== 0);
              }}
            />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
              <X className="w-3.5 h-3.5" />
            </button>
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

          <div className="flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            <Switch id="mute-audio" checked={muteAudio} onCheckedChange={setMuteAudio} />
            <Label htmlFor="mute-audio" className="text-sm cursor-pointer">
              Remove audio from output
              {!hasAudio && <span className="ml-2 text-xs text-gray-400">(no audio detected)</span>}
            </Label>
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} disabled={speed === 1} className="w-full" size="lg">
            {processing ? "Processing…" : `Apply ${speed}x Speed`}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Adjusting speed…" done={done} />}
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

export default SpeedTool;
