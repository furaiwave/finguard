declare const __brand: unique symbol
export type Brand<T, B extends string> = T & { readonly [__brand]: B }

export type TransactionId   = Brand<string, 'TransactionId'>
export type UserId          = Brand<string, 'UserId'>
export type AccountId       = Brand<string, 'AccountId'>
export type MerchantId      = Brand<string, 'MerchantId'>
export type RuleId          = Brand<string, 'RuleId'>
export type ReportId        = Brand<string, 'ReportId'>
export type AnalysisId      = Brand<string, 'AnalysisId'>
export type ModelVersion    = Brand<string, 'ModelVersion'>

export type AmountMinor     = Brand<number, 'AmountMinor'>
export type RiskScore       = Brand<number, 'RiskScore'>
export type ConfidenceScore = Brand<number, 'ConfidenceScore'>

export type CurrencyCode = 'USD' | 'EUR' | 'UAH' | 'GBP' | 'CHF' | 'PLN' | 'CZK'

export const mkTransactionId    = (s: string): TransactionId => s as TransactionId
export const mkUserId           = (s: string): UserId        => s as UserId
export const mkAccountId        = (s: string): AccountId     => s as AccountId
export const mkMerchantId       = (s: string): MerchantId    => s as MerchantId
export const mkRuleId           = (s: string): RuleId        => s as RuleId
export const mkReportId         = (s: string): ReportId      => s as ReportId
export const mkAnalysisId       = (s: string): AnalysisId    => s as AnalysisId
export const mkModelVersion     = (s: string): ModelVersion  => s as ModelVersion

export const mkAmountMinor = (n: number): AmountMinor => {
    if(!Number.isInteger(n) || n < 0) throw new RangeError(`Invalid minor amount: ${n}`)
    return n as AmountMinor
}

export const mkRiskScore = (n: number): RiskScore => {
    return Math.max(0, Math.min(100, Math.round(n))) as RiskScore
}

export const mkConfidence = (n: number): ConfidenceScore => {
    if(n < 0 || n > 1) throw new RangeError(`Confidence out of range: ${n}`)
    return n as ConfidenceScore
}

export type TransactionType     = 'payment' | 'transfer' | 'withdrawal' | 'deposit' | 'refund' | 'chargeback'
export type TransactionChannel  = 'card_present' | 'card_not_present' | 'bank_transfer' | 'crypto' | 'mobile_payment' | 'atm'
export type RiskLevel           = 'low' | 'medium' | 'high' | 'critical'
export type TransactionStatus   = 'pending' | 'analyzing' | 'approved' | 'approved_with_review' | 'blocked' | 'manual_review'
export type RuleAction          = 'flag' | 'block' | 'review' | 'approve' | 'notify'
export type RuleOperator        = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains' | 'not_contains' | 'in' | 'not_in'
export type ReportType          = 'fraud_summary' | 'transaction_volume' | 'risk_distribution' | 'rule_effectiveness' | 'ai_performance'
export type ReportPeriod        = 'daily' | 'weekly' | 'monthly' | 'custom'
export type FraudSignalCategory = 'velocity' | 'geolocation' | 'device_fingerprint' | 'behavioral' | 'amount_anomaly' | 'blacklist' | 'pattern_match' | 'ai_detected'

export const RISK_THRESHOLDS = {
    low:    { min: 0, max: 30 },
    medium: { min: 31, max: 60 },
    high: { min: 61, max: 85},
    critical: { min: 86, max: 100 }
} as const satisfies Record<RiskLevel, { min: number; max: number}>

export function scoreToRiskLevel(score: number): RiskLevel { 
    if(score <= 30) return 'low'
    if(score <= 60) return 'medium'
    if(score <= 85) return 'high'
    return 'critical'
}

export type FraudSignal = {
    readonly category:  FraudSignalCategory
    readonly code: string
    readonly description : string
    readonly weight: ConfidenceScore
}

export type LegitimacyDecision = 
    {
        readonly verdict:         'approved',
        readonly riskLevel:       Extract<RiskLevel, 'low' | 'medium'>
        readonly requiresReview:  false
        readonly blockedReason:   null
        readonly reviewDeadlineMs: null
    } | 
    {
        readonly verdict:         'approved_with_review',
        readonly riskLevel:       Extract<RiskLevel, 'medium' | 'high'>
        readonly requiresReview:  true
        readonly blockedReason:   null
        readonly reviewDeadlineMs: number
    } | 
    {
        readonly verdict:         'blocked',
        readonly riskLevel:       Extract<RiskLevel, 'high' | 'critical'>
        readonly requiresReview:  false
        readonly blockedReason:   FraudSignal
        readonly reviewDeadlineMs: null
    } | 
    {
        readonly verdict:         'pending_manual_review',
        readonly riskLevel:       RiskLevel
        readonly requiresReview:  true
        readonly blockedReason:   FraudSignal | null
        readonly reviewDeadlineMs: number
    } 

export type Verdict = LegitimacyDecision['verdict']

export interface BaseTransactionFields { 
    readonly transactionId: TransactionId
    readonly userId:        UserId
    readonly timestampMs:   number
    readonly amount:        AmountMinor
    readonly currency:      CurrencyCode
    readonly ipAddress:     string
    readonly userAgent:     string
    readonly description?:  string
}

export type CardPresentPayment = BaseTransactionFields & {
    readonly type:      'payment'
    readonly channel:   'card_present'
    readonly merchantId: MerchantId
    readonly terminalId: string
    readonly pinVerified: boolean
}

export type CardNotPresentPayment = BaseTransactionFields & {
    readonly type:      'payment'
    readonly channel:   'card_not_present'
    readonly merchantId: MerchantId
    readonly billingAddressHash: string
    readonly cvvProvided: boolean
    readonly threeDsStatus: '3ds_passed' | '3ds_failed' | '3ds_not_enrolled'
}

export type BankTransfer = BaseTransactionFields & {
    readonly type:      'transfer'
    readonly channel:   'bank_transfer'
    readonly sourceAccountId: AccountId
    readonly destinationAccountId: AccountId
    readonly destinationBankCode: string
    readonly purposeCode: string
}

export type CryptoTransfer = BaseTransactionFields & {
    readonly type:      'transfer'
    readonly channel:   'crypto'
    readonly sourceWallet: string
    readonly destinationWallet: string
    readonly networkFee: AmountMinor
    readonly blockchain: 'ethereum' | 'bitcoin' | 'solana' | 'polygon'
}

export type AtmWithdrawal = BaseTransactionFields & {
    readonly type: 'withdrawal'
    readonly channel: 'atm'
    readonly atmId: string
    readonly cardHash: string
    readonly pinAttempts: 1 | 2 | 3
}

export type MobileDeposit = BaseTransactionFields & { 
    readonly type:      'deposit'
    readonly channel:   'mobile_payment'
    readonly sourceWalletProvider: 'apple_pay' | 'google_pay' | 'paypal'
    readonly deviceFingerprint: string
}

export type AnyTransaction =
    | CardPresentPayment
    | CardNotPresentPayment
    | BankTransfer
    | CryptoTransfer
    | AtmWithdrawal
    | MobileDeposit

export type AllowedChannels = { 
    readonly payment: 'card_present' | 'card_not_present'
    readonly transfer: 'bank_transfer' | 'crypto'
    readonly withdrawal: 'atm'
    readonly deposit: 'mobile_payment'
    readonly refund: 'card_present' | 'card_not_present' | 'bank_transfer'
    readonly chargeback: 'card_present' | 'card_not_present' | 'bank_transfer'
}

export type ValidChannelFor<T extends TransactionType> = AllowedChannels[T]

export type AiAnalysisResult = {
    readonly analysisId: AnalysisId
    readonly transactionId: TransactionId
    readonly modelVersion: ModelVersion
    readonly riskScore: RiskScore
    readonly confidence: ConfidenceScore
    readonly decision: LegitimacyDecision
    readonly signals: ReadonlyArray<FraudSignal>
    readonly reasoning: string
    readonly recommendations: ReadonlyArray<string>
    readonly processingTimeMs: number
    readonly analyzedAt: Date
}

export type RuleCondition = {
    readonly field: string
    readonly operator: RuleOperator
    readonly value: string | number | boolean | ReadonlyArray<string | number>
}

export type RuleDefinition = {
    readonly id: RuleId
    readonly name: string
    readonly description: string
    readonly isActive: boolean
    readonly priority: number
    readonly conditions: ReadonlyArray<RuleCondition>
    readonly conditionLogic: 'AND' | 'OR'
    readonly action: RuleAction
    readonly riskScoreImpact: number
    readonly createdAt: Date
    readonly updatedAt: Date
}

export type FraudSummaryPayload = {
    readonly totalTransactions: number
    readonly flaggedCount: number
    readonly blockedCount: number
    readonly approvedCount: number
    readonly totalAmountMinor: AmountMinor
    readonly fraudAmountMinor: AmountMinor
    readonly fraudRate: number
    readonly topSignals: ReadonlyArray<{ signal: FraudSignalCategory; count: number }>
}

export type VolumePayload = {
    readonly series: ReadonlyArray<{ date: string; count: number; amountMinor: AmountMinor }>
    readonly byChannel: Readonly<Record<TransactionChannel, number>>
    readonly byType: Readonly<Record<TransactionType, number>>
}

export type RiskDistributionPayload = {
    readonly low: number 
    readonly medium: number
    readonly high: number
    readonly critical: number
    readonly avgScore: number
}

export type RuleEffectivenessPayload = {
    readonly rules: ReadonlyArray<{
        ruleId: RuleId
        ruleName: string
        triggeredCount: number
        truePositiveRate: number
        falsePositiveRate: number
    }>
}

export type AiPerfomancePayload = {
    readonly avgProcessingMs: number
    readonly avgConfidence: number
    readonly totalAnalyzed: number
    readonly decisionBreakdown: Readonly<Record<Verdict, number>>
}

export type ReportData = 
    | { readonly type: 'fraud_summary';     readonly payload: FraudSummaryPayload }
    | { readonly type: 'transaction_volume'; readonly payload: VolumePayload }
    | { readonly type: 'risk_distribution'; readonly payload: RiskDistributionPayload }
    | { readonly type: 'rule_effectiveness'; readonly payload: RuleEffectivenessPayload }
    | { readonly type: 'ai_performance'; readonly payload: AiPerfomancePayload }

export type ReportPayloadFor<T extends ReportType> = Extract<ReportData, { type: T }>['payload']

export type ApiSuccess<T> = {
    readonly success: true
    readonly data: T;
    readonly timestamp: string
}

export type ApiError = {
    readonly success: false
    readonly error: {
        readonly code: string
        readonly message: string
        readonly details?: Readonly<Record<string, unknown>>
    }
    readonly timestamp: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export const isApiSuccess = <T>(r: ApiResponse<T>): r is ApiSuccess<T> => r.success

export type PaginatedResponse<T> = {
    readonly items: ReadonlyArray<T>
    readonly total: number
    readonly page: number
    readonly limit: number
    readonly totalPages: number
}

export type DeepReadonly<T> = 
    T extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> } 
        : T

export type ExtractTransaction<
    TType extends TransactionType,
    TChannel extends TransactionChannel,
> = Extract<AnyTransaction, { type: TType; channel: TChannel }>

export type InferServiceReturn<
    T extends (...args: never[]) => Promise<unknown>,
> = T extends (...args: never[]) => Promise<infer R> ? R : never