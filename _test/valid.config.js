module.exports = {
  locales: ["en", "ar"],
  sourceDirectory: "./_test",
  outputDirectory: "./_test/messages",
  pages: [
    {
      match: "**/*.{js,jsx,ts,tsx}",
      ignore: ["**/ignore/**"],
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
  ignore: ["**/node_modules/**", "**/.next/**"],
};
