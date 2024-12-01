// #!/usr/bin/env node

import { Command } from "commander";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import extractTranslations from "./utils/extractTranslations";

const program = new Command();

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const pkgPath = path.resolve(__dirname, "../package.json");
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));

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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
