//@ts-nocheck

import { useTranslations } from "./TestWithHook";

const Test = () => {
  const t = useTranslations("customNamespace");

  const test = "test";
  return (
    <div>
      <h1>{t("helloNamespace", {}, "Hello Namespace!")}</h1>
      <h1>{t("dont", {}, "Don't")}</h1>
      <h1>{t("dontQuotes", {}, 'double " inside "')}</h1>
      <h1>{t("singleQuotes", {}, "single ' inside '")}</h1>
      <h1>{t("mixedQuotes", {}, 'mixed " and \' quotes')}</h1>
      <h1>{t("escapedQuotes", {}, "escaped \" and \' quotes")}</h1>

    </div>
  );
};

export default Test;
