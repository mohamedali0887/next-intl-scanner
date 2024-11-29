"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = require("chalk");
var commander_1 = require("commander");
var LoggerC = /** @class */ (function () {
    function LoggerC() {
    }
    LoggerC.prototype.info = function (message) {
        if (message === void 0) { message = ''; }
        console.log(chalk_1.default.cyanBright(message));
    };
    LoggerC.prototype.error = function (message) {
        if (message === void 0) { message = ''; }
        console.log(chalk_1.default.redBright(message));
        commander_1.program.outputHelp();
    };
    LoggerC.prototype.success = function (message) {
        if (message === void 0) { message = ''; }
        console.log(chalk_1.default.greenBright(message));
    };
    return LoggerC;
}());
var Logger = new LoggerC();
exports.default = Logger;
