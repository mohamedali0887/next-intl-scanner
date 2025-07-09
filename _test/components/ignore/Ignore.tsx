//@ts-nocheck
import { useTranslations } from "../TestWithHook";

const Test = () => {
  const t = useTranslations("");
  return <div>{t("Ignore")}</div>;
};

export default Test;
