import type { ReportId, ReportData, ReportPeriod, ReportType } from '../../../../shared/types';
export declare class ReportEntity {
    id: ReportId;
    name: string;
    type: ReportType;
    period: ReportPeriod;
    data: ReportData;
    generatedAt: Date;
}
