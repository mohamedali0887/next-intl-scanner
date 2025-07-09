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
import { extractTranslationsFromSource } from "./extractWithBabelParser";

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

  if (options.watch) {
    Logger.info("Starting watch mode...");
    await startWatchMode(config, options);
    return;
  }

  Logger.info("Extracting translations...");
  await performExtraction(config, options);
};

// Helpers
function getAllKeys(obj: any, prefix = ""): string[] {
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
}

function removeKeyFromObject(obj: any, keyPath: string): void {
  const keys = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] && typeof current[keys[i]] === "object") {
      current = current[keys[i]];
    } else {
      return;
    }
  }
  delete current[keys[keys.length - 1]];
}

function createNestedObject(
  namespace: string,
  messageKey: string,
  value: string
): Record<string, any> {
  const parts = namespace.split(".");
  const result: Record<string, any> = {};
  let current = result;

  // Create nested structure for all parts
  for (let i = 0; i < parts.length; i++) {
    if (i === parts.length - 1) {
      // Last part: add the message key
      current[parts[i]] = { [messageKey]: value };
    } else {
      // Not the last part: create nested object
      current[parts[i]] = {};
      current = current[parts[i]];
    }
  }

  return result;
}

function mergeNestedObjects(
  target: Record<string, any>,
  source: Record<string, any>
): void {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      if (!target[key]) {
        target[key] = {};
      }
      mergeNestedObjects(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

function getNestedValue(obj: Record<string, any>, keyPath: string): any {
  const keys = keyPath.split(".");
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

async function startWatchMode(config: Config, options: DefaultOptions) {
  const basepath = path.resolve(process.cwd(), config.sourceDirectory);
  if (!fs.existsSync(basepath)) {
    Logger.error(`Source directory ${basepath} does not exist`);
    return;
  }

  // Initial extraction
  await performExtraction(config, options);

  // Get all files to watch
  const allFiles: string[] = [];
  for (const page of config.pages) {
    const files = await new Promise<string[]>((resolve, reject) => {
      glob(
        page.match,
        { cwd: basepath, ignore: page.ignore.concat(config.ignore) },
        (err, matches) => (err ? reject(err) : resolve(matches))
      );
    });
    allFiles.push(...files.map((file) => path.resolve(basepath, file)));
  }

  // Watch directories for changes
  const watchedDirs = new Set<string>();
  for (const file of allFiles) {
    const dir = path.dirname(file);
    if (!watchedDirs.has(dir)) {
      watchedDirs.add(dir);
      fs.watch(dir, { recursive: true }, async (eventType, filename) => {
        if (filename && shouldProcessFile(filename, config, basepath)) {
          Logger.info(`File changed: ${filename}`);
          await performExtraction(config, options);
        }
      });
    }
  }

  Logger.success(`Watching ${watchedDirs.size} directories for changes...`);
  Logger.info("Press Ctrl+C to stop watching");

  // Keep the process alive
  process.on("SIGINT", () => {
    Logger.info("Stopping watch mode...");
    process.exit(0);
  });
}

function shouldProcessFile(
  filename: string,
  config: Config,
  basepath: string
): boolean {
  const filePath = path.resolve(basepath, filename);

  // Check if file matches any of the page patterns
  for (const page of config.pages) {
    const matches = glob.sync(page.match, { cwd: basepath });
    if (matches.includes(filename)) {
      // Check if file is not ignored
      for (const ignorePattern of page.ignore.concat(config.ignore)) {
        if (glob.sync(ignorePattern, { cwd: basepath }).includes(filename)) {
          return false;
        }
      }
      return true;
    }
  }

  return false;
}

async function performExtraction(config: Config, options: DefaultOptions) {
  const basepath = path.resolve(process.cwd(), config.sourceDirectory);
  if (!fs.existsSync(basepath)) {
    Logger.error(`Source directory ${basepath} does not exist`);
    return;
  }

  const BATCH_SIZE = 50;
  const allFiles: string[] = [];

  for (const page of config.pages) {
    const files = await new Promise<string[]>((resolve, reject) => {
      glob(
        page.match,
        { cwd: basepath, ignore: page.ignore.concat(config.ignore) },
        (err, matches) => (err ? reject(err) : resolve(matches))
      );
    });
    allFiles.push(...files.map((file) => path.resolve(basepath, file)));
  }

  if (!fs.existsSync(config.outputDirectory)) {
    fs.mkdirSync(config.outputDirectory, { recursive: true });
  }

  for (const locale of config.locales) {
    const localeFile = path.resolve(config.outputDirectory, `${locale}.json`);
    if (!fs.existsSync(localeFile)) {
      fs.writeFileSync(localeFile, "{}");
    }
  }

  const duplicateKeyMap = new Map<
    string,
    { value: string; files: Set<string>; duplicateValues: Set<string> }
  >();
  const allExtractedKeys = new Set<string>();

  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    const batchTranslations: Translation[] = [];

    for (const file of batch) {
      const source = fs.readFileSync(file, "utf-8");
      if (!source) {
        Logger.error(`Could not read file: ${file}`);
        continue;
      }

      const extracted = extractTranslationsFromSource(source, file, config);
      for (const translation of extracted) {
        checkForDots(translation.messageKey);
        batchTranslations.push(translation);

        const key = translation.nameSpace
          ? `${translation.nameSpace}.${translation.messageKey}`
          : translation.messageKey;
        allExtractedKeys.add(key);

        const mapKey = key;
        const existing = duplicateKeyMap.get(mapKey);

        if (existing) {
          existing.files.add(translation.file || "unknown");
          if (existing.value !== translation.string) {
            existing.duplicateValues.add(translation.string);
          }
        } else {
          duplicateKeyMap.set(mapKey, {
            value: translation.string,
            files: new Set([translation.file || "unknown"]),
            duplicateValues: new Set(),
          });
        }
      }
    }

    if (config.locales?.length) {
      for (const locale of config.locales) {
        const localeFile = path.resolve(
          config.outputDirectory,
          `${locale}.json`
        );
        let localeTranslations: Record<string, any> = {};

        if (fs.existsSync(localeFile)) {
          try {
            localeTranslations = JSON.parse(
              fs.readFileSync(localeFile, "utf-8")
            );

            for (const { nameSpace, string, messageKey } of batchTranslations) {
              if (nameSpace) {
                // Create nested structure for namespaces with dots
                if (nameSpace.includes(".")) {
                  const nestedObject = createNestedObject(
                    nameSpace,
                    messageKey,
                    string
                  );
                  mergeNestedObjects(localeTranslations, nestedObject);
                } else {
                  // Handle simple namespaces
                  localeTranslations[nameSpace] =
                    localeTranslations[nameSpace] || {};
                  if (
                    options.overwrite ||
                    !localeTranslations[nameSpace][messageKey]
                  ) {
                    localeTranslations[nameSpace][messageKey] = string;
                  }
                }
              } else {
                if (options.overwrite || !localeTranslations[messageKey]) {
                  localeTranslations[messageKey] = string;
                }
              }
            }
          } catch (error) {
            Logger.error(`Error parsing JSON for locale ${locale}: ${error}`);
          }
        }

        fs.writeFileSync(
          localeFile,
          JSON.stringify(localeTranslations, null, 2)
        );
        Logger.info(`Translations written for locale ${locale}`);
      }
    }
  }

  if (options.clean && config.locales?.length) {
    for (const locale of config.locales) {
      const localeFile = path.resolve(config.outputDirectory, `${locale}.json`);
      if (fs.existsSync(localeFile)) {
        try {
          const localeTranslations = JSON.parse(
            fs.readFileSync(localeFile, "utf-8")
          );
          const existingKeys = getAllKeys(localeTranslations);
          const keysToRemove = existingKeys.filter(
            (key) => !allExtractedKeys.has(key)
          );
          for (const key of keysToRemove) {
            removeKeyFromObject(localeTranslations, key);
          }
          if (keysToRemove.length) {
            fs.writeFileSync(
              localeFile,
              JSON.stringify(localeTranslations, null, 2)
            );
            Logger.info(
              `Cleaned ${keysToRemove.length} unused keys from ${locale}.json`
            );
          }
        } catch (error) {
          Logger.error(`Error cleaning locale ${locale}: ${error}`);
        }
      }
    }
  }

  if (options.autoTranslate) {
    const defaultLocaleFile = path.resolve(
      config.outputDirectory,
      `${config.defaultLocale}.json`
    );
    const defaultLocaleTranslations = JSON.parse(
      fs.readFileSync(defaultLocaleFile, "utf-8")
    );
    for (const locale of config.locales) {
      const localeFile = path.resolve(config.outputDirectory, `${locale}.json`);
      const localeTranslations = JSON.parse(
        fs.readFileSync(localeFile, "utf-8")
      );

      // Get all keys from both objects for comparison
      const defaultKeys = getAllKeys(defaultLocaleTranslations);
      const localeKeys = getAllKeys(localeTranslations);

      const untranslated: Record<string, string> = {};
      for (const key of defaultKeys) {
        if (
          !localeKeys.includes(key) ||
          getNestedValue(defaultLocaleTranslations, key) ===
            getNestedValue(localeTranslations, key)
        ) {
          untranslated[key] = getNestedValue(defaultLocaleTranslations, key);
        }
      }

      const translated = await translateBatch(
        untranslated,
        config.defaultLocale,
        locale
      );

      // Merge translated keys back into the nested structure
      for (const [key, value] of Object.entries(translated)) {
        const parts = key.split(".");
        let current = localeTranslations;

        // Navigate to the correct nested location
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }

        // Set the translated value
        current[parts[parts.length - 1]] = value;
      }

      fs.writeFileSync(localeFile, JSON.stringify(localeTranslations, null, 2));
    }
  }

  if (
    Array.from(duplicateKeyMap.values()).some((v) => v.duplicateValues.size)
  ) {
    Logger.warn("\nSummary of duplicate keys with conflicting values:");
    for (const [key, { value, duplicateValues }] of duplicateKeyMap.entries()) {
      if (duplicateValues.size) {
        Logger.warn(
          `- ${key}: original='${value}', others=[${Array.from(
            duplicateValues
          ).join(", ")}])`
        );
      }
    }
  }

  Logger.success("Translations extracted successfully");
}

export default extractTranslations;
