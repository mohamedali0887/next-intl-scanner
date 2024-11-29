# next-intl-scanner

A tool to extract and manage internationalization messages from Next.js projects using [next-intl](https://github.com/amannn/next-intl) package

## Installation

```bash
npm install next-intl-scanner
```

## Usage

```bash
npx next-intl-scanner extract [options]
```

## Options

- `--config` - Optional : Path to the configuration file if the file is not in the root of the project
- `--help` - Display help message
- `--version` - Display version number

## Configuration

The tool can be configured using a `next-intl-scanner.config.cjs` or
`next-intl-scanner.config.json`file in the root of the project. The configuration file should export an object with the following properties:

```javascript
{
  locales: ["en", "ar"], // array of locales used in i18n.t
  defaultNamespace: "common", // default namespace used  if useTranslations hook is used without namespace ( useTranslations())
  sourceDirectory: "./", // source directory to scan for i18n keys
  outputDirectory: "./messages", // output directory for generated json files
  pages: [
    // pages to scan for i18n keys
    {
      match: "./src/**/*.{js,jsx,ts,tsx}", // glob pattern to match files
      ignore: ["**/*.test.{js,jsx,ts,tsx}", "**/_*.js"], // glob pattern to ignore files
    },
  ],
  ignore: ["**/node_modules/**", "**/.next/**"], // glob pattern to ignore directories
};
```
