import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import VideoPreview from "@/components/VideoPreview";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { FileText, Upload, Info, AlertTriangle, RefreshCw } from "lucide-react";
import { sessionStore } from "@/lib/session-store";

type FontSize = "20" | "28" | "36" | "48";
type SubPosition = "bottom" | "top" | "middle";
type SubColor = "white" | "yellow" | "cyan" | "lime";

const COLOR_HEX: Record<SubColor, string> = {
  white: "ffffff", yellow: "ffff00", cyan: "00ffff", lime: "00ff00",
};

// Parse SRT into drawtext-compatible segments
interface SubEntry { start: number; end: number; text: string; }

const parseSRT = (srt: string): SubEntry[] => {
  const entries: SubEntry[] = [];
  const blocks = srt.trim().split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;
    const timeLine = lines[1];
    const match = timeLine.match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
    if (!match) continue;
    const toSec = (h: string, m: string, s: string, ms: string) =>
      parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
    const start = toSec(match[1], match[2], match[3], match[4]);
    const end = toSec(match[5], match[6], match[7], match[8]);
    const text = lines.slice(2).join(" ").replace(/<[^>]+>/g, "").trim();
    if (text) entries.push({ start, end, text });
  }
  return entries;
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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  useEffect(() => {
    const session = sessionStore.get();
    if (session.file && !video) handleVideo(session.file);
  }, []);

  const handleVideo = (f: File) => {
    const err = validateVideoFile(f);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setVideo(f); setPreviewUrl(URL.createObjectURL(f));
    setResult(null); setDone(false); setError(null);
    sessionStore.set(f);
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
    setVideo(null); setPreviewUrl(""); setResult(null);
    setDone(false); setError(null); setSrtFile(null); setSrtContent("");
  };

  const handleProcess = async () => {
    if (!video || !srtFile) {
      toast({ variant: "destructive", title: "Upload both a video and an SRT file" });
      return;
    }
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false); setError(null);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);

    const vExt = video.name.split(".").pop();
    const base = video.name.replace(/\.[^.]+$/, "");

    try {
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));

      // Strategy 1: try subtitles filter (needs font support in WASM build)
      let success = false;
      try {
        await ff.writeFile("subs.srt", new TextEncoder().encode(srtContent));
        const alignment = position === "bottom" ? 2 : position === "top" ? 8 : 5;
        const vf = `subtitles=subs.srt:force_style='FontSize=${fontSize},PrimaryColour=&H00${COLOR_HEX[color]}&,Alignment=${alignment},MarginV=20,Bold=1'`;
        await ff.exec(["-i", `input.${vExt}`, "-vf", vf, "-c:a", "copy", "-preset", "fast", "subtitled.mp4"]);
        await ff.deleteFile("subs.srt");
        success = true;
      } catch {
        // Strategy 2: fallback to drawtext per subtitle entry
        try { await ff.deleteFile("subs.srt"); } catch {}
        const entries = parseSRT(srtContent);
        if (!entries.length) throw new Error("Could not parse SRT file — check the format.");

        const hex = COLOR_HEX[color];
        const y = position === "bottom" ? "h-th-30" : position === "top" ? "30" : "(h-th)/2";

        const drawtextFilters = entries.map(e => {
          const escaped = e.text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
          return `drawtext=text='${escaped}':fontsize=${fontSize}:fontcolor=0x${hex}:x=(w-tw)/2:y=${y}:enable='between(t,${e.start.toFixed(3)},${e.end.toFixed(3)})':box=1:boxcolor=black@0.45:boxborderw=6`;
        });

        // FFmpeg has a limit on filter chain length — batch if needed
        const BATCH = 50;
        let currentInput = `input.${vExt}`;
        for (let i = 0; i < drawtextFilters.length; i += BATCH) {
          const batch = drawtextFilters.slice(i, i + BATCH);
          const outFile = i + BATCH >= drawtextFilters.length ? "subtitled.mp4" : `sub_batch_${i}.mp4`;
          await ff.exec(["-i", currentInput, "-vf", batch.join(","), "-c:a", "copy", "-preset", "fast", outFile]);
          if (currentInput !== `input.${vExt}`) await ff.deleteFile(currentInput);
          currentInput = outFile;
        }
        success = true;
      }

      if (!success) throw new Error("Both subtitle methods failed.");

      await ff.deleteFile(`input.${vExt}`);
      const blob = await readOutputBlob(ff, "subtitled.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      setDone(true);
      setResult({ url, filename: `${base}-subtitled.mp4`, size: formatBytes(blob.size) });
      toast({ title: "✓ Subtitles burned in!" });
    } catch (e) {
      const msg = String(e);
      setError(msg);
      toast({ variant: "destructive", title: "Failed", description: msg });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!video ? (
        <DropZone onFile={handleVideo} label="Drop video to add subtitles" />
      ) : (
        <VideoPreview ref={videoRef} file={video} previewUrl={previewUrl} onReset={reset} />
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
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3 max-h-24 overflow-y-auto">
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {srtContent.slice(0, 300)}{srtContent.length > 300 ? "…" : ""}
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
                  <SelectItem value="white">⬜ White</SelectItem>
                  <SelectItem value="yellow">🟡 Yellow</SelectItem>
                  <SelectItem value="cyan">🔵 Cyan</SelectItem>
                  <SelectItem value="lime">🟢 Lime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Position</Label>
              <Select value={position} onValueChange={v => setPosition(v as SubPosition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom">⬇ Bottom</SelectItem>
                  <SelectItem value="top">⬆ Top</SelectItem>
                  <SelectItem value="middle">⬛ Middle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Subtitles are burned into the video. Uses subtitles filter with drawtext fallback for maximum compatibility.
          </div>

          {/* Error recovery */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Processing failed</p>
                <p className="text-xs text-red-500 mt-0.5 break-words">{error}</p>
              </div>
              <button onClick={() => setError(null)}
                className="shrink-0 text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

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
