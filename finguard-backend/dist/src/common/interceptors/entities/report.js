"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportEntity = void 0;
const typeorm_1 = require("typeorm");
let ReportEntity = class ReportEntity {
    id;
    name;
    type;
    period;
    data;
    generatedAt;
};
exports.ReportEntity = ReportEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ReportEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], ReportEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'fraud_summary',
            'transaction_volume',
            'risk_distribution',
            'rule_effectiveness',
            'ai_performance'
        ]
    }),
    __metadata("design:type", String)
], ReportEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'daily',
            'weekly',
            'monthly',
            'custom'
        ]
    }),
    __metadata("design:type", String)
], ReportEntity.prototype, "period", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'json',
    }),
    __metadata("design:type", Object)
], ReportEntity.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'datetime',
        name: 'generated_at'
    }),
    __metadata("design:type", Date)
], ReportEntity.prototype, "generatedAt", void 0);
exports.ReportEntity = ReportEntity = __decorate([
    (0, typeorm_1.Entity)('reports')
], ReportEntity);
//# sourceMappingURL=report.js.map