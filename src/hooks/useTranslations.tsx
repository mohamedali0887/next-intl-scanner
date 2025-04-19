//@ts-nocheck
let useNextTranslations;
try {
  useNextTranslations = require("next-intl").useTranslations;
} catch (e) {
  // Mock implementation for extraction purposes
  useNextTranslations = () => (key) => key;
}

export const useTranslations = (namespace: string) => {
  //here we should actually return the t function that will get the custom arguments, then
  // we can use the useNextTranslations to get the translations

  const t = (
    key: string,
    args: Record<string, string | number | Date>,
    _message: string
  ) => {
    return useNextTranslations(namespace)(key, args);
  };

  return t;
};
