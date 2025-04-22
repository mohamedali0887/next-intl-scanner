//@ts-nocheck
import useTranslations from "next-intl";

const Test = () => {
  const t = useTranslations();

  const test = "test";
  return (
    <div>
      <h1>{t("Hello Test!")}</h1>
      <h1>{t("Hello World!")}</h1>
      {/* <h1>{t("Test with a. dot")}</h1> */}
      <h2>{t(`Insert text directly`)}</h2>
      <h3>
        {t(
          "Hello, {name}! You can use this tool to extract strings for {package}",
          {
            name: "John",
            package: "react-intl",
          }
        )}
      </h3>
    </div>
  );
};

export default Test;
