import { FraudSignal, LegitimacyDecision, RiskLevel } from "../../../shared/types";
export declare class AnalysisResponseDto {
    readonly id: string;
    readonly transactionId: string;
    readonly modelVersion: string;
    readonly riskScore: number;
    readonly confidence: number;
    readonly verdict: LegitimacyDecision['verdict'];
    readonly riskLevel: RiskLevel;
    readonly requiresReview: boolean;
    readonly signals: ReadonlyArray<FraudSignal>;
    readonly reasoning: string;
    readonly recommendations: ReadonlyArray<string>;
    readonly processingTimeMs: number;
    readonly reviewDeadlineMs: number | null;
    readonly blockedReason: FraudSignal | null;
    readonly analyzeAt: string;
}
