import { RuleAction, RuleCondition } from "../../../shared/types";
export declare class RuleResponseDto {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly isActive: boolean;
    readonly priority: number;
    readonly conditions: ReadonlyArray<RuleCondition>;
    readonly conditionLogic: 'AND' | 'OR';
    readonly action: RuleAction;
    readonly riskScoreImpact: number;
    readonly createdAt: string;
    readonly updatedAt: string;
}
