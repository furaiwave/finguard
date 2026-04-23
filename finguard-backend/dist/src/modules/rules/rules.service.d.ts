import { Repository } from 'typeorm';
import { type RuleId } from "../../../shared/types";
import { RuleEntity } from "../../common/interceptors/entities/rules";
import { CreateRuleDto } from "../../common/dto/createRule";
import { UpdateRulesDto } from "../../common/dto/update";
import { RuleResponseDto } from "../../common/dto/ruleResponse";
export declare class RulesService {
    private readonly repo;
    constructor(repo: Repository<RuleEntity>);
    private toDto;
    create(dto: CreateRuleDto): Promise<RuleResponseDto>;
    findAll(): Promise<RuleResponseDto[]>;
    findOne(id: RuleId): Promise<RuleResponseDto>;
    update(id: RuleId, dto: UpdateRulesDto): Promise<RuleResponseDto>;
    toggle(id: RuleId): Promise<RuleResponseDto>;
    remove(id: RuleId): Promise<void>;
}
