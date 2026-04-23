import type { TransactionChannel, TransactionId, TransactionStatus, TransactionType, AmountMinor, CurrencyCode } from '../../../../shared/types';
import { AnalysisEntity } from './analysis';
export declare class TransactionEntity {
    id: TransactionId;
    userId: string;
    amountMinor: AmountMinor;
    currency: CurrencyCode;
    type: TransactionType;
    channel: TransactionChannel;
    status: TransactionStatus;
    ipAddress: string;
    userAgent: string;
    description: string | null;
    extraFields: Readonly<Record<string, unknown>> | null;
    createdAt: Date;
    updatedAt: Date;
    analyses: AnalysisEntity[];
}
