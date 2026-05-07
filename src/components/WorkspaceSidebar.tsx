import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projectStore, ProjectState } from "@/lib/project-store";
import { formatBytes } from "@/lib/ffmpeg-run";
import { Download, FolderOpen, X, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceSidebarProps {
  onOpenTool: (toolId: string) => void;
}

const TOOL_ICONS: Record<string, string> = {
  convert: "🔄", compress: "📦", resize: "📐", gif: "🎞",
  audiostudio: "🎵", subtitle: "💬", thumbnail: "📸",
  proeditor: "🎬", timeline: "✂️", overlay: "🧩",
  clean: "🧹", merge: "🔗", autooptimize: "⚡",
};

const WorkspaceSidebar = ({ onOpenTool }: WorkspaceSidebarProps) => {
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState<ProjectState>(() => projectStore.get());

  useEffect(() => {
    const unsub = projectStore.subscribe(() => setProject(projectStore.get()));
    return unsub;
  }, []);

  const hasFiles = project.files.length > 0 || project.sourceFileName;

  const download = (file: typeof project.files[0]) => {
    if (!file.url) return;
    const a = document.createElement("a");
    a.href = file.url; a.download = file.name; a.click();
  };

  return (
    <>
      {/* Toggle button — only show when there's something */}
      <AnimatePresence>
        {hasFiles && (
          <motion.button
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            onClick={() => setOpen(o => !o)}
            className="fixed right-3 sm:right-4 bottom-4 sm:bottom-6 z-40 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-3 py-2.5 rounded-2xl shadow-xl shadow-violet-500/30 text-xs font-bold"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden xs:inline">Project</span>
            {project.files.length > 0 && (
              <span className="bg-white/25 px-1.5 py-0.5 rounded-full text-[10px]">
                {project.files.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 sm:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-600 to-fuchsia-600">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">Current Project</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Source file */}
              {project.sourceFileName && (
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Source</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📂</span>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                      {project.sourceFileName}
                    </p>
                  </div>
                </div>
              )}

              {/* Output files */}
              <div className="flex-1 overflow-y-auto">
                {project.files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-gray-500 px-6 text-center">
                    <span className="text-4xl">📁</span>
                    <p className="text-sm font-medium">No exports yet</p>
                    <p className="text-xs">Process a video to see your outputs here</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">
                      Exports ({project.files.length})
                    </p>
                    {project.files.map((file, i) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 group"
                      >
                        <span className="text-lg shrink-0">
                          {TOOL_ICONS[file.toolId] ?? "📄"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            {formatBytes(file.size)} · {file.toolLabel}
                          </p>
                        </div>
                        {file.url && (
                          <button
                            onClick={() => download(file)}
                            className="shrink-0 p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-violet-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Download className="w-3 h-3 text-violet-500" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Quick actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: "📦", label: "Compress", id: "compress" },
                    { icon: "💬", label: "Subtitle", id: "subtitle" },
                    { icon: "📸", label: "Thumbnail", id: "thumbnail" },
                    { icon: "🔄", label: "Convert", id: "convert" },
                  ].map(a => (
                    <button key={a.id}
                      onClick={() => { onOpenTool(a.id); setOpen(false); }}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all text-xs font-semibold text-gray-700 dark:text-gray-200"
                    >
                      <span>{a.icon}</span>{a.label}
                      <ChevronRight className="w-3 h-3 ml-auto text-gray-400" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { projectStore.clear(); setOpen(false); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear project
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default WorkspaceSidebar;
