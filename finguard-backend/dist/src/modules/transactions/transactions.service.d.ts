import { Repository } from 'typeorm';
import { CreateTransactionDto } from "../../common/dto/create";
import { TransactionResponseDto } from "../../common/dto/transResponse";
import { AnalysisResponseDto } from "../../common/dto/responseAnalysis";
import { TransactionQueryDto } from "../../common/dto/query";
import { AiAnalysisService } from '../analysis/analysis.service';
import { TransactionEntity } from "../../common/interceptors/entities/transactions";
import { AnalysisEntity } from "../../common/interceptors/entities/analysis";
import { RuleEntity } from "../../common/interceptors/entities/rules";
import { type TransactionId, type PaginatedResponse } from "../../../shared/types";
export declare class TransactionsService {
    private readonly txRepo;
    private readonly analysisRepo;
    private readonly ruleRepo;
    private readonly aiService;
    private readonly logger;
    constructor(txRepo: Repository<TransactionEntity>, analysisRepo: Repository<AnalysisEntity>, ruleRepo: Repository<RuleEntity>, aiService: AiAnalysisService);
    private toDto;
    private entityToPayLoad;
    create(dto: CreateTransactionDto): Promise<TransactionResponseDto>;
    findAll(q: TransactionQueryDto): Promise<PaginatedResponse<TransactionResponseDto>>;
    findOne(id: TransactionId): Promise<TransactionResponseDto>;
    analyze(id: TransactionId): Promise<AnalysisResponseDto>;
    remove(id: TransactionId): Promise<void>;
}
