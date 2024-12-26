module.exports = {
  locales: ["en", "ar"], // array of locales used in i18n.t
  sourceDirectory: "./", // source directory to scan for i18n keys
  outputDirectory: "./messages", // output directory for generated json files
  pages: [
    // pages to scan for i18n keys
    {
      match: "./src/**/*.{js,jsx,ts,tsx}", // glob pattern to match files
      ignore: ["**/*.test.{js,jsx,ts,tsx}", "**/_*.js"], // glob pattern to ignore files
    },
  ],
  customJSXPattern: [
    {
      element: "FormattedMessage", // JSX element name
      attributes: {
        namespace: "namespace", // attribute name to get namespace
        string: "string", // attribute name to get id
      },
    },
  ], // custom JSX components to scan

  ignore: ["**/node_modules/**", "**/.next/**"], // glob pattern to ignore directories
};
