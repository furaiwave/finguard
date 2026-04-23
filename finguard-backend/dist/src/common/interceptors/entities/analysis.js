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
exports.AnalysisEntity = void 0;
const typeorm_1 = require("typeorm");
const transactions_1 = require("./transactions");
let AnalysisEntity = class AnalysisEntity {
    id;
    transactionId;
    transaction;
    modelVersion;
    riskScore;
    confidence;
    verdict;
    riskLevel;
    requiresReview;
    signals;
    reasoning;
    recommendations;
    processingTimeMs;
    reviewDeadlineMs;
    blockedReason;
    analyzedAt;
};
exports.AnalysisEntity = AnalysisEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 36
    }),
    __metadata("design:type", String)
], AnalysisEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 36,
        name: 'transaction_id'
    }),
    __metadata("design:type", String)
], AnalysisEntity.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => transactions_1.TransactionEntity, (t) => t.analyses),
    (0, typeorm_1.JoinColumn)({ name: 'transaction_id' }),
    __metadata("design:type", transactions_1.TransactionEntity)
], AnalysisEntity.prototype, "transaction", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 30,
        name: 'model_version'
    }),
    __metadata("design:type", String)
], AnalysisEntity.prototype, "modelVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'tinyint',
        unsigned: true,
        name: 'risk_score'
    }),
    __metadata("design:type", Number)
], AnalysisEntity.prototype, "riskScore", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 4,
        scale: 3
    }),
    __metadata("design:type", Number)
], AnalysisEntity.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'approved',
            'approved_with_review',
            'blocked',
            'pending_manual_review'
        ],
    }),
    __metadata("design:type", String)
], AnalysisEntity.prototype, "verdict", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['low', 'medium', 'high', 'critical'],
        name: 'risk_level',
    }),
    __metadata("design:type", String)
], AnalysisEntity.prototype, "riskLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        name: 'requires_review',
        default: false
    }),
    __metadata("design:type", Boolean)
], AnalysisEntity.prototype, "requiresReview", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'json'
    }),
    __metadata("design:type", Array)
], AnalysisEntity.prototype, "signals", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text'
    }),
    __metadata("design:type", String)
], AnalysisEntity.prototype, "reasoning", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'json'
    }),
    __metadata("design:type", Array)
], AnalysisEntity.prototype, "recommendations", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        name: 'processing_time_ms'
    }),
    __metadata("design:type", Number)
], AnalysisEntity.prototype, "processingTimeMs", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'bigint',
        nullable: true,
        name: 'review_deadline_ms'
    }),
    __metadata("design:type", Object)
], AnalysisEntity.prototype, "reviewDeadlineMs", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'json',
        name: 'blocked_reason',
        nullable: true
    }),
    __metadata("design:type", Object)
], AnalysisEntity.prototype, "blockedReason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'analyzed_at'
    }),
    __metadata("design:type", Date)
], AnalysisEntity.prototype, "analyzedAt", void 0);
exports.AnalysisEntity = AnalysisEntity = __decorate([
    (0, typeorm_1.Entity)('analyses'),
    (0, typeorm_1.Index)(['transactionId', 'analyzedAt'])
], AnalysisEntity);
//# sourceMappingURL=analysis.js.map