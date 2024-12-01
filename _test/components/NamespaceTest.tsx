//@ts-nocheck
import useTranslations from "next-intl";

const Test = () => {
  const t = useTranslations("customNamespace");

  const test = "test";
  return (
    <div>
      <h1>{t("Hello Namespace!")}</h1>
    </div>
  );
};

export default Test;
