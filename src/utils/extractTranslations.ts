import fs from "fs";
import path from "path";
import { glob } from "glob";
import Logger from "./logger";
import { loadConfig } from "./config";
import type { Config, DefaultOptions } from "./types";

const extractTranslations = async (options: DefaultOptions = {}) => {
  let configPath = path.resolve(process.cwd(), "next-intl-scanner.config");

  if (options.config) {
    configPath = path.resolve(process.cwd(), options.config);
  }

  const config: Config | null = await loadConfig(
    configPath,
    options.config ? true : false
  );

  if (!config) {
    Logger.error("Could not load configuration file");
    return;
  }

  Logger.info("Extracting translations...");

  const allFiles: any = [];

  const basepath = path.resolve(process.cwd(), config.sourceDirectory);
  //check if the source directory exists
  if (!fs.existsSync(basepath)) {
    Logger.error(`Source directory ${basepath} does not exist`);
    return;
  }

  //extract translations
  //first we need to get all the files that match the pattern
  for (const page of config.pages) {
    const files = await new Promise<string[]>((resolve, reject) => {
      glob(
        page.match,
        { ignore: page.ignore.concat(config.ignore) },
        (err, matches) => {
          if (err) reject(err);
          else resolve(matches);
        }
      );
    });
    allFiles.push(...files);
  }

  //identify the custom patterns
  const validCustomPatterns = config.customJSXPattern?.filter(
    (customPattern) =>
      customPattern.element &&
      customPattern.attributes &&
      customPattern.attributes.namespace &&
      customPattern.attributes.string
  );

  const invalidCustomPatterns = config.customJSXPattern?.filter(
    (customPattern) =>
      !customPattern.element ||
      !customPattern.attributes ||
      !customPattern.attributes.namespace ||
      !customPattern.attributes.string
  );

  if (validCustomPatterns.length > 0) {
    Logger.info(
      `Using custom JSX patterns: ${JSON.stringify(validCustomPatterns)}`
    );

    for (const customPattern of validCustomPatterns) {
      Logger.info(
        `expecting element: <${customPattern.element} ${customPattern.attributes.namespace}="exampleNamespace" ${customPattern.attributes.string}="exampleString">`
      );
    }
  }

  if (invalidCustomPatterns.length > 0) {
    Logger.warn(
      `Skipping invalid custom JSX patterns found: ${JSON.stringify(
        invalidCustomPatterns
      )}`
    );
  }

  const allTranslations: {
    nameSpace: string;
    string: string;
    message?: string;
  }[] = [];

  //then we need to extract the translations from each file

  for (const file of allFiles) {
    const source = fs.readFileSync(file, "utf-8");
    if (!source || source === null || !source.length) {
      Logger.error(`Could not read file: ${file}`);
      return;
    }

    const nameSpaceMatch = source.match(/\buseTranslations\(['"](.+?)['"]\)/g);
    const nameSpace: string =
      nameSpaceMatch && nameSpaceMatch.length
        ? nameSpaceMatch[0].replace(/\buseTranslations\(['"](.+?)['"]\)/, "$1")
        : "";

    // Detect both standard hook usage (with optional args) and custom hook usage
    const standardHookRegex = /\bt\s*\(\s*['"`]([^'"`]+?)['"`]/g;
    const customHookRegex =
      /\bt\s*\(\s*['"`]([^'"`]+?)['"`]\s*,\s*\{[^}]*\}\s*,\s*['"`]([^'"`]+?)['"`]/g;

    let match;
    const customHookKeys = new Set<string>();

    // First check for custom hook usage (3 arguments)
    while ((match = customHookRegex.exec(source)) !== null) {
      const key = match[1];
      const message = match[2];
      if (nameSpace) {
        allTranslations.push({
          nameSpace,
          string: key,
          message,
        });
      } else {
        allTranslations.push({
          nameSpace: "",
          string: key,
          message,
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
          allTranslations.push({
            nameSpace,
            string: key,
            message: key,
          });
        } else {
          allTranslations.push({
            nameSpace: "",
            string: key,
            message: key,
          });
        }
      }
    }

    if (allTranslations && Object.keys(allTranslations).length) {
      Object.keys(allTranslations).forEach((t: string) => {
        const string = t.replace(/\bt\(['"](.+?)['"]\)/, "$1");

     
        if (nameSpace) {
          allTranslations.push({
            nameSpace,
            string,
            message: string,
          });
        } else {
          allTranslations.push({
            nameSpace: "",
            string,
            message: string,
          });
        }
      });
    }



    for (const pattern of validCustomPatterns) {
      // Match the whole tag with its attributes
      const tagRegex = new RegExp(`<${pattern.element}[^>]*?>`, "g");
      let match;

      // Loop through all matches in the input
      while ((match = tagRegex.exec(source)) !== null) {
        const tag = match[0]; // Full tag with attributes

        // Match individual attributes inside the tag
        const attributeRegex = /(\w+)=\{(['"`])(.*?)\2\}/g;
        let attributeMatch;

        // Store attributes in an object to handle multiple attributes
        const attributes: {
          [key: string]: string;
        } = {};

        // Loop through all matches for attributes in the tag
        while ((attributeMatch = attributeRegex.exec(tag)) !== null) {
          const attributeName = attributeMatch[1]; // e.g., 'string', 'namespace'
          const attributeValue = attributeMatch[3]; // e.g., 'Kanban Board'

          // Store the attribute value in the attributes object
          attributes[attributeName] = attributeValue;
        }

        if (
          attributes[pattern.attributes.string] &&
          attributes[pattern.attributes.namespace]
        ) {
          const string = attributes[pattern.attributes.string];
          const namespace = attributes[pattern.attributes.namespace];

          allTranslations.push({
            nameSpace: namespace,
            string: string,
            message: string,
          });
        }
      }
    }
  }

  //now lets map it to an object
  const translationsObject: any = {};

  for (const translation of allTranslations) {
    const { nameSpace, string, message } = translation as any;

    // Skip if the key is a number
    if (!isNaN(Number(string))) {
      continue;
    }

    if (nameSpace.length > 0) {
      if (!translationsObject[nameSpace]) {
        translationsObject[nameSpace] = {};
      }
      // For custom hook, use the message as value
      if (message) {
        translationsObject[nameSpace][string] = message;
      } else {
        translationsObject[nameSpace][string] = string;
      }
    } else {
      translationsObject[string] = message || string;
    }
  }

  // now lets write the translations to the output directory
  // if the output directory does not exist we need to create it
  if (!fs.existsSync(config.outputDirectory)) {
    fs.mkdirSync(config.outputDirectory, { recursive: true });
  }

  if (config.locales && config.locales.length) {
    for (const locale of config.locales) {
      const localeFile = path.resolve(config.outputDirectory, `${locale}.json`);
      //lets make sure its valid json
      let localeTranslations: Record<string, string | Record<string, string>> =
        {};
      if (fs.existsSync(localeFile)) {
        try {
          localeTranslations = JSON.parse(fs.readFileSync(localeFile, "utf-8"));
        } catch (error) {
          Logger.error(
            `Error parsing JSON file for locale ${locale}: ${error}`
          );
        }
      }

      for (const translation of allTranslations) {
        const { nameSpace, string, message } = translation as any;

        // Skip if the key is a number
        if (!isNaN(Number(string))) {
          continue;
        }

        if (nameSpace.length > 0) {
          if (!localeTranslations[nameSpace]) {
            localeTranslations[nameSpace] = {};
          }
          // For custom hook, use the message as value
          if (message) {
            (localeTranslations[nameSpace] as Record<string, string>)[string] =
              message;
          } else {
            (localeTranslations[nameSpace] as Record<string, string>)[string] =
              string;
          }
        } else {
          localeTranslations[string] = message || string;
        }
      }

      //write the translations to the file
      fs.writeFileSync(localeFile, JSON.stringify(localeTranslations, null, 2));
      Logger.info(`Translations for locale ${locale} written to ${localeFile}`);
    }
  }

  Logger.success("Translations extracted successfully");
};

export default extractTranslations;
