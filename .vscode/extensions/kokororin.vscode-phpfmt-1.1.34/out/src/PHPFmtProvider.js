"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHPFmtProvider = void 0;
const vscode_1 = require("vscode");
const pjson_1 = __importDefault(require("pjson"));
const Widget_1 = require("./Widget");
const PHPFmtError_1 = require("./PHPFmtError");
class PHPFmtProvider {
    constructor(widget, phpfmt) {
        this.widget = widget;
        this.phpfmt = phpfmt;
        this.config = vscode_1.workspace.getConfiguration('phpfmt');
        this.documentSelector = [
            { language: 'php', scheme: 'file' },
            { language: 'php', scheme: 'untitled' }
        ];
        this.widget.logInfo(`Extension Version: ${pjson_1.default.version}`);
        this.transformation = this.phpfmt.getTransformation();
    }
    registerOnDidChangeConfiguration() {
        return vscode_1.workspace.onDidChangeConfiguration(() => {
            this.config = vscode_1.workspace.getConfiguration('phpfmt');
            this.phpfmt.loadSettings();
            this.transformation = this.phpfmt.getTransformation();
            this.widget.logInfo(`settings reloaded`);
        });
    }
    registerFormatCommand() {
        return vscode_1.commands.registerTextEditorCommand('phpfmt.format', textEditor => {
            if (textEditor.document.languageId === 'php') {
                void vscode_1.commands.executeCommand('editor.action.formatDocument');
            }
        });
    }
    async getTransformationItems() {
        const transformationItems = await this.transformation.getTransformations();
        const items = transformationItems.map(o => ({
            label: o.key,
            description: o.description
        }));
        return items;
    }
    registerListTransformationsCommand() {
        return vscode_1.commands.registerCommand('phpfmt.listTransformations', async () => {
            const items = await this.getTransformationItems();
            const result = await vscode_1.window.showQuickPick(items);
            if (typeof result !== 'undefined') {
                this.widget.logInfo('Getting transformation output');
                const output = await this.transformation.getExample({
                    key: result.label,
                    description: result.description ?? ''
                });
                this.widget.getOutputChannel().appendLine(output);
                this.widget.getOutputChannel().show();
            }
        });
    }
    async showUpdateConfigQuickPick(section, value) {
        const targetResult = await vscode_1.window.showQuickPick(['Global', 'Workspace'], {
            placeHolder: 'Where to update settings.json?'
        });
        let target;
        if (targetResult === 'Global') {
            target = vscode_1.ConfigurationTarget.Global;
        }
        else {
            target = vscode_1.ConfigurationTarget.Workspace;
        }
        try {
            await this.config.update(section, value, target);
            await vscode_1.window.showInformationMessage('Configuration updated successfully!');
        }
        catch (err) {
            await vscode_1.window.showErrorMessage('Configuration updated failed!');
        }
    }
    registerToggleTransformationsCommand() {
        const commands = [
            {
                command: 'toggleAdditionalTransformations',
                key: 'passes'
            },
            {
                command: 'toggleExcludedTransformations',
                key: 'exclude'
            }
        ];
        return commands.map(command => vscode_1.commands.registerCommand(`phpfmt.${command.command}`, async () => {
            const items = await this.getTransformationItems();
            items.unshift({
                label: 'All',
                description: 'Choose all of following'
            });
            const result = await vscode_1.window.showQuickPick(items);
            if (typeof result !== 'undefined') {
                let value = this.config.get(command.key);
                if (result.label === 'All') {
                    value = items.filter(o => o.label !== 'All').map(o => o.label);
                }
                else {
                    const enabled = value?.includes(result.label);
                    const enableResult = await vscode_1.window.showQuickPick([
                        {
                            label: 'Enable',
                            description: enabled ? 'Current' : ''
                        },
                        {
                            label: 'Disable',
                            description: !enabled ? 'Current' : ''
                        }
                    ]);
                    if (typeof enableResult !== 'undefined') {
                        if (enableResult.label === 'Enable' && !enabled) {
                            value?.push(result.label);
                        }
                        else if (enableResult.label === 'Disable' && enabled) {
                            value = value?.filter(v => v !== result.label);
                        }
                    }
                }
                await this.showUpdateConfigQuickPick(command.key, value);
            }
        }));
    }
    registerToggleBooleanCommand() {
        const commands = [
            {
                command: 'togglePSR1Naming',
                key: 'psr1_naming'
            },
            {
                command: 'togglePSR1',
                key: 'psr1'
            },
            {
                command: 'togglePSR2',
                key: 'psr2'
            },
            {
                command: 'toggleAutoAlign',
                key: 'enable_auto_align'
            }
        ];
        return commands.map(command => vscode_1.commands.registerCommand(`phpfmt.${command.command}`, async () => {
            const value = this.config.get(command.key);
            const result = await vscode_1.window.showQuickPick([
                {
                    label: 'Enable',
                    description: value ? 'Current' : ''
                },
                {
                    label: 'Disable',
                    description: !value ? 'Current' : ''
                }
            ]);
            if (typeof result !== 'undefined') {
                await this.showUpdateConfigQuickPick(command.key, result.label === 'Enable');
            }
        }));
    }
    registerToggleIndentWithSpaceCommand() {
        return vscode_1.commands.registerCommand('phpfmt.toggleIndentWithSpace', async () => {
            const result = await vscode_1.window.showQuickPick(['tabs', '2', '4', '6', '8']);
            if (typeof result !== 'undefined') {
                const value = result === 'tabs' ? false : Number(result);
                await this.showUpdateConfigQuickPick('indent_with_space', value);
            }
        });
    }
    registerDocumentFormattingEditProvider() {
        return vscode_1.languages.registerDocumentFormattingEditProvider(this.documentSelector, {
            provideDocumentFormattingEdits: async (document) => {
                try {
                    const originalText = document.getText();
                    const lastLine = document.lineAt(document.lineCount - 1);
                    const range = new vscode_1.Range(new vscode_1.Position(0, 0), lastLine.range.end);
                    const text = await this.phpfmt.format(originalText);
                    this.widget.updateStatusBarItem(Widget_1.PHPFmtStatus.Success);
                    if (text && text !== originalText) {
                        return [new vscode_1.TextEdit(range, text)];
                    }
                }
                catch (err) {
                    this.widget.updateStatusBarItem(Widget_1.PHPFmtStatus.Error);
                    if (!(err instanceof PHPFmtError_1.PHPFmtSkipError) && err instanceof Error) {
                        void vscode_1.window.showErrorMessage(err.message);
                        this.widget.logError('Format failed', err);
                    }
                }
                return [];
            }
        });
    }
    registerDocumentRangeFormattingEditProvider() {
        return vscode_1.languages.registerDocumentRangeFormattingEditProvider(this.documentSelector, {
            provideDocumentRangeFormattingEdits: async (document, range) => {
                try {
                    let originalText = document.getText(range);
                    if (originalText.replace(/\s+/g, '').length === 0) {
                        return [];
                    }
                    let hasModified = false;
                    if (originalText.search(/^\s*<\?php/i) === -1) {
                        originalText = `<?php\n${originalText}`;
                        hasModified = true;
                    }
                    let text = await this.phpfmt.format(originalText);
                    if (hasModified) {
                        text = text.replace(/^<\?php\r?\n/, '');
                    }
                    this.widget.updateStatusBarItem(Widget_1.PHPFmtStatus.Success);
                    if (text && text !== originalText) {
                        return [new vscode_1.TextEdit(range, text)];
                    }
                }
                catch (err) {
                    this.widget.updateStatusBarItem(Widget_1.PHPFmtStatus.Error);
                    if (!(err instanceof PHPFmtError_1.PHPFmtSkipError) && err instanceof Error) {
                        void vscode_1.window.showErrorMessage(err.message);
                        this.widget.logError('Format failed', err);
                    }
                }
                return [];
            }
        });
    }
    registerStatusBarItem() {
        return [
            vscode_1.window.onDidChangeActiveTextEditor(editor => {
                this.widget.toggleStatusBarItem(editor);
            }),
            vscode_1.commands.registerCommand('phpfmt.openOutput', () => {
                this.widget.getOutputChannel().show();
            })
        ];
    }
}
exports.PHPFmtProvider = PHPFmtProvider;
//# sourceMappingURL=PHPFmtProvider.js.map