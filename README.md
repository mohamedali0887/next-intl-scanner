# Next-Intl-Scanner

A tool to extract and manage internationalization messages from Next.js projects using the [next-intl](https://github.com/amannn/next-intl) package.

## Installation

To install the package, run the following command:

```bash
npm install next-intl-scanner
```

## Prerequisites

For auto-translation functionality, you need to:

1. Set up a Google Cloud project
2. Enable the Cloud Translation API
3. Create an API key
4. Set the API key as an environment variable:

```bash
export GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

## Options

The following options can be used when running the tool:

- `--config` (Optional): Specifies the path to the configuration file if it is not located in the root of the project.
- `--overwrite` (Optional): Overwrite existing translations. By default, existing translations are preserved.
- `--auto-translate` (Optional): Automatically translate strings using Google Translate API.
- `--help`: Displays a help message explaining the available options.
- `--version`: Displays the version number of the tool.

## Configuration

The tool can be configured using a `next-intl-scanner.config.js` or `next-intl-scanner.config.json` file in the root of the project. The configuration file should export an object with the following properties:

```javascript
{
  locales: ["en", "ar"], // Array of locales used in i18n.t
  sourceDirectory: "./", // Directory to scan for i18n keys
  outputDirectory: "./messages", // Directory for generated JSON files
  defaultLocale: "en", // Default locale for the project
  pages: [
    {
      match: "./src/**/*.{js,jsx,ts,tsx}", // Glob pattern to match files for scanning
      ignore: ["**/*.test.{js,jsx,ts,tsx}", "**/_*.js"], // Glob pattern to ignore certain files
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
  ignore: ["**/node_modules/**", "**/.next/**"], // Glob patterns to ignore directories
}
```

### Configuration Properties Explained

1. **`locales`**:  
   An array of locale strings (e.g., `["en", "ar"]`). These represent the languages used in the project.

2. **`sourceDirectory`**:  
   The root directory where the tool will search for internationalization keys.

3. **`outputDirectory`**:  
   The directory where the extracted message JSON files will be saved.

4. **`defaultLocale`**:  
   The default locale of the project. Used for auto-translation and reference.

5. **`pages`**:  
   An array of objects containing the following properties:

   - `match`: A glob pattern to specify which files to scan for translation keys.
   - `ignore`: A glob pattern to specify which files to exclude from scanning.

6. **`customJSXPattern`**:  
   An array of objects defining custom JSX components to scan for translations. Each object should contain:

   - `element`: The name of the JSX component
   - `attributes`: An object mapping attribute names to their purposes (namespace and string)

7. **`ignore`**:  
   An array of glob patterns that define directories or files to ignore during the scan.

## Usage

To extract internationalization messages, use the following command:

```bash
npx next-intl-scanner extract [options]
```

### Examples

```bash
# Basic extraction (preserves existing translations)
npx next-intl-scanner extract

# Overwrite existing translations
npx next-intl-scanner extract --overwrite

# Use custom config file
npx next-intl-scanner extract --config ./custom.config.js

# Auto-translate new strings
npx next-intl-scanner extract --auto-translate
```

## Usage Example

### 1. Create a Configuration File

Create a configuration file named `next-intl-scanner.config.js` in the root of your project with the following content:

```javascript
module.exports = {
  locales: ["en", "ar"], // Supported locales
  sourceDirectory: "./", // Directory to scan
  outputDirectory: "./messages", // Directory to save the extracted JSON files
  defaultLocale: "en", // Default locale
  pages: [
    {
      match: "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS/TS files in src directory
      ignore: ["**/*.test.{js,jsx,ts,tsx}", "**/_*.js"], // Ignore test files and private files
    },
  ],
  customJSXPattern: [
    {
      element: "FormattedMessage",
      attributes: {
        namespace: "namespace",
        string: "string",
      },
    },
  ],
  ignore: ["**/node_modules/**", "**/.next/**"], // Ignore build and dependency directories
};
```

### 2. Include Strings in the Code

The tool supports multiple ways to include translation strings:

#### Using the custom useTranslations hook (Recommended)

We highly recommend using our custom `useTranslations` hook instead of the standard next-intl hook. This is because:

1. It supports namespaced translations for better organization
2. It allows using dots in translation keys (e.g., "Hello.World")
3. It provides better type safety and autocompletion
4. It handles nested translations more efficiently

```javascript
import { useTranslations } from "next-intl-scanner";

const TestWithHook = () => {
  // Using with namespace
  const t = useTranslations("customHook");

  return (
    <div>
      {/* Using dots in keys is safe with our custom hook */}
      <h1>{t("welcome.message", {}, "Welcome to our app!")}</h1>
      <h2>{t("user.greeting", { name: "John" }, "Hello, {name}!")}</h2>
    </div>
  );
};
```

#### Using the standard next-intl hook (Not Recommended)

⚠️ **Important**: When using the standard next-intl hook, you cannot use dots in translation keys. For example, "Hello.World" would cause an error. Instead, use underscores or camelCase.

```javascript
import useTranslations from "next-intl";

const Test = () => {
  const t = useTranslations();

  return (
    <div>
      {/* Avoid using dots in keys with standard hook */}
      <h1>{t("welcome_message")}</h1>
      <h2>{t("userGreeting", { name: "John" })}</h2>
    </div>
  );
};
```

#### Using custom JSX components:

```jsx
<FormattedMessage namespace="Formatted message" string="formatted string" />
```

## Key Naming Best Practices

1. **With Custom Hook (Recommended)**:

   - Use dots for nested keys: `"user.profile.name"`
   - Use meaningful namespaces: `"auth.login.error"`
   - Keep keys descriptive and hierarchical

2. **With Standard Hook (Not Recommended)**:
   - Use underscores instead of dots: `"user_profile_name"`
   - Use camelCase: `"userProfileName"`
   - Avoid special characters in keys

## Features

- Extracts translations from both standard and custom hooks
- Supports namespaced translations
- Preserves existing translations by default
- Option to overwrite existing translations
- Supports custom JSX components
- Auto-translation support for new strings
- Handles template literals and string interpolation
- Supports multiple file patterns and ignore rules

## Output Format

The tool generates JSON files for each locale in the specified output directory. The structure of the output depends on how the translations are used:

1. Direct translations (no namespace):

```json
{
  "Hello Test!": "Hello Test!",
  "Insert text directly": "Insert text directly"
}
```

2. Namespaced translations:

```json
{
  "customHook": {
    "testKey": "Test Message."
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
