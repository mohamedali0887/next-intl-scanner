export type DefaultOptions = {
  config?: string;
  version?: boolean;
};

export type Config = {
  locales: string[];
  sourceDirectory: string;
  outputDirectory: string;
  defaultLocale: string;
  pages: {
    match: string;
    ignore: string[];
  }[];
  ignore: string[];
};
