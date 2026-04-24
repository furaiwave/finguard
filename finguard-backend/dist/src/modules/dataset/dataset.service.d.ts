import { ConfigService } from '@nestjs/config';
import type { UlbRowDto } from "../../common/interceptors/entities/ulbDataset";
import type { RiskLevel } from "../../../shared/types";
type UlbVerdict = 'fraud' | 'legitimate';
export type UlbAnalysisResult = {
    rowIndex: number;
    amount: number;
    trueClass: 0 | 1;
    verdict: UlbVerdict;
    riskScore: number;
    riskLevel: RiskLevel;
    confidence: number;
    reasoning: string;
    primarySignals: string[];
    processingTimeMs: number;
    isCorrect: boolean;
};
export declare class DatasetAnalysisService {
    private readonly config;
    private readonly logger;
    private readonly client;
    constructor(config: ConfigService);
    analyzeBatch(rows: UlbRowDto[]): Promise<UlbAnalysisResult[]>;
    private analyzeRow;
    private systemPrompt;
    private buildPrompt;
    private parseResponse;
    private fallbackSchema;
}
export {};
