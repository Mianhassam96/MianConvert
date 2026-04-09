import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, FileText, Upload, Info } from "lucide-react";
import { motion } from "framer-motion";

type FontSize = "20" | "28" | "36" | "48";
type SubPosition = "bottom" | "top" | "middle";
type SubColor = "white" | "yellow" | "cyan" | "lime";

const COLOR_MAP: Record<SubColor, string> = {
  white:  "ffffff",
  yellow: "ffff00",
  cyan:   "00ffff",
  lime:   "00ff00",
};

const SubtitleTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [srtContent, setSrtContent] = useState("");
  const [fontSize, setFontSize] = useState<FontSize>("28");
  const [color, setColor] = useState<SubColor>("white");
  const [position, setPosition] = useState<SubPosition>("bottom");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleVideo = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
  };

  const handleSrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSrtFile(f);
    const reader = new FileReader();
    reader.onload = ev => setSrtContent(ev.target?.result as string || "");
    reader.readAsText(f);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setDone(false);
    setSrtFile(null); setSrtContent("");
  };

  const handleProcess = async () => {
    if (!video || !srtFile) {
      toast({ variant: "destructive", title: "Upload both a video and an SRT file" });
      return;
    }
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));
      await ff.writeFile("subs.srt", new TextEncoder().encode(srtContent));

      const yPos = position === "bottom" ? "h-th-20" : position === "top" ? "20" : "(h-th)/2";
      const hex = COLOR_MAP[color];

      // Use drawtext with SRT-like approach via subtitles filter
      // FFmpeg subtitles filter burns in SRT
      const vf = `subtitles=subs.srt:force_style='FontSize=${fontSize},PrimaryColour=&H${hex}&,Alignment=${position === "bottom" ? 2 : position === "top" ? 8 : 5},MarginV=20'`;

      await ff.exec(["-i", `input.${vExt}`, "-vf", vf, "-c:a", "copy", "-preset", "fast", "subtitled.mp4"]);
      await ff.deleteFile(`input.${vExt}`);
      await ff.deleteFile("subs.srt");
      const blob = await readOutputBlob(ff, "subtitled.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setDone(true);
      setResult({ url, filename: `${base}-subtitled.mp4`, size: formatBytes(blob.size) });
      toast({ title: "✓ Subtitles burned in!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!video ? (
        <DropZone onFile={handleVideo} label="Drop video to add subtitles" />
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            <video ref={videoRef} src={previewUrl} controls className="w-full max-h-52 object-contain" />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {video && !result && (
        <>
          {/* SRT upload */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" /> SRT Subtitle File
            </Label>
            <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg px-4 py-2.5 text-sm transition-colors w-fit">
              <Upload className="w-4 h-4" />
              {srtFile ? srtFile.name : "Upload .srt file"}
              <input type="file" accept=".srt,.vtt" className="hidden" onChange={handleSrt} />
            </label>
            {srtContent && (
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3 max-h-28 overflow-y-auto">
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                  {srtContent.slice(0, 400)}{srtContent.length > 400 ? "…" : ""}
                </pre>
              </div>
            )}
          </div>

          {/* Style controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Font size</Label>
              <Select value={fontSize} onValueChange={v => setFontSize(v as FontSize)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">Small (20px)</SelectItem>
                  <SelectItem value="28">Medium (28px)</SelectItem>
                  <SelectItem value="36">Large (36px)</SelectItem>
                  <SelectItem value="48">Extra large (48px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Color</Label>
              <Select value={color} onValueChange={v => setColor(v as SubColor)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="cyan">Cyan</SelectItem>
                  <SelectItem value="lime">Lime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Position</Label>
              <Select value={position} onValueChange={v => setPosition(v as SubPosition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Subtitles are burned into the video (hardcoded). Upload a standard .srt file with timestamps.
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} disabled={!srtFile} className="w-full" size="lg">
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
