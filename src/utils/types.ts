export type DefaultOptions = {
  config?: string;
  version?: boolean;
};

export type Config = {
  locales: string[];
  sourceDirectory: string;
  outputDirectory: string;
  defaultLocale: string;
  defaultNamespace: string;
  pages: {
    match: string;
    ignore: string[];
  }[];
  ignore: string[];
};
