import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob, validateVideoFile, getFileSizeWarning } from "@/lib/ffmpeg-run";
import DropZone from "@/components/DropZone";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { Scissors, Plus, Trash2 } from "lucide-react";
import VideoPreview from "@/components/VideoPreview";
import ErrorRecovery from "@/components/ErrorRecovery";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { sessionStore } from "@/lib/session-store";
import { cleanupFiles, safeDelete } from "@/lib/ffmpeg-pipeline";
import { startJob, updateJob, finishJob, failJob } from "@/lib/job-tracker";

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

const fmt = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toFixed(1).padStart(4, "0");
  return `${m}:${sec}`;
};

interface Segment { id: string; start: number; end: number; }

const TimelineTool = () => {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [loopCount, setLoopCount] = useState(2);
  const [muteAudio, setMuteAudio] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
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
    setWarning(getFileSizeWarning(f));
    setVideo(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setDone(false);
    sessionStore.set(f);
  };

  const onMetadata = () => {
    const d = videoRef.current?.duration || 0;
    setDuration(d);
    setSegments([{ id: crypto.randomUUID(), start: 0, end: Math.min(d, 30) }]);
  };

  const addSegment = () => {
    const last = segments[segments.length - 1];
    const newStart = last ? Math.min(last.end, duration - 1) : 0;
    setSegments(prev => [...prev, { id: crypto.randomUUID(), start: newStart, end: Math.min(newStart + 10, duration) }]);
  };

  const updateSegment = (id: string, patch: Partial<Segment>) =>
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const removeSegment = (id: string) =>
    setSegments(prev => prev.filter(s => s.id !== id));

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result) URL.revokeObjectURL(result.url);
    setVideo(null); setPreviewUrl(""); setResult(null); setDone(false); setWarning(null); setError(null);
    setSegments([]); setSpeed(1); setLoop(false);
  };

  const handleProcess = async () => {
    if (!video || !segments.length) return;
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const jobId = startJob({ toolId: "timeline", toolLabel: "Timeline", icon: "✂️", fileName: video.name });
    const handler = ({ progress: p }: { progress: number }) => {
      const pct = Math.round(p * 100); setProgress(pct); updateJob(jobId, pct);
    };
    ff.on("progress", handler);
    try {
      const vExt = video.name.split(".").pop();
      await ff.writeFile(`input.${vExt}`, await fetchFile(video));
      const base = video.name.replace(/\.[^.]+$/, "");

      // Extract each segment
      const segFiles: string[] = [];
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const segName = `seg_${i}.mp4`;
        // Stream copy for speed=1, re-encode otherwise
        if (speed === 1 && !muteAudio) {
          await ff.exec(["-i", `input.${vExt}`, "-ss", seg.start.toFixed(2), "-to", seg.end.toFixed(2), "-c", "copy", segName]);
        } else {
          const vf = `setpts=${(1 / speed).toFixed(4)}*PTS`;
          let af = "";
          if (!muteAudio) {
            if (speed <= 0.5) af = `atempo=0.5,atempo=${(speed / 0.5).toFixed(4)}`;
            else if (speed >= 2) af = `atempo=2.0,atempo=${(speed / 2).toFixed(4)}`;
            else af = `atempo=${speed.toFixed(4)}`;
          }
          const args = ["-i", `input.${vExt}`, "-ss", seg.start.toFixed(2), "-to", seg.end.toFixed(2)];
          if (!muteAudio && af) {
            args.push("-filter_complex", `[0:v]${vf}[v];[0:a]${af}[a]`, "-map", "[v]", "-map", "[a]");
          } else {
            args.push("-vf", vf, "-an");
          }
          args.push("-preset", "fast", segName);
          await ff.exec(args);
        }
        segFiles.push(segName);
      }

      let finalFile = "output.mp4";

      if (segFiles.length === 1 && !loop) {
        // Single segment — just rename
        finalFile = segFiles[0];
      } else {
        // Concat segments
        let concatFiles = [...segFiles];
        if (loop) {
          const repeated = Array(loopCount).fill(segFiles).flat();
          concatFiles = repeated;
        }
        const concatList = concatFiles.map(n => `file '${n}'`).join("\n");
        await ff.writeFile("concat.txt", new TextEncoder().encode(concatList));
        await ff.exec(["-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", finalFile]);
        await safeDelete(ff, "concat.txt");
        await cleanupFiles(ff, segFiles);
      }

      await safeDelete(ff, `input.${vExt}`);
      const blob = await readOutputBlob(ff, finalFile, "video/mp4");
      const url = URL.createObjectURL(blob);
      const filename = `${base}-timeline.mp4`;
      const sizeStr = formatBytes(blob.size);
      setDone(true);
      setResult({ url, filename, size: sizeStr });
      finishJob(jobId, { url, name: filename, size: sizeStr, rawSize: blob.size }, "timeline", "Timeline");
      toast({ title: "✓ Done!" });
    } catch (e) {
      const msg = String(e); setError(msg);
      failJob(jobId, msg);
      toast({ variant: "destructive", title: "Failed", description: msg });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!video ? (
        <DropZone onFile={handleVideo} label="Drop video to edit timeline" />
      ) : (
        <VideoPreview
          ref={videoRef}
          file={video}
          previewUrl={previewUrl}
          onReset={reset}
          warning={warning}
          badge={duration > 0 ? `${fmt(duration)} total` : undefined}
          onLoadedMetadata={onMetadata}
        />
      )}

      {video && duration > 0 && !result && (
        <>
          {/* Timeline segments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" /> Segments ({segments.length})
              </Label>
              <AnimatedButton size="xs" variant="outline" onClick={addSegment}>
                <Plus className="w-3 h-3" /> Add
              </AnimatedButton>
            </div>

            {/* Visual timeline bar */}
            <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {segments.map((seg, i) => {
                const colors = ["bg-violet-500", "bg-fuchsia-500", "bg-purple-500", "bg-indigo-500"];
                return (
                  <div key={seg.id}
                    className={cn("absolute top-0 h-full opacity-70 rounded", colors[i % colors.length])}
                    style={{ left: `${(seg.start / duration) * 100}%`, width: `${((seg.end - seg.start) / duration) * 100}%` }}
                  />
                );
              })}
            </div>

            {segments.map((seg, i) => (
              <div key={seg.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Segment {i + 1} — {fmt(seg.end - seg.start)}
                  </span>
                  {segments.length > 1 && (
                    <button onClick={() => removeSegment(seg.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 font-mono">
                  <span>Start: {fmt(seg.start)}</span>
                  <span>End: {fmt(seg.end)}</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-400">Start</Label>
                  <Slider min={0} max={duration} step={0.1} value={[seg.start]}
                    onValueChange={([v]) => updateSegment(seg.id, { start: Math.min(v, seg.end - 0.5) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-400">End</Label>
                  <Slider min={0} max={duration} step={0.1} value={[seg.end]}
                    onValueChange={([v]) => updateSegment(seg.id, { end: Math.max(v, seg.start + 0.5) })} />
                </div>
              </div>
            ))}
          </div>

          {/* Speed */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Speed</Label>
              <span className="text-lg font-bold text-violet-600">{speed}x</span>
            </div>
            <Slider min={0.25} max={4} step={0.25} value={[speed]} onValueChange={([v]) => setSpeed(v)} />
            <div className="flex flex-wrap gap-1.5">
              {SPEED_PRESETS.map(p => (
                <button key={p} onClick={() => setSpeed(p)}
                  className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    speed === p ? "bg-violet-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-100")}>
                  {p}x
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Switch id="loop-t" checked={loop} onCheckedChange={setLoop} />
                <Label htmlFor="loop-t" className="text-sm cursor-pointer">🔁 Loop</Label>
              </div>
              {loop && (
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setLoopCount(n)}
                      className={cn("w-8 h-8 rounded-lg text-xs font-bold border transition-all",
                        loopCount === n ? "bg-violet-600 text-white border-violet-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300")}>
                      {n}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Switch id="mute-t" checked={muteAudio} onCheckedChange={setMuteAudio} />
                <Label htmlFor="mute-t" className="text-sm cursor-pointer">🔇 Remove audio</Label>
              </div>
            </div>
          </div>

          <AnimatedButton onClick={handleProcess} loading={processing} className="w-full" size="lg">
            {processing ? "Processing…" : `Export ${segments.length} segment${segments.length > 1 ? "s" : ""}${loop ? ` × ${loopCount}` : ""}`}
          </AnimatedButton>

          {processing && <AnimatedProgress value={progress} label="Processing timeline…" done={done} />}
          {error && <ErrorRecovery error={error} onRetry={() => setError(null)} />}
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

export default TimelineTool;
