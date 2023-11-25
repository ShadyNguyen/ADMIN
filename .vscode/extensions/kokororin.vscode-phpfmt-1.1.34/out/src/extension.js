"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const PHPFmtProvider_1 = require("./PHPFmtProvider");
const PHPFmt_1 = require("./PHPFmt");
const Widget_1 = require("./Widget");
function activate(context) {
    const widget = new Widget_1.Widget();
    const phpfmt = new PHPFmt_1.PHPFmt(widget);
    const provider = new PHPFmtProvider_1.PHPFmtProvider(widget, phpfmt);
    context.subscriptions.push(provider.registerOnDidChangeConfiguration(), provider.registerFormatCommand(), provider.registerListTransformationsCommand(), ...provider.registerToggleTransformationsCommand(), ...provider.registerToggleBooleanCommand(), provider.registerToggleIndentWithSpaceCommand(), provider.registerDocumentFormattingEditProvider(), provider.registerDocumentRangeFormattingEditProvider(), ...provider.registerStatusBarItem());
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map