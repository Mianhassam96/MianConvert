import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFile: (file: File) => void;
}

const DropZone = ({ onFile }: DropZoneProps) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
        dragging
          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
          : "border-gray-300 hover:border-violet-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/40"
      )}
    >
      <UploadCloud className={cn("w-12 h-12 transition-colors", dragging ? "text-violet-500" : "text-gray-400")} />
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Drop your video here
        </p>
        <p className="text-sm text-gray-500 mt-1">or click to browse — MP4, WebM, MOV, AVI, MKV supported</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default DropZone;
