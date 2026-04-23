import type { ReportPeriod, ReportType } from "../../../shared/types";
export declare class GenerateReportDto {
    name: string;
    type: ReportType;
    period: ReportPeriod;
    startDate?: string;
    endDate?: string;
}
