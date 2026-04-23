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
exports.TransactionEntity = void 0;
const typeorm_1 = require("typeorm");
const analysis_1 = require("./analysis");
let TransactionEntity = class TransactionEntity {
    id;
    userId;
    amountMinor;
    currency;
    type;
    channel;
    status;
    ipAddress;
    userAgent;
    description;
    extraFields;
    createdAt;
    updatedAt;
    analyses;
};
exports.TransactionEntity = TransactionEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({
        type: 'varchar',
        length: 36
    }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 36,
        name: 'user_id'
    }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'bigint',
        unsigned: true,
        name: 'amount_minor'
    }),
    __metadata("design:type", Number)
], TransactionEntity.prototype, "amountMinor", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 3,
    }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['payment', 'transfer', 'withdrawal', 'deposit', 'refund', 'chargeback']
    }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['card_present', 'card_not_present', 'bank_transfer', 'crypto', 'mobile_payment', 'atm']
    }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'pending',
            'analyzing',
            'approved',
            'approved_with_review',
            'blocked',
            'manual_review'
        ],
        default: 'pending',
    }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 45,
        name: 'ip_address'
    }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        name: 'user_agent',
    }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TransactionEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'json',
        name: 'extra_fields',
        nullable: true
    }),
    __metadata("design:type", Object)
], TransactionEntity.prototype, "extraFields", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at'
    }),
    __metadata("design:type", Date)
], TransactionEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        name: 'updated_at'
    }),
    __metadata("design:type", Date)
], TransactionEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => analysis_1.AnalysisEntity, (a) => a.transaction),
    __metadata("design:type", Array)
], TransactionEntity.prototype, "analyses", void 0);
exports.TransactionEntity = TransactionEntity = __decorate([
    (0, typeorm_1.Entity)('transactions'),
    (0, typeorm_1.Index)(['status', 'createdAt']),
    (0, typeorm_1.Index)(['type', 'channel'])
], TransactionEntity);
//# sourceMappingURL=transactions.js.map