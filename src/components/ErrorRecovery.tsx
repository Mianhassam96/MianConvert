import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorRecoveryProps {
  error: string;
  onRetry: () => void;
}

/**
 * Inline error banner with retry button — shown when FFmpeg processing fails.
 */
const ErrorRecovery = ({ error, onRetry }: ErrorRecoveryProps) => (
  <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 rounded-xl px-4 py-3">
    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Processing failed</p>
      <p className="text-xs text-red-500 dark:text-red-500 mt-0.5 break-words leading-relaxed">{error}</p>
    </div>
    <button
      onClick={onRetry}
      className="shrink-0 flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
    >
      <RefreshCw className="w-3.5 h-3.5" /> Retry
    </button>
  </div>
);

export default ErrorRecovery;
