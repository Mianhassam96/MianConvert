import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { UploadCloud, X, GripVertical, ArrowUp, ArrowDown, AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { startJob, updateJob, finishJob, failJob } from "@/lib/job-tracker";

const getExt = (f: File) => f.name.split(".").pop()?.toLowerCase() || "mp4";

// Check if all files have the same extension (fast path = stream copy)
const allSameFormat = (files: File[]) => {
  const exts = files.map(getExt);
  return exts.every(e => e === exts[0]);
};

const MergeTool = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const dragIdx = useRef<number | null>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []).filter(f => f.type.startsWith("video/"));
    setFiles(prev => [...prev, ...picked]);
    e.target.value = "";
  };

  const remove = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const moveUp = (i: number) => {
    if (i === 0) return;
    setFiles(prev => { const a = [...prev]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; });
  };

  const moveDown = (i: number) => {
    setFiles(prev => {
      if (i >= prev.length - 1) return prev;
      const a = [...prev]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a;
    });
  };

  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    setFiles(prev => {
      const a = [...prev];
      const [moved] = a.splice(dragIdx.current!, 1);
      a.splice(i, 0, moved);
      dragIdx.current = i;
      return a;
    });
  };
  const onDragEnd = () => { dragIdx.current = null; };

  const handleMerge = async () => {
    if (files.length < 2) { toast({ variant: "destructive", title: "Add at least 2 videos" }); return; }
    if (!loaded) { toast({ title: "Loading FFmpeg…" }); await load(); }
    setProcessing(true); setProgress(0); setResult(null); setDone(false); setError(null);
    const ff = ffmpeg.current!;
    const jobId = startJob({ toolId: "merge", toolLabel: "Merge", icon: "🔗", fileName: `${files.length} videos` });
    const handler = ({ progress: p }: { progress: number }) => {
      const pct = Math.round(p * 100); setProgress(pct); updateJob(jobId, pct);
    };
    ff.on("progress", handler);

    try {
      // Write all files
      const names: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const name = `merge_${i}.${getExt(files[i])}`;
        await ff.writeFile(name, await fetchFile(files[i]));
        names.push(name);
      }

      const sameFormat = allSameFormat(files);

      if (sameFormat) {
        // Fast path: stream copy (no re-encode)
        const concatList = names.map(n => `file '${n}'`).join("\n");
        await ff.writeFile("concat.txt", new TextEncoder().encode(concatList));
        try {
          await ff.exec(["-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", "merged.mp4"]);
        } catch {
          // Stream copy failed (codec mismatch despite same ext) — fall through to re-encode
          await ff.deleteFile("concat.txt");
          throw new Error("__reencode__");
        }
        await ff.deleteFile("concat.txt");
      } else {
        throw new Error("__reencode__");
      }

      for (const n of names) { try { await ff.deleteFile(n); } catch {} }
      const blob = await readOutputBlob(ff, "merged.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      setDone(true);
      setResult({ url, filename: "merged-mianconvert.mp4", size: formatBytes(blob.size) });
      finishJob(jobId, { url, name: "merged-mianconvert.mp4", size: formatBytes(blob.size), rawSize: blob.size }, "merge", "Merge");
      toast({ title: "✓ Merged!", description: `${files.length} videos combined (stream copy).` });

    } catch (firstErr) {
      // Re-encode path: normalize all clips to same codec/resolution then concat
      try {
        const normalised: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const src = `merge_${i}.${getExt(files[i])}`;
          const out = `norm_${i}.mp4`;
          await ff.exec([
            "-i", src,
            "-c:v", "libx264", "-crf", "23", "-preset", "fast",
            "-c:a", "aac", "-b:a", "128k",
            "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
            out
          ]);
          normalised.push(out);
        }

        const concatList = normalised.map(n => `file '${n}'`).join("\n");
        await ff.writeFile("concat.txt", new TextEncoder().encode(concatList));
        await ff.exec(["-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", "merged.mp4"]);
        await ff.deleteFile("concat.txt");
        for (const n of normalised) { try { await ff.deleteFile(n); } catch {} }
        for (let i = 0; i < files.length; i++) {
          try { await ff.deleteFile(`merge_${i}.${getExt(files[i])}`); } catch {}
        }

        const blob = await readOutputBlob(ff, "merged.mp4", "video/mp4");
        const url = URL.createObjectURL(blob);
        setDone(true);
        setResult({ url, filename: "merged-mianconvert.mp4", size: formatBytes(blob.size) });
        finishJob(jobId, { url, name: "merged-mianconvert.mp4", size: formatBytes(blob.size), rawSize: blob.size }, "merge", "Merge");
        toast({ title: "✓ Merged!", description: `${files.length} videos combined (re-encoded for compatibility).` });

      } catch (e) {
        const msg = String(e);
        setError(msg);
        failJob(jobId, msg);
        toast({ variant: "destructive", title: "Merge failed", description: msg });
      }
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  const fastPath = files.length >= 2 && allSameFormat(files);

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-violet-400 dark:hover:border-violet-600 transition-colors bg-gray-50/60 dark:bg-gray-900/40">
        <label className="cursor-pointer flex flex-col items-center gap-2">
          <UploadCloud className="w-8 h-8 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Click to add videos</span>
          <span className="text-xs text-gray-400">Add multiple — drag rows to reorder merge sequence</span>
          <input type="file" accept="video/*" multiple className="hidden" onChange={addFiles} />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Merge order ({files.length} files)
            </p>
            {files.length >= 2 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                fastPath
                  ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
              }`}>
                {fastPath ? "⚡ Stream copy (fast)" : "🔄 Will re-encode (different formats)"}
              </span>
            )}
          </div>

          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDragEnd={onDragEnd}
              className="flex items-center gap-3 bg-white dark:bg-gray-800/80 rounded-xl px-3 py-2.5 text-sm cursor-grab active:cursor-grabbing select-none border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors shadow-sm"
            >
              <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 truncate text-gray-700 dark:text-gray-200 text-xs sm:text-sm">{f.name}</span>
              <span className="text-gray-400 text-xs shrink-0 hidden sm:block">{formatBytes(f.size)}</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase shrink-0">{getExt(f)}</span>
              <div className="flex gap-1 sm:hidden">
                <button onClick={() => moveUp(i)} disabled={i === 0}
                  className="p-1 text-gray-400 hover:text-violet-500 disabled:opacity-30">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moveDown(i)} disabled={i === files.length - 1}
                  className="p-1 text-gray-400 hover:text-violet-500 disabled:opacity-30">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info tip */}
      {files.length >= 2 && !fastPath && (
        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Different formats detected — videos will be re-encoded to H.264 MP4 for compatibility. This takes longer.
        </div>
      )}

      {/* Error recovery */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Merge failed</p>
            <p className="text-xs text-red-500 mt-0.5 break-words">{error}</p>
          </div>
          <button onClick={() => setError(null)}
            className="shrink-0 text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {files.length >= 2 && !result && (
        <AnimatedButton onClick={handleMerge} loading={processing} className="w-full" size="lg">
          {processing ? "Merging…" : (
            <span className="flex items-center gap-2">
              {fastPath && <Zap className="w-4 h-4" />}
              {`Merge ${files.length} Videos`}
            </span>
          )}
        </AnimatedButton>
      )}

      {processing && <AnimatedProgress value={progress} label="Merging videos…" done={done} />}

      {result && (
        <ResultCard url={result.url} filename={result.filename} size={result.size}
          onAgain={() => { URL.revokeObjectURL(result.url); setResult(null); setDone(false); }}
          onReset={() => { setFiles([]); setResult(null); setDone(false); setError(null); }} />
      )}
    </div>
  );
};

export default MergeTool;
