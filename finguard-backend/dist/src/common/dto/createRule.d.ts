import { RuleConditionDto } from "./rule";
import type { RuleAction } from "../../../shared/types";
export declare class CreateRuleDto {
    name: string;
    description: string;
    isActive: boolean;
    priority: number;
    conditions: RuleConditionDto[];
    conditionLogic: 'AND' | 'OR';
    action: RuleAction;
    riskScoreImpact: number;
}
