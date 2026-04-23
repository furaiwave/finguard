import { Repository } from 'typeorm';
import { type ReportId } from "../../../shared/types";
import { ReportEntity } from "../../common/interceptors/entities/report";
import { TransactionEntity } from "../../common/interceptors/entities/transactions";
import { AnalysisEntity } from "../../common/interceptors/entities/analysis";
import { GenerateReportDto } from "../../common/dto/report";
export declare class ReportsService {
    private readonly rpRepo;
    private readonly txRepo;
    private readonly anRepo;
    constructor(rpRepo: Repository<ReportEntity>, txRepo: Repository<TransactionEntity>, anRepo: Repository<AnalysisEntity>);
    generate(dto: GenerateReportDto): Promise<ReportEntity>;
    findAll(): Promise<ReportEntity[]>;
    findOne(id: ReportId): Promise<ReportEntity>;
    remove(id: ReportId): Promise<void>;
    private buildData;
    private fraudSummary;
    private volume;
    private riskDist;
    private aiPerf;
    private dateRange;
}
