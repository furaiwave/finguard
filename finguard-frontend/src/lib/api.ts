import {
isApiSuccess,
type ApiResponse, type PaginatedResponse,
type TransactionId, type RuleId, type ReportId,
} from '../../../finguard-backend/shared/types';
import type { CreateTransactionDto } from '../../../finguard-backend/src/common/dto/create';
import type { TransactionResponseDto } from '../../../finguard-backend/src/common/dto/transResponse'
import type { AnalysisResponseDto } from '../../../finguard-backend/src/common/dto/responseAnalysis'
import type { TransactionQueryDto } from '../../../finguard-backend/src/common/dto/query'
import type { CreateRuleDto } from '../../../finguard-backend/src/common/dto/createRule'
import type { UpdateRulesDto } from '../../../finguard-backend/src/common/dto/update'
import type { RuleResponseDto } from '../../../finguard-backend/src/common/dto/ruleResponse'
import type { GenerateReportDto } from '../../../finguard-backend/src/common/dto/report'


const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiClientError extends Error {
constructor(
    public readonly code: string,
    message: string,
) {
    super(message);
    this.name = 'ApiClientError';
}
}

// ─── Generic fetcher ─────────────────────────────────────────────────────────

async function req<T>(path: string, init?: RequestInit): Promise<T> {
const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
});

// unknown — raw JSON, narrowed immediately by isApiSuccess
const json: unknown = await res.json();
const wrapped = json as ApiResponse<T>;

if (!isApiSuccess(wrapped)) {
    throw new ApiClientError(wrapped.error.code, wrapped.error.message);
}

return wrapped.data;
}

const qs = (q?: object): string => {
if (!q) return '';
const p = new URLSearchParams(
    Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => [k, String(v)])
);
return p.toString() ? `?${p}` : '';
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const transactionsApi = {
create:  (dto: CreateTransactionDto) =>
    req<TransactionResponseDto>('/transactions', { method: 'POST', body: JSON.stringify(dto) }),

list:    (q?: Partial<TransactionQueryDto>) =>
    req<PaginatedResponse<TransactionResponseDto>>(`/transactions${qs(q)}`),

getOne:  (id: TransactionId) =>
    req<TransactionResponseDto>(`/transactions/${id}`),

analyze: (id: TransactionId) =>
    req<AnalysisResponseDto>(`/transactions/${id}/analyze`, { method: 'POST' }),

remove:  (id: TransactionId) =>
    req<void>(`/transactions/${id}`, { method: 'DELETE' }),
} as const;

// ─── RULES ───────────────────────────────────────────────────────────────────

export const rulesApi = {
create:  (dto: CreateRuleDto) =>
    req<RuleResponseDto>('/rules', { method: 'POST', body: JSON.stringify(dto) }),

list:    () =>
    req<RuleResponseDto[]>('/rules'),

getOne:  (id: RuleId) =>
    req<RuleResponseDto>(`/rules/${id}`),

update:  (id: RuleId, dto: UpdateRulesDto) =>
    req<RuleResponseDto>(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

toggle:  (id: RuleId) =>
    req<RuleResponseDto>(`/rules/${id}/toggle`, { method: 'PATCH' }),

remove:  (id: RuleId) =>
    req<void>(`/rules/${id}`, { method: 'DELETE' }),
} as const;

// ─── REPORTS ─────────────────────────────────────────────────────────────────

export const reportsApi = {
generate: (dto: GenerateReportDto) =>
    req<unknown>('/reports/generate', { method: 'POST', body: JSON.stringify(dto) }),

list:    () =>
    req<unknown[]>('/reports'),

getOne:  (id: ReportId) =>
    req<unknown>(`/reports/${id}`),

remove:  (id: ReportId) =>
    req<void>(`/reports/${id}`, { method: 'DELETE' }),
} as const;