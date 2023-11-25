'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const util = require("../util");
class LinkProvider {
    constructor() {
        this.methods = util.methods;
    }
    async provideDocumentLinks(doc) {
        let editor = vscode_1.window.activeTextEditor;
        if (editor) {
            util.setWs(doc.uri);
            const text = doc.getText();
            let regex = new RegExp(`(?<=(${this.methods}))['"]([^$*]*?)['"]`, 'g');
            let links = [];
            let matches = text.matchAll(regex);
            for (const match of matches) {
                let found = match[0];
                let files = await util.getFilePaths(found);
                const range = doc.getWordRangeAtPosition(doc.positionAt(match.index), regex);
                if (files.length && range) {
                    for (const file of files) {
                        let documentlink = new vscode_1.DocumentLink(range, file.fileUri);
                        documentlink.tooltip = file.tooltip;
                        links.push(documentlink);
                    }
                }
            }
            return links;
        }
    }
}
exports.default = LinkProvider;
//# sourceMappingURL=linkProvider.js.map