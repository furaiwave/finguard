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
exports.RuleEntity = void 0;
const typeorm_1 = require("typeorm");
let RuleEntity = class RuleEntity {
    id;
    name;
    description;
    isActive;
    priority;
    conditions;
    conditionLogic;
    action;
    riskScoreImpact;
    createdAt;
    updatedAt;
};
exports.RuleEntity = RuleEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], RuleEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 200,
    }),
    __metadata("design:type", String)
], RuleEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text'
    }),
    __metadata("design:type", String)
], RuleEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'boolean',
        name: 'is_active',
        default: true
    }),
    __metadata("design:type", Boolean)
], RuleEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'smallint',
        unsigned: true,
        default: 200
    }),
    __metadata("design:type", Number)
], RuleEntity.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], RuleEntity.prototype, "conditions", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['AND', 'OR'],
        name: 'condition_logic',
        default: 'AND'
    }),
    __metadata("design:type", String)
], RuleEntity.prototype, "conditionLogic", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'flag',
            'block',
            'review',
            'approve',
            'notify'
        ]
    }),
    __metadata("design:type", String)
], RuleEntity.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'tinyint',
        name: 'risk_score_impact',
        default: 0
    }),
    __metadata("design:type", Number)
], RuleEntity.prototype, "riskScoreImpact", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at'
    }),
    __metadata("design:type", Date)
], RuleEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        name: 'updated_at'
    }),
    __metadata("design:type", Date)
], RuleEntity.prototype, "updatedAt", void 0);
exports.RuleEntity = RuleEntity = __decorate([
    (0, typeorm_1.Entity)('rules'),
    (0, typeorm_1.Index)(['isActive', 'priority'])
], RuleEntity);
//# sourceMappingURL=rules.js.map