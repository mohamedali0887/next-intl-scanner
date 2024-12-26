# Next-Intl-Scanner

A tool to extract and manage internationalization messages from Next.js projects using the [next-intl](https://github.com/amannn/next-intl) package.

## Installation

To install the package, run the following command:

```bash
npm install next-intl-scanner
```

## Options

The following options can be used when running the tool:

- `--config` (Optional): Specifies the path to the configuration file if it is not located in the root of the project.
- `--help`: Displays a help message explaining the available options.
- `--version`: Displays the version number of the tool.

## Configuration

The tool can be configured using a `next-intl-scanner.config.js` or `next-intl-scanner.config.json` file in the root of the project. The configuration file should export an object with the following properties:

```javascript
{
  locales: ["en", "ar"], // Array of locales used in i18n.t
  sourceDirectory: "./", // Directory to scan for i18n keys
  outputDirectory: "./messages", // Directory for generated JSON files
  pages: [
    {
      match: "./src/**/*.{js,jsx,ts,tsx}", // Glob pattern to match files for scanning
      ignore: ["**/*.test.{js,jsx,ts,tsx}", "**/_*.js"], // Glob pattern to ignore certain files
    },
  ],
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

4. **`pages`**:  
   An array of objects containing the following properties:

   - `match`: A glob pattern to specify which files to scan for translation keys.
   - `ignore`: A glob pattern to specify which files to exclude from scanning.

5. **`ignore`**:  
   An array of glob patterns that define directories or files to ignore during the scan.

## Usage

To extract internationalization messages, use the following command:

```bash
npx next-intl-scanner extract [options]
```

## Usage Example

### 1. Create a Configuration File

Create a configuration file named `next-intl-scanner.config.js` in the root of your project with the following content:

```javascript
module.exports = {
  locales: ["en", "ar"], // Supported locales
  sourceDirectory: "./", // Directory to scan
  outputDirectory: "./messages", // Directory to save the extracted JSON files
  pages: [
    {
      match: "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS/TS files in src directory
      ignore: ["**/*.test.{js,jsx,ts,tsx}", "**/_*.js"], // Ignore test files and private files
    },
  ],
  ignore: ["**/node_modules/**", "**/.next/**"], // Ignore build and dependency directories
};
```

### 2. Include Strings in the Code

Below is an example of including strings directly in the code using the `t()` function from `next-intl`:

```javascript
import useTranslations from "next-intl";

const Test = () => {
  const t = useTranslations();

  return (
    <div>
      <h1>{t("Hello Test!")}</h1>
      <h2>{t("Insert text directly")}</h2>
      <h3>
        {t(
          "Hello, {name}! You can use this tool to extract strings for {package}.",
          {
            name: "John",
            package: "react-intl",
          }
        )}
      </h3>
    </div>
  );
};

export default Test;
```

### Explanation of the Example

1. **`t("Hello Test!")`**:  
   Directly translates the string "Hello Test!" using the default locale.

2. **`t("Insert text directly")`**:  
   Another simple translation example.

3. **`t("Hello, {name}...")`**:  
   Demonstrates dynamic message interpolation with placeholders (`{name}` and `{package}`).

### 3. Run the Tool to Extract Strings

After configuring the file and including translation keys in the code, run the following command to extract the strings:

```bash
npx next-intl-scanner extract
```

### 4. Expected Output

Running the tool will generate a JSON file `messages/en.json` with the following content:

```json
{
  "common": {
    "Hello Test!": "Hello Test!",
    "Insert text directly": "Insert text directly",
    "Hello, {name}! You can use this tool to extract strings for {package}": "Hello, {name}! You can use this tool to extract strings for {package}"
  }
}
```
