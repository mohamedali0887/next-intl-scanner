module.exports = {
  locales: "invalid value",
  sourceDirectory: "./",
  outputDirectory: "./messages",
  pages: [
    {
      match: "./src/**/*.{js,jsx,ts,tsx}",
      ignore: ["**/*.test.{js,jsx,ts,tsx}", "**/_*.js"],
    },
  ],
  ignore: ["**/node_modules/**", "**/.next/**"],
};
