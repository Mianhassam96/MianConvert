import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { UploadCloud, X, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

const MergeTool = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
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
    setFiles(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  };

  const moveDown = (i: number) => {
    setFiles(prev => {
      if (i >= prev.length - 1) return prev;
      const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a;
    });
  };

  // Drag-to-reorder handlers
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
    setProcessing(true); setProgress(0); setResult(null); setDone(false);
    const ff = ffmpeg.current!;
    const handler = ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100));
    ff.on("progress", handler);
    try {
      const names: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const name = `merge_${i}.${files[i].name.split(".").pop()}`;
        await ff.writeFile(name, await fetchFile(files[i]));
        names.push(name);
      }
      const concatList = names.map(n => `file '${n}'`).join("\n");
      await ff.writeFile("concat.txt", new TextEncoder().encode(concatList));
      await ff.exec(["-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", "merged.mp4"]);
      for (const n of names) await ff.deleteFile(n);
      await ff.deleteFile("concat.txt");
      const blob = await readOutputBlob(ff, "merged.mp4", "video/mp4");
      const url = URL.createObjectURL(blob);
      setDone(true);
      setResult({ url, filename: "merged-mianconvert.mp4", size: formatBytes(blob.size) });
      toast({ title: "Merged!", description: `${files.length} videos combined.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Merge failed", description: String(e) });
    } finally {
      ff.off("progress", handler); setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-violet-400 transition-colors">
        <label className="cursor-pointer flex flex-col items-center gap-2">
          <UploadCloud className="w-8 h-8 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Click to add videos</span>
          <span className="text-xs text-gray-400">Add multiple — drag rows to reorder merge sequence</span>
          <input type="file" accept="video/*" multiple className="hidden" onChange={addFiles} />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Merge order ({files.length} files) — drag to reorder
          </p>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDragEnd={onDragEnd}
              className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-grab active:cursor-grabbing select-none border border-transparent hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
              <span className="flex-1 truncate text-gray-700 dark:text-gray-200">{f.name}</span>
              <span className="text-gray-400 text-xs shrink-0">{formatBytes(f.size)}</span>
              {/* Up/Down buttons for mobile */}
              <div className="flex gap-1 sm:hidden">
                <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 text-gray-400 hover:text-violet-500 disabled:opacity-30">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moveDown(i)} disabled={i === files.length - 1} className="p-1 text-gray-400 hover:text-violet-500 disabled:opacity-30">
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

      {files.length >= 2 && !result && (
        <AnimatedButton onClick={handleMerge} loading={processing} className="w-full" size="lg">
          {processing ? "Merging…" : `Merge ${files.length} Videos`}
        </AnimatedButton>
      )}

      {processing && <AnimatedProgress value={progress} label="Merging videos…" done={done} />}

      {result && (
        <ResultCard url={result.url} filename={result.filename} size={result.size}
          onAgain={() => { URL.revokeObjectURL(result.url); setResult(null); setDone(false); }}
          onReset={() => { setFiles([]); setResult(null); setDone(false); }} />
      )}
    </div>
  );
};

export default MergeTool;
