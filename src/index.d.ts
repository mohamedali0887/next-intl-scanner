declare module "next-intl-scanner" {
  export function useTranslations(
    namespace?: string
  ): (
    key: string,
    params?: Record<string, any>,
    defaultValue?: string
  ) => string;
}
