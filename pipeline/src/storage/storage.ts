import { mkdir, writeFile, readFile, readdir, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

const LOCAL_ROOT = join(process.cwd(), '.local-storage');

function localPath(dir: string, path: string): string {
  return join(LOCAL_ROOT, dir, path);
}

async function ensureDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function writeJson(dir: string, path: string, data: unknown): Promise<void> {
  const fp = localPath(dir, path);
  await ensureDir(fp);
  await writeFile(fp, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readJson<T>(dir: string, path: string): Promise<T | null> {
  const fp = localPath(dir, path);
  try {
    const content = await readFile(fp, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeText(dir: string, path: string, data: string): Promise<void> {
  const fp = localPath(dir, path);
  await ensureDir(fp);
  await writeFile(fp, data, 'utf-8');
}

export async function listFiles(dir: string, prefix: string): Promise<string[]> {
  const fullDir = localPath(dir, prefix);
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

  await walk(fullDir, fullDir);
  return results;
}

export async function deleteFile(dir: string, path: string): Promise<void> {
  try {
    await unlink(localPath(dir, path));
  } catch {
    // Ignore
  }
}

export async function fileExists(dir: string, path: string): Promise<boolean> {
  return existsSync(localPath(dir, path));
}
