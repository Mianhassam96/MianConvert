import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, FileText } from "lucide-react";

const SubtitleTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [srt, setSrt] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleVideo = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const handleSrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSrt(f);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setSrt(null); setDone(false);
  };

  const handleProcess = async () => {
    if (!video || !srt) { toast({ variant: "destructive", title: "Add both a video and an SRT file" }); return; }
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));
      await ff.writeFile("subs.srt", await fetchFile(srt));
      await ff.exec(["-i", `input.${vExt}`, "-vf", "subtitles=subs.srt", "-c:a", "copy", "-preset", "fast", "subtitled.mp4"]);
      await ff.deleteFile(`input.${vExt}`);
      await ff.deleteFile("subs.srt");
      const blob = await readOutputBlob(ff, "subtitled.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-subtitled.mp4`, size: formatBytes(blob.size) });
      toast({ title: "Done!", description: "Subtitles burned in." });
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
          <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {video && !result && (
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <Label className="text-sm font-medium">SRT Subtitle File</Label>
            <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg px-4 py-2 text-sm w-fit transition-colors">
              <FileText className="w-4 h-4" />
              {srt ? srt.name : "Upload .srt file"}
              <input type="file" accept=".srt" className="hidden" onChange={handleSrt} />
            </label>
            {!srt && (
              <p className="text-xs text-gray-400">
                SRT format: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">1{"\n"}00:00:01,000 --&gt; 00:00:04,000{"\n"}Hello world</code>
              </p>
            )}
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} disabled={!srt} className="w-full" size="lg">
            {processing ? "Burning subtitles…" : "Burn Subtitles"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Burning subtitles…" done={done} />}
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

export default SubtitleTool;
