import { 
    IsString, IsEnum, IsOptional, IsInt, Min, Max, MaxLength, MinLength, IsIP
} from 'class-validator'
import type {
    CurrencyCode, TransactionChannel,
    TransactionType
} from '../../../shared/types'

export class CreateTransactionDto {
    @IsOptional()
    @IsString()
    @MaxLength(36)
    transactionId?: string

    @IsString()
    @MinLength(1)
    @MaxLength(36)
    userId?: string

    @IsInt()
    @Min(1)
    @Max(999_999_999)
    amountMinor!: number

    @IsEnum([
        'USD',
        'EUR',
        'UAH',
        'CHF',
        'GBP',
        'PLN',
        'CZK'
    ] satisfies CurrencyCode[])
    currency!: CurrencyCode

    @IsEnum([
        'card_present',
        'card_not_present',
        'bank_transfer',
        'crypto',
        'mobile_payment',
        'atm'
    ] satisfies TransactionChannel[])
    channel: TransactionChannel

    @IsEnum([
        'payment',
        'transfer',
        'withdrawal',
        'deposit',
        'refund',
        'chargeback'
    ] satisfies TransactionType[])
    type!: TransactionType

    @IsIP()
    ipAddress!: string

    @IsString()
    @MaxLength(512)
    userAgent!: string

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string

    @IsOptional()
    extraFields?: Readonly<Record<string, unknown>>
}
