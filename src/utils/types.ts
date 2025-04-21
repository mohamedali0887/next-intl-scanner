export type DefaultOptions = {
  config?: string;
  version?: boolean;
  overwrite?: boolean;
  autoTranslate?: boolean;
  defaultLocale?: string;
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
      key: string;
    };
  }[];
  pages: {
    match: string;
    ignore: string[];
  }[];
  ignore: string[];
};
