import { forwardRef } from "react";
import { motion } from "framer-motion";
import { X, FileVideo } from "lucide-react";
import { formatBytes } from "@/lib/ffmpeg-run";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  file: File;
  previewUrl: string;
  onReset: () => void;
  warning?: string | null;
  info?: string | null;
  infoVariant?: "blue" | "violet";
  badge?: string;
  style?: React.CSSProperties;
  onLoadedMetadata?: React.ReactEventHandler<HTMLVideoElement>;
  onTimeUpdate?: React.ReactEventHandler<HTMLVideoElement>;
  className?: string;
}

/**
 * Shared video preview component used across all tools.
 * - Fills full width, 16:9 aspect ratio container
 * - Video fills the box (object-cover) — no black bars
 * - Gradient overlay at bottom for badges
 * - Attractive glass-style file info row below
 */
const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  (
    {
      file,
      previewUrl,
      onReset,
      warning,
      info,
      infoVariant = "blue",
      badge,
      style,
      onLoadedMetadata,
      onTimeUpdate,
      className,
    },
    ref
  ) => {
    return (
      <div className="space-y-2">
        {/* ── Video container ── */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-xl shadow-black/20 ring-1 ring-white/10">
          {/* 16:9 aspect ratio wrapper */}
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <video
              ref={ref}
              src={previewUrl}
              controls
              playsInline
              style={style}
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={onTimeUpdate}
              className={cn(
                "absolute inset-0 w-full h-full object-contain bg-black",
                className
              )}
            />

            {/* Bottom gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* Badges row */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none">
              {badge && (
                <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10">
                  {badge}
                </span>
              )}
            </div>

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onReset}
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors border border-white/10 z-10"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* ── File info row ── */}
        <div className="flex items-center gap-2.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/60 rounded-xl px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
            <FileVideo className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">{file.name}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatBytes(file.size)}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50 shrink-0 animate-pulse" />
        </div>

        {/* ── Warning ── */}
        {warning && (
          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2.5">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{warning}</span>
          </div>
        )}

        {/* ── Info ── */}
        {info && (
          <div className={cn(
            "flex items-start gap-2 text-xs rounded-xl px-3 py-2.5",
            infoVariant === "violet"
              ? "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/60"
              : "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60"
          )}>
            <span className="shrink-0 mt-0.5">{infoVariant === "violet" ? "⚡" : "ℹ️"}</span>
            <span>{info}</span>
          </div>
        )}
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";
export default VideoPreview;
