import type { TransactionId, AnalysisId, RiskScore, ConfidenceScore, ModelVersion, RiskLevel, Verdict, FraudSignal } from '../../../../shared/types';
import { TransactionEntity } from './transactions';
export declare class AnalysisEntity {
    id: AnalysisId;
    transactionId: TransactionId;
    transaction: TransactionEntity;
    modelVersion: ModelVersion;
    riskScore: RiskScore;
    confidence: ConfidenceScore;
    verdict: Verdict;
    riskLevel: RiskLevel;
    requiresReview: boolean;
    signals: ReadonlyArray<FraudSignal>;
    reasoning: string;
    recommendations: ReadonlyArray<string>;
    processingTimeMs: number;
    reviewDeadlineMs: number | null;
    blockedReason: FraudSignal | null;
    analyzedAt: Date;
}
