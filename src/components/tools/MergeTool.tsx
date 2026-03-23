import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { formatBytes, readOutputBlob } from "@/lib/ffmpeg-run";
import ResultCard from "@/components/ResultCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedProgress from "@/components/ui/AnimatedProgress";
import { UploadCloud, X, GripVertical } from "lucide-react";

const MergeTool = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string; size: string } | null>(null);
  const { toast } = useToast();
  const { ffmpeg, loaded, load } = useFFmpeg();

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []).filter(f => f.type.startsWith("video/"));
    setFiles(prev => [...prev, ...picked]);
    e.target.value = "";
  };

  const remove = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

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
          <span className="text-xs text-gray-400">Add multiple — they'll merge in order</span>
          <input type="file" accept="video/*" multiple className="hidden" onChange={addFiles} />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Merge order ({files.length} files)</p>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm">
              <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
              <span className="flex-1 truncate text-gray-700 dark:text-gray-200">{f.name}</span>
              <span className="text-gray-400 text-xs shrink-0">{formatBytes(f.size)}</span>
              <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
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
