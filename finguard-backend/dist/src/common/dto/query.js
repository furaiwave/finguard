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
exports.TransactionQueryDto = void 0;
const class_validator_1 = require("class-validator");
class TransactionQueryDto {
    type;
    channel;
    status;
    riskLevel;
    page = 1;
    limit = 20;
    sortBy = 'createdAt';
    sortOrder = 'DESC';
}
exports.TransactionQueryDto = TransactionQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)([
        'payment',
        'transfer',
        'withdrawal',
        'deposit',
        'refund',
        'chargeback'
    ]),
    __metadata("design:type", String)
], TransactionQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)([
        'card_present',
        'card_not_present',
        'bank_transfer',
        'crypto',
        'mobile_payment',
        'atm'
    ]),
    __metadata("design:type", String)
], TransactionQueryDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)([
        'pending',
        'analyzing',
        'approved',
        'approved_with_review',
        'blocked',
        'manual_review'
    ]),
    __metadata("design:type", String)
], TransactionQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)([
        'low',
        'medium',
        'high',
        'critical',
    ]),
    __metadata("design:type", String)
], TransactionQueryDto.prototype, "riskLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TransactionQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], TransactionQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransactionQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], TransactionQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=query.js.map