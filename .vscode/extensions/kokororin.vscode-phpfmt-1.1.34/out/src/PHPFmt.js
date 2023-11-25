"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHPFmt = void 0;
const vscode_1 = require("vscode");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const detect_indent_1 = __importDefault(require("detect-indent"));
const find_up_1 = __importDefault(require("find-up"));
const semver = __importStar(require("semver"));
const phpfmt_1 = __importDefault(require("phpfmt"));
const Widget_1 = require("./Widget");
const Transformation_1 = require("./Transformation");
const PHPFmtError_1 = require("./PHPFmtError");
const utils_1 = require("./utils");
class PHPFmt {
    constructor(widget) {
        this.widget = widget;
        this.args = [];
        this.config = this.getConfig();
        this.transformation = new Transformation_1.Transformation(this.config.php_bin, this.getFmt());
        this.loadSettings();
    }
    getConfig() {
        return vscode_1.workspace.getConfiguration('phpfmt');
    }
    loadSettings() {
        this.config = this.getConfig();
        this.transformation = new Transformation_1.Transformation(this.config.php_bin, this.getFmt());
        this.args.length = 0;
        if (this.config.custom_arguments !== '') {
            this.args.push(this.config.custom_arguments);
            return;
        }
        if (this.config.psr1) {
            this.args.push('--psr1');
        }
        if (this.config.psr1_naming) {
            this.args.push('--psr1-naming');
        }
        if (this.config.psr2) {
            this.args.push('--psr2');
        }
        if (this.config.wp) {
            this.args.push('--wp');
        }
        if (!this.config.detect_indent) {
            const spaces = this.config.indent_with_space;
            if (spaces === true) {
                this.args.push('--indent_with_space');
            }
            else if (typeof spaces === 'number' && spaces > 0) {
                this.args.push(`--indent_with_space=${spaces}`);
            }
        }
        if (this.config.enable_auto_align) {
            this.args.push('--enable_auto_align');
        }
        if (this.config.visibility_order) {
            this.args.push('--visibility_order');
        }
        const passes = this.config.passes;
        if (passes.length > 0) {
            this.args.push(`--passes=${passes.join(',')}`);
        }
        const exclude = this.config.exclude;
        if (exclude.length > 0) {
            this.args.push(`--exclude=${exclude.join(',')}`);
        }
        if (this.config.smart_linebreak_after_curly) {
            this.args.push('--smart_linebreak_after_curly');
        }
        if (this.config.yoda) {
            this.args.push('--yoda');
        }
        if (this.config.cakephp) {
            this.args.push('--cakephp');
        }
    }
    getFmt() {
        return this.config.use_old_phpfmt ? phpfmt_1.default.v1 : phpfmt_1.default.v2;
    }
    getPharPath() {
        return this.getFmt().pharPath;
    }
    getTransformation() {
        return this.transformation;
    }
    getArgs(fileName) {
        const args = this.args.slice(0);
        args.push(`"${fileName}"`);
        return args;
    }
    async format(text) {
        const passes = [...this.config.passes, ...this.config.exclude];
        const transformations = await this.transformation.getTransformations();
        if (passes.length > 0) {
            const invalidPasses = [];
            for (const pass of passes) {
                if (!transformations.some(transformation => transformation.key === pass) &&
                    !this.transformation.isExists(pass)) {
                    invalidPasses.push(pass);
                }
            }
            if (invalidPasses.length > 0) {
                throw new PHPFmtError_1.PHPFmtError(`passes or exclude invalid: ${invalidPasses.join(', ')}`);
            }
        }
        if (this.config.detect_indent) {
            const indentInfo = (0, detect_indent_1.default)(text);
            if (!indentInfo.type) {
                this.args.push('--indent_with_space');
            }
            else if (indentInfo.type === 'space') {
                this.args.push(`--indent_with_space=${indentInfo.amount}`);
            }
        }
        else {
            if (this.config.indent_with_space !== 4 && this.config.psr2) {
                throw new PHPFmtError_1.PHPFmtError('For PSR2, code MUST use 4 spaces for indenting, not tabs.');
            }
        }
        let fileName;
        let iniPath;
        const execOptions = { cwd: '' };
        if (vscode_1.window.activeTextEditor != null) {
            fileName = vscode_1.window.activeTextEditor.document.fileName;
            execOptions.cwd = path_1.default.dirname(fileName);
            const workspaceFolders = vscode_1.workspace.workspaceFolders;
            if (workspaceFolders != null) {
                iniPath = await (0, find_up_1.default)('.php.tools.ini', {
                    cwd: execOptions.cwd
                });
                const origIniPath = iniPath;
                const workspaceFolder = workspaceFolders.find(folder => iniPath?.startsWith(folder.uri.fsPath));
                iniPath = workspaceFolder != null ? origIniPath : undefined;
            }
        }
        try {
            const { stdout, stderr } = await (0, utils_1.exec)(`${this.config.php_bin} -v`, execOptions);
            if (stderr) {
                this.widget.logError('getting php version failed', stderr);
                throw new PHPFmtError_1.PHPFmtError(`"php -v" returns non-zero code`);
            }
            const match = /PHP ([\d.]+)/i.exec(stdout);
            if (match == null) {
                throw new PHPFmtError_1.PHPFmtError('Failed to parse php version');
            }
            const phpVersion = match[1];
            if (this.config.use_old_phpfmt) {
                if (semver.lt(phpVersion, '5.6.0') || semver.gt(phpVersion, '8.0.0')) {
                    throw new PHPFmtError_1.PHPFmtError('PHP version < 5.6 or > 8.0');
                }
            }
            else {
                if (semver.lt(phpVersion, '5.6.0') || semver.gt(phpVersion, '8.3.0')) {
                    throw new PHPFmtError_1.PHPFmtError('PHP version < 5.6 or > 8.3');
                }
            }
        }
        catch (err) {
            if (err instanceof PHPFmtError_1.PHPFmtError) {
                throw err;
            }
            else {
                this.widget.logError('getting php version failed', err);
                throw new PHPFmtError_1.PHPFmtError(`Error getting php version`);
            }
        }
        const tmpDir = os_1.default.tmpdir();
        let tmpRandomFileName = `${tmpDir}/temp-${Math.random()
            .toString(36)
            .replace(/[^a-z]+/g, '')
            .substring(0, 10)}`;
        if (fileName) {
            const basename = path_1.default.basename(fileName);
            const ignore = this.config.ignore;
            if (ignore.length > 0) {
                for (const ignoreItem of ignore) {
                    if (basename.match(ignoreItem) != null) {
                        this.widget.logInfo(`Ignored file ${basename} by match of ${ignoreItem}`);
                        this.widget.updateStatusBarItem(Widget_1.PHPFmtStatus.Ignore);
                        return '';
                    }
                }
            }
            tmpRandomFileName += `-${basename}`;
        }
        else {
            tmpRandomFileName += '.php';
        }
        const tmpFileName = path_1.default.normalize(tmpRandomFileName);
        try {
            await promises_1.default.writeFile(tmpFileName, text);
        }
        catch (err) {
            this.widget.logError('Create tmp file failed', err);
            throw new PHPFmtError_1.PHPFmtError(`Cannot create tmp file in "${tmpDir}"`);
        }
        try {
            await (0, utils_1.exec)(`${this.config.php_bin} -l ${tmpFileName}`, execOptions);
        }
        catch (err) {
            this.widget.logError('PHP lint failed', err);
            vscode_1.window.setStatusBarMessage('phpfmt: Format failed - syntax errors found', 4500);
            throw new PHPFmtError_1.PHPFmtSkipError();
        }
        const args = this.getArgs(tmpFileName);
        args.unshift(`"${this.getPharPath()}"`);
        let formatCmd;
        if (!iniPath) {
            formatCmd = `${this.config.php_bin} ${args.join(' ')}`;
        }
        else {
            this.widget.logInfo(`Using config file: ${iniPath}`);
            formatCmd = `${this.config.php_bin} ${args[0]} --config=${iniPath} ${args.pop()}`;
        }
        this.widget.logInfo(`Executing command: ${formatCmd}`);
        try {
            await (0, utils_1.exec)(formatCmd, execOptions);
        }
        catch (err) {
            this.widget.logError('Execute command failed', err).show();
            throw new PHPFmtError_1.PHPFmtError('Execute phpfmt failed');
        }
        const formatted = await promises_1.default.readFile(tmpFileName, 'utf-8');
        try {
            await promises_1.default.unlink(tmpFileName);
        }
        catch (err) {
            this.widget.logError('Remove temp file failed', err);
        }
        return formatted;
    }
}
exports.PHPFmt = PHPFmt;
//# sourceMappingURL=PHPFmt.js.map