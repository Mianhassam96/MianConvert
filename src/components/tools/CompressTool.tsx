import { useState, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, FileVideo } from "lucide-react";

type Preset = "ultrafast" | "fast" | "medium" | "slow";
type Crf = "18" | "23" | "28" | "33" | "38";
type Res = "original" | "1080p" | "720p" | "480p" | "360p";

const RES_MAP: Record<Res, string> = {
  original: "",
  "1080p": "1920:1080",
  "720p": "1280:720",
  "480p": "854:480",
  "360p": "640:360",
};

const QUALITY_LABELS: Record<Crf, string> = {
  "18": "Visually lossless (~large)",
  "23": "High quality",
  "28": "Balanced (recommended)",
  "33": "Smaller file",
  "38": "Maximum compression",
};

const CompressTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [crf, setCrf] = useState<Crf>("28");
  const [res, setRes] = useState<Res>("original");
  const [preset, setPreset] = useState<Preset>("fast");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleFile = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null); setPreviewUrl(""); setResult(null); setDone(false);
  };

  const handleCompress = async () => {
    if (!file) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…", description: "First run takes ~5s." }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      await ff.writeFile(`input.${ext}`, await fetchFile(file));
      const args = ["-i", `input.${ext}`];
      const vf = res !== "original" ? ["-vf", `scale=${RES_MAP[res]}:force_original_aspect_ratio=decrease`] : [];
      args.push(...vf, "-c:v", "libx264", "-crf", crf, "-preset", preset, "-c:a", "aac", "-b:a", "128k", "output.mp4");
      await ff.exec(args);
      await ff.deleteFile(`input.${ext}`);
      const blob = await readOutputBlob(ff, "output.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      const saved = file.size > blob.size
        ? ` (saved ${formatBytes(file.size - blob.size)})`
        : "";
      setDone(true);
      setResult({ url, filename: `${base}-compressed.mp4`, size: `${formatBytes(blob.size)}${saved}` });
      toast({ title: "✓ Compressed!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Compression failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <DropZone onFile={handleFile} label="Drop video to compress" />
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            <video ref={videoRef} src={previewUrl} controls className="w-full max-h-56 object-contain" />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Quality / CRF</Label>
              <Select value={crf} onValueChange={v => setCrf(v as Crf)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(QUALITY_LABELS) as [Crf, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Resolution</Label>
              <Select value={res} onValueChange={v => setRes(v as Res)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Keep original</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="480p">480p (SD)</SelectItem>
                  <SelectItem value="360p">360p (Mobile)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Speed preset</Label>
              <Select value={preset} onValueChange={v => setPreset(v as Preset)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultrafast">Ultrafast (larger)</SelectItem>
                  <SelectItem value="fast">Fast (recommended)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="slow">Slow (smaller)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info tip */}
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-3 text-xs text-violet-700 dark:text-violet-300">
            💡 CRF 28 + Fast preset is the sweet spot for most videos. Lower CRF = better quality but larger file.
          </div>

          <AnimatedButton onClick={handleCompress} loading={processing} className="w-full" size="lg">
            {processing ? "Compressing…" : "Compress Video"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Compressing with FFmpeg…" done={done} />}
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

export default CompressTool;
