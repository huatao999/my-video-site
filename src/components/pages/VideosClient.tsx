"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {useTranslations} from "next-intl";
import VideoThumbnail from "@/components/video/VideoThumbnail";

type VideoItem = {
  key: string;
  size: number;
  lastModified: string;
  title: string;
  description?: string;
  coverUrl?: string;
  videoPreviewUrl?: string;
};

type VideosResponse = {
  videos: VideoItem[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
  keyCount: number;
};

export default function VideosClient({locale = "zh"}: {locale?: string}) {
  const t = useTranslations("videos");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // 封面使用流式代理 URL，避免 R2 预签名 URL 的 CORS 问题
  function getCoverStreamUrl(coverKey: string): string {
    return `/api/videos/stream?key=${encodeURIComponent(coverKey)}`;
  }

  async function loadVideos(title?: string, continuationToken?: string) {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (title && title.trim()) params.set("title", title.trim());
      if (continuationToken) params.set("continuationToken", continuationToken);
      params.set("maxKeys", "20");
      params.set("locale", locale);

      const res = await fetch(`/api/videos/list?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `加载视频列表失败：${res.status}`);
      }

      const data = (await res.json()) as VideosResponse;

      const videosWithCovers = data.videos.map((video) => {
        if (video.coverUrl) {
          const coverUrl =
            video.coverUrl.startsWith("http://") ||
            video.coverUrl.startsWith("https://") ||
            video.coverUrl.startsWith("data:")
              ? video.coverUrl
              : getCoverStreamUrl(video.coverUrl);
          return {...video, coverUrl};
        }
        return video;
      });

      if (continuationToken) {
        setVideos((prev) => [...prev, ...videosWithCovers]);
      } else {
        setVideos(videosWithCovers);
      }
      setNextToken(data.nextContinuationToken || null);
      setHasMore(data.isTruncated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  function handleSearch() {
    if (loading) return;
    const title = searchQuery.trim() || undefined;
    setNextToken(null);
    setHasMore(false);
    setError(null);
    loadVideos(title);
  }

  function handleLoadMore() {
    if (nextToken && !loading) loadVideos(searchQuery.trim() || undefined, nextToken);
  }

  function getVideoUrl(videoKey: string): string {
    return `/${locale}/videos/${encodeURIComponent(videoKey)}`;
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {year: "numeric", month: "short", day: "numeric"});
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleSearch();
          }}
          placeholder={t("searchPlaceholder")}
          className="min-h-[44px] flex-1 touch-manipulation rounded-md border border-neutral-700 bg-neutral-950 px-3 py-3 text-sm text-neutral-50 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="min-h-[44px] min-w-[80px] touch-manipulation rounded-md bg-white px-4 py-3 text-sm font-semibold text-black transition-colors active:bg-neutral-200 disabled:opacity-50"
        >
          {t("search")}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {loading && videos.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="text-sm text-neutral-400">{t("loading")}</div>
        </div>
      )}

      {!loading && videos.length === 0 && !error && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-8 text-center">
          <p className="text-sm text-neutral-400">{t("noVideos")}</p>
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Link
              key={video.key}
              href={getVideoUrl(video.key)}
              className="group rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 text-left transition-all hover:border-neutral-700 hover:bg-neutral-900/50 active:bg-neutral-900/60 touch-manipulation"
            >
              <div className="mb-3 aspect-video w-full overflow-hidden">
                <VideoThumbnail
                  coverUrl={video.coverUrl}
                  videoUrl={video.videoPreviewUrl}
                  alt={video.title}
                  className="h-full w-full"
                />
              </div>
              <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-neutral-50 group-hover:text-white">
                {video.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>{formatFileSize(video.size)}</span>
                <span>{formatDate(video.lastModified)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && videos.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loading || !nextToken}
            className="min-h-[44px] touch-manipulation rounded-md border border-neutral-700 bg-neutral-900/50 px-6 py-3 text-sm text-neutral-300 transition-colors hover:bg-neutral-900 active:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? t("loading") : t("loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
