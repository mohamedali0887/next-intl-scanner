import { Command } from "commander";
import extractTranslations from "./utils/extractTranslations";
import { loadConfig } from "./utils/config";
import Logger from "./utils/logger";
import pkg from "./utils/packageInfo";

export async function runCli(args: string[]) {
  const program = new Command();

  program
    .name("next-intl-scanner")
    .description(
      "Extracts and merges translations for Next.js applications using next-intl"
    )
    .version(pkg.version)
    .allowUnknownOption(false);

  program
    .command("extract")
    .option("--version", "Display the version number")
    .option("--config <path>", "Path to the configuration file")
    .option("--overwrite", "Overwrite existing translations", false)
    .option(
      "--auto-translate",
      "Automatically translate strings using a translation service",
      false
    )
    .option(
      "--clean",
      "Remove unused translation keys from output files",
      false
    )
    .description("Extracts translations from source files")
    .addHelpText(
      "after",
      `
Examples:
  $ next-intl-scanner extract
  $ next-intl-scanner extract --overwrite
  $ next-intl-scanner extract --auto-translate
  $ next-intl-scanner extract --overwrite --auto-translate
  `
    )
    .action(async (options) => {
      const config = options.config
        ? await loadConfig(options.config, true)
        : await loadConfig("./next-intl-scanner.config.js", false);

      if (!config) {
        Logger.error("Failed to load configuration");
        process.exit(1);
      }

      await extractTranslations(config, {
        overwrite: options.overwrite,
        autoTranslate: options.autoTranslate,
        defaultLocale: config.defaultLocale,
        clean: options.clean,
      });
    });

  await program.parseAsync(["node", "next-intl-scanner", ...args]);
}
