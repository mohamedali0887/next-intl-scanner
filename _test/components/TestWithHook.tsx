//@ts-nocheck
import { useTranslations as useNextTranslations } from "next-intl";

export const useTranslations = (namespace: string) => {
  const t = useNextTranslations(namespace);

  return (
    key: string,
    args: Record<string, string | number | Date> = {},
    _message: string
  ) => {
    return t(key, args);
  };
};

const TestWithHook = () => {
  const t = useTranslations("customHook");

  return (
    <div>
      {t(
        "anErrorOccurredDuringAuthenticationPleaseTryAgainLaterOrContactSupport",
        {},
        "An error occurred during authentication, please try again later or contact support."
      )}
      {t("testKey", {}, "Test Message")}
      {t("test2", {}, "Don't")}
    </div>
  );
};

export default TestWithHook;
