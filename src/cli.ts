// #!/usr/bin/env node

import { Command } from "commander";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import extractTranslations from "./utils/extractTranslations";
import pkg from "../package.json";
const program = new Command();

program
  .name("next-intl-scanner")
  .description(
    "Extracts and merges translations for Next.js applications using react-intl"
  )
  .version(pkg.version);

program
  .command("extract")
  .option("--version", "Display the version number")
  .option("--config <path>", "Path to the configuration file")
  .description("Extracts translations from source files")
  .addHelpText(
    "after",
    `
Examples:
  $ next-intl-scanner extract
  `
  )
  .action(async (options) => {
    await extractTranslations(options);
  });

program.parse();
