'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.readConfig = exports.methods = exports.config = exports.PACKAGE_NAME = exports.scrollToText = exports.getFilePaths = exports.setWs = void 0;
const vscode_1 = require("vscode");
const path = require('path');
const sep = path.sep;
const glob = require('fast-glob');
const exec = require('await-exec');
let ws;
function setWs(uri) {
    ws = vscode_1.workspace.getWorkspaceFolder(uri)?.uri.fsPath;
}
exports.setWs = setWs;
/* -------------------------------------------------------------------------- */
let cache_store_link = [];
async function getFilePaths(text) {
    text = text.replace(/['"]/g, '');
    if (text.endsWith('.')) {
        return [];
    }
    let cache_key = text;
    let list = checkCache(cache_store_link, cache_key);
    if (!list.length) {
        list = await getData(text);
        if (list.length) {
            saveCache(cache_store_link, cache_key, list);
        }
    }
    return list;
}
exports.getFilePaths = getFilePaths;
async function getData(text) {
    let fileList = text.split('.');
    let keyName = fileList.pop();
    let paths = exports.config.folders;
    let editor = `${vscode_1.env.uriScheme}://file`;
    let toCheck = [];
    while (fileList.length > 0) {
        toCheck.push(`**/${fileList.join(sep)}.php`);
        fileList.pop();
    }
    let result = [];
    for (const path of paths) {
        let urls = await glob(toCheck, { cwd: `${ws}${sep}${path}` });
        let url = urls[0];
        let val = await getConfigValue(text);
        if (url != undefined) {
            let file = `${path}${sep}${url}`;
            let fileUri = vscode_1.Uri
                .parse(`${editor}${ws}${sep}${file}`)
                .with({ authority: 'mrchetan.laravel-goto-config', path: '/' + `${ws}${sep}${file}`, query: keyName });
            result.push({
                tooltip: `${val} (${file})`,
                fileUri: fileUri
            });
        }
        else {
            if (exports.config.forceShowConfigLink) {
                result.push({
                    tooltip: val,
                    fileUri: null
                });
            }
        }
    }
    return result;
}
/* Tinker ------------------------------------------------------------------- */
let counter = 1;
async function getConfigValue(key) {
    let timer;
    try {
        let res = await exec(`php artisan tinker --execute="echo json_encode(config('${key}'))"`, {
            cwd: ws,
            shell: vscode_1.env.shell
        });
        return res.stdout.replace(/<.*/, '').trim().replace(/['"]/g, '');
    }
    catch (error) {
        // console.error(error)
        if (counter >= 3) {
            return clearTimeout(timer);
        }
        timer = setTimeout(() => {
            counter++;
            getConfigValue(key);
        }, 2000);
    }
}
/* Scroll ------------------------------------------------------------------- */
function scrollToText() {
    vscode_1.window.registerUriHandler({
        handleUri(provider) {
            let { authority, path, query } = provider;
            if (authority == 'mrchetan.laravel-goto-config') {
                vscode_1.commands.executeCommand('vscode.openFolder', vscode_1.Uri.file(path))
                    .then(() => {
                    setTimeout(() => {
                        let editor = vscode_1.window.activeTextEditor;
                        let range = getTextPosition(query, editor.document);
                        if (range) {
                            editor.selection = new vscode_1.Selection(range.start, range.end);
                            editor.revealRange(range, 3);
                        }
                        if (!range && query) {
                            vscode_1.window.showInformationMessage('Laravel Goto Config: Copy Key To Clipboard', ...['Copy']).then((e) => {
                                if (e) {
                                    vscode_1.env.clipboard.writeText(`'${query}'`);
                                }
                            });
                        }
                    }, 500);
                });
            }
        }
    });
}
exports.scrollToText = scrollToText;
function getTextPosition(searchFor, doc) {
    let txt = doc.getText();
    let arr = searchFor.split('.');
    let last = arr[arr.length - 1];
    let regex = '';
    let match;
    if (searchFor.includes('.')) {
        for (const item of arr) {
            regex += item == last
                ? `${item}.*=>`
                : `['"]${item}.*\\[([\\S\\s]*?)`;
        }
        match = new RegExp(regex).exec(txt);
    }
    else {
        match = new RegExp(`['"]${searchFor}['"].*=>`).exec(txt);
    }
    if (match) {
        let pos = doc.positionAt(match.index + match[0].length);
        return new vscode_1.Range(pos, pos);
    }
}
/* Helpers ------------------------------------------------------------------ */
function checkCache(cache_store, text) {
    let check = cache_store.find((e) => e.key == text);
    return check ? check.val : [];
}
function saveCache(cache_store, text, val) {
    checkCache(cache_store, text).length
        ? false
        : cache_store.push({
            key: text,
            val: val
        });
    return val;
}
/* Config ------------------------------------------------------------------- */
const escapeStringRegexp = require('escape-string-regexp');
exports.PACKAGE_NAME = 'laravelGotoConfig';
exports.config = {};
exports.methods = '';
function readConfig() {
    exports.config = vscode_1.workspace.getConfiguration(exports.PACKAGE_NAME);
    exports.methods = exports.config.methods.map((e) => escapeStringRegexp(e)).join('|');
}
exports.readConfig = readConfig;
//# sourceMappingURL=util.js.map