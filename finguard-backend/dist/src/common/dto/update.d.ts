import { RuleConditionDto } from "./rule";
import type { RuleAction } from "../../../shared/types";
export declare class UpdateRulesDto {
    name?: string;
    description?: string;
    isActive?: boolean;
    priority?: number;
    conditions?: RuleConditionDto[];
    conditionLogic?: 'AND' | 'OR';
    action?: RuleAction;
}
