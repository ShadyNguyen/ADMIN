"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHPFmtSkipError = exports.PHPFmtError = void 0;
class PHPFmtError extends Error {
    constructor(message) {
        super(`phpfmt: ${message}`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.PHPFmtError = PHPFmtError;
class PHPFmtSkipError extends PHPFmtError {
    constructor() {
        super(PHPFmtSkipError.name);
    }
}
exports.PHPFmtSkipError = PHPFmtSkipError;
//# sourceMappingURL=PHPFmtError.js.map