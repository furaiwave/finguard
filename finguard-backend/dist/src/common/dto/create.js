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
exports.CreateTransactionDto = void 0;
const class_validator_1 = require("class-validator");
class CreateTransactionDto {
    transactionId;
    userId;
    amountMinor;
    currency;
    channel;
    type;
    ipAddress;
    userAgent;
    description;
    extraFields;
}
exports.CreateTransactionDto = CreateTransactionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(36),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "transactionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(36),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(999_999_999),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "amountMinor", void 0);
__decorate([
    (0, class_validator_1.IsEnum)([
        'USD',
        'EUR',
        'UAH',
        'CHF',
        'GBP',
        'PLN',
        'CZK'
    ]),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsEnum)([
        'card_present',
        'card_not_present',
        'bank_transfer',
        'crypto',
        'mobile_payment',
        'atm'
    ]),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsEnum)([
        'payment',
        'transfer',
        'withdrawal',
        'deposit',
        'refund',
        'chargeback'
    ]),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsIP)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "ipAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(512),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "userAgent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateTransactionDto.prototype, "extraFields", void 0);
//# sourceMappingURL=create.js.map