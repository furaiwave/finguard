"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseIntercaptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let ResponseIntercaptor = class ResponseIntercaptor {
    intercept(_ctx, next) {
        return next.handle().pipe((0, operators_1.map)((data) => ({
            success: true,
            data,
            timestamp: new Date().toISOString()
        })), (0, operators_1.catchError)((err) => {
            const status = err instanceof common_1.HttpException ? err.getStatus() : 500;
            const code = common_1.HttpStatus[status] ?? 'INTERNAL_ERROR';
            const message = err instanceof common_1.HttpException
                ? (() => { const r = err.getResponse(); return typeof r === 'string' ? r : r.message ?? err.message; })()
                : err instanceof Error ? err.message : 'Unknown error';
            return (0, rxjs_1.throwError)(() => new common_1.HttpException({ success: false, error: { code, message }, timestamp: new Date().toISOString() }, status));
        }));
    }
};
exports.ResponseIntercaptor = ResponseIntercaptor;
exports.ResponseIntercaptor = ResponseIntercaptor = __decorate([
    (0, common_1.Injectable)()
], ResponseIntercaptor);
//# sourceMappingURL=response.js.map