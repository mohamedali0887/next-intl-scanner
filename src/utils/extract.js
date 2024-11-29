"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTranslations = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var glob_1 = require("glob");
var logger_1 = require("./logger");
var config_1 = require("./config");
var extractTranslations = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (options) {
        var configPath, config, allFiles, _a, _b, page, files, allTranslations, _loop_1, _c, allFiles_1, file, state_1, translationsObject, _d, allTranslations_1, translation, _e, nameSpace, key, _f, _g, locale, localeFile, localeTranslations, _h, _j, nameSpace, _k, _l, key;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    configPath = path_1.default.resolve(process.cwd(), 'next-intl-scanner.config');
                    if (options.config) {
                        configPath = path_1.default.resolve(process.cwd(), options.config);
                    }
                    return [4 /*yield*/, (0, config_1.loadConfig)(configPath, options.config ? true : false)];
                case 1:
                    config = _m.sent();
                    if (!config) {
                        logger_1.default.error('Could not load configuration file');
                        return [2 /*return*/];
                    }
                    logger_1.default.info('Extracting translations...');
                    allFiles = [];
                    _a = 0, _b = config.pages;
                    _m.label = 2;
                case 2:
                    if (!(_a < _b.length)) return [3 /*break*/, 5];
                    page = _b[_a];
                    return [4 /*yield*/, (0, glob_1.glob)(page.match, {
                            ignore: page.ignore.concat(config.ignore)
                        })];
                case 3:
                    files = _m.sent();
                    allFiles.push.apply(allFiles, files);
                    _m.label = 4;
                case 4:
                    _a++;
                    return [3 /*break*/, 2];
                case 5:
                    allTranslations = [];
                    _loop_1 = function (file) {
                        var source = fs_1.default.readFileSync(file, 'utf-8');
                        if (!source || source === null || !source.length) {
                            logger_1.default.error("Could not read file: ".concat(file));
                            return { value: void 0 };
                        }
                        var nameSpaceMatch = source.match(/\buseTranslations\(['"](.+?)['"]\)/g);
                        var nameSpace = nameSpaceMatch && nameSpaceMatch.length
                            ? nameSpaceMatch[0].replace(/\buseTranslations\(['"](.+?)['"]\)/, '$1')
                            : 'common';
                        var translations = source.match(/\bt\(['"](.+?)['"]\)/g);
                        if (nameSpace && translations && translations.length) {
                            translations.forEach(function (t) {
                                var string = t.replace(/\bt\(['"](.+?)['"]\)/, '$1');
                                allTranslations.push("".concat(nameSpace, ".").concat(string));
                            });
                        }
                    };
                    //then we need to extract the translations from each file
                    for (_c = 0, allFiles_1 = allFiles; _c < allFiles_1.length; _c++) {
                        file = allFiles_1[_c];
                        state_1 = _loop_1(file);
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                    }
                    translationsObject = {};
                    for (_d = 0, allTranslations_1 = allTranslations; _d < allTranslations_1.length; _d++) {
                        translation = allTranslations_1[_d];
                        _e = translation.split('.'), nameSpace = _e[0], key = _e[1];
                        if (!translationsObject[nameSpace]) {
                            translationsObject[nameSpace] = {};
                        }
                        translationsObject[nameSpace][key] = key;
                    }
                    // now lets write the translations to the output directory
                    // if the output directory does not exist we need to create it
                    if (!fs_1.default.existsSync(config.outputDirectory)) {
                        fs_1.default.mkdirSync(config.outputDirectory, { recursive: true });
                    }
                    if (config.locales && config.locales.length) {
                        for (_f = 0, _g = config.locales; _f < _g.length; _f++) {
                            locale = _g[_f];
                            localeFile = path_1.default.resolve(config.outputDirectory, "".concat(locale, ".json"));
                            localeTranslations = fs_1.default.existsSync(localeFile) ? JSON.parse(fs_1.default.readFileSync(localeFile, 'utf-8')) : {};
                            for (_h = 0, _j = Object.keys(translationsObject); _h < _j.length; _h++) {
                                nameSpace = _j[_h];
                                if (!localeTranslations[nameSpace]) {
                                    localeTranslations[nameSpace] = {};
                                }
                                for (_k = 0, _l = Object.keys(translationsObject[nameSpace]); _k < _l.length; _k++) {
                                    key = _l[_k];
                                    //if the key does not exist in the locale file we add it
                                    if (!localeTranslations[nameSpace][key]) {
                                        localeTranslations[nameSpace][key] = translationsObject[nameSpace][key];
                                    }
                                }
                            }
                            //write the translations to the file
                            fs_1.default.writeFileSync(localeFile, JSON.stringify(localeTranslations, null, 2));
                            logger_1.default.info("Translations for locale ".concat(locale, " written to ").concat(localeFile));
                        }
                    }
                    logger_1.default.success('Translations extracted successfully');
                    return [2 /*return*/];
            }
        });
    });
};
exports.extractTranslations = extractTranslations;
