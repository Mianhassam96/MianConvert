import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
}

const DropZone = ({ onFile, accept = "video/*", label }: DropZoneProps) => {
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

  return (
    <motion.div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 overflow-hidden",
        dragging
          ? "drop-border bg-violet-50/80 dark:bg-violet-950/30"
          : "border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-600 bg-gray-50/50 dark:bg-gray-900/50"
      )}
    >
      {/* Background glow when dragging */}
      <AnimatePresence>
        {dragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-violet-500/5 pointer-events-none" />
        )}
      </AnimatePresence>

      <motion.div
        animate={dragging ? { scale: 1.15, rotate: -5 } : { scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
          dragging ? "bg-violet-600 shadow-violet-500/40" : "bg-violet-100 dark:bg-violet-950/50"
        )}
      >
        <UploadCloud className={cn("w-7 h-7 transition-colors", dragging ? "text-white" : "text-violet-500")} />
      </motion.div>

      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
          {dragging ? "Drop it!" : label || "Drop your video here"}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          or <span className="text-violet-500 font-medium">click to browse</span> — MP4, WebM, MOV, AVI, MKV
        </p>
      </div>

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </motion.div>
  );
};

export default DropZone;
