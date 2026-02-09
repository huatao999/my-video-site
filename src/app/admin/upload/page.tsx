"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";

type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

export default function AdminUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [videoKey, setVideoKey] = useState("");
  const [langZh, setLangZh] = useState(true);
  const [langEn, setLangEn] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!videoKey) setVideoKey(selectedFile.name);
      setError(null);
      setSuccess(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!file || !videoKey.trim() || uploading || (!langZh && !langEn)) return;

    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(null);

    try {
      const rawKey = videoKey.trim();
      const ext = rawKey.includes(".") ? rawKey.slice(rawKey.lastIndexOf(".")) : ".mp4";
      const base = rawKey.includes(".") ? rawKey.slice(0, rawKey.lastIndexOf(".")) : rawKey;

      // 仅英文时自动命名为 *_en.mp4
      const finalKey = langEn && !langZh ? `${base}_en${ext}` : rawKey;
      const contentType = file.type || "video/mp4";

      // 使用预签名 URL，浏览器直传到 R2，绕过 Netlify 函数体积限制和 multipart 最小分片限制
      const presignRes = await fetch("/api/videos/presign-upload", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({key: finalKey, contentType}),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({}));
        throw new Error(data.message || data.error || `预签名上传失败: ${presignRes.status}`);
      }
      const presignData = (await presignRes.json()) as {url: string; key: string};

      // 使用 XMLHttpRequest 以获得稳定的上传进度事件（fetch 目前在绝大多数浏览器里没有 upload 进度）
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignData.url, true);
        xhr.setRequestHeader("Content-Type", contentType);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const loaded = event.loaded;
          const total = event.total || file.size;
          const percentage = Math.round((loaded / total) * 100);
          setProgress({loaded, total, percentage});
        };

        xhr.onerror = () => {
          reject(new Error("上传过程中发生网络错误"));
        };
        xhr.onabort = () => {
          reject(new Error("上传已被取消"));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // 确保进度条到 100%
            setProgress({loaded: file.size, total: file.size, percentage: 100});
            resolve();
          } else {
            reject(new Error(`上传到 R2 失败: ${xhr.status}`));
          }
        };

        xhr.send(file);
      });

      const resolvedKey = presignData.key || finalKey;
      const metaTitle = title.trim() || finalKey;
      const metaDescription = description.trim();

      const localesToSave: Array<"zh" | "en"> = [];
      if (langZh) localesToSave.push("zh");
      if (langEn) localesToSave.push("en");

      for (const loc of localesToSave) {
        const res = await fetch(`/api/admin/videos/${encodeURIComponent(resolvedKey)}/metadata`, {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            locale: loc,
            title: metaTitle,
            description: metaDescription,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`保存元数据失败 (${loc}): ${res.status} - ${errorData.error || "未知错误"}`);
        }
      }

      setSuccess(true);
      setFile(null);
      setVideoKey("");
      setTitle("");
      setDescription("");
      setProgress(null);

      setTimeout(() => router.push("/admin/videos"), 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      setError(msg);
      setProgress(null);
      // Don't clear state on error - allow resume on retry
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">上传视频</h1>
          <p className="mt-1 text-sm text-neutral-400">上传视频文件到 Cloudflare R2</p>
        </div>
        <Link
          href="/admin"
          className="min-h-[44px] touch-manipulation rounded-md border border-neutral-700 bg-neutral-900/50 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-900 active:bg-neutral-800"
        >
          返回
        </Link>
      </div>

      <form onSubmit={handleUpload} className="space-y-6 rounded-xl border border-neutral-800 bg-neutral-900/30 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="file" className="mb-2 block text-sm font-medium">
              选择视频文件
            </label>
            <input
              id="file"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              required
              disabled={uploading}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black file:hover:bg-neutral-200 file:cursor-pointer disabled:opacity-50"
            />
            {file && (
              <p className="mt-2 text-xs text-neutral-400">
                文件大小: {(file.size / 1024 / 1024).toFixed(2)} MB | 类型: {file.type || "未知"}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              选择语言
            </label>
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={langZh}
                  onChange={(e) => setLangZh(e.target.checked)}
                  disabled={uploading}
                  className="h-4 w-4 rounded border-neutral-600"
                />
                <span>中文</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={langEn}
                  onChange={(e) => setLangEn(e.target.checked)}
                  disabled={uploading}
                  className="h-4 w-4 rounded border-neutral-600"
                />
                <span>英文</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              仅英文时自动将视频命名为 *_en.mp4（如 ep1.mp4 → ep1_en.mp4）
            </p>
          </div>

          <div>
            <label htmlFor="key" className="mb-2 block text-sm font-medium">
              视频 Key（R2 中的文件名）
            </label>
            <input
              id="key"
              type="text"
              value={videoKey}
              onChange={(e) => setVideoKey(e.target.value)}
              placeholder="例如: videos/episode1.mp4"
              required
              disabled={uploading}
              className="min-h-[44px] w-full touch-manipulation rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-neutral-400">建议使用有意义的文件名，如 videos/episode1.mp4</p>
          </div>

          <div className="space-y-3 rounded-lg border border-neutral-700 bg-neutral-950/50 p-4">
            <div className="text-sm font-medium text-neutral-300">视频元数据</div>
            <div>
              <label htmlFor="title" className="mb-2 block text-xs font-medium text-neutral-400">
                视频标题
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入视频标题"
                disabled={uploading}
                maxLength={200}
                className="min-h-[44px] w-full touch-manipulation rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-neutral-400">可选，留空则使用文件名</p>
            </div>
            <div>
              <label htmlFor="description" className="mb-2 block text-xs font-medium text-neutral-400">
                视频简介
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入视频简介"
                disabled={uploading}
                maxLength={2000}
                rows={3}
                className="w-full touch-manipulation rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-neutral-400">可选，可在上传后编辑</p>
            </div>
          </div>
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">上传进度</span>
              <span className="font-semibold">{progress.percentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{width: `${progress.percentage}%`}}
              />
            </div>
            <p className="text-xs text-neutral-400">
              {(progress.loaded / 1024 / 1024).toFixed(2)} MB / {(progress.total / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-green-800 bg-green-900/20 px-4 py-3 text-sm text-green-300">
            上传成功！3 秒后自动跳转到视频管理页面...
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!file || !videoKey.trim() || uploading}
            className="min-h-[44px] touch-manipulation rounded-md bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-50"
          >
            {uploading ? "上传中..." : "开始上传"}
          </button>
          <Link
            href="/admin/videos"
            className="min-h-[44px] touch-manipulation rounded-md border border-neutral-700 bg-neutral-900/50 px-6 py-3 text-sm text-neutral-300 transition-colors hover:bg-neutral-900 active:bg-neutral-800"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
