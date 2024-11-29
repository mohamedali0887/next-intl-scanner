import chalk from "chalk";
import { program } from "commander";

class LoggerC {
  info(message: string = "") {
    console.log(chalk.cyanBright(message));
  }

  error(message: string = "") {
    console.log(chalk.redBright(message));
  }

  outPutHelp() {
    program.outputHelp();
  }

  success(message: string = "") {
    console.log(chalk.greenBright(message));
  }
}

const Logger = new LoggerC();

export default Logger;
