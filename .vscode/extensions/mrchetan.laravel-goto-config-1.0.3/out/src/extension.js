'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode_1 = require("vscode");
const linkProvider_1 = require("./providers/linkProvider");
const util = require("./util");
let providers = [];
const debounce = require('lodash.debounce');
function activate(context) {
    util.readConfig();
    // config
    vscode_1.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(util.PACKAGE_NAME)) {
            util.readConfig();
        }
    });
    // links
    initProviders();
    vscode_1.window.onDidChangeActiveTextEditor(async (e) => {
        await clearAll();
        initProviders();
    });
    // scroll
    util.scrollToText();
}
exports.activate = activate;
const initProviders = debounce(function () {
    providers.push(vscode_1.languages.registerDocumentLinkProvider(['php', 'blade'], new linkProvider_1.default()));
}, 250);
function clearAll() {
    return new Promise((res, rej) => {
        providers.map((e) => e.dispose());
        providers = [];
        setTimeout(() => {
            return res(true);
        }, 500);
    });
}
function deactivate() {
    clearAll();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map