import fs from "fs";
import path from "path";
import { glob } from "glob";
import Logger from "./logger";
import type { Config, DefaultOptions } from "./types";
import { translateText } from "./translate";

const extractTranslations = async (config: Config, options: DefaultOptions) => {
  if (!config) {
    Logger.error("Could not load configuration file");
    return;
  }

  Logger.info("Extracting translations...");

  const basepath = path.resolve(process.cwd(), config.sourceDirectory);
  if (!fs.existsSync(basepath)) {
    Logger.error(`Source directory ${basepath} does not exist`);
    return;
  }

  // Process files in batches
  const BATCH_SIZE = 50;
  const allFiles: string[] = [];

  for (const page of config.pages) {
    const files = await new Promise<string[]>((resolve, reject) => {
      glob(
        page.match,
        { cwd: basepath, ignore: page.ignore.concat(config.ignore) },
        (err: Error | null, matches: string[]) => {
          if (err) reject(err);
          else resolve(matches);
        }
      );
    });
    allFiles.push(...files.map((file) => path.resolve(basepath, file)));
  }

  // Filter and validate custom patterns once
  const validCustomPatterns =
    config.customJSXPattern?.filter(
      (customPattern) =>
        customPattern.element &&
        customPattern.attributes &&
        customPattern.attributes.namespace &&
        customPattern.attributes.string
    ) || [];

  // Create output directory if it doesn't exist
  if (!fs.existsSync(config.outputDirectory)) {
    fs.mkdirSync(config.outputDirectory, { recursive: true });
  }

  // Process files in batches
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    const batchTranslations: {
      nameSpace: string;
      string: string;
      message?: string;
      key?: string;
    }[] = [];

    for (const file of batch) {
      const source = fs.readFileSync(file, "utf-8");
      if (!source) {
        Logger.error(`Could not read file: ${file}`);
        continue;
      }

      const nameSpaceMatch = source.match(
        /\buseTranslations\(['"](.+?)['"]\)/g
      );
      const nameSpace =
        nameSpaceMatch?.[0]?.replace(
          /\buseTranslations\(['"](.+?)['"]\)/,
          "$1"
        ) || "";

      // Process translations
      const customHookRegex =
        /\bt\s*\(\s*['"`]([^'"`]+?)['"`]\s*,\s*\{[^}]*\}\s*,\s*['"`]([^'"`]+?)['"`]/g;
      const standardHookRegex = /\bt\s*\(\s*['"`]([^'"`]+?)['"`]/g;

      let match;
      const customHookKeys = new Set<string>();

      // Process custom hooks
      while ((match = customHookRegex.exec(source)) !== null) {
        const [_, key, message] = match;
        batchTranslations.push({
          nameSpace,
          string: key,
          message,
          key: nameSpace ? undefined : key,
        });
        customHookKeys.add(key);
      }

      // Process standard hooks
      while ((match = standardHookRegex.exec(source)) !== null) {
        const [_, key] = match;
        if (!customHookKeys.has(key)) {
          batchTranslations.push({
            nameSpace,
            string: key,
            message: key,
            key: nameSpace ? undefined : key,
          });
        }
      }

      // Process custom JSX patterns
      for (const pattern of validCustomPatterns) {
        const tagRegex = new RegExp(`<${pattern.element}[^>]*?>`, "g");
        while ((match = tagRegex.exec(source)) !== null) {
          const tag = match[0];
          console.log("Found tag:", tag);
          const attributeRegex = /(\w+)=["']?\{(.*?)\}["']?/g;
          const attributes: Record<string, string> = {};

          let attributeMatch;
          while ((attributeMatch = attributeRegex.exec(tag)) !== null) {
            console.log("attr1 (name):", attributeMatch[1]);
            console.log("attr2 (value):", attributeMatch[2]);
            const attrName = attributeMatch[1];
            const attrValue = attributeMatch[2]
              .trim()
              .replace(/^['"`]|['"`]$/g, "");
            console.log("Final attrName:", attrName);
            console.log("Final attrValue:", attrValue);
            attributes[attrName] = attrValue;
          }

          console.log("Final attributes:", attributes);
          console.log("Pattern attributes:", pattern.attributes);

          if (
            attributes[pattern.attributes.string] &&
            attributes[pattern.attributes.namespace]
          ) {
            const translation = {
              nameSpace: attributes[pattern.attributes.namespace],
              string: attributes[pattern.attributes.string],
              message: attributes[pattern.attributes.string],
              key: attributes[pattern.attributes.key] || undefined,
            };
            console.log("Adding translation:", translation);
            batchTranslations.push(translation);
          }
        }
      }
    }

    // Write translations for this batch
    if (config.locales?.length) {
      for (const locale of config.locales) {
        const localeFile = path.resolve(
          config.outputDirectory,
          `${locale}.json`
        );
        let localeTranslations: Record<
          string,
          string | Record<string, string>
        > = {};

        if (fs.existsSync(localeFile)) {
          try {
            localeTranslations = JSON.parse(
              fs.readFileSync(localeFile, "utf-8")
            );
          } catch (error) {
            Logger.error(
              `Error parsing JSON file for locale ${locale}: ${error}`
            );
          }
        }

        // Process translations for this batch
        for (const translation of batchTranslations) {
          const { nameSpace, string, message, key } = translation;
          if (isNaN(Number(string))) {
            if (nameSpace) {
              if (!localeTranslations[nameSpace]) {
                localeTranslations[nameSpace] = {};
              }
              const namespaceObj = localeTranslations[nameSpace] as Record<
                string,
                string
              >;
              const translationKey = key || string;
              if (options.overwrite || !namespaceObj[translationKey]) {
                namespaceObj[translationKey] = message || string;
              }
            } else if (options.overwrite || !localeTranslations[string]) {
              const translationKey = key || string;
              localeTranslations[translationKey] = message || string;
            }
          }
        }

        // Auto-translate if enabled and not the default locale
        if (options.autoTranslate && locale !== options.defaultLocale) {
          Logger.info(`Auto-translating content for locale: ${locale}`);
          const translatedContent = await translateContent(
            localeTranslations,
            options.defaultLocale || config.defaultLocale,
            locale
          );
          localeTranslations = translatedContent;
        }

        fs.writeFileSync(
          localeFile,
          JSON.stringify(localeTranslations, null, 2)
        );
        Logger.info(
          `Translations for locale ${locale} written to ${localeFile}`
        );
      }
    }
  }

  Logger.success("Translations extracted successfully");
};

async function translateContent(
  content: Record<string, any>,
  sourceLocale: string,
  targetLocale: string
): Promise<Record<string, any>> {
  const translatedContent: Record<string, any> = {};

  for (const [key, value] of Object.entries(content)) {
    if (typeof value === "string") {
      // Translate string value
      const translatedValue = await translateText(
        value,
        sourceLocale,
        targetLocale
      );
      translatedContent[key] = translatedValue;
    } else if (typeof value === "object" && value !== null) {
      // Recursively translate nested objects
      translatedContent[key] = await translateContent(
        value as Record<string, any>,
        sourceLocale,
        targetLocale
      );
    } else {
      // Keep non-string, non-object values as is
      translatedContent[key] = value;
    }
  }

  return translatedContent;
}

export default extractTranslations;
