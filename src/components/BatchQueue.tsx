import { X, FileVideo, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type BatchFile = {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  resultUrl?: string;
  resultName?: string;
  error?: string;
};

interface BatchQueueProps {
  files: BatchFile[];
  onRemove: (id: string) => void;
}

const statusIcon = (status: BatchFile["status"]) => {
  if (status === "done") return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === "processing") return <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />;
  if (status === "error") return <AlertCircle className="w-4 h-4 text-red-500" />;
  return <FileVideo className="w-4 h-4 text-gray-400" />;
};

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

const BatchQueue = ({ files, onRemove }: BatchQueueProps) => (
  <div className="space-y-2">
    {files.map((f) => (
      <div
        key={f.id}
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
          f.status === "done" && "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20",
          f.status === "error" && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20",
          f.status === "processing" && "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20",
          f.status === "pending" && "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        )}
      >
        {statusIcon(f.status)}
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-gray-800 dark:text-gray-100">{f.file.name}</p>
          <p className="text-xs text-gray-400">{formatBytes(f.file.size)}</p>
          {f.status === "processing" && (
            <Progress value={f.progress} className="h-1 mt-1" />
          )}
          {f.status === "error" && (
            <p className="text-xs text-red-500 mt-0.5">{f.error}</p>
          )}
        </div>
        {f.status === "done" && f.resultUrl && (
          <a
            href={f.resultUrl}
            download={f.resultName}
            className="text-xs text-violet-600 hover:underline shrink-0"
          >
            Download
          </a>
        )}
        {f.status === "pending" && (
          <Button size="icon" variant="ghost" className="shrink-0 h-6 w-6" onClick={() => onRemove(f.id)}>
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    ))}
  </div>
);

export default BatchQueue;
