import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, formatDistanceToNow } from 'date-fns';

import { Button }    from '@/components/ui/button';
import { Badge }     from '@/components/ui/badge';
import { Input }     from '@/components/ui/input';
import { Label }     from '@/components/ui/label';
import { Switch }    from '@/components/ui/switch';
import { Skeleton }  from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  useTransactionList, useCreateTransaction, useAnalyzeTransaction,
  useDeleteTransaction, useRuleList, useCreateRule, useToggleRule,
  useDeleteRule, useReportList, useGenerateReport,
} from './hooks';
import { reportsApi } from './lib/api';
import { mkTransactionId, mkRuleId, mkReportId } from '../../finguard-backend/shared/types';
import type { TransactionResponseDto } from '../../finguard-backend/src/common/dto/transResponse';
import type { AnalysisResponseDto } from '../../finguard-backend/src/common/dto/responseAnalysis';
import type { CreateRuleDto } from '../../finguard-backend/src/common/dto/createRule';
import type { GenerateReportDto } from '../../finguard-backend/src/common/dto/report';
import type {
  CurrencyCode, TransactionType, TransactionChannel,
  RiskLevel, LegitimacyDecision, RuleAction,
  ReportType, ReportPeriod, FraudSignal,
} from '../../finguard-backend/shared/types';

// ─── CONFIG MAPS ─────────────────────────────────────────────────────────────

const VERDICT_CFG = {
  approved:              { label: 'Approved', bg: 'bg-emerald-950', text: 'text-emerald-300', border: 'border-emerald-800', dot: 'bg-emerald-400' },
  approved_with_review:  { label: 'Review',   bg: 'bg-amber-950',   text: 'text-amber-300',   border: 'border-amber-800',   dot: 'bg-amber-400'   },
  blocked:               { label: 'Blocked',  bg: 'bg-red-950',     text: 'text-red-300',     border: 'border-red-800',     dot: 'bg-red-400'     },
  pending_manual_review: { label: 'Pending',  bg: 'bg-indigo-950',  text: 'text-indigo-300',  border: 'border-indigo-800',  dot: 'bg-indigo-400'  },
} as const satisfies Record<LegitimacyDecision['verdict'], { label: string; bg: string; text: string; border: string; dot: string }>;

const RISK_CFG = {
  low:      { label: 'Low',      color: 'text-emerald-400', bar: 'bg-emerald-500' },
  medium:   { label: 'Medium',   color: 'text-amber-400',   bar: 'bg-amber-500'   },
  high:     { label: 'High',     color: 'text-orange-400',  bar: 'bg-orange-500'  },
  critical: { label: 'Critical', color: 'text-red-400',     bar: 'bg-red-500'     },
} as const satisfies Record<RiskLevel, { label: string; color: string; bar: string }>;

const STATUS_CLS: Record<NonNullable<TransactionResponseDto['status']>, string> = {
  pending:              'bg-zinc-900 text-zinc-400 border-zinc-700',
  analyzing:            'bg-blue-950 text-blue-300 border-blue-800',
  approved:             'bg-emerald-950 text-emerald-300 border-emerald-800',
  approved_with_review: 'bg-amber-950 text-amber-300 border-amber-800',
  blocked:              'bg-red-950 text-red-300 border-red-800',
  manual_review:        'bg-indigo-950 text-indigo-300 border-indigo-800',
};

const ACTION_CLS: Record<RuleAction, string> = {
  flag:    'bg-amber-950 text-amber-300 border-amber-800',
  block:   'bg-red-950 text-red-300 border-red-800',
  review:  'bg-indigo-950 text-indigo-300 border-indigo-800',
  approve: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  notify:  'bg-zinc-800 text-zinc-300 border-zinc-700',
};

const CHANNELS_PER_TYPE: Record<TransactionType, TransactionChannel[]> = {
  payment:    ['card_present', 'card_not_present'],
  transfer:   ['bank_transfer', 'crypto'],
  withdrawal: ['atm'],
  deposit:    ['mobile_payment'],
  refund:     ['card_present', 'card_not_present', 'bank_transfer'],
  chargeback: ['card_present', 'card_not_present', 'bank_transfer'],
};

const REPORT_TYPE_CLS: Record<ReportType, string> = {
  fraud_summary:       'text-red-400',
  transaction_volume:  'text-blue-400',
  risk_distribution:   'text-amber-400',
  rule_effectiveness:  'text-purple-400',
  ai_performance:      'text-emerald-400',
};

// ─── FORMATTERS ───────────────────────────────────────────────────────────────

const fmtAmount = (minor: number, currency: CurrencyCode) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minor / 100);
const fmtDate = (iso: string) => format(new Date(iso), 'dd MMM HH:mm');
const fmtAgo  = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

function Mono({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-mono text-xs text-zinc-500 ${className}`}>{children}</span>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-400">{label}</Label>
      {children}
    </div>
  );
}
function Sel({ children, ...props }: React.ComponentProps<typeof Select> & { children: React.ReactNode }) {
  return (
    <Select {...props}>
      <SelectTrigger className="bg-zinc-900 border-zinc-700 h-8 text-sm"><SelectValue /></SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-700">{children}</SelectContent>
    </Select>
  );
}
function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-mono font-semibold text-zinc-100 tracking-tight">{title}</h2>
        {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function DeleteDialog({ name, onDelete }: { name: string; onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-700 hover:text-red-400">✕</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-zinc-950 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-zinc-100 font-mono">Delete?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Delete "{name}"? Cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-zinc-700 text-zinc-400 bg-transparent">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-red-900 hover:bg-red-800 text-white">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── RISK BAR ─────────────────────────────────────────────────────────────────

function RiskBar({ score, level }: { score: number; level: RiskLevel }) {
  const c = RISK_CFG[level];
  return (
    <div className="space-y-1 min-w-[110px]">
      <div className="flex justify-between">
        <Mono className={c.color}>{c.label}</Mono>
        <Mono className={`font-bold ${c.color}`}>{score}</Mono>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ─── VERDICT PILL ─────────────────────────────────────────────────────────────

function VerdictPill({ verdict }: { verdict: LegitimacyDecision['verdict'] }) {
  const c = VERDICT_CFG[verdict];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── SIGNAL LIST ──────────────────────────────────────────────────────────────

function SignalList({ signals }: { signals: ReadonlyArray<FraudSignal> }) {
  if (!signals.length) return null;
  return (
    <div className="space-y-1.5">
      {signals.map((s, i) => (
        <div key={i} className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded p-2">
          <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <Mono className="text-red-400">{s.code}</Mono>
              <Badge variant="outline" className="text-xs py-0 px-1 border-zinc-700 text-zinc-600 font-mono">{s.category}</Badge>
              <Mono className="ml-auto">w:{(s.weight * 100).toFixed(0)}%</Mono>
            </div>
            <p className="text-xs text-zinc-400">{s.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ANALYSIS PANEL ──────────────────────────────────────────────────────────

function AnalysisPanel({ a }: { a: AnalysisResponseDto }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
      {/* Left */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <VerdictPill verdict={a.verdict} />
          <RiskBar score={a.riskScore} level={a.riskLevel} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Confidence', value: `${(a.confidence * 100).toFixed(1)}%` },
            { label: 'Time',       value: `${a.processingTimeMs}ms` },
            { label: 'Model',      value: a.modelVersion },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded p-2">
              <Mono className="uppercase tracking-wider block mb-1">{label}</Mono>
              <span className="text-xs font-mono font-bold text-zinc-200 truncate block">{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <Mono className="uppercase tracking-wider">Claude AI Reasoning</Mono>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{a.reasoning}</p>
        </div>

        {a.recommendations.length > 0 && (
          <div>
            <Mono className="uppercase tracking-wider block mb-2">Recommendations</Mono>
            <ol className="space-y-1">
              {a.recommendations.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-zinc-400">
                  <Mono className="text-zinc-700 flex-shrink-0">{String(i + 1).padStart(2, '0')}.</Mono>
                  {r}
                </li>
              ))}
            </ol>
          </div>
        )}

        {a.blockedReason && (
          <div className="bg-red-950/40 border border-red-900 rounded p-2">
            <Mono className="uppercase tracking-wider text-red-500 block mb-1">Block reason</Mono>
            <p className="text-xs text-red-300">{a.blockedReason.description}</p>
          </div>
        )}
      </div>

      {/* Right — signals */}
      <div className="space-y-3">
        <Mono className="uppercase tracking-wider block">Fraud Signals ({a.signals.length})</Mono>
        {a.signals.length ? <SignalList signals={a.signals} /> : (
          <div className="text-center py-10 text-zinc-700 font-mono text-xs">No signals detected</div>
        )}
      </div>
    </div>
  );
}

// ─── CREATE TRANSACTION FORM ──────────────────────────────────────────────────

type TxForm = {
  userId: string; amountMinor: string; currency: CurrencyCode;
  type: TransactionType; channel: TransactionChannel;
  ipAddress: string; description: string;
  merchantId: string; terminalId: string; pinVerified: boolean;
  billingAddressHash: string; cvvProvided: boolean;
  threeDsStatus: '3ds_passed' | '3ds_failed' | '3ds_not_enrolled';
  sourceAccountId: string; destinationAccountId: string;
  destinationBankCode: string; purposeCode: string;
  sourceWallet: string; destinationWallet: string;
  blockchain: 'ethereum' | 'bitcoin' | 'solana' | 'polygon';
  networkFeeMinor: string;
  atmId: string; cardHash: string; pinAttempts: 1 | 2 | 3;
  sourceWalletProvider: 'apple_pay' | 'google_pay' | 'paypal';
  deviceFingerprint: string;
};

const DEF_TX: TxForm = {
  userId: uuidv4(), amountMinor: '10000', currency: 'USD',
  type: 'payment', channel: 'card_not_present',
  ipAddress: '127.0.0.1', description: '',
  merchantId: uuidv4(), terminalId: 'TERM-001', pinVerified: true,
  billingAddressHash: 'hash_abc123', cvvProvided: true, threeDsStatus: '3ds_passed',
  sourceAccountId: uuidv4(), destinationAccountId: uuidv4(),
  destinationBankCode: 'BNKUAUK2', purposeCode: 'SALA',
  sourceWallet: '0xabc123', destinationWallet: '0xdef456',
  blockchain: 'ethereum', networkFeeMinor: '2000',
  atmId: 'ATM-KBP-001', cardHash: 'cardhash_xyz', pinAttempts: 1,
  sourceWalletProvider: 'apple_pay', deviceFingerprint: uuidv4(),
};

function buildExtras(f: TxForm): Record<string, unknown> {
  if (f.type === 'payment' && f.channel === 'card_present')
    return { merchantId: f.merchantId, terminalId: f.terminalId, pinVerified: f.pinVerified };
  if (f.type === 'payment' && f.channel === 'card_not_present')
    return { merchantId: f.merchantId, billingAddressHash: f.billingAddressHash, cvvProvided: f.cvvProvided, threeDsStatus: f.threeDsStatus };
  if (f.type === 'transfer' && f.channel === 'bank_transfer')
    return { sourceAccountId: f.sourceAccountId, destinationAccountId: f.destinationAccountId, destinationBankCode: f.destinationBankCode, purposeCode: f.purposeCode };
  if (f.type === 'transfer' && f.channel === 'crypto')
    return { sourceWallet: f.sourceWallet, destinationWallet: f.destinationWallet, blockchain: f.blockchain, networkFee: Number(f.networkFeeMinor) };
  if (f.type === 'withdrawal' && f.channel === 'atm')
    return { atmId: f.atmId, cardHash: f.cardHash, pinAttempts: f.pinAttempts };
  if (f.type === 'deposit' && f.channel === 'mobile_payment')
    return { sourceWalletProvider: f.sourceWalletProvider, deviceFingerprint: f.deviceFingerprint };
  return {};
}

function CreateTxDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TxForm>(DEF_TX);
  const { create, loading, error } = useCreateTransaction(() => { setOpen(false); onCreated(); });
  const set = <K extends keyof TxForm>(k: K, v: TxForm[K]) => setForm((p) => ({ ...p, [k]: v }));
  const changeType = (t: TransactionType) => { set('type', t); set('channel', CHANNELS_PER_TYPE[t][0]); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-600 text-white font-mono h-8 text-xs">
          + New Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-emerald-400 text-sm">Create Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (minor units)">
              <Input value={form.amountMinor} onChange={(e) => set('amountMinor', e.target.value)}
                className="bg-zinc-900 border-zinc-700 font-mono h-8 text-sm" placeholder="10000 = $100" />
            </Field>
            <Field label="Currency">
              <Sel value={form.currency} onValueChange={(v) => set('currency', v as CurrencyCode)}>
                {(['USD','EUR','UAH','GBP','CHF','PLN','CZK'] as CurrencyCode[]).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </Sel>
            </Field>
            <Field label="Type">
              <Sel value={form.type} onValueChange={(v) => changeType(v as TransactionType)}>
                {(['payment','transfer','withdrawal','deposit','refund','chargeback'] as TransactionType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </Sel>
            </Field>
            <Field label="Channel">
              <Sel value={form.channel} onValueChange={(v) => set('channel', v as TransactionChannel)}>
                {CHANNELS_PER_TYPE[form.type].map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}
              </Sel>
            </Field>
            <Field label="IP Address">
              <Input value={form.ipAddress} onChange={(e) => set('ipAddress', e.target.value)}
                className="bg-zinc-900 border-zinc-700 font-mono h-8 text-sm" />
            </Field>
            <Field label="Description">
              <Input value={form.description} onChange={(e) => set('description', e.target.value)}
                className="bg-zinc-900 border-zinc-700 h-8 text-sm" placeholder="Optional" />
            </Field>
          </div>

          {/* Dynamic channel-specific fields */}
          {form.type === 'payment' && form.channel === 'card_not_present' && (
            <div className="border-t border-zinc-800 pt-3 space-y-3">
              <Mono className="uppercase tracking-wider">Card-not-present fields</Mono>
              <div className="grid grid-cols-2 gap-3">
                <Field label="3DS Status">
                  <Sel value={form.threeDsStatus} onValueChange={(v) => set('threeDsStatus', v as TxForm['threeDsStatus'])}>
                    <SelectItem value="3ds_passed">Passed</SelectItem>
                    <SelectItem value="3ds_failed">Failed</SelectItem>
                    <SelectItem value="3ds_not_enrolled">Not enrolled</SelectItem>
                  </Sel>
                </Field>
                <Field label="Merchant ID">
                  <Input value={form.merchantId} onChange={(e) => set('merchantId', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-xs" />
                </Field>
                <div className="flex items-center gap-2 col-span-2">
                  <Switch checked={form.cvvProvided} onCheckedChange={(v) => set('cvvProvided', v)} />
                  <Label className="text-xs text-zinc-400">CVV Provided</Label>
                </div>
              </div>
            </div>
          )}

          {form.type === 'payment' && form.channel === 'card_present' && (
            <div className="border-t border-zinc-800 pt-3 space-y-3">
              <Mono className="uppercase tracking-wider">Card present fields</Mono>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Terminal ID">
                  <Input value={form.terminalId} onChange={(e) => set('terminalId', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-sm" />
                </Field>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={form.pinVerified} onCheckedChange={(v) => set('pinVerified', v)} />
                  <Label className="text-xs text-zinc-400">PIN Verified</Label>
                </div>
              </div>
            </div>
          )}

          {form.type === 'transfer' && form.channel === 'bank_transfer' && (
            <div className="border-t border-zinc-800 pt-3 space-y-3">
              <Mono className="uppercase tracking-wider">Bank transfer fields</Mono>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Source Account">
                  <Input value={form.sourceAccountId} onChange={(e) => set('sourceAccountId', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-xs" />
                </Field>
                <Field label="Destination Account">
                  <Input value={form.destinationAccountId} onChange={(e) => set('destinationAccountId', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-xs" />
                </Field>
                <Field label="Bank Code">
                  <Input value={form.destinationBankCode} onChange={(e) => set('destinationBankCode', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-sm" />
                </Field>
                <Field label="Purpose Code">
                  <Input value={form.purposeCode} onChange={(e) => set('purposeCode', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-sm" />
                </Field>
              </div>
            </div>
          )}

          {form.type === 'transfer' && form.channel === 'crypto' && (
            <div className="border-t border-zinc-800 pt-3 space-y-3">
              <Mono className="uppercase tracking-wider">Crypto transfer fields</Mono>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Source Wallet">
                  <Input value={form.sourceWallet} onChange={(e) => set('sourceWallet', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-xs" />
                </Field>
                <Field label="Destination Wallet">
                  <Input value={form.destinationWallet} onChange={(e) => set('destinationWallet', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-xs" />
                </Field>
                <Field label="Blockchain">
                  <Sel value={form.blockchain} onValueChange={(v) => set('blockchain', v as TxForm['blockchain'])}>
                    {(['ethereum','bitcoin','solana','polygon'] as const).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </Sel>
                </Field>
                <Field label="Network Fee (minor)">
                  <Input value={form.networkFeeMinor} onChange={(e) => set('networkFeeMinor', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-sm" />
                </Field>
              </div>
            </div>
          )}

          {form.type === 'withdrawal' && form.channel === 'atm' && (
            <div className="border-t border-zinc-800 pt-3 space-y-3">
              <Mono className="uppercase tracking-wider">ATM fields</Mono>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ATM ID">
                  <Input value={form.atmId} onChange={(e) => set('atmId', e.target.value)}
                    className="bg-zinc-900 border-zinc-700 font-mono h-8 text-sm" />
                </Field>
                <Field label="PIN Attempts">
                  <Sel value={String(form.pinAttempts)} onValueChange={(v) => set('pinAttempts', Number(v) as 1|2|3)}>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </Sel>
                </Field>
              </div>
            </div>
          )}

          {form.type === 'deposit' && form.channel === 'mobile_payment' && (
            <div className="border-t border-zinc-800 pt-3 space-y-3">
              <Mono className="uppercase tracking-wider">Mobile deposit fields</Mono>
              <Field label="Wallet Provider">
                <Sel value={form.sourceWalletProvider} onValueChange={(v) => set('sourceWalletProvider', v as TxForm['sourceWalletProvider'])}>
                  {(['apple_pay','google_pay','paypal'] as const).map((p) => <SelectItem key={p} value={p}>{p.replace(/_/g, ' ')}</SelectItem>)}
                </Sel>
              </Field>
            </div>
          )}

          {error && (
            <div className="bg-red-950 border border-red-900 rounded p-2">
              <Mono className="text-red-400">{error}</Mono>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-zinc-500 h-8">Cancel</Button>
          <Button size="sm" disabled={loading} onClick={() => create({
            transactionId: uuidv4(), userId: form.userId,
            amountMinor: parseInt(form.amountMinor, 10), currency: form.currency,
            type: form.type, channel: form.channel,
            ipAddress: form.ipAddress, userAgent: navigator.userAgent,
            description: form.description || undefined,
            extraFields: buildExtras(form),
          })} className="bg-emerald-700 hover:bg-emerald-600 text-white font-mono h-8 text-xs">
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── TRANSACTION ROW ─────────────────────────────────────────────────────────

function TxRow({ tx, onAnalyze, onDelete, isAnalyzing }: {
  tx: TransactionResponseDto;
  onAnalyze: () => void;
  onDelete: () => void;
  isAnalyzing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow
        className={`border-zinc-800 transition-colors ${tx.latestAnalysis ? 'cursor-pointer hover:bg-zinc-900/40' : 'hover:bg-zinc-900/20'}`}
        onClick={() => tx.latestAnalysis && setExpanded((p) => !p)}
      >
        <TableCell><Mono>{tx.id.slice(0, 8)}…</Mono></TableCell>
        <TableCell>
          <div className="flex flex-col gap-0.5">
            <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-xs font-mono w-fit">{tx.type}</Badge>
            <Mono>{tx.channel.replace(/_/g, ' ')}</Mono>
          </div>
        </TableCell>
        <TableCell className="font-mono text-sm text-zinc-100 font-medium">
          {fmtAmount(tx.amountMinor, tx.currency)}
        </TableCell>
        <TableCell>
          <Badge className={`text-xs border font-mono ${STATUS_CLS[tx.status]}`}>
            {tx.status === 'analyzing'
              ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />analyzing</span>
              : tx.status.replace(/_/g, ' ')}
          </Badge>
        </TableCell>
        <TableCell>
          {tx.latestAnalysis
            ? <RiskBar score={tx.latestAnalysis.riskScore} level={tx.latestAnalysis.riskLevel} />
            : <Mono>—</Mono>}
        </TableCell>
        <TableCell>
          {tx.latestAnalysis ? <VerdictPill verdict={tx.latestAnalysis.verdict} /> : <Mono>—</Mono>}
        </TableCell>
        <TableCell><Mono>{fmtDate(tx.createdAt)}</Mono></TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" disabled={isAnalyzing || tx.status === 'analyzing'} onClick={onAnalyze}
                    className="h-6 px-2 text-xs font-mono bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800">
                    {isAnalyzing ? '⟳' : '▶'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-zinc-900 border-zinc-700 text-zinc-300 text-xs">
                  Run Claude AI analysis
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-zinc-700 hover:text-red-400">✕</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-zinc-100 font-mono">Delete transaction?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Deletes <Mono className="text-zinc-300">{tx.id.slice(0, 8)}</Mono> and all analyses. Cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-zinc-700 text-zinc-400 bg-transparent">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-900 hover:bg-red-800 text-white">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>

      {expanded && tx.latestAnalysis && (
        <TableRow className="border-zinc-800 bg-zinc-950/80">
          <TableCell colSpan={8} className="p-4">
            <AnalysisPanel a={tx.latestAnalysis} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── TRANSACTIONS TAB ─────────────────────────────────────────────────────────

function TransactionsTab() {
  const { data, loading, refetch } = useTransactionList();
  const { analyze, analyzingId }   = useAnalyzeTransaction(() => refetch());
  const { remove }                 = useDeleteTransaction(() => refetch());

  const stats = useMemo(() => {
    if (!data) return null;
    const items    = data.items;
    const analyzed = items.filter((t) => t.latestAnalysis);
    return {
      total:    data.total,
      blocked:  items.filter((t) => t.status === 'blocked').length,
      approved: items.filter((t) => t.status === 'approved').length,
      pending:  items.filter((t) => t.status === 'pending').length,
      avgRisk:  analyzed.length
        ? analyzed.reduce((s, t) => s + (t.latestAnalysis?.riskScore ?? 0), 0) / analyzed.length
        : 0,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Total',    val: stats.total,                   cls: 'text-zinc-100' },
            { label: 'Approved', val: stats.approved,                cls: 'text-emerald-400' },
            { label: 'Blocked',  val: stats.blocked,                 cls: 'text-red-400' },
            { label: 'Pending',  val: stats.pending,                 cls: 'text-zinc-400' },
            { label: 'Avg Risk', val: `${stats.avgRisk.toFixed(1)}`, cls: 'text-amber-400' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
              <Mono className="uppercase tracking-wider block mb-1">{label}</Mono>
              <span className={`text-xl font-mono font-bold ${cls}`}>{val}</span>
            </div>
          ))}
        </div>
      )}

      <SectionHeader
        title="Transactions"
        sub={data ? `${data.total} total · click row to expand AI analysis` : ''}
        action={<CreateTxDialog onCreated={() => refetch()} />}
      />

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900/60">
              {['ID','Type','Amount','Status','Risk','Verdict','Created',''].map((h) => (
                <TableHead key={h} className="text-xs font-mono text-zinc-600 uppercase tracking-wider h-9 py-0">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 5 }, (_, i) => (
              <TableRow key={i} className="border-zinc-800">
                {Array.from({ length: 8 }, (_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full bg-zinc-800" /></TableCell>
                ))}
              </TableRow>
            )) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 font-mono text-zinc-700 text-xs">
                  No transactions. Create one to begin.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  onAnalyze={() => analyze(mkTransactionId(tx.id))}
                  onDelete={() => remove(mkTransactionId(tx.id))}
                  isAnalyzing={analyzingId === mkTransactionId(tx.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── RULES TAB ────────────────────────────────────────────────────────────────

const DEF_RULE: CreateRuleDto = {
  name: '', description: '', isActive: true, priority: 100,
  conditions: [{ field: 'amount', operator: 'gt', value: 100000 }],
  conditionLogic: 'AND', action: 'flag', riskScoreImpact: 20,
};

function RulesTab() {
  const { data: rules, loading, refetch } = useRuleList();
  const { toggle, togglingId }            = useToggleRule(() => refetch());
  const { remove }            = useDeleteRule(() => refetch());
  const [showCreate, setShowCreate]       = useState(false);
  const [form, setForm]                   = useState<CreateRuleDto>(DEF_RULE);
  const { create, loading: creating, error: createError } = useCreateRule(() => { refetch(); setShowCreate(false); setForm(DEF_RULE); });

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Fraud Rules"
        sub={`${rules.length} rules · passed to Claude AI on every analysis`}
        action={
          <Button size="sm" onClick={() => setShowCreate((p) => !p)}
            className="bg-blue-800 hover:bg-blue-700 text-white font-mono h-8 text-xs">
            {showCreate ? '− Cancel' : '+ New Rule'}
          </Button>
        }
      />

      {showCreate && (
        <Card className="bg-zinc-950 border-zinc-800 border-dashed">
          <CardContent className="p-4 space-y-3">
            <Mono className="uppercase tracking-wider text-blue-400 block">New Rule</Mono>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-zinc-900 border-zinc-700 h-8 text-sm" placeholder="High-value CNP" />
              </Field>
              <Field label="Action">
                <Sel value={form.action} onValueChange={(v) => setForm((p) => ({ ...p, action: v as RuleAction }))}>
                  {(['flag','block','review','approve','notify'] as RuleAction[]).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </Sel>
              </Field>
              <Field label="Description">
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="bg-zinc-900 border-zinc-700 h-8 text-sm" />
              </Field>
              <Field label="Risk Impact (-50 to +50)">
                <Input type="number" min={-50} max={50} value={form.riskScoreImpact}
                  onChange={(e) => setForm((p) => ({ ...p, riskScoreImpact: parseInt(e.target.value, 10) }))}
                  className="bg-zinc-900 border-zinc-700 font-mono h-8 text-sm" />
              </Field>
              <Field label="Priority (lower = first)">
                <Input type="number" min={1} max={1000} value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: parseInt(e.target.value, 10) }))}
                  className="bg-zinc-900 border-zinc-700 font-mono h-8 text-sm" />
              </Field>
              <Field label="Logic">
                <Sel value={form.conditionLogic} onValueChange={(v) => setForm((p) => ({ ...p, conditionLogic: v as 'AND' | 'OR' }))}>
                  <SelectItem value="AND">AND — all conditions</SelectItem>
                  <SelectItem value="OR">OR — any condition</SelectItem>
                </Sel>
              </Field>
            </div>
            {createError && (
              <div className="bg-red-950 border border-red-900 rounded p-2">
                <Mono className="text-red-400">{createError}</Mono>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)} className="text-zinc-500 h-8">Cancel</Button>
              <Button size="sm" onClick={() => create(form)} disabled={creating || !form.name}
                className="bg-blue-800 hover:bg-blue-700 text-white font-mono h-8 text-xs">
                {creating ? 'Saving…' : 'Save Rule'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {loading ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 bg-zinc-900 rounded-lg" />) :
         rules.length === 0 ? (
          <div className="text-center py-16 text-zinc-700 font-mono text-xs">
            No rules. Rules are passed to Claude AI with every transaction analysis.
          </div>
        ) : (
          rules.map((r) => (
            <Card key={r.id} className={`border-zinc-800 transition-opacity ${r.isActive ? 'bg-zinc-950' : 'bg-zinc-900/30 opacity-60'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-zinc-100">{r.name}</span>
                      <Badge className={`text-xs border font-mono ${ACTION_CLS[r.action]}`}>{r.action}</Badge>
                      <Mono>priority:{r.priority}</Mono>
                      <Mono className={r.riskScoreImpact > 0 ? 'text-red-400' : 'text-emerald-400'}>
                        impact:{r.riskScoreImpact > 0 ? '+' : ''}{r.riskScoreImpact}
                      </Mono>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{r.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {r.conditions.map((c, i) => (
                        <Mono key={i} className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">
                          {c.field} {c.operator} {JSON.stringify(c.value)}
                        </Mono>
                      ))}
                      {r.conditions.length > 1 && <Mono className="text-blue-500">[{r.conditionLogic}]</Mono>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={r.isActive}
                      onCheckedChange={() => toggle(mkRuleId(r.id))}
                      disabled={togglingId === mkRuleId(r.id)}
                    />
                    <DeleteDialog name={r.name} onDelete={() => remove(mkRuleId(r.id))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ─── REPORTS TAB ─────────────────────────────────────────────────────────────

function ReportsTab() {
  const { data: reports, loading, refetch } = useReportList();
  const { generate, loading: generating, error: generateError } = useGenerateReport(() => { refetch(); setShowForm(false); });
  const [showForm, setShowForm]             = useState(false);
  const [form, setForm]                     = useState<GenerateReportDto>({
    name: 'Weekly Fraud Summary', type: 'fraud_summary', period: 'weekly',
  });

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Reports"
        sub="Fraud summary, volume, risk distribution, AI performance"
        action={
          <Button size="sm" onClick={() => setShowForm((p) => !p)}
            className="bg-purple-900 hover:bg-purple-800 text-white font-mono h-8 text-xs">
            {showForm ? '− Cancel' : '+ Generate'}
          </Button>
        }
      />

      {showForm && (
        <Card className="bg-zinc-950 border-zinc-800 border-dashed">
          <CardContent className="p-4 space-y-3">
            <Mono className="uppercase tracking-wider text-purple-400 block">Generate Report</Mono>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Name">
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-zinc-900 border-zinc-700 h-8 text-sm" />
              </Field>
              <Field label="Type">
                <Sel value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as ReportType }))}>
                  {(['fraud_summary','transaction_volume','risk_distribution','rule_effectiveness','ai_performance'] as ReportType[]).map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </Sel>
              </Field>
              <Field label="Period">
                <Sel value={form.period} onValueChange={(v) => setForm((p) => ({ ...p, period: v as ReportPeriod }))}>
                  {(['daily','weekly','monthly','custom'] as ReportPeriod[]).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </Sel>
              </Field>
            </div>
            {generateError && (
              <div className="bg-red-950 border border-red-900 rounded p-2">
                <Mono className="text-red-400">{generateError}</Mono>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-zinc-500 h-8">Cancel</Button>
              <Button size="sm" onClick={() => generate(form)} disabled={generating || !form.name}
                className="bg-purple-900 hover:bg-purple-800 text-white font-mono h-8 text-xs">
                {generating ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {loading ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14 bg-zinc-900 rounded-lg" />) :
         reports.length === 0 ? (
          <div className="text-center py-16 text-zinc-700 font-mono text-xs">No reports yet.</div>
        ) : (
          reports.map((r: unknown) => {
            const rp = r as { id: string; name: string; type: ReportType; period: string; generatedAt: string };
            return (
              <Card key={rp.id} className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-100">{rp.name}</span>
                      <Mono className={REPORT_TYPE_CLS[rp.type]}>{rp.type.replace(/_/g, ' ')}</Mono>
                      <Mono className="border border-zinc-800 rounded px-1">{rp.period}</Mono>
                    </div>
                    <Mono className="mt-0.5">{fmtAgo(rp.generatedAt)}</Mono>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-zinc-200 h-7 font-mono text-xs">
                      View →
                    </Button>
                    <DeleteDialog
                      name={rp.name}
                      onDelete={() => reportsApi.remove(mkReportId(rp.id)).then(() => refetch())}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-white leading-none">F</span>
            </div>
            <span className="font-mono font-bold text-zinc-100 tracking-tighter text-sm">FINGUARD</span>
            <Separator orientation="vertical" className="h-4 bg-zinc-800" />
            <Mono className="text-zinc-700">AI Fraud Detection System</Mono>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Mono className="text-zinc-500">Claude AI · Live</Mono>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Tabs defaultValue="transactions">
            <TabsList className="bg-zinc-900 border border-zinc-800 mb-6 h-9">
              {[
                { value: 'transactions', label: 'Transactions' },
                { value: 'rules',        label: 'Fraud Rules' },
                { value: 'reports',      label: 'Reports' },
              ].map(({ value, label }) => (
                <TabsTrigger key={value} value={value}
                  className="font-mono text-xs h-7 data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-100 text-zinc-500">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="transactions"><TransactionsTab /></TabsContent>
            <TabsContent value="rules"><RulesTab /></TabsContent>
            <TabsContent value="reports"><ReportsTab /></TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}