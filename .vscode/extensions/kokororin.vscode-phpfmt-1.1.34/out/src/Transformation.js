"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transformation = void 0;
const os_1 = __importDefault(require("os"));
const mem_1 = __importDefault(require("mem"));
const phpfmt_1 = __importDefault(require("phpfmt"));
const utils_1 = require("./utils");
class Transformation {
    constructor(phpBin, fmt) {
        this.phpBin = phpBin;
        this.fmt = fmt;
        this.getCacheKey = (args) => {
            return JSON.stringify([this.fmt.pharPath, args]);
        };
        this.getTransformations = (0, mem_1.default)(this.getTransformations, {
            cacheKey: this.getCacheKey
        });
        this.getPasses = (0, mem_1.default)(this.getPasses, {
            cacheKey: this.getCacheKey
        });
        this.isExists = (0, mem_1.default)(this.isExists, {
            cacheKey: this.getCacheKey
        });
    }
    get baseCmd() {
        return `${this.phpBin} "${this.fmt.pharPath}"`;
    }
    async getTransformations() {
        try {
            const { stdout } = await (0, utils_1.exec)(`${this.baseCmd} --list-simple`);
            return stdout
                .trim()
                .split(os_1.default.EOL)
                .map(v => {
                const splited = v.split(' ');
                return {
                    key: splited[0],
                    description: splited
                        .filter((value, index) => value && index > 0)
                        .join(' ')
                        .trim()
                };
            });
        }
        catch (err) {
            return [];
        }
    }
    async getExample(transformationItem) {
        try {
            const { stdout } = await (0, utils_1.exec)(`${this.baseCmd} --help-pass ${transformationItem.key}`);
            return stdout;
        }
        catch (err) {
            return '';
        }
    }
    getPasses() {
        return phpfmt_1.default.parser.getPasses(this.fmt, phpfmt_1.default.parser.MODE_REGEX);
    }
    isExists(name) {
        return this.getPasses().includes(name);
    }
}
exports.Transformation = Transformation;
//# sourceMappingURL=Transformation.js.map