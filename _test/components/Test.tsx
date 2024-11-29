//@ts-nocheck
import useTranslations from "next-intl";

const Test = () => {
  const t = useTranslations();
  return <div>{t("Hello Test!")}</div>;
};

export default Test;
