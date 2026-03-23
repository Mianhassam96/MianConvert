import { Slider } from "@/components/ui/slider";

interface TrimControlProps {
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

const TrimControl = ({ duration, start, end, onChange }: TrimControlProps) => (
  <div className="space-y-3">
    <div className="flex justify-between text-xs text-gray-500 font-mono">
      <span>Start: {fmt(start)}</span>
      <span>Duration: {fmt(end - start)}</span>
      <span>End: {fmt(end)}</span>
    </div>
    <div className="space-y-2">
      <label className="text-xs text-gray-500">Start time</label>
      <Slider
        min={0}
        max={duration}
        step={0.1}
        value={[start]}
        onValueChange={([v]) => onChange(Math.min(v, end - 0.5), end)}
      />
    </div>
    <div className="space-y-2">
      <label className="text-xs text-gray-500">End time</label>
      <Slider
        min={0}
        max={duration}
        step={0.1}
        value={[end]}
        onValueChange={([v]) => onChange(start, Math.max(v, start + 0.5))}
      />
    </div>
  </div>
);

export default TrimControl;
