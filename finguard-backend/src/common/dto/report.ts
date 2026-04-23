import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import type { ReportPeriod, ReportType } from "shared/types";

export class GenerateReportDto { 
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name!: string

    @IsEnum([
        'fraud_summary',
        'transaction_volume',
        'risk_distribution',
        'rule_effectiveness',
        'ai_performance'
    ] satisfies ReportType[])
    type!: ReportType

    @IsEnum([
        'daily',
        'weekly',
        'monthly',
        'custom'
    ] satisfies ReportPeriod[])
    period!: ReportPeriod

    @IsOptional()
    @IsString()
    startDate?: string

    @IsOptional()
    @IsString()
    endDate?: string
}