export type DefaultOptions = {
  config?: string;
  version?: boolean;
  overwrite?: boolean;
  autoTranslate?: boolean;
  defaultLocale?: string;
  clean?: boolean;
  watch?: boolean;
};

export type Config = {
  locales: string[];
  sourceDirectory: string;
  outputDirectory: string;
  defaultLocale: string;
  customJSXPattern: {
    element: string;
    attributes: {
      namespace: string;
      string: string;
      messageKey: string;
    };
  }[];
  pages: {
    match: string;
    ignore: string[];
  }[];
  ignore: string[];
};
