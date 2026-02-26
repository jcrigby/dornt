import { config } from '../config.js';
import { readJson, writeJson, deleteFile } from './gcs-client.js';
import type { PipelineState, PipelineStage } from '../types/index.js';
import { v4 as uuid } from 'uuid';

const BUCKET = config.gcs.rawBucket;
const STATE_PREFIX = 'pipeline-state';

function statePath(stage: PipelineStage): string {
  return `${STATE_PREFIX}/${stage}.json`;
}

function lockPath(stage: PipelineStage): string {
  return `${STATE_PREFIX}/locks/${stage}.json`;
}

export async function getState(stage: PipelineStage): Promise<PipelineState> {
  const state = await readJson<PipelineState>(BUCKET, statePath(stage));
  return state || { stage, status: 'idle' };
}

export async function acquireLock(stage: PipelineStage): Promise<string | null> {
  const lockId = uuid();
  const existing = await readJson<{ lockedBy: string; lockedAt: string }>(BUCKET, lockPath(stage));

  if (existing) {
    const lockAge = Date.now() - new Date(existing.lockedAt).getTime();
    if (lockAge < config.pipeline.lockTimeoutMs) {
      console.log(`Stage ${stage} is locked by ${existing.lockedBy}, age ${Math.round(lockAge / 1000)}s`);
      return null; // Still locked
    }
    console.log(`Stale lock on ${stage} (${Math.round(lockAge / 1000)}s), breaking it`);
  }

  await writeJson(BUCKET, lockPath(stage), {
    lockedBy: lockId,
    lockedAt: new Date().toISOString(),
  });

  // Verify we got the lock (basic check)
  const check = await readJson<{ lockedBy: string }>(BUCKET, lockPath(stage));
  if (check?.lockedBy !== lockId) {
    return null; // Another process got it
  }

  return lockId;
}

export async function releaseLock(stage: PipelineStage, lockId: string): Promise<void> {
  const existing = await readJson<{ lockedBy: string }>(BUCKET, lockPath(stage));
  if (existing?.lockedBy === lockId) {
    await deleteFile(BUCKET, lockPath(stage));
  }
}

export async function updateState(
  stage: PipelineStage,
  updates: Partial<PipelineState>
): Promise<void> {
  const current = await getState(stage);
  await writeJson(BUCKET, statePath(stage), { ...current, ...updates });
}

export async function markRunning(stage: PipelineStage): Promise<void> {
  await updateState(stage, {
    status: 'running',
    lastRunAt: new Date().toISOString(),
  });
}

export async function markCompleted(stage: PipelineStage): Promise<void> {
  await updateState(stage, {
    status: 'completed',
    lastCompletedAt: new Date().toISOString(),
    error: undefined,
  });
}

export async function markFailed(stage: PipelineStage, error: string): Promise<void> {
  await updateState(stage, {
    status: 'failed',
    error,
  });
}
