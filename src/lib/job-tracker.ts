/**
 * Job Tracker — single helper that wires renderQueue + projectStore together.
 *
 * Usage in any tool:
 *
 *   const jobId = startJob({ toolId: "compress", toolLabel: "Compress", icon: "📦", fileName: file.name });
 *   ff.on("progress", ({ progress }) => updateJob(jobId, Math.round(progress * 100)));
 *   // on success:
 *   finishJob(jobId, { url, name: filename, size: formatBytes(blob.size), rawSize: blob.size });
 *   // on error:
 *   failJob(jobId, errorMessage);
 */

import { renderQueue } from "@/lib/render-queue";
import { projectStore } from "@/lib/project-store";

export interface JobMeta {
  toolId: string;
  toolLabel: string;
  icon: string;
  fileName: string;
}

export interface JobResult {
  url: string;
  name: string;
  size: string;
  rawSize: number;
}

/** Register a new job in the render queue. Returns the job ID. */
export const startJob = (meta: JobMeta): string => {
  return renderQueue.add({
    toolId: meta.toolId,
    toolLabel: meta.toolLabel,
    icon: meta.icon,
    fileName: meta.fileName,
    status: "processing",
  });
};

/** Update job progress (0–100). */
export const updateJob = (jobId: string, progress: number): void => {
  renderQueue.update(jobId, { progress, status: "processing" });
};

/** Mark job complete and add output to project store. */
export const finishJob = (jobId: string, result: JobResult, toolId: string, toolLabel: string): void => {
  renderQueue.complete(jobId, result.url, result.name, result.size);
  projectStore.addOutput({
    name: result.name,
    size: result.rawSize,
    type: "output",
    toolId,
    toolLabel,
    url: result.url,
  });
};

/** Mark job as failed. */
export const failJob = (jobId: string, error: string): void => {
  renderQueue.fail(jobId, error);
};
