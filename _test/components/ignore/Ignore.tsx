//@ts-nocheck
import useTranslations from "next-intl";

const Test = () => {
  const t = useTranslations();
  return <div>{t("Ignore")}</div>;
};

export default Test;
