import type { RuleOperator } from "../../../shared/types";
export declare class RuleConditionDto {
    field: string;
    operator: RuleOperator;
    value: string | number | boolean | Array<string | number>;
}
