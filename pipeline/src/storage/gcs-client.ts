import { config } from '../config.js';
import { mkdir, writeFile, readFile, readdir, unlink, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

// ── Local filesystem backend (used when GCS is not configured) ──

const LOCAL_ROOT = join(process.cwd(), '.local-storage');
const useLocal = !config.gcs.projectId;

if (useLocal) {
  console.log(`[storage] No GCP_PROJECT_ID set — using local filesystem at ${LOCAL_ROOT}`);
}

function localPath(bucket: string, path: string): string {
  return join(LOCAL_ROOT, bucket, path);
}

async function ensureDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

// ── Local implementations ──

async function localWriteJson(bucket: string, path: string, data: unknown): Promise<void> {
  const fp = localPath(bucket, path);
  await ensureDir(fp);
  await writeFile(fp, JSON.stringify(data, null, 2), 'utf-8');
}

async function localReadJson<T>(bucket: string, path: string): Promise<T | null> {
  const fp = localPath(bucket, path);
  try {
    const content = await readFile(fp, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function localWriteText(bucket: string, path: string, data: string): Promise<void> {
  const fp = localPath(bucket, path);
  await ensureDir(fp);
  await writeFile(fp, data, 'utf-8');
}

async function localListFiles(bucket: string, prefix: string): Promise<string[]> {
  const dir = localPath(bucket, prefix);
  const results: string[] = [];

  async function walk(currentDir: string, relativeTo: string): Promise<void> {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        const stripped = relativeTo.endsWith('/') ? relativeTo.length : relativeTo.length + 1;
        const relPath = fullPath.slice(stripped);
        if (entry.isDirectory()) {
          await walk(fullPath, relativeTo);
        } else {
          results.push(prefix + relPath);
        }
      }
    } catch {
      // Directory doesn't exist yet
    }
  }

  await walk(dir, dir);
  return results;
}

async function localDeleteFile(bucket: string, path: string): Promise<void> {
  try {
    await unlink(localPath(bucket, path));
  } catch {
    // Ignore
  }
}

async function localFileExists(bucket: string, path: string): Promise<boolean> {
  return existsSync(localPath(bucket, path));
}

// ── GCS implementations ──

async function gcsWriteJson(bucket: string, path: string, data: unknown): Promise<void> {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage({ projectId: config.gcs.projectId || undefined });
  const file = storage.bucket(bucket).file(path);
  const content = JSON.stringify(data, null, 2);
  await file.save(content, {
    contentType: 'application/json',
    metadata: { cacheControl: 'public, max-age=300' },
  });
}

async function gcsReadJson<T>(bucket: string, path: string): Promise<T | null> {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage({ projectId: config.gcs.projectId || undefined });
  const file = storage.bucket(bucket).file(path);
  try {
    const [exists] = await file.exists();
    if (!exists) return null;
    const [content] = await file.download();
    return JSON.parse(content.toString()) as T;
  } catch {
    return null;
  }
}

async function gcsWriteText(bucket: string, path: string, data: string): Promise<void> {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage({ projectId: config.gcs.projectId || undefined });
  const file = storage.bucket(bucket).file(path);
  await file.save(data, { contentType: 'text/plain' });
}

async function gcsListFiles(bucket: string, prefix: string): Promise<string[]> {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage({ projectId: config.gcs.projectId || undefined });
  const [files] = await storage.bucket(bucket).getFiles({ prefix });
  return files.map(f => f.name);
}

async function gcsDeleteFile(bucket: string, path: string): Promise<void> {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage({ projectId: config.gcs.projectId || undefined });
  try {
    await storage.bucket(bucket).file(path).delete();
  } catch {
    // Ignore
  }
}

async function gcsFileExists(bucket: string, path: string): Promise<boolean> {
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage({ projectId: config.gcs.projectId || undefined });
  const [exists] = await storage.bucket(bucket).file(path).exists();
  return exists;
}

// ── Exported functions — route to local or GCS ──

export const writeJson = useLocal ? localWriteJson : gcsWriteJson;
export const readJson: <T>(bucket: string, path: string) => Promise<T | null> = useLocal ? localReadJson : gcsReadJson;
export const writeText = useLocal ? localWriteText : gcsWriteText;
export const listFiles = useLocal ? localListFiles : gcsListFiles;
export const deleteFile = useLocal ? localDeleteFile : gcsDeleteFile;
export const fileExists = useLocal ? localFileExists : gcsFileExists;
