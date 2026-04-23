import { IsBoolean, IsInt, IsString, MaxLength, MinLength, Min, Max, IsArray, ValidateNested, IsEnum } from "class-validator";
import { RuleConditionDto } from "./rule";
import { Type } from "class-transformer";
import type { RuleAction } from "shared/types";

export class CreateRuleDto{
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name!: string

    @IsString()
    @MaxLength(1000)
    description!: string

    @IsBoolean()
    isActive!: boolean

    @IsInt()
    @Min(1)
    @Max(1000)
    priority!: number

    @IsArray()
    @ValidateNested({
        each: true
    })
    @Type(() => RuleConditionDto)
    conditions!: RuleConditionDto[]

    @IsEnum(['AND', 'OR'])
    conditionLogic!: 'AND' | 'OR'

    @IsEnum([
        'flag',
        'block',
        'review',
        'approve',
        'notify'
    ] satisfies RuleAction[])
    action!: RuleAction

    @IsInt()
    @Min(-50)
    @Max(50)
    riskScoreImpact!: number
}