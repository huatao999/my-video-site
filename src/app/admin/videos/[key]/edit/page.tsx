"use client";

import {useEffect, useState, useMemo} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";

type VideoMetadata = {
  videoKey: string;
  locales: Record<string, {title: string; description: string; coverUrl?: string}>;
  createdAt: string;
  updatedAt: string;
};

export default function AdminVideoEditPage() {
  const params = useParams();
  const videoKey = useMemo(() => {
    const rawKey = params.key as string;
    try {
      return decodeURIComponent(rawKey);
    } catch (e) {
      return rawKey;
    }
  }, [params.key]);

  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (videoKey) loadMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoKey]);

  useEffect(() => {
    if (!metadata) {
      setTitle("");
      setDescription("");
      setCoverUrl(null);
      setCoverPreview(null);
      setCoverFile(null);
      return;
    }
    const localeData = metadata.locales["zh"];
    setTitle(localeData?.title ?? "");
    setDescription(localeData?.description ?? "");
    setCoverUrl(localeData?.coverUrl ?? null);
    setCoverPreview(null);
    setCoverFile(null);
  }, [metadata]);

  async function loadMetadata() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/videos/${encodeURIComponent(videoKey)}/metadata`);
      if (!res.ok) {
        if (res.status === 404) {
          setMetadata({
            videoKey,
            locales: {zh: {title: "", description: ""}},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          throw new Error("加载元数据失败");
        }
      } else {
        const data = (await res.json()) as VideoMetadata;
        setMetadata(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("标题不能为空");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let finalCoverUrl = coverUrl;
      if (coverFile) {
        const coverData = coverPreview?.replace(/^data:image\/\w+;base64,/, "") || "";
        const contentType = coverFile.type || "image/jpeg";

        const coverRes = await fetch(`/api/admin/videos/${encodeURIComponent(videoKey)}/cover`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            locale: "zh",
            coverData,
            contentType,
          }),
        });

        if (!coverRes.ok) throw new Error("上传封面失败");

        const coverResult = await coverRes.json();
        finalCoverUrl = coverResult.coverUrl;
      }

      const res = await fetch(`/api/admin/videos/${encodeURIComponent(videoKey)}/metadata`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          locale: "zh",
          title: title.trim(),
          description: description.trim(),
          coverUrl: finalCoverUrl || undefined,
        }),
      });

      if (!res.ok) throw new Error("保存失败");

      const updatedMetadata = (await res.json()) as VideoMetadata;
      setMetadata(updatedMetadata);
      setSuccess(true);
      setCoverFile(null);
      setCoverPreview(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    async function loadCoverPreview(url: string) {
      try {
        const res = await fetch(`/api/videos/presign-play?key=${encodeURIComponent(url)}&expires=3600`);
        if (res.ok) {
          const data = await res.json();
          setCoverUrl(data.url);
        }
      } catch (e) {
        console.error("Failed to load cover preview:", e);
      }
    }

    if (coverUrl && !coverFile && !coverPreview && !coverUrl.startsWith("http")) {
      loadCoverPreview(coverUrl);
    }
  }, [coverUrl, coverFile, coverPreview]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-sm text-neutral-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">编辑视频</h1>
          <p className="mt-1 text-sm text-neutral-400">视频 Key: {videoKey}</p>
        </div>
        <Link
          href="/admin/videos"
          className="min-h-[44px] touch-manipulation rounded-md border border-neutral-700 bg-neutral-900/50 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-900 active:bg-neutral-800"
        >
          返回
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-green-800 bg-green-900/20 px-4 py-3 text-sm text-green-300">
          保存成功！
        </div>
      )}

      <div className="space-y-6 rounded-xl border border-neutral-800 bg-neutral-900/30 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium">视频封面</label>
          <div className="space-y-4">
            {(coverPreview || coverUrl) && (
              <div className="relative aspect-video max-w-md overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950">
                <img
                  src={coverPreview || coverUrl || ""}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              disabled={saving}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black file:hover:bg-neutral-200 file:cursor-pointer disabled:opacity-50"
            />
            <p className="text-xs text-neutral-400">支持 JPG、PNG、WebP 格式</p>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            视频标题
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入视频标题"
            disabled={saving}
            maxLength={200}
            required
            className="min-h-[44px] w-full touch-manipulation rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            视频简介
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="输入视频简介"
            disabled={saving}
            maxLength={2000}
            rows={6}
            className="w-full touch-manipulation rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="min-h-[44px] touch-manipulation rounded-md bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <Link
            href="/admin/videos"
            className="min-h-[44px] touch-manipulation rounded-md border border-neutral-700 bg-neutral-900/50 px-6 py-3 text-sm text-neutral-300 transition-colors hover:bg-neutral-900 active:bg-neutral-800"
          >
            取消
          </Link>
        </div>
      </div>
    </div>
  );
}
