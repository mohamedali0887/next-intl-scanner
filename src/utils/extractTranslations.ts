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
    const files = await glob(page.match, {
      ignore: page.ignore.concat(config.ignore),
    });

    allFiles.push(...files);
  }

  const allTranslations: string[] = [];

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
        : config.defaultNamespace;

    const translations = source.match(/\bt\(['"](.+?)['"]\)/g);

    if (nameSpace && translations && translations.length) {
      translations.forEach((t: string) => {
        const string = t.replace(/\bt\(['"](.+?)['"]\)/, "$1");
        allTranslations.push(`${nameSpace}.${string}`);
      });
    }
  }

  //now lets map it to an object
  const translationsObject: any = {};

  for (const translation of allTranslations) {
    const [nameSpace, key] = translation.split(".");
    if (!translationsObject[nameSpace]) {
      translationsObject[nameSpace] = {};
    }
    translationsObject[nameSpace][key] = key;
  }

  // now lets write the translations to the output directory
  // if the output directory does not exist we need to create it
  if (!fs.existsSync(config.outputDirectory)) {
    fs.mkdirSync(config.outputDirectory, { recursive: true });
  }

  if (config.locales && config.locales.length) {
    for (const locale of config.locales) {
      const localeFile = path.resolve(config.outputDirectory, `${locale}.json`);
      const localeTranslations = fs.existsSync(localeFile)
        ? JSON.parse(fs.readFileSync(localeFile, "utf-8"))
        : {};

      for (const nameSpace of Object.keys(translationsObject)) {
        if (!localeTranslations[nameSpace]) {
          localeTranslations[nameSpace] = {};
        }

        for (const key of Object.keys(translationsObject[nameSpace])) {
          //if the key does not exist in the locale file we add it
          if (!localeTranslations[nameSpace][key]) {
            localeTranslations[nameSpace][key] =
              translationsObject[nameSpace][key];
          }
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