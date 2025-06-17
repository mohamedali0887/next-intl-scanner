import fs from "fs";
import path from "path";
import { glob } from "glob";
import Logger from "./logger";
import type { Config, DefaultOptions } from "./types";
import { translateBatch } from "./translate";
import {
  checkForDots,
  flattenObject,
  restoreNamespaces,
} from "./objectHelpers";

interface Translation {
  nameSpace: string;
  string: string;
  messageKey: string;
  file?: string;
}

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

  //create files for all locales if they don't exist
  for (const locale of config.locales) {
    const localeFile = path.resolve(config.outputDirectory, `${locale}.json`);
    if (!fs.existsSync(localeFile)) {
      fs.writeFileSync(localeFile, "{}");
    }
  }

  // Add before the batch processing loop
  const duplicateKeyMap = new Map<
    string,
    {
      value: string;
      files: Set<string>;
      duplicateValues: Set<string>;
    }
  >();

  // Process files in batches
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    const batchTranslations: Translation[] = [];

    for (const file of batch) {
      const source = fs.readFileSync(file, "utf-8");
      if (!source) {
        Logger.error(`Could not read file: ${file}`);
        continue;
      }

      const nameSpaceMatch = source.match(
        /\buseTranslations\(['"](.+?)['"]\)/g
      );
      let nameSpace =
        nameSpaceMatch?.[0]?.replace(
          /\buseTranslations\(['"](.+?)['"]\)/,
          "$1"
        ) || "";

      // Also match server-side getTranslations usage
      const getTranslationsMatch = source.match(
        /getTranslations\s*\(\s*[^,]+,\s*['"](.+?)['"]\s*\)/g
      );
      if (getTranslationsMatch && getTranslationsMatch[0]) {
        const extracted = getTranslationsMatch[0].match(/getTranslations\s*\(\s*[^,]+,\s*['"](.+?)['"]\s*\)/);
        if (extracted && extracted[1]) {
          nameSpace = extracted[1];
        }
      }

      // Detect both standard hook usage (with optional args) and custom hook usage
      const standardHookRegex = /\bt\s*\(\s*['"`]([^'"`]+?)['"`]/g;
      const customHookRegex =
        /\bt\s*\(\s*['"`]([^'"`]+?)['"`]\s*,\s*\{[^}]*\}\s*,\s*['"`]([^'"`]+?)['"`]/g;

      let match;
      const customHookKeys = new Set<string>();

      while ((match = customHookRegex.exec(source)) !== null) {
        const key = match[1];
        const message = match[2];

        checkForDots(key);

        if (nameSpace) {
          batchTranslations.push({
            nameSpace,
            string: message,
            messageKey: key,
          });
        } else {
          batchTranslations.push({
            nameSpace: "",
            string: message,
            messageKey: key,
          });
        }
        customHookKeys.add(key);
      }

      // Then check for standard hook usage (1 or 2 arguments)
      while ((match = standardHookRegex.exec(source)) !== null) {
        const key = match[1];
        // Only add if it's not already added by custom hook
        if (!customHookKeys.has(key)) {
          if (nameSpace) {
            batchTranslations.push({
              nameSpace,
              string: key,
              messageKey: key,
            });
          } else {
            batchTranslations.push({
              nameSpace: "",
              string: key,
              messageKey: key,
            });
          }
        }
      }

      // Process custom JSX patterns
      for (const pattern of validCustomPatterns) {
        const tagRegex = new RegExp(`<${pattern.element}\\b[^>]*>`, "gs");
        while ((match = tagRegex.exec(source)) !== null) {
          const tag = match[0];
          const attributeRegex =
            /(\w+)\s*=\s*(?:{[`'"](.*?)[`'"]}|[`'"](.*?)[`'"])/g;
          const attributes: Record<string, string> = {};

          let attributeMatch;
          while ((attributeMatch = attributeRegex.exec(tag)) !== null) {
            const attrName = attributeMatch[1];
            let attrValue = (attributeMatch[2] || attributeMatch[3]).trim();

            attrValue = attrValue.replace(/^[`'"]+|[`'"]+$/g, "");

            attributes[attrName] = attrValue;
            Logger.info(`Found attribute: ${attrName} = ${attrValue}`);
          }

          if (attributes[pattern.attributes.messageKey]) {
            // checkForDots(attributes[pattern.attributes.messageKey]);
          }
          if (
            !attributes[pattern.attributes.messageKey] &&
            attributes[pattern.attributes.string]
          ) {
            //incase we are usign string as a key
            // checkForDots(attributes[pattern.attributes.string]);
          }

          if (
            attributes[pattern.attributes.string] &&
            attributes[pattern.attributes.namespace]
          ) {
            const translation: Translation = {
              nameSpace: attributes[pattern.attributes.namespace],
              string: attributes[pattern.attributes.string],
              messageKey: attributes[pattern.attributes.messageKey],
              file,
            };
            Logger.info(
              `Found FormattedMessage translation: ${JSON.stringify(
                translation
              )}`
            );
            batchTranslations.push(translation);
          }
        }
      }

      // Add duplicate messageKey detection before processing translations
      for (const translation of batchTranslations) {
        const { nameSpace, string, messageKey } = translation;
        if (nameSpace && messageKey) {
          const mapKey = `${nameSpace}.${messageKey}`;
          const existing = duplicateKeyMap.get(mapKey);

          if (existing) {
            existing.files.add(translation.file || "unknown");

            if (existing.value !== string) {
              existing.duplicateValues.add(string);
              Logger.warn(
                `Duplicate messageKey "${messageKey}" in namespace "${nameSpace}" has different values:\n` +
                  `  - "${existing.value}" in ${Array.from(existing.files).join(", ")}\n` +
                  `  - "${string}" in ${translation.file || "unknown"}`
              );
            }
          } else {
            duplicateKeyMap.set(mapKey, {
              value: string,
              files: new Set([translation.file || "unknown"]),
              duplicateValues: new Set(),
            });
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

            // now lets format all this to add it to the file
            for (const translation of batchTranslations) {
              const { nameSpace, string, messageKey } = translation;

              if (nameSpace) {
                if (!localeTranslations[nameSpace]) {
                  localeTranslations[nameSpace] = {};
                }
                const namespaceObj = localeTranslations[nameSpace] as Record<
                  string,
                  string
                >;
                const translationKey = messageKey || string;
                if (options.overwrite || !namespaceObj[translationKey]) {
                  namespaceObj[translationKey] = string;
                }
              } else {
                if (options.overwrite || !localeTranslations[string]) {
                  localeTranslations[string] = string;
                }
              }
            }
          } catch (error) {
            Logger.error(
              `Error parsing JSON file for locale ${locale}: ${error}`
            );
          }
        }

        // Process translations for this batch
        for (const translation of batchTranslations) {
          const { nameSpace, string, messageKey } = translation;
          if (isNaN(Number(string))) {
            if (nameSpace) {
              if (!localeTranslations[nameSpace]) {
                localeTranslations[nameSpace] = {};
              }
              const namespaceObj = localeTranslations[nameSpace] as Record<
                string,
                string
              >;
              const translationKey = messageKey || string;
              if (options.overwrite || !namespaceObj[translationKey]) {
                namespaceObj[translationKey] = string;
              }
            } else if (options.overwrite || !localeTranslations[string]) {
              const translationKey = messageKey || string;
              localeTranslations[translationKey] = string;
            }
          }
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

  // At the end of processing, show summary of duplicates if any
  const duplicatesFound = Array.from(duplicateKeyMap.entries()).filter(
    ([_, info]) => info.duplicateValues.size > 0
  );

  if (duplicatesFound.length > 0) {
    Logger.warn("\nSummary of duplicate messageKeys with different values:");
    for (const [messageKey, info] of duplicatesFound) {
      Logger.warn(
        `\nmessageKey: ${messageKey}\n` +
          `Original value: "${info.value}"\n` +
          `Different values found: ${Array.from(info.duplicateValues)
            .map((v) => `"${v}"`)
            .join(", ")}\n`
      );
    }
  }

  //now lets read default locale file and flatten it
  const defaultLocaleFile = path.resolve(
    config.outputDirectory,
    `${config.defaultLocale}.json`
  );

  const defaultLocaleTranslations = JSON.parse(
    fs.readFileSync(defaultLocaleFile, "utf-8")
  );

  //now lets flatten the default locale translations
  const flattenedDefaultLocaleTranslations = await flattenObject(
    defaultLocaleTranslations
  );

  // now that we have all files ready, lets see if auto translate is enabled
  if (options.autoTranslate) {
    //lets read the file of default locale
    const defaultLocaleFile = path.resolve(
      config.outputDirectory,
      `${config.defaultLocale}.json`
    );
    const defaultLocaleTranslations = JSON.parse(
      fs.readFileSync(defaultLocaleFile, "utf-8")
    );

    // we need to translate all the files
    for (const locale of config.locales) {
      const localeFile = path.resolve(config.outputDirectory, `${locale}.json`);

      //for each locale file , we can do a batch translation
      const localeTranslations = JSON.parse(
        fs.readFileSync(localeFile, "utf-8")
      );

      // existing locale translations

      const flattenedLocaleTranslations = await flattenObject(
        localeTranslations
      );

      //lets try  to restore and test
      const restoredLocaleTranslations = await restoreNamespaces(
        flattenedLocaleTranslations
      );

      const untranslated: Record<string, string> = {};
      for (const key in flattenedDefaultLocaleTranslations) {
        if (
          flattenedDefaultLocaleTranslations[key] ===
          flattenedLocaleTranslations[key]
        ) {
          untranslated[key] = flattenedDefaultLocaleTranslations[key];
        }
      }

      //now lets translate these then merge them with the existing translations
      const translatedUnstranslated = await translateBatch(
        untranslated,
        config.defaultLocale,
        locale
      );

      //now lets merge the translated and the existing translations
      const mergedTranslations = {
        ...restoredLocaleTranslations,
        ...translatedUnstranslated,
      };

      //now lets restore the namespaces
      const restoredTranslations = await restoreNamespaces(mergedTranslations);

      //now lets write the translations to the file
      fs.writeFileSync(
        localeFile,
        JSON.stringify(restoredTranslations, null, 2)
      );
    }
  }

  Logger.success("Translations extracted successfully");
};

export default extractTranslations;
