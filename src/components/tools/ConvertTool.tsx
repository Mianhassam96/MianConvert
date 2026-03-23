import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import { detectDevice, recommendedFormat, recommendedResolution } from "@/lib/device";
import DropZone from "@/components/DropZone";
import DownloadCard from "@/components/DownloadCard";
import TrimControl from "@/components/TrimControl";
import { FileVideo, RefreshCw, X, Scissors, RotateCcw, FlipHorizontal, Download } from "lucide-react";

type Fmt = "mp4" | "webm" | "mp3" | "wav" | "avi" | "mov" | "mkv" | "muted";
type Res = "1080p" | "720p" | "480p" | "original";
type Quality = "high" | "medium" | "low";
type Rotate = "none" | "90" | "180" | "270" | "fliph" | "flipv";

const RES: Record<Res, string> = { "1080p": "1920:1080", "720p": "1280:720", "480p": "854:480", original: "" };
const CRF: Record<Quality, string> = { high: "18", medium: "28", low: "38" };

const FORMAT_GROUPS = [
  { group: "Video", opts: [["mp4","MP4"],["webm","WebM"],["avi","AVI"],["mov","MOV"],["mkv","MKV"],["muted","Mute Video"]] },
  { group: "Audio only", opts: [["mp3","MP3"],["wav","WAV"]] },
];

const ROTATE_OPTS: { value: Rotate; label: string }[] = [
  { value: "none",   label: "No rotation" },
  { value: "90",     label: "Rotate 90°" },
  { value: "180",    label: "Rotate 180°" },
  { value: "270",    label: "Rotate 270°" },
  { value: "fliph",  label: "Flip horizontal" },
  { value: "flipv",  label: "Flip vertical" },
];

const getRotateFilter = (r: Rotate): string | null => {
  if (r === "none") return null;
  if (r === "90")    return "transpose=1";
  if (r === "180")   return "transpose=1,transpose=1";
  if (r === "270")   return "transpose=2";
  if (r === "fliph") return "hflip";
  if (r === "flipv") return "vflip";
  return null;
};

const isAudio = (f: Fmt) => f === "mp3" || f === "wav";

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
  const [rotate, setRotate] = useState<Rotate>("none");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string; mime: string } | null>(null);
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
    setFile(null); setPreviewUrl(""); setResult(null); setProgress(0); setRotate("none");
  };

  const handleConvert = async () => {
    if (!file) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…", description: "First run takes ~5s." }); await load(); }
    setProcessing(true); setProgress(0); setResult(null);
    const ff = ffmpeg.current!;

    const extMap: Record<Fmt, string> = { mp4:"mp4", webm:"webm", mp3:"mp3", wav:"wav", avi:"avi", mov:"mov", mkv:"mkv", muted:"mp4" };
    const mimeMap: Record<string, string> = { mp4:"video/mp4", webm:"video/webm", mp3:"audio/mpeg", wav:"audio/wav", avi:"video/x-msvideo", mov:"video/quicktime", mkv:"video/x-matroska" };
    const ext = extMap[fmt];
    const inp = `in.${file.name.split(".").pop()}`;
    const out = `out.${ext}`;

    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      await ff.writeFile(inp, await fetchFile(file));
      const args = ["-i", inp];

      if (trimEnabled) args.push("-ss", trimStart.toFixed(2), "-to", trimEnd.toFixed(2));

      if (isAudio(fmt)) {
        args.push("-vn");
        if (fmt === "mp3") args.push("-acodec", "libmp3lame", "-q:a", "2");
        else args.push("-acodec", "pcm_s16le"); // WAV
      } else {
        if (fmt === "muted") args.push("-an");

        // Build video filters
        const vFilters: string[] = [];
        if (res !== "original") vFilters.push(`scale=${RES[res]}:force_original_aspect_ratio=decrease`);
        const rotFilter = getRotateFilter(rotate);
        if (rotFilter) vFilters.push(rotFilter);
        if (vFilters.length) args.push("-vf", vFilters.join(","));

        args.push("-crf", CRF[quality], "-preset", "fast");

        if (fmt === "webm") args.push("-c:v", "libvpx-vp9", "-c:a", "libopus");
        else if (fmt === "avi") args.push("-c:v", "libxvid", "-c:a", "mp3");
        else args.push("-c:v", "libx264", "-c:a", fmt === "muted" ? "copy" : "aac");
      }

      args.push(out);
      await ff.exec(args);
      await ff.deleteFile(inp);

      const blob = await readOutputBlob(ff, out, mimeMap[ext] || "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      setResult({ url, filename: `${base}-mianconvert.${ext}`, size: formatBytes(blob.size), mime: mimeMap[ext] });
      toast({ title: "✓ Done!", description: "Your file is ready." });
    } catch (e) {
      toast({ variant: "destructive", title: "Conversion failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  const convertAgain = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null); setProgress(0);
  };

  const copyLink = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.url).then(() =>
      toast({ title: "Link copied!", description: "Paste it anywhere to share (same browser session)." })
    );
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <DropZone onFile={handleFile} />
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg group">
            <video ref={videoRef} src={previewUrl} controls className="w-full max-h-60 object-contain"
              onLoadedMetadata={() => { const d = videoRef.current?.duration || 0; setDuration(d); setTrimEnd(d); }} />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <FileVideo className="w-4 h-4 shrink-0 text-violet-500" />
            <span className="truncate font-medium text-gray-700 dark:text-gray-200">{file.name}</span>
            <span className="shrink-0 text-xs">({formatBytes(file.size)})</span>
          </div>
        </div>
      )}

      {file && !result && (
        <>
          {/* Format + Resolution + Quality */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Output Format</Label>
              <Select value={fmt} onValueChange={v => setFmt(v as Fmt)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAT_GROUPS.map(g => (
                    <div key={g.group}>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{g.group}</div>
                      {g.opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isAudio(fmt) && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Resolution</Label>
                <Select value={res} onValueChange={v => setRes(v as Res)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                    <SelectItem value="720p">720p (HD)</SelectItem>
                    <SelectItem value="480p">480p (SD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Quality</Label>
              <Select value={quality} onValueChange={v => setQuality(v as Quality)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High quality</SelectItem>
                  <SelectItem value="medium">Balanced</SelectItem>
                  <SelectItem value="low">Smaller file</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rotate / Flip — video only */}
          {!isAudio(fmt) && fmt !== "muted" && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Rotate / Flip</Label>
              <div className="flex flex-wrap gap-2">
                {ROTATE_OPTS.map(o => (
                  <button key={o.value} onClick={() => setRotate(o.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${rotate === o.value ? "bg-violet-600 text-white border-violet-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400"}`}>
                    {o.value === "fliph" ? <><FlipHorizontal className="w-3 h-3 inline mr-1" />{o.label}</> : o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trim */}
          {duration > 0 && !isAudio(fmt) && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Switch id="trim" checked={trimEnabled} onCheckedChange={setTrimEnabled} />
                <Label htmlFor="trim" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Scissors className="w-3.5 h-3.5" /> Trim video
                </Label>
              </div>
              {trimEnabled && <TrimControl duration={duration} start={trimStart} end={trimEnd} onChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }} />}
            </div>
          )}

          <Button onClick={handleConvert} disabled={processing} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 text-base font-semibold">
            {processing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Converting…</> : "Convert Now"}
          </Button>

          {processing && (
            <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Processing with FFmpeg…</span>
                <span className="font-mono font-semibold text-violet-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>
          )}
        </>
      )}

      {/* Result dashboard */}
      {result && (
        <div className="rounded-2xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">Conversion complete!</p>
              <p className="text-xs text-green-600 dark:text-green-500">{result.size} · {result.filename.split(".").pop()?.toUpperCase()}</p>
            </div>
          </div>

          <DownloadCard url={result.url} filename={result.filename} label={result.filename} size={result.size} />

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={convertAgain} variant="outline" className="w-full gap-2">
              <RefreshCw className="w-4 h-4" /> Convert again
            </Button>
            <Button onClick={copyLink} variant="outline" className="w-full gap-2">
              🔗 Copy link
            </Button>
          </div>
          <Button onClick={reset} variant="ghost" className="w-full text-gray-500 text-sm">
            Upload new file
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConvertTool;
