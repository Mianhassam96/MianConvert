import { Slider } from "@/components/ui/slider";

interface TrimControlProps {
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toFixed(1).padStart(4, "0");
  return `${m}:${sec}`;
};

/**
 * Dual-handle range trim control.
 * Uses a single Slider with two thumbs for intuitive start/end selection.
 */
const TrimControl = ({ duration, start, end, onChange }: TrimControlProps) => (
  <div className="space-y-3">
    {/* Time display */}
    <div className="flex items-center justify-between text-xs font-mono">
      <span className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md">
        {fmt(start)}
      </span>
      <span className="text-gray-400 dark:text-gray-500">
        ✂️ {fmt(end - start)}
      </span>
      <span className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md">
        {fmt(end)}
      </span>
    </div>

    {/* Dual-handle range slider */}
    <div className="relative">
      <Slider
        min={0}
        max={duration}
        step={0.1}
        value={[start, end]}
        onValueChange={([s, e]) => {
          // Enforce minimum gap of 0.5s
          if (e - s < 0.5) return;
          onChange(s, e);
        }}
        className="w-full"
      />
    </div>

    {/* Visual range indicator */}
    <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
      <span>0:00</span>
      <span className="text-violet-500 dark:text-violet-400 font-medium">
        Selected: {fmt(end - start)} of {fmt(duration)}
      </span>
      <span>{fmt(duration)}</span>
    </div>
  </div>
);

export default TrimControl;
