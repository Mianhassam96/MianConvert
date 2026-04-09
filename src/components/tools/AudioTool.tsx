import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, Music } from "lucide-react";

type OutputFmt = "mp3" | "wav" | "aac";

const AudioTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [volume, setVolume] = useState(100);
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(2);
  const [outputFmt, setOutputFmt] = useState<OutputFmt>("mp3");
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleFile = (f: File) => {
    const isAudioFile = f.type.startsWith("audio/") || f.type.startsWith("video/");
    if (!isAudioFile) { toast({ variant: "destructive", title: "Please upload a video or audio file" }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null); setPreviewUrl(""); setResult(null); setDone(false);
  };

  const handleProcess = async () => {
    if (!file) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const ext = file.name.split(".").pop();
      await ff.writeFile(`input.${ext}`, await fetchFile(file));

      const audioFilters: string[] = [];
      if (volume !== 100) audioFilters.push(`volume=${(volume / 100).toFixed(2)}`);
      if (fadeIn) audioFilters.push(`afade=t=in:st=0:d=${fadeDuration}`);
      if (fadeOut && duration > 0) audioFilters.push(`afade=t=out:st=${Math.max(0, duration - fadeDuration).toFixed(2)}:d=${fadeDuration}`);

      const outFile = `output.${outputFmt}`;
      const args = ["-i", `input.${ext}`, "-vn"];
      if (audioFilters.length) args.push("-af", audioFilters.join(","));
      if (outputFmt === "mp3") args.push("-acodec", "libmp3lame", "-q:a", "2");
      else if (outputFmt === "wav") args.push("-acodec", "pcm_s16le");
      else args.push("-acodec", "aac", "-b:a", "192k");
      args.push(outFile);

      await ff.exec(args);
      await ff.deleteFile(`input.${ext}`);
      const mimeMap: Record<OutputFmt, string> = { mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac" };
      const blob = await readOutputBlob(ff, outFile, mimeMap[outputFmt]);
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-audio.${outputFmt}`, size: formatBytes(blob.size) });
      toast({ title: "✓ Audio processed!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <DropZone onFile={handleFile} accept="video/*,audio/*" label="Drop video or audio file" />
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            {file.type.startsWith("audio/") ? (
              <div className="flex items-center justify-center py-8 bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40">
                <Music className="w-12 h-12 text-violet-400" />
              </div>
            ) : (
              <video ref={videoRef} src={previewUrl} controls className="w-full max-h-52 object-contain"
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} />
            )}
            <audio src={file.type.startsWith("audio/") ? previewUrl : undefined} controls
              className={file.type.startsWith("audio/") ? "w-full" : "hidden"}
              onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)} />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {file && !result && (
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            {/* Volume */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm font-medium">Volume: {volume}%</Label>
                <button onClick={() => setVolume(100)} className="text-xs text-violet-500 hover:underline">Reset</button>
              </div>
              <Slider min={0} max={200} step={5} value={[volume]} onValueChange={([v]) => setVolume(v)} />
              <p className="text-xs text-gray-400">
                {volume === 0 ? "🔇 Muted" : volume < 100 ? "🔉 Reduced" : volume === 100 ? "🔊 Original" : "📢 Boosted"}
              </p>
            </div>

            {/* Fade in/out */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch id="fade-in" checked={fadeIn} onCheckedChange={setFadeIn} />
                <Label htmlFor="fade-in" className="text-sm cursor-pointer">Fade in</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="fade-out" checked={fadeOut} onCheckedChange={setFadeOut} />
                <Label htmlFor="fade-out" className="text-sm cursor-pointer">Fade out</Label>
              </div>
              {(fadeIn || fadeOut) && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Fade duration: {fadeDuration}s</Label>
                  <Slider min={0.5} max={5} step={0.5} value={[fadeDuration]} onValueChange={([v]) => setFadeDuration(v)} />
                </div>
              )}
            </div>
          </div>

          {/* Output format */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Output Format</Label>
            <Select value={outputFmt} onValueChange={v => setOutputFmt(v as OutputFmt)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3 (most compatible)</SelectItem>
                <SelectItem value="wav">WAV (lossless)</SelectItem>
                <SelectItem value="aac">AAC (high quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing ? "Processing…" : "Process Audio"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Processing audio…" done={done} />}
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

export default AudioTool;
