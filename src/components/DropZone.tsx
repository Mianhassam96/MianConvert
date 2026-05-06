import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Film, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
  /** "hero" = large homepage style; "default" = compact tool style */
  variant?: "hero" | "default";
}

const DropZone = ({ onFile, accept = "video/*", label, variant = "default" }: DropZoneProps) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  const isHero = variant === "hero";

  return (
    <motion.div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      whileHover={{ scale: isHero ? 1.002 : 1.005 }}
      whileTap={{ scale: 0.995 }}
      className={cn(
        "relative rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 select-none flex flex-col items-center justify-center gap-4",
        isHero ? "py-14 sm:py-20 px-6" : "py-10 sm:py-14 px-6",
        dragging
          ? "drop-border bg-violet-50/90 dark:bg-violet-950/40 shadow-xl shadow-violet-500/20"
          : "border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-600 bg-gray-50/60 dark:bg-gray-900/40 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 hover:shadow-lg hover:shadow-violet-500/10"
      )}
    >
      {/* Radial glow when dragging */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.10) 0%, transparent 70%)" }}
          />
        )}
      </AnimatePresence>

      {/* Floating particles — hero only */}
      {isHero && !dragging && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-violet-400/30 dark:bg-violet-500/20 pointer-events-none"
              style={{ left: `${20 + i * 28}%`, top: `${25 + i * 18}%` }}
              animate={{ y: [-8, 8, -8], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2.5 + i * 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            />
          ))}
        </>
      )}

      {/* Icon */}
      <motion.div
        animate={dragging ? { scale: 1.2, rotate: -8, y: -4 } : { scale: 1, rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className={cn(
          "relative rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300",
          isHero ? "w-20 h-20" : "w-16 h-16",
          dragging
            ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-violet-500/40"
            : "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/60 dark:to-purple-950/60 shadow-violet-200/50 dark:shadow-violet-900/30"
        )}
      >
        {dragging && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-violet-400"
            animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
        <AnimatePresence mode="wait">
          {dragging ? (
            <motion.div key="film" initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
              <Film className={cn("text-white", isHero ? "w-10 h-10" : "w-8 h-8")} />
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              {isHero
                ? <FileVideo className="w-10 h-10 text-violet-500 dark:text-violet-400" />
                : <UploadCloud className="w-8 h-8 text-violet-500 dark:text-violet-400" />
              }
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Text */}
      <div className="text-center space-y-1.5">
        <AnimatePresence mode="wait">
          {dragging ? (
            <motion.p key="drop" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className={cn("font-bold text-violet-700 dark:text-violet-300", isHero ? "text-lg" : "text-base")}>
              Release to upload!
            </motion.p>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <p className={cn("font-bold text-gray-800 dark:text-gray-100", isHero ? "text-xl sm:text-2xl" : "text-sm sm:text-base")}>
                {label || (isHero ? "Drop your video anywhere" : "Drop your video here")}
              </p>
              {isHero && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  No upload. No signup. No limits.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
          or{" "}
          <span className="text-violet-500 dark:text-violet-400 font-semibold hover:underline">
            click to browse
          </span>
          {" "}— MP4, WebM, MOV, AVI, MKV
        </p>
      </div>

      {/* Format badges */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {["MP4", "WebM", "MOV", "AVI", "MKV"].map(fmt => (
          <span key={fmt}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            {fmt}
          </span>
        ))}
      </div>

      {/* Security note — hero only */}
      {isHero && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
          Your files never leave your device — everything runs locally
        </motion.div>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </motion.div>
  );
};

export default DropZone;
