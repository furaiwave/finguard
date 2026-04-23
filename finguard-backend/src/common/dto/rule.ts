import { IsEnum, IsString, IsNotEmpty } from "class-validator";
import type { RuleOperator } from "shared/types";

export class RuleConditionDto {
    @IsString()
    field!: string

    @IsEnum([
        'gt',
        'gte',
        'lt',
        'lte',
        'eq',
        'neq',
        'contains',
        'not_contains',
        'in',
        'not_in'
    ] satisfies RuleOperator[])
    operator!: RuleOperator

    @IsNotEmpty()
    value!: string | number | boolean | Array<string | number>
}