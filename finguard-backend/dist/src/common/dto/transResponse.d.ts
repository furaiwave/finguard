import { CurrencyCode, TransactionChannel, TransactionStatus, TransactionType } from "../../../shared/types";
import { AnalysisResponseDto } from "./responseAnalysis";
export declare class TransactionResponseDto {
    readonly id: string;
    readonly userId: string;
    readonly amountMinor: number;
    readonly currency: CurrencyCode;
    readonly type: TransactionType;
    readonly channel: TransactionChannel;
    readonly status: TransactionStatus;
    readonly ipAddress: string;
    readonly userAgent: string;
    readonly description: string | null;
    readonly extraFields: Readonly<Record<string, unknown>> | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly latestAnalysis: AnalysisResponseDto | null;
}
