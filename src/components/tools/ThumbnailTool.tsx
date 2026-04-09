import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { readOutputBlob, validateVideoFile } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { X, Download, Camera, Type } from "lucide-react";
import { motion } from "framer-motion";

type ExportSize = "1280x720" | "1920x1080" | "800x450" | "original";

const ThumbnailTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [timestamp, setTimestamp] = useState(0);
  const [exportSize, setExportSize] = useState<ExportSize>("1280x720");
  const [addText, setAddText] = useState(false);
  const [text, setText] = useState("My Video Title");
  const [textSize, setTextSize] = useState(48);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textPos, setTextPos] = useState<"top" | "bottom" | "center">("bottom");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [thumbnail, setThumbnail] = useState<{ url: string; name: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const handleVideo = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setThumbnail(null); setDone(false);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (thumbnail) URL.revokeObjectURL(thumbnail.url);
    setVideo(null); setPreviewUrl(""); setThumbnail(null); setDone(false);
  };

  const handleExtract = async () => {
    if (!video) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(10); setThumbnail(null); setDone(false);
    const ff = ffmpeg.current!;
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));

      const args = ["-ss", timestamp.toFixed(2), "-i", `input.${vExt}`, "-vframes", "1"];

      // Scale
      if (exportSize !== "original") {
        const [w, h] = exportSize.split("x");
        args.push("-vf", `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`);
      }

      // Text overlay
      if (addText && text.trim()) {
        const hex = textColor.replace("#", "");
        const y = textPos === "top" ? "30" : textPos === "bottom" ? "h-th-30" : "(h-th)/2";
        const escaped = text.replace(/'/g, "\\'").replace(/:/g, "\\:");
        const drawtextFilter = `drawtext=text='${escaped}':fontsize=${textSize}:fontcolor=0x${hex}:x=(w-tw)/2:y=${y}:box=1:boxcolor=black@0.5:boxborderw=8`;
        // Combine with scale if needed
        const existingVf = args.indexOf("-vf");
        if (existingVf !== -1) {
          args[existingVf + 1] = args[existingVf + 1] + "," + drawtextFilter;
        } else {
          args.push("-vf", drawtextFilter);
        }
      }

      args.push("-q:v", "2", "thumb.jpg");
      await ff.exec(args);
      await ff.deleteFile(`input.${vExt}`);
      setProgress(90);
      const blob = await readOutputBlob(ff, "thumb.jpg", "image/jpeg");
      const url = URL.createObjectURL(blob);
      const base = video.name.replace(/\.[^.]+$/, "");
      setProgress(100); setDone(true);
      setThumbnail({ url, name: `${base}-thumbnail.jpg` });
      toast({ title: "✓ Thumbnail extracted!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: String(e) });
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!thumbnail) return;
    const a = document.createElement("a");
    a.href = thumbnail.url; a.download = thumbnail.name; a.click();
  };

  return (
    <div className="space-y-4">
      {!video ? (
        <DropZone onFile={handleVideo} label="Drop video to generate thumbnail" />
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
            <video ref={videoRef} src={previewUrl} controls className="w-full max-h-52 object-contain"
              onLoadedMetadata={() => {
                const d = videoRef.current?.duration || 0;
                setDuration(d);
                setTimestamp(Math.min(1, d));
              }}
              onTimeUpdate={() => {
                if (videoRef.current) setTimestamp(videoRef.current.currentTime);
              }} />
            <button onClick={reset} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              Scrub to select frame
            </div>
          </div>
        </div>
      )}

      {video && (
        <>
          {/* Timestamp scrubber */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-violet-500" /> Frame at
              </Label>
              <span className="text-sm font-mono text-violet-600 dark:text-violet-400">
                {timestamp.toFixed(1)}s
              </span>
            </div>
            <Slider min={0} max={duration || 100} step={0.1} value={[timestamp]}
              onValueChange={([v]) => {
                setTimestamp(v);
                if (videoRef.current) videoRef.current.currentTime = v;
              }} />
            <p className="text-xs text-gray-400">Scrub the video above or use the slider to pick your frame.</p>
          </div>

          {/* Export size */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Export Size</Label>
            <Select value={exportSize} onValueChange={v => setExportSize(v as ExportSize)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1920x1080">1920×1080 (Full HD)</SelectItem>
                <SelectItem value="1280x720">1280×720 (HD — YouTube)</SelectItem>
                <SelectItem value="800x450">800×450 (Web)</SelectItem>
                <SelectItem value="original">Original size</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text overlay toggle */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setAddText(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${addText ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
                <Type className="w-3.5 h-3.5" /> Add title text
              </button>
            </div>
            {addText && (
              <div className="space-y-3">
                <Input value={text} onChange={e => setText(e.target.value)} placeholder="Enter title…" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Size: {textSize}px</Label>
                    <Slider min={20} max={80} step={2} value={[textSize]} onValueChange={([v]) => setTextSize(v)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Color</Label>
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Position</Label>
                    <Select value={textPos} onValueChange={v => setTextPos(v as "top" | "bottom" | "center")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <AnimatedButton onClick={handleExtract} loading={processing} className="w-full" size="lg">
            <Camera className="w-4 h-4" />
            {processing ? "Extracting…" : "Generate Thumbnail"}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Extracting frame…" done={done} />}

          {/* Thumbnail preview */}
          {thumbnail && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-green-200 dark:border-green-800 shadow-lg">
                <img src={thumbnail.url} alt="thumbnail" className="w-full object-cover" />
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  ✓ Ready
                </div>
              </div>
              <AnimatedButton onClick={download} className="w-full" size="lg">
                <Download className="w-4 h-4" /> Download Thumbnail (JPG)
              </AnimatedButton>
              <AnimatedButton variant="outline" onClick={() => { URL.revokeObjectURL(thumbnail.url); setThumbnail(null); setDone(false); }} className="w-full">
                Try another frame
              </AnimatedButton>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default ThumbnailTool;
