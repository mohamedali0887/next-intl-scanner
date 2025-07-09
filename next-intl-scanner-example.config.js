module.exports = {
  // Source directory to scan
  sourceDirectory: "src",

  // Output directory for translation files
  outputDirectory: "src/locales",

  // Supported locales
  locales: ["en", "ar", "fr", "es"],

  // Default locale
  defaultLocale: "en",

  // Files to scan (supports glob patterns)
  pages: [
    {
      match: "**/*.{js,jsx,ts,tsx}",
      ignore: [
        "**/*.test.{js,jsx,ts,tsx}",
        "**/*.spec.{js,jsx,ts,tsx}",
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
      ],
    },
  ],

  // Global ignore patterns
  ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**"],

  // Custom JSX patterns to extract translations from
  customJSXPattern: [
    {
      element: "FormattedMessage",
      attributes: {
        namespace: "namespace",
        string: "string",
        messageKey: "messageKey",
      },
    },
  ],

  // Note: Currently only Google Translate API v2 is supported
  // Make sure that you have set the GOOGLE_TRANSLATE_API_KEY environment variable
  // If you need support for other translation services, please create an issue on GitHub
};
