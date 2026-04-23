import { ConfigService } from '@nestjs/config';
import { type AnyTransaction, type AiAnalysisResult, RuleDefinition } from "../../../shared/types";
import { Repository } from 'typeorm';
import { AnalysisEntity } from "../../common/interceptors/entities/analysis";
import type { AnalysisResponseDto } from "../../common/dto/responseAnalysis";
export declare class AiAnalysisService {
    private readonly config;
    private readonly repo;
    private readonly logger;
    private readonly client;
    private readonly modelVersion;
    constructor(config: ConfigService, repo: Repository<AnalysisEntity>);
    analyze(transaction: AnyTransaction, activeRules: ReadonlyArray<RuleDefinition>): Promise<AiAnalysisResult>;
    toResponseDto(a: AnalysisEntity): AnalysisResponseDto;
    private applyRules;
    private buildDecision;
    private systemPrompt;
    private buildPrompt;
    private parseResponse;
    private fullbackSchema;
}
