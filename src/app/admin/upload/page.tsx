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

    if (!file || !videoKey.trim() || uploading) return;

    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(null);

    try {
      const presignRes = await fetch("/api/videos/presign-upload", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          key: videoKey.trim(),
          contentType: file.type || "video/mp4",
          expires: 900,
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({}));
        throw new Error(data.error || "获取上传 URL 失败");
      }

      const {url} = await presignRes.json();

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`上传失败：HTTP ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("上传失败：网络错误")));
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.send(file);
      });

      const metaTitle = title.trim() || videoKey.trim();
      const metaDescription = description.trim();

      const res = await fetch(`/api/admin/videos/${encodeURIComponent(videoKey.trim())}/metadata`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          locale: "zh",
          title: metaTitle,
          description: metaDescription,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`保存元数据失败: ${res.status} - ${errorData.error || "未知错误"}`);
      }

      setSuccess(true);
      setFile(null);
      setVideoKey("");
      setTitle("");
      setDescription("");
      setProgress(null);

      setTimeout(() => router.push("/admin/videos"), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
      setProgress(null);
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
          <div className="rounded-md border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>
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
