# Next Intl Scanner

A powerful tool to extract and manage internationalization messages from Next.js projects using the [next-intl](https://github.com/amannn/next-intl) package. This tool helps automate the process of managing translations in your Next.js applications, making it easier to maintain multilingual projects.

## Installation

```bash
npm install next-intl-scanner --save-dev
# or
yarn add next-intl-scanner --dev
```

## Usage

### CLI Tool

This package is designed to be used as a CLI tool for extracting translations during build time or development.

```bash
next-intl-scanner extract
```

### Basic Usage

The simplest way to use Next Intl Scanner is to run the extract command:

```bash
npx next-intl-scanner extract
```

This will scan your project for translations using the default configuration.

### Advanced Usage

#### Using as a frontend hook to scan clean jsonKeys

the problem with using strings as keys is that there are some characters that are not allowed in jsonKeys like `.` and `:`, so we need to use a custom hook to scan the jsonKeys and return the clean keys.

To solve this, you can use a custom hook for translations, so that our custom scanner function will work with the clean keys.

```typescript
// hooks/useTranslation.ts
import { useTranslations } from "next-intl";

export function useCustomTranslation(namespace: string) {
  const t = useTranslations(namespace);

  return {
    t: (key: string, params?: Record<string, any>, message?: string) => {
      try {
        return t(key, params);
      } catch (error) {
        // Fallback to message or key if translation is missing
        return message || key;
      }
    },
  };
}

// Usage in components:
import { useCustomTranslation } from "@/hooks/useTranslation";

function MyComponent() {
  const { t } = useCustomTranslation("namespace");
  return <div>{t("key", {}, "fallback message")}</div>;
}
```

This approach:

1. Keeps the package focused on its main purpose - translation extraction
2. Avoids browser compatibility issues
3. Provides a clear separation between build-time and runtime functionality
4. Gives users flexibility in implementing their own translation hooks

#### Extract with Auto-translation

```bash
npx next-intl-scanner extract --auto-translate
```

#### Extract with Custom Config

```bash
npx next-intl-scanner extract --config ./custom.config.js
```

#### Extract and Overwrite

```bash
npx next-intl-scanner extract --overwrite
```

### Command Line Options

- `--config <path>`: Path to configuration file (default: `./next-intl-scanner.config.js`)
- `--auto-translate`: Enable auto-translation of extracted strings
- `--overwrite`: Overwrite existing translations (use with caution)
- `--version`: Display version information
- `--help`: Display help information

### Configuration

Create a `next-intl-scanner.config.js` file in your project root. Here's a detailed example:

```javascript
module.exports = {
  // Source files to scan (supports glob patterns)
  input: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.test.{js,jsx,ts,tsx}", // Exclude test files
    "!src/**/*.spec.{js,jsx,ts,tsx}", // Exclude spec files
  ],

  // Output directory for translation files
  output: "src/locales",

  // Supported locales
  locales: ["en", "ar", "fr", "es"],

  // Default locale
  defaultLocale: "en",

  // Note: Currently only Google Translate API v2 is supported , make sure that you have set the GOOGLE_TRANSLATE_API_KEY environment variable
  // If you need support for other translation services, please create an issue on GitHub
};
```

### Auto-translation

To enable auto-translation, you need to set the `GOOGLE_TRANSLATE_API_KEY` environment variable and use the `--auto-translate` flag.

```bash
export GOOGLE_TRANSLATE_API_KEY=<your-api-key>
```

### Integration with Next.js

Add the scanner to your build process by updating your `package.json`:

```json
{
  "scripts": {
    "extract-translations": "next-intl-scanner extract",
    "build": "next-intl-scanner extract && next build"
  }
}
```

## Features

- 🔍 **Smart Extraction**: Automatically extracts translations from your source code
- 📝 **Multi-format Support**: Works with JS, JSX, TS, and TSX files
- 🌐 **Auto-translation**: Currently supports Google Translate API v2 (other translation services can be requested via GitHub issues)
- 💾 **Safe Merging**: Preserves existing translations by default
- 📁 **Namespace Support**: Handles nested translations and namespaces
- ⚠️ **Error Handling**: Comprehensive error reporting and logging
- 🔄 **Configurable**: Highly customizable through configuration options
- 🛠️ **Developer Friendly**: Simple CLI interface with helpful commands

## Best Practices

1. **Regular Extraction**: Run the scanner regularly to keep translations up to date
2. **Version Control**: Commit translation files to version control
3. **Review Translations**: Always review auto-translated content
4. **Use Namespaces**: Organize translations using namespaces for better maintainability
5. **Environment Variables**: Store API keys in environment variables
6. **Exclude Test Files**: Add test files to the exclude patterns in your config
7. **Backup Translations**: Keep backups of your translation files before using the `--overwrite` option

## Troubleshooting

### Common Issues

1. **Missing Translations**

   - Ensure your source files are included in the `input` patterns
   - Check that the file extensions are correctly specified
   - Verify that the files contain valid translation keys

2. **Auto-translation Not Working**

   - Verify your API key is correctly set in the environment variables
   - Check that the translation service is properly configured
   - Ensure you have sufficient API credits/quota

3. **Configuration Errors**
   - Make sure your config file is valid JavaScript
   - Verify all required fields are present
   - Check that file paths are correct

### Getting Help

If you encounter any issues or have questions:

1. Check the [GitHub Issues](https://github.com/yourusername/next-intl-scanner/issues) for similar problems
2. Create a new issue with details about your problem
3. Include your configuration and error messages
4. For feature requests (like additional translation services), please create an issue with the "enhancement" label

## Requirements

- Node.js >= 14.0.0
- Next.js project using react-intl
- npm or yarn package manager

## License

MIT
