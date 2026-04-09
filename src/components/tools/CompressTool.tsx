import { useState, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import { COMPRESS_PRESETS } from "@/lib/presets";
import DropZone from "@/components/DropZone";
import VideoPreview from "@/components/VideoPreview";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, FileVideo, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

type Preset = "ultrafast" | "fast" | "medium" | "slow";
type Crf = "18" | "23" | "28" | "33" | "38";
type Res = "original" | "1080p" | "720p" | "480p" | "360p";

const RES_MAP: Record<Res, string> = {
  original: "", "1080p": "1920:1080", "720p": "1280:720", "480p": "854:480", "360p": "640:360",
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
  const [warning, setWarning] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>("balanced");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleFile = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setWarning(getFileSizeWarning(f));
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const applyPreset = (id: string) => {
    const p = COMPRESS_PRESETS.find(x => x.id === id);
    if (!p) return;
    setActivePreset(id);
    setCrf(p.crf as Crf);
    setRes(p.res as Res);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null); setPreviewUrl(""); setResult(null); setDone(false); setWarning(null);
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
      if (res !== "original") args.push("-vf", `scale=${RES_MAP[res]}:force_original_aspect_ratio=decrease`);
      args.push("-c:v", "libx264", "-crf", crf, "-preset", preset, "-c:a", "aac", "-b:a", "128k", "output.mp4");
      await ff.exec(args);
      await ff.deleteFile(`input.${ext}`);
      const blob = await readOutputBlob(ff, "output.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      const saved = file.size > blob.size ? ` (saved ${formatBytes(file.size - blob.size)})` : "";
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
        <VideoPreview ref={videoRef} file={file} previewUrl={previewUrl} onReset={reset} warning={warning} />
      )}

      {file && !result && (
        <>
          {/* Quick presets */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500 uppercase tracking-wide">Quick Presets</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COMPRESS_PRESETS.map(p => (
                <motion.button key={p.id} onClick={() => applyPreset(p.id)}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  title={p.description}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                    activePreset === p.id
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"
                  }`}>
                  <span className="text-lg">{p.icon}</span>
                  <span>{p.label}</span>
                  <span className="text-[10px] text-gray-400 font-normal text-center leading-tight">{p.description}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Quality / CRF</Label>
              <Select value={crf} onValueChange={v => { setCrf(v as Crf); setActivePreset(""); }}>
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
              <Select value={res} onValueChange={v => { setRes(v as Res); setActivePreset(""); }}>
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
