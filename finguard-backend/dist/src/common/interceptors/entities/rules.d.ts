import type { RuleId, RuleAction, RuleCondition } from '../../../../shared/types';
export declare class RuleEntity {
    id: RuleId;
    name: string;
    description: string;
    isActive: boolean;
    priority: number;
    conditions: ReadonlyArray<RuleCondition>;
    conditionLogic: 'AND' | 'OR';
    action: RuleAction;
    riskScoreImpact: number;
    createdAt: Date;
    updatedAt: Date;
}
