"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import VideoPlayer from "@/components/video/VideoPlayer";

type VideoItem = {
  key: string;
  size: number;
  lastModified: string;
  title: string;
  description: string;
  coverUrl?: string;
};

type VideosResponse = {
  videos: VideoItem[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
  keyCount: number;
};

export default function HomeClient() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState<string>("ep1.mp4");
  const [playUrl, setPlayUrl] = useState<string>("");
  const [playLoading, setPlayLoading] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/videos/list?locale=zh&maxKeys=20`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `加载视频列表失败：${res.status}`);
      }

      const data = (await res.json()) as VideosResponse;

      const videosWithCovers = await Promise.all(
        data.videos.map(async (video) => {
          if (video.coverUrl) {
            try {
              const coverRes = await fetch(
                `/api/videos/presign-play?key=${encodeURIComponent(video.coverUrl)}&expires=3600`
              );
              if (coverRes.ok) {
                const coverData = await coverRes.json();
                return {...video, coverUrl: coverData.url};
              }
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error("Failed to load cover:", e);
            }
          }
          return video;
        })
      );

      setVideos(videosWithCovers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  async function handlePlay() {
    if (!videoKey.trim()) return;

    setPlayError(null);
    setPlayLoading(true);

    try {
      const res = await fetch(`/api/videos/presign-play?key=${encodeURIComponent(videoKey.trim())}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `获取播放 URL 失败：${res.status}`);
      }
      const data = await res.json();
      setPlayUrl(data.url);
    } catch (e) {
      setPlayError(e instanceof Error ? e.message : "未知错误");
      setPlayUrl("");
    } finally {
      setPlayLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {loading && videos.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="text-sm text-neutral-400">加载中...</div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && videos.length === 0 && !error && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-8 text-center">
          <p className="text-sm text-neutral-400">暂无视频</p>
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Link
              key={video.key}
              href={`/videos/${encodeURIComponent(video.key)}`}
              className="group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/30 transition-all hover:border-neutral-700 hover:bg-neutral-900/50 active:bg-neutral-900/60 touch-manipulation"
            >
              <div className="aspect-video w-full overflow-hidden bg-neutral-950">
                {video.coverUrl ? (
                  <img
                    src={video.coverUrl}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex h-full items-center justify-center">
                            <svg class="h-12 w-12 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="h-12 w-12 text-neutral-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-neutral-50 group-hover:text-white">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="mb-2 line-clamp-2 text-xs text-neutral-400">{video.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
        <div className="mb-2 text-sm font-semibold">视频播放测试</div>
        <p className="mb-3 text-xs text-neutral-400">输入视频 key（例如：ep1.mp4）来测试播放功能：</p>
        <div className="grid gap-2">
          <label className="grid gap-1">
            <span className="text-xs text-neutral-300">视频 Key（R2 bucket 中的文件名）</span>
            <input
              type="text"
              value={videoKey}
              onChange={(e) => setVideoKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !playLoading && videoKey.trim()) handlePlay();
              }}
              placeholder="ep1.mp4"
              className="block w-full min-h-[44px] touch-manipulation rounded-md border border-neutral-700 bg-neutral-950 px-3 py-3 text-xs"
            />
          </label>
          <button
            onClick={handlePlay}
            disabled={!videoKey.trim() || playLoading}
            className="min-h-[44px] touch-manipulation rounded-md bg-white px-4 py-3 text-xs font-semibold text-black transition-colors active:bg-neutral-200 disabled:opacity-50"
          >
            {playLoading ? "获取播放 URL..." : "播放视频"}
          </button>
          {playError && <div className="text-xs text-red-300">错误：{playError}</div>}
        </div>
      </div>

      {playUrl && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3">
          <div className="mb-2 text-xs text-neutral-300">R2 播放（预签名 URL）</div>
          <VideoPlayer key={playUrl} src={playUrl} poster="" vastTagUrl={null} />
        </div>
      )}
    </div>
  );
}
