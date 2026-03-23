import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DropZone from "./DropZone";
import DownloadCard from "./DownloadCard";
import BatchQueue, { BatchFile } from "./BatchQueue";
import TrimControl from "./TrimControl";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { detectDevice, recommendedFormat, recommendedResolution } from "@/lib/device";
import { FileVideo, RefreshCw, X, Plus, Scissors, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

type OutputFormat = "mp4" | "webm" | "mp3" | "muted";
type Resolution = "4k" | "1080p" | "720p" | "480p" | "original";
type Quality = "high" | "medium" | "low";

const RESOLUTIONS: Record<Resolution, string> = {
  "4k": "3840:2160",
  "1080p": "1920:1080",
  "720p": "1280:720",
  "480p": "854:480",
  "original": "",
};

const QUALITY_CRF: Record<Quality, string> = {
  high: "18",
  medium: "28",
  low: "38",
};

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "mp4", label: "MP4" },
  { value: "webm", label: "WebM" },
  { value: "mp3", label: "MP3 (audio only)" },
  { value: "muted", label: "Mute video" },
];

const VideoConverter = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [resolution, setResolution] = useState<Resolution>("original");
  const [quality, setQuality] = useState<Quality>("medium");
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, loading, load } = useFFmpeg();

  // Auto-detect device and set defaults
  useEffect(() => {
    const device = detectDevice();
    setFormat(recommendedFormat(device) as OutputFormat);
    setResolution(recommendedResolution(device) as Resolution);
  }, []);

  const handleFile = (f: File) => {
    if (batchMode) {
      const id = crypto.randomUUID();
      setBatchFiles((prev) => [...prev, { id, file: f, status: "pending", progress: 0 }]);
      setFiles((prev) => [...prev, f]);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setActiveFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setProgress(0);
    setTrimEnabled(false);
  };

  const handleMultiFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []).filter((f) => f.type.startsWith("video/"));
    picked.forEach(handleFile);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setActiveFile(null);
    setPreviewUrl("");
    setResult(null);
    setProgress(0);
    setTrimEnabled(false);
  };

  const buildFFmpegArgs = (inputName: string, outputName: string, fmt: OutputFormat, res: Resolution, q: Quality, trim: boolean, ts: number, te: number) => {
    const args: string[] = ["-i", inputName];
    if (trim) {
      args.push("-ss", ts.toFixed(2), "-to", te.toFixed(2));
    }
    if (fmt === "mp3") {
      args.push("-vn", "-acodec", "libmp3lame", "-q:a", "2");
    } else if (fmt === "muted") {
      args.push("-an");
      if (res !== "original") args.push("-vf", `scale=${RESOLUTIONS[res]}:force_original_aspect_ratio=decrease`);
      args.push("-crf", QUALITY_CRF[q], "-preset", "fast");
    } else {
      if (res !== "original") args.push("-vf", `scale=${RESOLUTIONS[res]}:force_original_aspect_ratio=decrease`);
      args.push("-crf", QUALITY_CRF[q], "-preset", "fast");
      if (fmt === "webm") args.push("-c:v", "libvpx-vp9", "-c:a", "libopus");
      else args.push("-c:v", "libx264", "-c:a", "aac");
    }
    args.push(outputName);
    return args;
  };

  const runConversion = async (file: File, fmt: OutputFormat, res: Resolution, q: Quality, trim: boolean, ts: number, te: number, onProgress: (p: number) => void) => {
    if (!ffmpeg.current) throw new Error("FFmpeg not loaded");
    const ff = ffmpeg.current;

    const ext = fmt === "mp3" ? "mp3" : fmt === "webm" ? "webm" : "mp4";
    const inputName = `input_${Date.now()}.${file.name.split(".").pop()}`;
    const outputName = `output_${Date.now()}.${ext}`;

    ff.on("progress", ({ progress: p }) => onProgress(Math.round(p * 100)));

    await ff.writeFile(inputName, await fetchFile(file));
    const args = buildFFmpegArgs(inputName, outputName, fmt, res, q, trim, ts, te);
    await ff.exec(args);

    const data = await ff.readFile(outputName);
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
    ff.off("progress", () => {});

    const mimeMap: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg" };
    const buffer = data instanceof Uint8Array ? data.buffer.slice(0) as ArrayBuffer : (data as unknown as ArrayBuffer);
    return new Blob([buffer], { type: mimeMap[ext] || "video/mp4" });
  };

  const handleConvert = async () => {
    if (!activeFile) return;
    if (!loaded) {
      toast({ title: "Loading FFmpeg...", description: "Please wait while the engine loads." });
      await load();
    }
    setProcessing(true);
    setProgress(0);
    setResult(null);
    try {
      const blob = await runConversion(activeFile, format, resolution, quality, trimEnabled, trimStart, trimEnd, setProgress);
      const url = URL.createObjectURL(blob);
      const base = activeFile.name.replace(/\.[^.]+$/, "");
      const ext = format === "mp3" ? "mp3" : format === "webm" ? "webm" : "mp4";
      setResult({ url, filename: `${base}-mianconvert.${ext}`, size: formatBytes(blob.size) });
      toast({ title: "Done!", description: "Your file is ready to download." });
    } catch (err) {
      toast({ variant: "destructive", title: "Conversion failed", description: String(err) });
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchConvert = async () => {
    const pending = batchFiles.filter((f) => f.status === "pending");
    if (!pending.length) return;
    if (!loaded) {
      toast({ title: "Loading FFmpeg..." });
      await load();
    }
    for (const bf of pending) {
      setBatchFiles((prev) => prev.map((f) => f.id === bf.id ? { ...f, status: "processing", progress: 0 } : f));
      try {
        const blob = await runConversion(bf.file, format, resolution, quality, false, 0, 0, (p) => {
          setBatchFiles((prev) => prev.map((f) => f.id === bf.id ? { ...f, progress: p } : f));
        });
        const url = URL.createObjectURL(blob);
        const base = bf.file.name.replace(/\.[^.]+$/, "");
        const ext = format === "mp3" ? "mp3" : format === "webm" ? "webm" : "mp4";
        setBatchFiles((prev) => prev.map((f) => f.id === bf.id ? { ...f, status: "done", resultUrl: url, resultName: `${base}-mianconvert.${ext}` } : f));
      } catch (err) {
        setBatchFiles((prev) => prev.map((f) => f.id === bf.id ? { ...f, status: "error", error: String(err) } : f));
      }
    }
    toast({ title: "Batch complete!", description: `${pending.length} file(s) processed.` });
  };

  return (
    <div className="space-y-6">
      {/* Batch mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch id="batch" checked={batchMode} onCheckedChange={(v) => { setBatchMode(v); reset(); setBatchFiles([]); }} />
          <Label htmlFor="batch" className="text-sm cursor-pointer">Batch mode (multiple files)</Label>
        </div>
        {loading && (
          <span className="flex items-center gap-1 text-xs text-violet-500">
            <Cpu className="w-3 h-3 animate-pulse" /> Loading FFmpeg...
          </span>
        )}
      </div>

      {/* Drop zone */}
      {(!activeFile || batchMode) && (
        <div className="relative">
          <DropZone onFile={handleFile} />
          {batchMode && (
            <label className="absolute bottom-3 right-3 cursor-pointer">
              <input type="file" accept="video/*" multiple className="hidden" onChange={handleMultiFile} />
              <span className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
                <Plus className="w-3 h-3" /> Add more
              </span>
            </label>
          )}
        </div>
      )}

      {/* Single file preview */}
      {activeFile && !batchMode && (
        <div className="space-y-5">
          <div className="relative rounded-2xl overflow-hidden bg-black shadow-xl">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="w-full max-h-64 object-contain"
              onLoadedMetadata={() => {
                const d = videoRef.current?.duration || 0;
                setDuration(d);
                setTrimEnd(d);
              }}
            />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileVideo className="w-4 h-4 shrink-0" />
            <span className="truncate font-medium text-gray-700 dark:text-gray-200">{activeFile.name}</span>
            <span className="shrink-0">({formatBytes(activeFile.size)})</span>
          </div>
        </div>
      )}

      {/* Conversion settings */}
      {(activeFile || batchMode) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Resolution</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original</SelectItem>
                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                <SelectItem value="720p">720p (HD)</SelectItem>
                <SelectItem value="480p">480p (SD)</SelectItem>
                <SelectItem value="4k">4K (2160p)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Quality / Compression</Label>
            <Select value={quality} onValueChange={(v) => setQuality(v as Quality)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High (larger file)</SelectItem>
                <SelectItem value="medium">Medium (balanced)</SelectItem>
                <SelectItem value="low">Low (smaller file)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Trim control — single file only */}
      {activeFile && !batchMode && duration > 0 && (
        <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Switch id="trim" checked={trimEnabled} onCheckedChange={setTrimEnabled} />
            <Label htmlFor="trim" className="flex items-center gap-1 text-sm cursor-pointer">
              <Scissors className="w-3.5 h-3.5" /> Trim video
            </Label>
          </div>
          {trimEnabled && (
            <TrimControl duration={duration} start={trimStart} end={trimEnd} onChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }} />
          )}
        </div>
      )}

      {/* Batch queue */}
      {batchMode && batchFiles.length > 0 && (
        <BatchQueue files={batchFiles} onRemove={(id) => setBatchFiles((prev) => prev.filter((f) => f.id !== id))} />
      )}

      {/* Action buttons */}
      {!batchMode && activeFile && !result && (
        <Button onClick={handleConvert} disabled={processing} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 text-base">
          {processing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Convert Now"}
        </Button>
      )}
      {batchMode && batchFiles.some((f) => f.status === "pending") && (
        <Button onClick={handleBatchConvert} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 text-base">
          Convert All ({batchFiles.filter((f) => f.status === "pending").length} files)
        </Button>
      )}

      {/* Progress */}
      {processing && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 text-right">{progress}%</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">Done! Your file is ready.</p>
          <DownloadCard url={result.url} filename={result.filename} label={result.filename} size={result.size} />
          <Button variant="outline" onClick={reset} className="w-full">Convert another file</Button>
        </div>
      )}
    </div>
  );
};

export default VideoConverter;
