/**
 * Global session store — keeps the last uploaded file in memory
 * so users can switch tools without re-uploading.
 * Also tracks completed tools for the Session Timeline.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach(fn => fn());

export interface SessionState {
  file: File | null;
  previewUrl: string;
  duration: number;
  width: number;
  height: number;
  suggestions: string[];
  completedTools: string[];
}

const state: SessionState = {
  file: null,
  previewUrl: "",
  duration: 0,
  width: 0,
  height: 0,
  suggestions: [],
  completedTools: [],
};

const buildSuggestions = (file: File, duration: number, width: number, height: number): string[] => {
  const suggestions: string[] = [];
  const sizeMB = file.size / (1024 * 1024);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (sizeMB > 100) suggestions.push("compress");
  if (["avi", "mov", "mkv", "webm"].includes(ext)) suggestions.push("convert");
  if (duration > 120) suggestions.push("timeline");
  if (width > 1920 || height > 1080) suggestions.push("resize");
  if (!suggestions.includes("convert")) suggestions.push("convert");
  return suggestions.slice(0, 3);
};

export const sessionStore = {
  get: (): SessionState => ({ ...state }),

  set: (file: File, duration = 0, width = 0, height = 0) => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.file = file;
    state.previewUrl = URL.createObjectURL(file);
    state.duration = duration;
    state.width = width;
    state.height = height;
    state.suggestions = buildSuggestions(file, duration, width, height);
    // Don't reset completedTools on file change — keep session history
    notify();
  },

  markDone: (toolId: string) => {
    if (!state.completedTools.includes(toolId)) {
      state.completedTools = [...state.completedTools, toolId];
      notify();
    }
  },

  clear: () => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.file = null;
    state.previewUrl = "";
    state.duration = 0;
    state.width = 0;
    state.height = 0;
    state.suggestions = [];
    state.completedTools = [];
    notify();
  },

  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
