import type { CurrencyCode, TransactionChannel, TransactionType } from '../../../shared/types';
export declare class CreateTransactionDto {
    transactionId?: string;
    userId?: string;
    amountMinor: number;
    currency: CurrencyCode;
    channel: TransactionChannel;
    type: TransactionType;
    ipAddress: string;
    userAgent: string;
    description?: string;
    extraFields?: Readonly<Record<string, unknown>>;
}
