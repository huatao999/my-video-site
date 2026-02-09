/**
 * Chunked upload with resumability and retry.
 * 注意：Netlify Functions 单次请求体有 ~6MB 限制。
 * 使用 multipart/form-data 时会有额外边界和字段开销，
 * 5MB 的纯文件在实际请求中可能接近或超过限制，从而直接被 Netlify 拒绝，
 * 返回「Internal Error. ID: ...」，函数代码甚至不会被执行。
 *
 * 因此这里将分片大小降到 2MB，给 Netlify 的编码/头部留出充足余量，
 * 避免因为请求体过大导致的 500 Internal Error。
 */
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per part, safely under Netlify limit
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

export type CompletedPart = { partNumber: number; etag: string };

export type UploadState = {
  fileId: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  targetKey: string; // finalKey user intended to upload to
  key: string; // resolved key from server
  uploadId: string;
  completedParts: CompletedPart[];
};

function simpleFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

const UPLOAD_STATE_KEY = "video_upload_state";

export function getStoredState(file: File, targetKey: string): UploadState | null {
  try {
    const raw = localStorage.getItem(UPLOAD_STATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as UploadState;
    if (
      state.fileId === simpleFileId(file) &&
      state.fileName === file.name &&
      state.fileSize === file.size &&
      state.lastModified === file.lastModified &&
      state.targetKey === targetKey
    ) {
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveState(state: UploadState): void {
  try {
    localStorage.setItem(UPLOAD_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(UPLOAD_STATE_KEY);
  } catch {
    // ignore
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min per part

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) return res;

      const text = await res.text();
      let errMsg: string;
      try {
        const data = JSON.parse(text);
        errMsg = data.error || data.message || `HTTP ${res.status}`;
      } catch {
        errMsg = text || `HTTP ${res.status}`;
      }
      lastError = new Error(errMsg);

      if (res.status >= 400 && res.status < 500 && res.status !== 408) {
        break; // don't retry client errors (except 408)
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    if (attempt < MAX_RETRIES - 1) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw lastError || new Error("Upload failed");
}

async function uploadPartWithRetry(
  key: string,
  uploadId: string,
  partNumber: number,
  chunk: Blob
): Promise<{ partNumber: number; etag: string }> {
  const formData = new FormData();
  formData.append("file", chunk);
  formData.append("key", key);
  formData.append("uploadId", uploadId);
  formData.append("partNumber", String(partNumber));

  const res = await fetchWithRetry("/api/videos/upload/part", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json()) as { etag?: string; partNumber?: number };
  if (!data.etag) throw new Error("Missing etag in part response");
  return { partNumber, etag: data.etag };
}

export async function uploadFileInChunks(
  file: File,
  finalKey: string,
  contentType: string,
  options: {
    onProgress: (loaded: number, total: number, percentage: number) => void;
    onResume?: (completed: number, total: number) => void;
    getStoredState?: (file: File, targetKey: string) => UploadState | null;
  }
): Promise<void> {
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  let uploadId: string;
  let resolvedKey: string;
  let completedParts: CompletedPart[] = [];

  const existing = options.getStoredState?.(file, finalKey) ?? getStoredState(file, finalKey);
  if (existing) {
    uploadId = existing.uploadId;
    resolvedKey = existing.key;
    completedParts = [...existing.completedParts];
    options.onResume?.(completedParts.length, totalParts);
  } else {
    const initRes = await fetchWithRetry("/api/videos/upload/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: finalKey, contentType }),
    });
    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Initiate failed");
    }
    const initData = (await initRes.json()) as { uploadId: string; key: string };
    uploadId = initData.uploadId;
    resolvedKey = initData.key;
  }

  const state: UploadState = {
    fileId: simpleFileId(file),
    fileName: file.name,
    fileSize: file.size,
    lastModified: file.lastModified,
    targetKey: finalKey,
    key: resolvedKey,
    uploadId,
    completedParts: [...completedParts],
  };

  const completedSet = new Set(completedParts.map((p) => p.partNumber));

  for (let i = 1; i <= totalParts; i++) {
    if (completedSet.has(i)) {
      const loaded = (i / totalParts) * file.size;
      options.onProgress(loaded, file.size, Math.round((loaded / file.size) * 100));
      continue;
    }

    const start = (i - 1) * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const { etag } = await uploadPartWithRetry(resolvedKey, uploadId, i, chunk);
    completedParts.push({ partNumber: i, etag });
    state.completedParts = completedParts;
    saveState(state);

    const loaded = (i / totalParts) * file.size;
    options.onProgress(loaded, file.size, Math.round((loaded / file.size) * 100));
  }

  const completeRes = await fetchWithRetry("/api/videos/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: resolvedKey,
      uploadId,
      parts: completedParts.sort((a, b) => a.partNumber - b.partNumber),
    }),
  });

  if (!completeRes.ok) {
    const err = await completeRes.json().catch(() => ({}));
    // 优先展示后端返回的详细 message（通常是 R2 的具体错误信息），
    // 其次才是通用 error 字段，方便后台排查问题。
    throw new Error(err.message || err.error || "Complete failed");
  }

  clearState();
}
