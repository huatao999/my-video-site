import {useTranslations} from "next-intl";
import VideosClient from "@/components/pages/VideosClient";

type Props = {
  params: Promise<{locale: string}>;
};

export default async function VideosPage({params}: Props) {
  const {locale} = await params;
  const t = useTranslations("videos");

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
