module.exports = {
  locales: ["en", "ar"],
  defaultNamespace: "common",
  sourceDirectory: "./_test",
  outputDirectory: "./_test/messages",
  pages: [
    {
      match: "**/*.{js,jsx,ts,tsx}",
      ignore: ["**/ignore/**"],
    },
  ],
  ignore: ["**/node_modules/**", "**/.next/**"],
};
