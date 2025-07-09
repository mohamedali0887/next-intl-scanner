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

// Helper function to get all keys from a nested object
const getAllKeys = (obj: any, prefix = ""): string[] => {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
};

// Helper function to remove a key from a nested object
const removeKeyFromObject = (obj: any, keyPath: string): void => {
  const keys = keyPath.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] && typeof current[keys[i]] === "object") {
      current = current[keys[i]];
    } else {
      return; // Key path doesn't exist
    }
  }

  const lastKey = keys[keys.length - 1];
  if (current[lastKey] !== undefined) {
    delete current[lastKey];
  }
};

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

  // Collect all extracted keys across all batches for cleaning
  const allExtractedKeys = new Set<string>();

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

      // Find all useTranslations calls and their variable names (with or without namespace)
      // Support both standard next-intl useTranslations and custom useTranslations hooks
      const useTranslationsMatches = source.matchAll(
        /(\w+)\s*=\s*useTranslations\((['"](.*?)['"])?\)/g
      );
      const namespaceMap = new Map<string, string>();
      for (const match of useTranslationsMatches) {
        const variableName = match[1];
        // If group 3 exists, it's the namespace, else default/global
        const namespace = match[3] !== undefined ? match[3] : "";
        namespaceMap.set(variableName, namespace);
        Logger.info(`Found useTranslations: variable=${variableName}, namespace="${namespace}"`);
      }

      // Also match server-side getTranslations usage
      // Example: const t = await getTranslations('en', 'customHook')
      const getTranslationsMatches = source.matchAll(
        /(\w+)\s*=\s*await\s*getTranslations\([^,]+,\s*['"](.+?)['"]\)/g
      );
      for (const match of getTranslationsMatches) {
        const variableName = match[1];
        const namespace = match[2];
        namespaceMap.set(variableName, namespace);
      }

      // Support custom hooks: const t = useTranslations('namespace')
      // and also destructured/aliased hooks if possible

      // Updated regex to capture the variable name before the t() call
      const standardHookRegex = /([\w$]+)\s*\.\s*t\s*\(\s*['"`]([^'"`]+?)['"`]/g;
      // Flexible custom hook: t('key', ...optionalArgs..., 'message')
      // This regex matches the same quote at start/end and allows escaped quotes inside
      const customHookRegex = /([\w$]+)\s*\(\s*(["'`])((?:\\\2|.)*?)\2\s*,\s*(?:\{[^}]*\}|[^,]+)?\s*,\s*(["'`])((?:\\\4|.)*?)\4\s*\)/g;
      // Also support direct t('key') calls (for default/global namespace)
      const directTRegex = /\bt\s*\(\s*['"`]([^'"`]+?)['"`]/g;

      let match;
      const customHookKeys = new Set<string>();

      // Extract custom hook usage
      Logger.info(`Searching for custom hook pattern in file: ${file}`);
      while ((match = customHookRegex.exec(source)) !== null) {
        const variableName = match[1];
        const key = match[3].replace(new RegExp('\\' + match[2], 'g'), match[2]);
        const message = match[5].replace(new RegExp('\\' + match[4], 'g'), match[4]);
        checkForDots(key);
        const nameSpace = namespaceMap.get(variableName) ?? "";
        Logger.info(`Found custom hook usage: variable=${variableName}, key=\"${key}\", message=\"${message}\", namespace=\"${nameSpace}\"`);
        batchTranslations.push({
          nameSpace,
          string: message,
          messageKey: key,
        });
        customHookKeys.add(key);
      }

      // Then check for standard hook usage (1 or 2 arguments)
      Logger.info(`Searching for standard hook pattern in file: ${file}`);
      while ((match = standardHookRegex.exec(source)) !== null) {
        const variableName = match[1];
        const key = match[2];
        // Only add if it's not already added by custom hook
        if (!customHookKeys.has(key)) {
          const nameSpace = namespaceMap.get(variableName) ?? "";
          Logger.info(`Found standard hook usage: variable=${variableName}, key="${key}", namespace="${nameSpace}"`);
          batchTranslations.push({
            nameSpace,
            string: key,
            messageKey: key,
          });
        }
      }

      // Also check for direct t('key') calls (for default/global namespace)
      while ((match = directTRegex.exec(source)) !== null) {
        const key = match[1];
        // Only add if it's not already added by custom hook or standard hook
        if (!customHookKeys.has(key)) {
          batchTranslations.push({
            nameSpace: "",
            string: key,
            messageKey: key,
          });
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

            // Also add to allExtractedKeys for cleaning
            const key = attributes[pattern.attributes.messageKey] || attributes[pattern.attributes.string];
            if (attributes[pattern.attributes.namespace]) {
              allExtractedKeys.add(`${attributes[pattern.attributes.namespace]}.${key}`);
            } else {
              allExtractedKeys.add(key);
            }
          }
        }
      }

      // Add duplicate messageKey detection before processing translations
      for (const translation of batchTranslations) {
        const { nameSpace, string, messageKey } = translation;

        // Always add the flattened key for cleaning
        if (nameSpace) {
          allExtractedKeys.add(`${nameSpace}.${messageKey || string}`);
        } else {
          allExtractedKeys.add(messageKey || string);
        }

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

  // Clean unused keys if --clean flag is enabled (after all batches are processed)
  if (options.clean && config.locales?.length) {
    for (const locale of config.locales) {
      const localeFile = path.resolve(
        config.outputDirectory,
        `${locale}.json`
      );

      if (fs.existsSync(localeFile)) {
        try {
          const localeTranslations = JSON.parse(
            fs.readFileSync(localeFile, "utf-8")
          );

          // Get all existing keys in the file
          const existingKeys = getAllKeys(localeTranslations);

          // Debug: Log what keys we have
          Logger.info(`All extracted keys: ${Array.from(allExtractedKeys).join(', ')}`);
          Logger.info(`Existing keys in ${locale}.json: ${existingKeys.join(', ')}`);

          // Find keys to remove (existing keys that are not in extracted keys)
          const keysToRemove = existingKeys.filter(key => !allExtractedKeys.has(key));

          Logger.info(`Keys to remove: ${keysToRemove.join(', ')}`);

          // Remove unused keys
          for (const keyToRemove of keysToRemove) {
            removeKeyFromObject(localeTranslations, keyToRemove);
            Logger.info(`Removed unused key: ${keyToRemove}`);
          }

          if (keysToRemove.length > 0) {
            Logger.info(`Cleaned ${keysToRemove.length} unused keys from ${locale}.json`);
          }

          // Write the cleaned file back
          fs.writeFileSync(
            localeFile,
            JSON.stringify(localeTranslations, null, 2)
          );
        } catch (error) {
          Logger.error(
            `Error cleaning JSON file for locale ${locale}: ${error}`
          );
        }
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
