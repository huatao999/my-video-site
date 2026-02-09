"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslations} from "next-intl";
import VideoPlayer from "@/components/video/VideoPlayer";
import LikeButton from "@/components/video/LikeButton";
import CommentSection from "@/components/video/CommentSection";

export default function VideoDetailClient({videoKey}: {videoKey: string}) {
  const t = useTranslations("videos");
  const router = useRouter();
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用预签名 URL，浏览器直连 R2 播放，避免大文件通过 Netlify 代理的体积和超时限制
  useEffect(() => {
    let cancelled = false;

    async function loadPlayUrl() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/videos/presign-play?key=${encodeURIComponent(videoKey)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || data.error || `加载播放地址失败: ${res.status}`);
        }
        const data = (await res.json()) as {url: string};
        if (!cancelled) {
          setPlayUrl(data.url);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "加载播放地址失败";
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlayUrl();

    return () => {
      cancelled = true;
    };
  }, [videoKey]);

  const videoTitle = videoKey.split("/").pop()?.replace(/\.[^.]+$/, "") || videoKey;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="-ml-2 flex min-h-[44px] items-center gap-2 px-2 text-sm text-neutral-400 transition-colors hover:text-neutral-200 active:text-neutral-300 touch-manipulation"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t("backToList")}
      </button>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{videoTitle}</h1>
        <p className="text-xs text-neutral-400">{videoKey}</p>
      </div>

      {loading && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 text-sm text-neutral-400">
          加载播放地址中...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && playUrl && (
        <>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3">
            <VideoPlayer key={playUrl} src={playUrl} poster="" vastTagUrl={null} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            <LikeButton videoKey={videoKey} />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            <CommentSection videoKey={videoKey} />
          </div>
        </>
      )}
    </div>
  );
}
