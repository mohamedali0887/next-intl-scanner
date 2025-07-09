//@ts-nocheck

import { getTranslations as getNextTranslations } from "next-intl/server";

type TranslationFunction = (key: string, args?: Record<string, any>) => string;

export const getTranslations = async (locale: string, namespace: string) => {
  const t = (await getNextTranslations({
    locale,
    namespace: namespace as any,
  })) as TranslationFunction;
  return (
    key: string,
    args: Record<string, string | number | Date> = {},
    _message: string
  ) => t(key, args);
};

const ServerHook = async () => {
  const t = await getTranslations("en", "customHook");
  return <div>{t("testServerString", {}, "Test For Server Hook")}</div>;
};
