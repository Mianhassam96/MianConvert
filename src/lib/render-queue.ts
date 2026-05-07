/**
 * Render Queue — tracks active and completed processing jobs.
 * Gives users visibility into background operations.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach(fn => fn());

export type JobStatus = "queued" | "processing" | "done" | "error";

export interface RenderJob {
  id: string;
  toolId: string;
  toolLabel: string;
  icon: string;
  fileName: string;
  status: JobStatus;
  progress: number;
  startedAt: number;
  completedAt?: number;
  error?: string;
  resultUrl?: string;
  resultName?: string;
  resultSize?: string;
}

const jobs: RenderJob[] = [];

export const renderQueue = {
  getAll: (): RenderJob[] => [...jobs],
  getActive: (): RenderJob[] => jobs.filter(j => j.status === "processing" || j.status === "queued"),
  getDone: (): RenderJob[] => jobs.filter(j => j.status === "done"),

  add: (job: Omit<RenderJob, "id" | "startedAt" | "progress">): string => {
    const id = crypto.randomUUID();
    jobs.unshift({ ...job, id, startedAt: Date.now(), progress: 0 });
    if (jobs.length > 20) jobs.splice(20);
    notify();
    return id;
  },

  update: (id: string, patch: Partial<RenderJob>) => {
    const idx = jobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      jobs[idx] = { ...jobs[idx], ...patch };
      notify();
    }
  },

  complete: (id: string, resultUrl: string, resultName: string, resultSize: string) => {
    renderQueue.update(id, {
      status: "done",
      progress: 100,
      completedAt: Date.now(),
      resultUrl,
      resultName,
      resultSize,
    });
  },

  fail: (id: string, error: string) => {
    renderQueue.update(id, { status: "error", error, completedAt: Date.now() });
  },

  clear: () => {
    jobs.splice(0);
    notify();
  },

  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
