import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, triggerDownload } from "@/lib/ffmpeg-run";
import { detectDevice, recommendedFormat, recommendedResolution } from "@/lib/device";
import DropZone from "@/components/DropZone";
import DownloadCard from "@/components/DownloadCard";
import TrimControl from "@/components/TrimControl";
import { FileVideo, RefreshCw, X, Scissors } from "lucide-react";

type Fmt = "mp4" | "webm" | "mp3" | "muted";
type Res = "4k" | "1080p" | "720p" | "480p" | "original";
type Quality = "high" | "medium" | "low";

const RES: Record<Res, string> = { "4k": "3840:2160", "1080p": "1920:1080", "720p": "1280:720", "480p": "854:480", original: "" };
const CRF: Record<Quality, string> = { high: "18", medium: "28", low: "38" };

const ConvertTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [fmt, setFmt] = useState<Fmt>("mp4");
  const [res, setRes] = useState<Res>("original");
  const [quality, setQuality] = useState<Quality>("medium");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  useEffect(() => {
    const d = detectDevice();
    setFmt(recommendedFormat(d) as Fmt);
    setRes(recommendedResolution(d) as Res);
  }, []);

  const handleFile = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f); setPreviewUrl(URL.createObjectURL(f));
    setResult(null); setProgress(0); setTrimEnabled(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null); setPreviewUrl(""); setResult(null); setProgress(0);
  };

  const handleConvert = async () => {
    if (!file) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null);
    const ff = ffmpeg.current!;
    const ext = fmt === "mp3" ? "mp3" : fmt === "webm" ? "webm" : "mp4";
    const inp = `in.${file.name.split(".").pop()}`;
    const out = `out.${ext}`;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      await ff.writeFile(inp, await fetchFile(file));
      const args = ["-i", inp];
      if (trimEnabled) args.push("-ss", trimStart.toFixed(2), "-to", trimEnd.toFixed(2));
      if (fmt === "mp3") { args.push("-vn", "-acodec", "libmp3lame", "-q:a", "2"); }
      else {
        if (fmt === "muted") args.push("-an");
        if (res !== "original") args.push("-vf", `scale=${RES[res]}:force_original_aspect_ratio=decrease`);
        args.push("-crf", CRF[quality], "-preset", "fast");
        if (fmt === "webm") args.push("-c:v", "libvpx-vp9", "-c:a", "libopus");
        else if (fmt === "mp4" || fmt === "muted") args.push("-c:v", "libx264", "-c:a", fmt === "muted" ? "copy" : "aac");
      }
      args.push(out);
      await ff.exec(args);
      await ff.deleteFile(inp);
      const mime = { mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg" }[ext] || "video/mp4";
      const blob = await readOutputBlob(ff, out, mime);
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      setResult({ url, filename: `${base}-converted.${ext}`, size: formatBytes(blob.size) });
      toast({ title: "Done!", description: "File ready to download." });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file ? <DropZone onFile={handleFile} /> : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            <video ref={videoRef} src={previewUrl} controls className="w-full max-h-60 object-contain"
              onLoadedMetadata={() => { const d = videoRef.current?.duration || 0; setDuration(d); setTrimEnd(d); }} />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2"><FileVideo className="w-4 h-4" /><span className="truncate">{file.name}</span><span className="shrink-0">({formatBytes(file.size)})</span></p>
        </div>
      )}

      {file && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Format", value: fmt, set: setFmt, opts: [["mp4","MP4"],["webm","WebM"],["mp3","MP3 Audio"],["muted","Mute Video"]] },
              { label: "Resolution", value: res, set: setRes, opts: [["original","Original"],["1080p","1080p HD"],["720p","720p"],["480p","480p"],["4k","4K"]] },
              { label: "Quality", value: quality, set: setQuality, opts: [["high","High"],["medium","Medium"],["low","Low (smaller)"]] },
            ].map(({ label, value, set, opts }) => (
              <div key={label} className="space-y-1">
                <Label className="text-xs text-gray-500">{label}</Label>
                <Select value={value} onValueChange={set as (v: string) => void}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {duration > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Switch id="trim" checked={trimEnabled} onCheckedChange={setTrimEnabled} />
                <Label htmlFor="trim" className="flex items-center gap-1 text-sm cursor-pointer"><Scissors className="w-3.5 h-3.5" /> Trim video</Label>
              </div>
              {trimEnabled && <TrimControl duration={duration} start={trimStart} end={trimEnd} onChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }} />}
            </div>
          )}

          {!result && (
            <Button onClick={handleConvert} disabled={processing} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11">
              {processing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing…</> : "Convert Now"}
            </Button>
          )}
          {processing && <div className="space-y-1"><Progress value={progress} className="h-2" /><p className="text-xs text-right text-gray-500">{progress}%</p></div>}
          {result && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-green-600">✓ Done! File ready.</p>
              <DownloadCard url={result.url} filename={result.filename} label={result.filename} size={result.size} />
              <Button variant="outline" onClick={reset} className="w-full">Convert another</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConvertTool;
