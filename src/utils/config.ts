import Logger from "./logger";
import fs from "fs";
import type { Config } from "./types";
import path from "path";

export const defaultConfig: Config = {
  locales: ["en"],
  sourceDirectory: "./",
  outputDirectory: "./messages",
  defaultLocale: "en",
  pages: [
    {
      match: "./src/(pages|app)/**/*.{js,jsx,ts,tsx}",
      ignore: ["**/*.test.{js,jsx,ts,tsx}", "**/_*.js"],
    },
  ],
  customJSXPattern: [],
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
  try {
    const ext = path.extname(url).toLowerCase();
    if (ext === ".json") {
      // For JSON files
      const content = fs.readFileSync(url, {
        encoding: "utf-8",
      });
      config = JSON.parse(content);
    } else if (ext === ".js" || ext === ".cjs" || ext === ".mjs") {
      // For JS files, handle both CommonJS and ES modules
      const module = require(url);
      config = module.default || module;
    } else {
      throw new Error(`Unsupported config file extension: ${ext}`);
    }
    return config;
  } catch (error) {
    console.error("Error loading config file:", error);
    throw error;
  }
};

export const loadConfig = async (
  configPath: string,
  custom: boolean = false
): Promise<Config | null> => {
  let parsedConfig: Config = defaultConfig;
  let config: Config;

  if (configPath) {
    if (custom) {
      // Resolve the path relative to the current working directory
      const absolutePath = path.resolve(process.cwd(), configPath);
      Logger.info(`Using custom configuration file: ${absolutePath}`);

      if (!fs.existsSync(absolutePath)) {
        Logger.error(
          `Custom Configuration file does not exist at: ${absolutePath}`
        );
        return null;
      }

      config = await importFile(absolutePath);
    } else {
      // Get the absolute path to the config file
      const absolutePath = path.resolve(process.cwd(), configPath);

      if (!fs.existsSync(absolutePath)) {
        Logger.error(
          `Default Configuration file does not exist at: ${absolutePath}\nPlease create next-intl-scanner.config.js or next-intl-scanner.config.json in your project root`
        );
        return null;
      }

      //first find .json , if not found then find .js
      const isJson = absolutePath.endsWith(".json");
      const isJs = absolutePath.endsWith(".js");

      if (!isJson && !isJs) {
        Logger.error(
          `Default Configuration file does not exist at: ${absolutePath}\nPlease create next-intl-scanner.config.js or next-intl-scanner.config.json in your project root`
        );
        return null;
      }
      const configUrl = absolutePath;
      config = await importFile(configUrl);
    }

    // Deep merge the configs
    parsedConfig = {
      ...defaultConfig,
      ...config,
      pages: config.pages || defaultConfig.pages,
      customJSXPattern:
        config.customJSXPattern || defaultConfig.customJSXPattern,
      ignore: [...new Set([...defaultConfig.ignore, ...(config.ignore || [])])],
    };

    if (!validateConfig(parsedConfig)) {
      return null;
    }
  } else {
    Logger.info("Using default configuration");
  }

  return parsedConfig;
};
