# Next Intl Scanner

A tool to extract and manage internationalization messages from Next.js projects using the [next-intl](https://github.com/amannn/next-intl) package.

## Installation

```bash
npm install next-intl-scanner --save-dev
# or
yarn add next-intl-scanner --dev
```

## Usage

### Basic Usage

```bash
npx next-intl-scanner extract
```

### Options

- `--config <path>`: Path to configuration file (default: `./next-intl-scanner.config.js`)
- `--auto-translate`: Enable auto-translation of extracted strings
- `--version`: Display version information
- `--help`: Display help information

### Configuration

Create a `next-intl-scanner.config.js` file in your project root:

```javascript
module.exports = {
  input: ["src/**/*.{js,jsx,ts,tsx}"],
  output: "src/locales",
  locales: ["en", "ar"],
  defaultLocale: "en",
};
```

## Features

- Extracts translations from source files
- Supports multiple file formats (JS, JSX, TS, TSX)
- Auto-translation support using Google Translate API
- Preserves existing translations by default
- Handles namespaces and nested translations
- Error handling and logging

## Requirements

- Node.js >= 14.0.0
- Next.js project using react-intl

## License

MIT
