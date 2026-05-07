/**
 * Project Store — tracks the current creator session as a "project"
 * with file history, render outputs, and exported versions.
 * Persists to localStorage so it survives page refresh.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach(fn => fn());

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: "source" | "output";
  toolId: string;
  toolLabel: string;
  url: string;       // object URL — valid for current session only
  createdAt: number;
}

export interface ProjectState {
  files: ProjectFile[];
  sourceFileName: string;
}

const KEY = "mc_project";

const loadState = (): ProjectState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { files: [], sourceFileName: "" };
    const parsed = JSON.parse(raw) as ProjectState;
    // Object URLs are invalid after page reload — clear them
    return { ...parsed, files: parsed.files.map(f => ({ ...f, url: "" })) };
  } catch { return { files: [], sourceFileName: "" }; }
};

const saveState = (state: ProjectState) => {
  // Don't persist object URLs (they're session-only)
  const toSave: ProjectState = {
    ...state,
    files: state.files.map(f => ({ ...f, url: "" })),
  };
  try { localStorage.setItem(KEY, JSON.stringify(toSave)); } catch {}
};

let state: ProjectState = loadState();

export const projectStore = {
  get: (): ProjectState => ({ ...state, files: [...state.files] }),

  setSource: (name: string) => {
    state = { ...state, sourceFileName: name };
    saveState(state);
    notify();
  },

  addOutput: (file: Omit<ProjectFile, "id" | "createdAt">) => {
    const entry: ProjectFile = {
      ...file,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    // Keep max 10 outputs, newest first
    state = {
      ...state,
      files: [entry, ...state.files].slice(0, 10),
    };
    saveState(state);
    notify();
  },

  clear: () => {
    state = { files: [], sourceFileName: "" };
    saveState(state);
    notify();
  },

  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
