import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import DownloadCard from "@/components/DownloadCard";
import { X, RefreshCw } from "lucide-react";

const OPTIONS = [
  { value: "transpose=1",                   label: "↻ 90° Clockwise",        icon: "↻" },
  { value: "transpose=2",                   label: "↺ 90° Counter-clockwise", icon: "↺" },
  { value: "transpose=1,transpose=1",       label: "↕ 180°",                  icon: "↕" },
  { value: "hflip",                         label: "⇔ Flip Horizontal",       icon: "⇔" },
  { value: "vflip",                         label: "⇕ Flip Vertical",         icon: "⇕" },
  { value: "hflip,vflip",                   label: "⊕ Flip Both",             icon: "⊕" },
];

const RotateTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selected, setSelected] = useState(OPTIONS[0].value);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
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
      await ff.exec(["-i", `input.${vExt}`, "-vf", selected, "-c:a", "copy", "-preset", "fast", "rotated.mp4"]);
      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "rotated.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setResult({ url, filename: `${base}-rotated.mp4`, size: formatBytes(blob.size) });
      toast({ title: "Done!" });
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

      {video && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OPTIONS.map(o => (
              <button key={o.value} onClick={() => setSelected(o.value)}
                className={`rounded-xl border-2 p-3 text-sm font-medium transition-all text-center ${selected === o.value ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"}`}>
                <div className="text-xl mb-1">{o.icon}</div>
                <div className="text-xs">{o.label.replace(/^. /, "")}</div>
              </button>
            ))}
          </div>

          {!result && (
            <Button onClick={handleProcess} disabled={processing} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11">
              {processing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing…</> : "Apply Transform"}
            </Button>
          )}
          {processing && <div className="space-y-1"><Progress value={progress} className="h-2" /><p className="text-xs text-right text-gray-500">{progress}%</p></div>}
          {result && (
            <div className="rounded-2xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">✓ Done!</p>
              <DownloadCard url={result.url} filename={result.filename} label={result.filename} size={result.size} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { if(result) URL.revokeObjectURL(result.url); setResult(null); }} className="w-full gap-1"><RefreshCw className="w-3.5 h-3.5" />Again</Button>
                <Button variant="ghost" onClick={reset} className="w-full text-sm">New file</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RotateTool;
