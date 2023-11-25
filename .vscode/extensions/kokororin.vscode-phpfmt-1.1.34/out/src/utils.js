"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = exports.exec = void 0;
const child_process_1 = __importDefault(require("child_process"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const exec = async (command, options) => {
    return await new Promise((resolve, reject) => {
        const child = child_process_1.default.exec(command, options, (error, stdout, stderr) => {
            if (error != null) {
                reject(error);
            }
            else {
                resolve({
                    stdout: String(stdout),
                    stderr: String(stderr)
                });
            }
        });
        child.on('error', reject);
    });
};
exports.exec = exec;
const downloadFile = async (url, filePath) => {
    await new Promise((resolve, reject) => {
        https_1.default
            .get(url, res => {
            const dest = fs_1.default.createWriteStream(filePath, {
                autoClose: true
            });
            res.pipe(dest).on('finish', () => {
                resolve();
            });
        })
            .on('error', err => {
            reject(err);
        });
    });
};
exports.downloadFile = downloadFile;
//# sourceMappingURL=utils.js.map