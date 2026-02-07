"use client";

import {useMemo} from "react";
import {useRouter} from "next/navigation";
import {useTranslations} from "next-intl";
import VideoPlayer from "@/components/video/VideoPlayer";
import LikeButton from "@/components/video/LikeButton";
import CommentSection from "@/components/video/CommentSection";

export default function VideoDetailClient({videoKey}: {videoKey: string}) {
  const t = useTranslations("videos");
  const router = useRouter();
  // 使用流式代理 URL，避免 R2 预签名 URL 的 CORS 问题
  const playUrl = useMemo(
    () => `/api/videos/stream?key=${encodeURIComponent(videoKey)}`,
    [videoKey]
  );

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

      {playUrl && (
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
