"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Widget = exports.PHPFmtStatus = void 0;
const vscode_1 = require("vscode");
const dayjs_1 = __importDefault(require("dayjs"));
var PHPFmtStatus;
(function (PHPFmtStatus) {
    PHPFmtStatus["Ready"] = "check-all";
    PHPFmtStatus["Success"] = "check";
    PHPFmtStatus["Ignore"] = "x";
    PHPFmtStatus["Warn"] = "warning";
    PHPFmtStatus["Error"] = "alert";
    PHPFmtStatus["Disabled"] = "circle-slash";
})(PHPFmtStatus = exports.PHPFmtStatus || (exports.PHPFmtStatus = {}));
class Widget {
    constructor() {
        this.logLevel = 'INFO';
        this.outputChannel = vscode_1.window.createOutputChannel('phpfmt');
        this.statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, -1);
        this.statusBarItem.text = 'phpfmt';
        this.statusBarItem.command = 'phpfmt.openOutput';
        this.toggleStatusBarItem(vscode_1.window.activeTextEditor);
    }
    toggleStatusBarItem(editor) {
        if (typeof editor === 'undefined') {
            return;
        }
        if (editor.document.languageId === 'php') {
            this.statusBarItem.show();
            this.updateStatusBarItem(PHPFmtStatus.Ready);
        }
        else {
            this.statusBarItem.hide();
        }
    }
    updateStatusBarItem(result) {
        this.statusBarItem.text = `$(${result.toString()}) phpfmt`;
        switch (result) {
            case PHPFmtStatus.Ignore:
            case PHPFmtStatus.Warn:
                this.statusBarItem.backgroundColor = new vscode_1.ThemeColor('statusBarItem.warningBackground');
                break;
            case PHPFmtStatus.Error:
                this.statusBarItem.backgroundColor = new vscode_1.ThemeColor('statusBarItem.errorBackground');
                break;
            default:
                this.statusBarItem.backgroundColor = new vscode_1.ThemeColor('statusBarItem.fourgroundBackground');
                break;
        }
        this.statusBarItem.show();
    }
    getOutputChannel() {
        return this.outputChannel;
    }
    setOutputLevel(logLevel) {
        this.logLevel = logLevel;
    }
    logMessage(message, logLevel) {
        const now = (0, dayjs_1.default)();
        this.outputChannel.appendLine(`${now.format('HH:mm:ss.SSS')} [${logLevel}] ${message}`);
    }
    logObject(data) {
        const message = JSON.stringify(data, null, 2);
        this.outputChannel.appendLine(message);
    }
    logInfo(message, data) {
        if (['NONE', 'WARN', 'ERROR'].includes(this.logLevel)) {
            return this.outputChannel;
        }
        this.logMessage(message, 'INFO');
        if (data) {
            this.logObject(data);
        }
        return this.outputChannel;
    }
    logWarning(message, data) {
        if (['NONE', 'ERROR'].includes(this.logLevel)) {
            return this.outputChannel;
        }
        this.logMessage(message, 'WARN');
        if (data) {
            this.logObject(data);
        }
        return this.outputChannel;
    }
    logError(message, error) {
        if (['NONE'].includes(this.logLevel)) {
            return this.outputChannel;
        }
        this.logMessage(message, 'ERROR');
        if (typeof error === 'string') {
            this.outputChannel.appendLine(error);
        }
        else if (error instanceof Error) {
            if (error?.message) {
                this.logMessage(error.message, 'ERROR');
            }
        }
        else if (error) {
            this.logObject(error);
        }
        return this.outputChannel;
    }
}
exports.Widget = Widget;
//# sourceMappingURL=Widget.js.map