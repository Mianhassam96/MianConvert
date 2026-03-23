import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { readOutputBlob } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, Download, Camera } from "lucide-react";
import { motion } from "framer-motion";

interface Frame { url: string; name: string; }

const FramesTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [timestamp, setTimestamp] = useState("0");
  const [fps, setFps] = useState("1");
  const [mode, setMode] = useState<"single" | "burst">("single");
  const [frames, setFrames] = useState<Frame[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleVideo = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setFrames([]); setDone(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    frames.forEach(f => URL.revokeObjectURL(f.url));
    setVideo(null); setPreviewUrl(""); setFrames([]); setDone(false);
  };

  const handleExtract = async () => {
    if (!video) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(10); setFrames([]); setDone(false);
    const ff = ffmpeg.current!;
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));
      const extracted: Frame[] = [];
      if (mode === "single") {
        const t = parseFloat(timestamp) || 0;
        await ff.exec(["-i", `input.${vExt}`, "-ss", t.toFixed(2), "-vframes", "1", "-q:v", "2", "frame.jpg"]);
        setProgress(80);
        const blob = await readOutputBlob(ff, "frame.jpg", "image/jpeg");
        extracted.push({ url: URL.createObjectURL(blob), name: `frame-${t.toFixed(2)}s.jpg` });
      } else {
        const rate = parseFloat(fps) || 1;
        await ff.exec(["-i", `input.${vExt}`, "-vf", `fps=1/${rate}`, "-q:v", "2", "frame%03d.jpg"]);
        setProgress(70);
        let i = 1;
        while (true) {
          const name = `frame${String(i).padStart(3, "0")}.jpg`;
          try {
            const blob = await readOutputBlob(ff, name, "image/jpeg");
            extracted.push({ url: URL.createObjectURL(blob), name: `frame-${i}.jpg` });
            i++;
          } catch { break; }
        }
      }
      await ff.deleteFile(`input.${vExt}`);
      setFrames(extracted);
      setProgress(100);
      setDone(true);
      toast({ title: `${extracted.length} frame(s) extracted!` });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = () => frames.forEach(f => {
    const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click();
  });

  return (
    <div className="space-y-5">
      {!video ? <DropZone onFile={handleVideo} /> : (
        <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
          <video ref={videoRef} src={previewUrl} controls className="w-full max-h-52 object-contain"
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} />
          <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {video && (
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <div className="flex gap-2">
              {(["single", "burst"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? "bg-violet-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>
                  {m === "single" ? "📸 Single Frame" : "🎞 Burst Extract"}
                </button>
              ))}
            </div>
            {mode === "single" ? (
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Timestamp (seconds, max {duration.toFixed(0)}s)</Label>
                <Input type="number" min="0" max={duration} step="0.1" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Extract 1 frame every N seconds</Label>
                <Input type="number" min="1" max="60" value={fps} onChange={e => setFps(e.target.value)} />
              </div>
            )}
          </div>

          <AnimatedButton onClick={handleExtract} loading={processing} className="w-full" size="lg">
            <Camera className="w-4 h-4" />
            {processing ? "Extracting…" : "Extract Frames"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Extracting frames…" done={done} />}

          {frames.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-600">✓ {frames.length} frame(s) extracted</p>
                {frames.length > 1 && (
                  <AnimatedButton size="sm" variant="outline" onClick={downloadAll}>
                    <Download className="w-3.5 h-3.5" /> Download All
                  </AnimatedButton>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {frames.map((f, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={f.url} alt={f.name} className="w-full aspect-video object-cover" />
                    <a href={f.url} download={f.name}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Download className="w-5 h-5 text-white" />
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default FramesTool;
