import type { TransactionType, TransactionChannel, TransactionStatus, RiskLevel } from '../../../shared/types';
export declare class TransactionQueryDto {
    type?: TransactionType;
    channel?: TransactionChannel;
    status?: TransactionStatus;
    riskLevel?: RiskLevel;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
