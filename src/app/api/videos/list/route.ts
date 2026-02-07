import {ListObjectsV2Command} from "@aws-sdk/client-s3";
import {z} from "zod";
import {env} from "@/lib/env";
import {getR2Client} from "@/lib/r2/client";
import {getVideoMetadataBatch} from "@/lib/video-metadata/store";
import {locales, type Locale} from "@/i18n/locales";

const querySchema = z.object({
  prefix: z.string().optional(),
  title: z.string().optional(), // 按视频标题搜索
  maxKeys: z.coerce.number().int().min(1).max(1000).default(100),
  continuationToken: z.string().optional(),
  locale: z.enum([...locales] as [Locale, ...Locale[]]).optional(), // 语言过滤
});

// Common video file extensions
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".m3u8"];

function isVideoFile(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lowerKey.endsWith(ext));
}

/**
 * 根据视频 key 和 locale 推断默认封面路径。
 * ep1.mp4 + zh -> covers/ep1-zh.jpg
 * ep1_en.mp4 + en -> covers/ep1-en.jpg（去除 _en 后缀）
 */
function inferDefaultCoverKey(videoKey: string, locale?: string): string {
  let basename = videoKey.split("/").pop()?.replace(/\.[^.]+$/, "") || videoKey;
  if (locale === "en" && basename.endsWith("_en")) {
    basename = basename.slice(0, -3); // ep1_en -> ep1
  }
  const suffix = locale === "en" ? "-en" : "-zh";
  return `covers/${basename}${suffix}.jpg`;
}

export async function GET(req: Request) {
  try {
    if (!env.R2_BUCKET) {
      return Response.json(
        {
          error: "R2_BUCKET missing",
          hint: "请在 Netlify Site settings > Environment variables 中设置 R2_BUCKET、R2_ACCOUNT_ID、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY",
        },
        {status: 500}
      );
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return Response.json({error: "Invalid query", details: parsed.error.flatten()}, {status: 400});
    }

    const {prefix, title, maxKeys, continuationToken, locale} = parsed.data;
    const client = getR2Client();

    // 如果使用标题搜索，需要获取更多视频以便正确过滤和分页
    // 因为标题搜索是在内存中进行的，我们需要获取更多数据
    const fetchMaxKeys = title && title.trim() ? Math.max(maxKeys * 3, 150) : maxKeys;

    const effectivePrefix = prefix || env.R2_PREFIX || undefined;

    const command = new ListObjectsV2Command({
      Bucket: env.R2_BUCKET,
      Prefix: effectivePrefix,
      MaxKeys: fetchMaxKeys,
      ContinuationToken: continuationToken,
    });

    const response = await client.send(command);

    // Filter video files
    const videoObjects = (response.Contents || []).filter((obj) => obj.Key && isVideoFile(obj.Key));

    // 获取所有视频的元数据
    const videoKeys = videoObjects.map((obj) => obj.Key!);
    const metadataMap = await getVideoMetadataBatch(videoKeys);
    
    // eslint-disable-next-line no-console
    console.log("[videos/list] Loaded metadata:", {
      videoCount: videoKeys.length,
      metadataCount: metadataMap.size,
      videoKeys: videoKeys.slice(0, 5), // 只显示前5个
      metadataKeys: Array.from(metadataMap.keys()).slice(0, 5), // 只显示前5个
    });

    // Format response with metadata
    let videos = videoObjects
      .map((obj) => {
        const key = obj.Key!;
        const metadata = metadataMap.get(key);

        // 显示标题、描述、封面：优先使用元数据，无元数据时用文件名
        let displayTitle: string;
        let displayDescription: string;
        let displayCoverUrl: string | undefined;

        if (locale) {
          // 如果指定了语言，优先使用该语言的元数据
          const localeData = metadata?.locales[locale];
          if (localeData && localeData.title && localeData.title.trim() !== "") {
            displayTitle = localeData.title;
            displayDescription = localeData.description || "";
            displayCoverUrl = localeData.coverUrl || inferDefaultCoverKey(key, locale);
          } else {
            // 无该语言元数据时，用文件名作为标题，推断默认封面 covers/{basename}-zh.jpg
            displayTitle = key.split("/").pop()?.replace(/\.[^.]+$/, "") || key;
            displayDescription = "";
            displayCoverUrl = inferDefaultCoverKey(key, locale);
          }
        } else {
          // 如果没有指定语言（后台管理），优先使用第一个有标题的语言，否则使用文件名
          if (metadata) {
            // 找到第一个有标题的语言
            const firstLocaleWithTitle = locales.find((loc) => {
              const locData = metadata.locales[loc];
              return locData && locData.title && locData.title.trim() !== "";
            });
            
            if (firstLocaleWithTitle) {
              const localeData = metadata.locales[firstLocaleWithTitle];
              displayTitle = localeData.title;
              displayDescription = localeData.description || "";
              displayCoverUrl = localeData.coverUrl || inferDefaultCoverKey(key, locale);
            } else {
              // 如果没有找到任何有标题的语言，使用文件名和推断封面
              displayTitle = key.split("/").pop()?.replace(/\.[^.]+$/, "") || key;
              displayDescription = "";
              displayCoverUrl = inferDefaultCoverKey(key, locale);
            }
          } else {
            // 如果没有元数据，使用文件名和推断封面 covers/{basename}-zh.jpg
            displayTitle = key.split("/").pop()?.replace(/\.[^.]+$/, "") || key;
            displayDescription = "";
            displayCoverUrl = inferDefaultCoverKey(key, locale);
          }
        }

        return {
          key,
          size: obj.Size || 0,
          lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
          title: displayTitle,
          description: displayDescription,
          coverUrl: displayCoverUrl,
          metadata: metadata ? {
            locales: Object.keys(metadata.locales).filter((loc) => {
              const locData = metadata.locales[loc as Locale];
              return locData && locData.title && locData.title.trim() !== "";
            }),
          } : undefined,
        };
      })
      .filter((v) => v !== null)
      .filter((v) => {
        // 指定 locale 时按 key 过滤：zh 不显示 _en.mp4，en 只显示 _en.mp4
        if (!locale) return true;
        const key = v.key;
        const endsWithEn = key.endsWith("_en.mp4") || key.toLowerCase().endsWith("_en.webm");
        if (locale === "zh") return !endsWithEn;
        if (locale === "en") return endsWithEn;
        return true;
      }) as Array<{
      key: string;
      size: number;
      lastModified: string;
      title: string;
      description: string;
      coverUrl?: string;
      metadata?: {locales: string[]};
    }>;

    // 如果指定了标题搜索，进行过滤
    if (title && title.trim()) {
      const searchTitle = title.trim().toLowerCase();
      videos = videos.filter((video) => {
        // 在所有语言的标题中搜索
        if (video.metadata?.locales) {
          // 检查所有语言的标题
          const metadata = metadataMap.get(video.key);
          if (metadata) {
            for (const loc of video.metadata.locales) {
              const localeData = metadata.locales[loc as Locale];
              if (localeData?.title && localeData.title.toLowerCase().includes(searchTitle)) {
                return true;
              }
            }
          }
        }
        // 也检查当前显示的标题
        return video.title.toLowerCase().includes(searchTitle);
      });
      
      // 标题搜索时，由于是在内存中过滤，分页逻辑简化
      // 如果还有更多原始结果，继续获取；否则说明搜索完成
      return Response.json({
        videos,
        isTruncated: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken || null,
        keyCount: videos.length,
      });
    }

    return Response.json({
      videos,
      isTruncated: response.IsTruncated || false,
      nextContinuationToken: response.NextContinuationToken || null,
      keyCount: videos.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[videos/list] failed:", e);
    return Response.json({error: "List videos failed", message}, {status: 500});
  }
}
