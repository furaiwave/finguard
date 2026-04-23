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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const types_1 = require("../../../shared/types");
const rules_1 = require("../../common/interceptors/entities/rules");
let RulesService = class RulesService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    toDto(r) {
        return {
            id: r.id,
            name: r.name,
            description: r.description,
            isActive: r.isActive,
            priority: r.priority,
            conditions: r.conditions,
            conditionLogic: r.conditionLogic,
            action: r.action,
            riskScoreImpact: r.riskScoreImpact,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        };
    }
    async create(dto) {
        const rule = this.repo.create({ id: (0, types_1.mkRuleId)((0, uuid_1.v4)()), ...dto });
        return this.toDto(await this.repo.save(rule));
    }
    async findAll() {
        const rules = await this.repo.find({ order: { priority: 'ASC' } });
        return rules.map((r) => this.toDto(r));
    }
    async findOne(id) {
        const rule = await this.repo.findOne({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException(`Rule ${id} not found`);
        return this.toDto(rule);
    }
    async update(id, dto) {
        const rule = await this.repo.findOne({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException(`Rule ${id} not found`);
        return this.toDto(await this.repo.save(Object.assign(rule, dto)));
    }
    async toggle(id) {
        const rule = await this.repo.findOne({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException(`Rule ${id} not found`);
        rule.isActive = !rule.isActive;
        return this.toDto(await this.repo.save(rule));
    }
    async remove(id) {
        if (!(await this.repo.findOne({ where: { id } })))
            throw new common_1.NotFoundException(`Rule ${id} not found`);
        await this.repo.delete(id);
    }
};
exports.RulesService = RulesService;
exports.RulesService = RulesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rules_1.RuleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RulesService);
//# sourceMappingURL=rules.service.js.map