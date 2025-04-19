//@ts-nocheck
import { useTranslations } from "../../src/hooks/useTranslations";

const TestWithHook = () => {
  const t = useTranslations("customHook");

  return <div>{t("testKey", {}, "Test Message.")}</div>;
};

export default TestWithHook;
