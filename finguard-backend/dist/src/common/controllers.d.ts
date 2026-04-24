import { CreateTransactionDto } from './dto/create';
import { TransactionQueryDto } from './dto/query';
import { CreateRuleDto } from './dto/createRule';
import { UpdateRulesDto } from './dto/update';
import { GenerateReportDto } from './dto/report';
import { UlbBatchDto } from './interceptors/entities/ulbDataset';
import { TransactionsService } from "../modules/transactions/transactions.service";
import { RulesService } from "../modules/rules/rules.service";
import { ReportsService } from "../modules/reports/reports.service";
import { DatasetAnalysisService } from "../modules/dataset/dataset.service";
export declare class TransactionController {
    private readonly txService;
    constructor(txService: TransactionsService);
    create(dto: CreateTransactionDto): Promise<import("./dto/transResponse").TransactionResponseDto>;
    findAll(q: TransactionQueryDto): Promise<import("shared/types").PaginatedResponse<import("./dto/transResponse").TransactionResponseDto>>;
    findOne(id: string): Promise<import("./dto/transResponse").TransactionResponseDto>;
    analyze(id: string): Promise<import("./dto/responseAnalysis").AnalysisResponseDto>;
    remove(id: string): Promise<void>;
}
export declare class RuleContoller {
    private readonly ruleService;
    constructor(ruleService: RulesService);
    create(dto: CreateRuleDto): Promise<import("./dto/ruleResponse").RuleResponseDto>;
    findAll(): Promise<import("./dto/ruleResponse").RuleResponseDto[]>;
    findOne(id: string): Promise<import("./dto/ruleResponse").RuleResponseDto>;
    update(id: string, dto: UpdateRulesDto): Promise<import("./dto/ruleResponse").RuleResponseDto>;
    toggle(id: string): Promise<import("./dto/ruleResponse").RuleResponseDto>;
    remove(id: string): Promise<void>;
}
export declare class DatasetController {
    private readonly datasetService;
    constructor(datasetService: DatasetAnalysisService);
    analyzeBatch(dto: UlbBatchDto): Promise<import("src/modules/dataset/dataset.service").UlbAnalysisResult[]>;
}
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportsService);
    generate(dto: GenerateReportDto): Promise<import("./interceptors/entities/report").ReportEntity>;
    findAll(): Promise<import("./interceptors/entities/report").ReportEntity[]>;
    findOne(id: string): Promise<import("./interceptors/entities/report").ReportEntity>;
    remove(id: string): Promise<void>;
}
