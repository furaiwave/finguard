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
exports.CreateRuleDto = void 0;
const class_validator_1 = require("class-validator");
const rule_1 = require("./rule");
const class_transformer_1 = require("class-transformer");
class CreateRuleDto {
    name;
    description;
    isActive;
    priority;
    conditions;
    conditionLogic;
    action;
    riskScoreImpact;
}
exports.CreateRuleDto = CreateRuleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateRuleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateRuleDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRuleDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], CreateRuleDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({
        each: true
    }),
    (0, class_transformer_1.Type)(() => rule_1.RuleConditionDto),
    __metadata("design:type", Array)
], CreateRuleDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['AND', 'OR']),
    __metadata("design:type", String)
], CreateRuleDto.prototype, "conditionLogic", void 0);
__decorate([
    (0, class_validator_1.IsEnum)([
        'flag',
        'block',
        'review',
        'approve',
        'notify'
    ]),
    __metadata("design:type", String)
], CreateRuleDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(-50),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], CreateRuleDto.prototype, "riskScoreImpact", void 0);
//# sourceMappingURL=createRule.js.map