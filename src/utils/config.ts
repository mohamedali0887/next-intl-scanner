import Logger from "./logger";
import fs from "fs";
import { pathToFileURL } from "url";
import type { Config } from "./types";

export const defaultConfig: Config = {
  locales: ["en"],
  defaultNamespace: "common",
  sourceDirectory: "./",
  outputDirectory: "./messages",
  defaultLocale: "en",
  pages: [
    {
      match: "./src/(pages|app)/**/*.{js,jsx,ts,tsx}",
      ignore: ["**/*.test.{js,jsx,ts,tsx}", "**/_*.js"],
    },
  ],
  ignore: ["**/node_modules/**", "**/.next/**", ".git/**"],
};

export const validateConfig = (config: Config): boolean => {
  //merge the default config with the user config

  const errors: string[] = [];

  if (
    !config.locales ||
    !Array.isArray(config.locales) ||
    !config.locales.length
  ) {
    errors.push("Locales are required");
  }
  if (!config.sourceDirectory) {
    errors.push("Source directory is required");
  }
  if (!config.outputDirectory) {
    errors.push("Output directory is required");
  }
  if (!config.defaultLocale) {
    errors.push("Default locale is required");
  }

  if (errors.length) {
    Logger.error("Failed to validate configuration");
    Logger.error(errors.join(", "));
    return false;
  }

  return true;
};

const importFile = async (url: string) => {
  let config: Config;
  if (url.endsWith(".json")) {
    //make the url relative to the working directory

    config = JSON.parse(
      fs.readFileSync(url, {
        encoding: "utf-8",
      })
    );
  } else {
    config = (await import(url)).default;
  }

  return config;
};

export const loadConfig = async (
  configPath: string,
  custom: boolean = false
): Promise<Config | null> => {
  let parsedConfig: Config = defaultConfig;
  let config: Config;

  if (configPath) {
    if (custom) {
      Logger.info(`Using custom configuration file: ${configPath}`);

      if (!fs.existsSync(configPath)) {
        Logger.error("Custom Configuration file does not exist");
        return null;
      }
      // Convert the path to a file URL

      const configUrl = configPath.endsWith(".cjs")
        ? pathToFileURL(configPath).href
        : configPath;

      config = await importFile(configUrl);
    } else {
      //first find .json , if not found then find .cjs
      const isJson = fs.existsSync(configPath + ".json");
      const isJs = fs.existsSync(configPath + ".cjs");

      if (!isJson && !isJs) {
        Logger.error(
          "Default Configuration file does not exist , please create  next-intl-scanner.config.js or next-intl-scanner.config.json in your project root"
        );
        return null;
      }

      const configUrl = pathToFileURL(
        isJson ? configPath + ".json" : configPath + ".cjs"
      ).href;

      config = await importFile(configUrl);
    }

    parsedConfig = { ...defaultConfig, ...(config as unknown as Config) };

    if (!validateConfig(parsedConfig)) {
      return null;
    }
  } else {
    Logger.info("Using default configuration");
  }

  return parsedConfig;
};
