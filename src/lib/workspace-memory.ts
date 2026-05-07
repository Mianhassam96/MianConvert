/**
 * Workspace Memory — persists recent presets, workflows, and favorites
 * across browser sessions using localStorage.
 */

export interface WorkflowEntry {
  id: string;
  label: string;
  icon: string;
  toolId: string;
  preset?: string;
  usedAt: number;
}

const KEY_WORKFLOWS = "mc_recent_workflows";
const KEY_PRESETS   = "mc_recent_presets";
const KEY_FAVTOOLS  = "mc_fav_tools";
const MAX_RECENT    = 5;

// ── Recent Workflows ──────────────────────────────────────────────────────────
export const workspaceMemory = {
  getWorkflows: (): WorkflowEntry[] => {
    try { return JSON.parse(localStorage.getItem(KEY_WORKFLOWS) ?? "[]"); }
    catch { return []; }
  },

  addWorkflow: (entry: Omit<WorkflowEntry, "usedAt">) => {
    const existing = workspaceMemory.getWorkflows().filter(w => w.id !== entry.id);
    const updated = [{ ...entry, usedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(KEY_WORKFLOWS, JSON.stringify(updated));
  },

  // ── Recent presets ──────────────────────────────────────────────────────────
  getRecentPresets: (): string[] => {
    try { return JSON.parse(localStorage.getItem(KEY_PRESETS) ?? "[]"); }
    catch { return []; }
  },

  addPreset: (presetId: string) => {
    const existing = workspaceMemory.getRecentPresets().filter(p => p !== presetId);
    localStorage.setItem(KEY_PRESETS, JSON.stringify([presetId, ...existing].slice(0, MAX_RECENT)));
  },

  // ── Favorite tools ──────────────────────────────────────────────────────────
  getFavTools: (): string[] => {
    try { return JSON.parse(localStorage.getItem(KEY_FAVTOOLS) ?? "[]"); }
    catch { return []; }
  },

  setFavTools: (ids: string[]) => {
    localStorage.setItem(KEY_FAVTOOLS, JSON.stringify(ids));
  },

  clearAll: () => {
    localStorage.removeItem(KEY_WORKFLOWS);
    localStorage.removeItem(KEY_PRESETS);
    localStorage.removeItem(KEY_FAVTOOLS);
  },
};
