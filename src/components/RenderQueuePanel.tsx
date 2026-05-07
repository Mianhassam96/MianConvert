import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { renderQueue, RenderJob } from "@/lib/render-queue";
import { Download, X, Loader2, CheckCircle, AlertCircle, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";

const JobRow = ({ job }: { job: RenderJob }) => {
  const download = () => {
    if (!job.resultUrl) return;
    const a = document.createElement("a");
    a.href = job.resultUrl; a.download = job.resultName ?? job.fileName; a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs transition-colors",
        job.status === "done"       && "border-green-200 dark:border-green-800/50 bg-green-50/60 dark:bg-green-950/20",
        job.status === "processing" && "border-violet-200 dark:border-violet-800/50 bg-violet-50/60 dark:bg-violet-950/20",
        job.status === "queued"     && "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40",
        job.status === "error"      && "border-red-200 dark:border-red-800/50 bg-red-50/60 dark:bg-red-950/20",
      )}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {job.status === "processing" && <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />}
        {job.status === "done"       && <CheckCircle className="w-4 h-4 text-green-500" />}
        {job.status === "error"      && <AlertCircle className="w-4 h-4 text-red-500" />}
        {job.status === "queued"     && <span className="text-base">{job.icon}</span>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{job.fileName}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          {job.toolLabel}
          {job.status === "processing" && ` · ${job.progress}%`}
          {job.status === "done" && job.resultSize && ` · ${job.resultSize}`}
          {job.status === "error" && ` · Failed`}
        </p>
        {job.status === "processing" && (
          <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
              animate={{ width: `${job.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* Download */}
      {job.status === "done" && job.resultUrl && (
        <button onClick={download}
          className="shrink-0 p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-violet-400 transition-colors">
          <Download className="w-3 h-3 text-violet-500" />
        </button>
      )}
    </motion.div>
  );
};

const RenderQueuePanel = () => {
  const [jobs, setJobs] = useState<RenderJob[]>(() => renderQueue.getAll());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = renderQueue.subscribe(() => {
      setJobs(renderQueue.getAll());
      // Auto-open when a job starts
      if (renderQueue.getActive().length > 0) setOpen(true);
    });
    return unsub;
  }, []);

  const active = jobs.filter(j => j.status === "processing" || j.status === "queued");
  const visible = jobs.slice(0, 8);

  if (jobs.length === 0) return null;

  return (
    <>
      {/* Floating badge */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setOpen(o => !o)}
        className="fixed left-4 bottom-20 z-40 flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2.5 rounded-2xl shadow-xl text-xs font-bold hover:border-violet-400 transition-colors"
      >
        <ListVideo className="w-4 h-4 text-violet-500" />
        <span>Queue</span>
        {active.length > 0 && (
          <span className="bg-violet-600 text-white px-1.5 py-0.5 rounded-full text-[10px] animate-pulse">
            {active.length}
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/10"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed left-4 bottom-20 z-50 w-72 sm:w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Render Queue</span>
                  {active.length > 0 && (
                    <span className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded-full font-semibold">
                      {active.length} active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => renderQueue.clear()}
                    className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Clear</button>
                  <button onClick={() => setOpen(false)}>
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                {visible.map(job => <JobRow key={job.id} job={job} />)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default RenderQueuePanel;
