import chalk from "chalk";
import { program } from "commander";

function LoggerC() {
  return {
    info: function (message: string = "") {
      console.log(chalk.cyanBright(message));
    },
    warn: function (message: string = "") {
      console.log(chalk.yellowBright(message));
    },
    error: function (message: string = "") {
      console.log(chalk.redBright(message));
    },
    outPutHelp: function () {
      program.outputHelp();
    },
    success: function (message: string = "") {
      console.log(chalk.greenBright(message));
    },
  };
}

const Logger = LoggerC();

export default Logger;
