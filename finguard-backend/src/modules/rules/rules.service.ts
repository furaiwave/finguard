import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid'
import { mkRuleId, type RuleId } from 'shared/types';
import { RuleEntity } from 'src/common/interceptors/entities/rules';
import { CreateRuleDto } from 'src/common/dto/createRule';
import { UpdateRulesDto } from 'src/common/dto/update';
import { RuleResponseDto } from 'src/common/dto/ruleResponse';

@Injectable()
export class RulesService {
    constructor(
        @InjectRepository(RuleEntity)
        private readonly repo: Repository<RuleEntity>
    ) {}

    private toDto(r: RuleEntity): RuleResponseDto{
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
        }
    }

    async create(dto: CreateRuleDto): Promise<RuleResponseDto>{
        const rule = this.repo.create({ id: mkRuleId(uuidv4()), ...dto})
        return this.toDto(await this.repo.save(rule))
    }

    async findAll(): Promise<RuleResponseDto[]> {
        const rules = await this.repo.find({ order: { priority: 'ASC' }})
        return rules.map((r) => this.toDto(r))
    }

    async findOne(id: RuleId): Promise<RuleResponseDto>{
        const rule = await this.repo.findOne({ where: { id } })
        if(!rule) throw new NotFoundException(`Rule ${id} not found`)
        return this.toDto(rule)
    }

    async update(id: RuleId, dto: UpdateRulesDto): Promise<RuleResponseDto>{
        const rule = await this.repo.findOne({ where: { id }})
        if(!rule) throw new NotFoundException(`Rule ${id} not found`)
        return this.toDto(await this.repo.save(Object.assign(rule, dto)))
    }

    async toggle(id: RuleId): Promise<RuleResponseDto>{
        const rule = await this.repo.findOne({ where: { id} })
        if(!rule) throw new NotFoundException(`Rule ${id} not found`)
        rule.isActive = !rule.isActive
        return this.toDto(await this.repo.save(rule))
    }

    async remove(id: RuleId): Promise<void>{
        if(!(await this.repo.findOne({ where: { id } })))
            throw new NotFoundException(`Rule ${id} not found`)
        await this.repo.delete(id)
    }
}
