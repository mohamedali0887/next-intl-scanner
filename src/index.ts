export { useTranslations } from "./hooks/useTranslations";
//lets make this the entry point for the package
import { runCli } from "./cli-runner";

runCli(process.argv.slice(2));
