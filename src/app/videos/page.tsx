import {getTranslations, getLocale} from "next-intl/server";
import VideosClient from "@/components/pages/VideosClient";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const t = await getTranslations("videos");
  const locale = (await getLocale()) || "zh";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-neutral-300">{t("subtitle")}</p>
      </div>

      <VideosClient locale={locale} />
    </div>
  );
}
