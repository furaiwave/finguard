import { useState, useCallback, useEffect, useRef } from 'react';
import { transactionsApi, rulesApi, reportsApi, ApiClientError } from '../lib/api';
import type { ReportResponse } from '../lib/api';
import type { TransactionId, RuleId, ReportId } from '../../../finguard-backend/shared/types';
import type { AnalysisResponseDto } from '../../../finguard-backend/src/common/dto/responseAnalysis'
import type { CreateTransactionDto } from '../../../finguard-backend/src/common/dto/create'
import type { TransactionQueryDto } from '../../../finguard-backend/src/common/dto/query'
import type { CreateRuleDto } from '../../../finguard-backend/src/common/dto/createRule'
import type { UpdateRulesDto } from '../../../finguard-backend/src/common/dto/update'
import type { RuleResponseDto } from '../../../finguard-backend/src/common/dto/ruleResponse';
import type { GenerateReportDto } from '../../../finguard-backend/src/common/dto/report';

// ─── BASE: useFetch ───────────────────────────────────────────────────────────

type FetchState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string; code: string };

function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<FetchState<T>>({ status: 'loading' });
  const ref = useRef(fetcher);
  ref.current = fetcher;

  const run = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'success', data: await ref.current() });
    } catch (err) {
      setState({
        status:  'error',
        message: err instanceof Error ? err.message : 'Error',
        code:    err instanceof ApiClientError ? err.code : 'UNKNOWN',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { void run(); }, [run]);

  return { state, refetch: run };
}

// ─── BASE: useMutation ────────────────────────────────────────────────────────

function useMutation<TArgs extends unknown[], TReturn>(
  mutator: (...args: TArgs) => Promise<TReturn>,
  onSuccess?: (result: TReturn) => void,
) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const mutate = useCallback(async (...args: TArgs): Promise<TReturn> => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutator(...args);
      onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mutate, loading, error };
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export function useTransactionList(query?: Partial<TransactionQueryDto>) {
  const { state, refetch } = useFetch(
    () => transactionsApi.list(query),
    [JSON.stringify(query)],
  );
  return {
    data:    state.status === 'success' ? state.data : null,
    loading: state.status === 'loading',
    error:   state.status === 'error'   ? state.message : null,
    refetch,
  } as const;
}

export function useCreateTransaction(onSuccess?: () => void) {
  const { mutate: create, loading, error } = useMutation(
    (dto: CreateTransactionDto) => transactionsApi.create(dto),
    () => onSuccess?.(),
  );
  return { create, loading, error } as const;
}

export function useAnalyzeTransaction(onSuccess?: (r: AnalysisResponseDto) => void) {
  const [analyzingId, setAnalyzingId] = useState<TransactionId | null>(null);
  const [result,      setResult]      = useState<AnalysisResponseDto | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  const analyze = useCallback(async (id: TransactionId) => {
    setAnalyzingId(id);
    setError(null);
    try {
      const r = await transactionsApi.analyze(id);
      setResult(r);
      onSuccess?.(r);
      return r;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      throw err;
    } finally {
      setAnalyzingId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { analyze, analyzingId, result, error } as const;
}

export function useDeleteTransaction(onSuccess?: () => void) {
  const [deletingId, setDeletingId] = useState<TransactionId | null>(null);

  const remove = useCallback(async (id: TransactionId) => {
    setDeletingId(id);
    try {
      await transactionsApi.remove(id);
      onSuccess?.();
    } finally {
      setDeletingId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { remove, deletingId } as const;
}

// ─── RULES ────────────────────────────────────────────────────────────────────

export function useRuleList() {
  const { state, refetch } = useFetch(() => rulesApi.list());
  return {
    data:    state.status === 'success' ? state.data : [] as RuleResponseDto[],
    loading: state.status === 'loading',
    error:   state.status === 'error'   ? state.message : null,
    refetch,
  } as const;
}

export function useCreateRule(onSuccess?: () => void) {
  const { mutate: create, loading, error } = useMutation(
    (dto: CreateRuleDto) => rulesApi.create(dto),
    () => onSuccess?.(),
  );
  return { create, loading, error } as const;
}

export function useUpdateRule(onSuccess?: () => void) {
  const { mutate: update, loading } = useMutation(
    (id: RuleId, dto: UpdateRulesDto) => rulesApi.update(id, dto),
    () => onSuccess?.(),
  );
  return { update, loading } as const;
}

export function useToggleRule(onSuccess?: () => void) {
  const [togglingId, setTogglingId] = useState<RuleId | null>(null);

  const toggle = useCallback(async (id: RuleId) => {
    setTogglingId(id);
    try {
      const r = await rulesApi.toggle(id);
      onSuccess?.();
      return r;
    } finally {
      setTogglingId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { toggle, togglingId } as const;
}

export function useDeleteRule(onSuccess?: () => void) {
  const [deletingId, setDeletingId] = useState<RuleId | null>(null);

  const remove = useCallback(async (id: RuleId) => {
    setDeletingId(id);
    try {
      await rulesApi.remove(id);
      onSuccess?.();
    } finally {
      setDeletingId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { remove, deletingId } as const;
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

export function useReportList() {
  const { state, refetch } = useFetch(() => reportsApi.list());
  return {
    data:    state.status === 'success' ? state.data : [] as ReportResponse[],
    loading: state.status === 'loading',
    error:   state.status === 'error'   ? state.message : null,
    refetch,
  } as const;
}

export function useGenerateReport(onSuccess?: () => void) {
  const { mutate: generate, loading, error } = useMutation(
    (dto: GenerateReportDto) => reportsApi.generate(dto),
    () => onSuccess?.(),
  );
  return { generate, loading, error } as const;
}

export function useDeleteReport(onSuccess?: () => void) {
  const [deletingId, setDeletingId] = useState<ReportId | null>(null);

  const remove = useCallback(async (id: ReportId) => {
    setDeletingId(id);
    try {
      await reportsApi.remove(id);
      onSuccess?.();
    } finally {
      setDeletingId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { remove, deletingId } as const;
}