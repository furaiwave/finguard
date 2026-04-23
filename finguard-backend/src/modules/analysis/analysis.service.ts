import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid'

import { 
    mkAnalysisId, mkRiskScore, mkConfidence, mkModelVersion,
    scoreToRiskLevel, type AnyTransaction, LegitimacyDecision,
    type AiAnalysisResult, type Verdict, type RiskLevel,
    FraudSignal,
    RuleDefinition
} from 'shared/types'
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisEntity } from 'src/common/interceptors/entities/analysis';
import type { AnalysisResponseDto } from 'src/common/dto/responseAnalysis';

type ClaudeSchema = {
    readonly riskScore: number
    readonly confidence: number
    readonly verdict: Verdict
    readonly riskLevel: RiskLevel
    readonly requiresReview: boolean
    readonly reviewDeadlineHours: number | null
    readonly signals: ReadonlyArray<{
        readonly category: FraudSignal['category']
        readonly code: string
        readonly description: string
        readonly weight: number
    }>
    readonly reasoning: string
    readonly recommendations: ReadonlyArray<string>
    readonly blockedReason: {
        readonly category: FraudSignal['category']
        readonly code: string
        readonly description: string
        readonly weight: number
    } | null
}

function isvalidClaudeSchema(data: unknown): data is ClaudeSchema {
    if(typeof data != 'object' || data === null) return false
    const d = data as Record<string, unknown>
    return (
        typeof d['riskScore'] === 'number' &&
        typeof d['confidence'] === 'number' &&
        typeof d['verdict'] === 'string' &&
        typeof d['riskLevel'] === 'string' &&
        typeof d['requiresReview'] === 'boolean' &&
        typeof d['reasoning'] === 'string' &&
        Array.isArray(d['signals']) &&
        Array.isArray(d['recommendations'])
    )
}
@Injectable()
export class AiAnalysisService {
    private readonly logger = new Logger(AiAnalysisService.name)
    private readonly client: Anthropic
    private readonly modelVersion = mkModelVersion('claude-sonnet-4-5')

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(AnalysisEntity)
        private readonly repo: Repository<AnalysisEntity>,
    ) {
        this.client = new Anthropic({
            apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY')
        })
    }

    async analyze(
        transaction: AnyTransaction,
        activeRules: ReadonlyArray<RuleDefinition>
    ): Promise<AiAnalysisResult>{
        const startMs = Date.now()

        const ruleDelta = this.applyRules(transaction, activeRules)
        const message = await this.client.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1500,
            system: this.systemPrompt(),
            messages: [{ role: 'user', content: this.buildPrompt(transaction, activeRules, ruleDelta)} ]
        })

        const rawText = message.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('');
        
        const parsed = this.parseResponse(rawText)

        const finalScore = mkRiskScore(parsed.riskScore + ruleDelta)
        const riskLevel = scoreToRiskLevel(finalScore)
        const decision = this.buildDecision(parsed, finalScore, riskLevel)
        const signals: ReadonlyArray<FraudSignal> = parsed.signals.map((s) => ({
            ...s,
            weight: mkConfidence(Math.min(1, Math.max(0, s.weight)))
        }))

        const processingTimeMs = Date.now() - startMs

        const entity = this.repo.create({
            id: mkAnalysisId(uuidv4()),
            transactionId: transaction.transactionId,
            modelVersion: this.modelVersion,
            riskScore: finalScore,
            confidence: mkConfidence(parsed.confidence),
            verdict: decision.verdict,
            riskLevel: decision.riskLevel,
            requiresReview: decision.requiresReview,
            signals,
            reasoning: parsed.reasoning,
            recommendations: parsed.recommendations,
            processingTimeMs,
            reviewDeadlineMs: decision.reviewDeadlineMs,
            blockedReason: decision.blockedReason,
            analyzedAt: new Date(),
        })

        const saved = await this.repo.save(entity)

        return {
            analysisId: saved.id,
            transactionId: transaction.transactionId,
            modelVersion: this.modelVersion,
            riskScore: finalScore,
            confidence: mkConfidence(parsed.confidence),
            decision: decision,
            signals: signals,
            reasoning: parsed.reasoning,
            recommendations: parsed.recommendations,
            processingTimeMs: processingTimeMs,
            analyzedAt: saved.analyzedAt,
        }
    }

    toResponseDto(a: AnalysisEntity): AnalysisResponseDto {
        return {
            id:    a.id,
            transactionId: a.transactionId,
            modelVersion: a.modelVersion,
            riskScore: a.riskScore,
            confidence: mkConfidence(Number(a.confidence)),
            verdict: a.verdict,
            riskLevel: a.riskLevel,
            requiresReview: a.requiresReview,
            signals: a.signals,
            reasoning: a.reasoning,
            recommendations: a.recommendations,
            processingTimeMs: a.processingTimeMs,
            reviewDeadlineMs: a.reviewDeadlineMs,
            blockedReason: a.blockedReason,
            analyzeAt: a.analyzedAt.toISOString(),
        }
    }

    private applyRules(
        tx: AnyTransaction,
        rules: ReadonlyArray<RuleDefinition>,
    ): number {
        let delta = 0
        const txFlat = tx as unknown as Record<string, unknown>
        for(const rule of rules){
            if(!rule.isActive) continue
            const results = rule.conditions.map((c) => {
                const val = txFlat[c.field]
                if(val === undefined) return false
                switch(c.operator){
                    case 'gt': return Number(val) > Number(c.value)
                    case 'gte': return Number(val) >= Number(c.value)
                    case 'lt': return Number(val) < Number(c.value)
                    case 'lte': return Number(val) <= Number(c.value)
                    case 'eq': return String(val) === String(c.value)
                    case 'neq': return String(val) !== String(c.value)
                    case 'contains': return String(val).includes(String(c.value))
                    case 'not_contains': return !String(val).includes(String(c.value))
                    case 'in': return Array.isArray(c.value) && (c.value as unknown[]).includes(val)
                    case 'not_in': return Array.isArray(c.value) && !(c.value as unknown[]).includes(val)
                    default: return false
                }
            })

            const triggered = rule.conditionLogic === 'AND'
                ? results.every(Boolean)
                : results.some(Boolean)

            if(triggered){
                this.logger.debug(`Rule "${rule.name}" triggered → delta ${rule.riskScoreImpact}`)
                delta += rule.riskScoreImpact
            }
        }

        return Math.max(-50, Math.min(50, delta))
    }

    private buildDecision(
        parsed: ClaudeSchema,
        score: number,
        riskLevel: RiskLevel,
    ): LegitimacyDecision { 
        const reviewDeadlineMs = parsed.reviewDeadlineHours
            ? Date.now() + parsed.reviewDeadlineHours * 3_600_000
            : null
        
        const primarySignal = parsed.signals[0] ?? null
        const toSignal = (s: ClaudeSchema['blockedReason']): FraudSignal | null => s ? {...s, weight: mkConfidence(s.weight) } : null
        
        const effectiveVerdict: Verdict = 
            score <= 30 ? 'approved'
            : score <= 60 ? 'approved'
            : score <= 85 ? 'approved_with_review'
            : 'blocked'

        const ORDER: Record<Verdict, number> = {
            approved: 0, approved_with_review: 1, pending_manual_review: 2, blocked: 3
        }

        const finalVerdict: Verdict = 
            ORDER[parsed.verdict] >= ORDER[effectiveVerdict]
                ? parsed.verdict
                : effectiveVerdict

        switch(finalVerdict){
            case 'approved':
                return {
                    verdict: 'approved',
                    riskLevel: riskLevel as Extract<RiskLevel, 'low' | 'medium'>,
                    requiresReview: false,
                    blockedReason: null,
                    reviewDeadlineMs: null,
                }
            case 'approved_with_review':
                return {
                    verdict: 'approved_with_review',
                    riskLevel: riskLevel as Extract<RiskLevel, 'medium' | 'high'>,
                    requiresReview: true,
                    blockedReason: null,
                    reviewDeadlineMs: reviewDeadlineMs ?? Date.now() + 86_400_400,
                }
            case 'blocked':
                return {
                    verdict: 'blocked',
                    riskLevel: riskLevel as Extract<RiskLevel, 'high' | 'critical'>,
                    requiresReview: false,
                    blockedReason: toSignal(parsed.blockedReason) ?? (primarySignal)
                        ? { ...primarySignal, weight: mkConfidence(primarySignal.weight)}
                        : {
                            category: 'ai_detected',
                            code: 'HIGH_RISK',
                            description: 'Risk exceeds critical threshold', weight: mkConfidence(1),
                        },
                    reviewDeadlineMs: null
                }
            case 'pending_manual_review':
                return {
                    verdict: 'pending_manual_review',
                    riskLevel: riskLevel as Extract<RiskLevel, 'medium' | 'high'>,
                    requiresReview: true,
                    blockedReason: null,
                    reviewDeadlineMs: reviewDeadlineMs ?? Date.now() + 86_400_000,
                }
        }
    }

    private systemPrompt(): string {
        return `You are an expert financial fraud detection AI. 
        Analyze transactions and respond ONLY with a JSON code block.
        Required schema:
        \`\`\`json
        {
        "riskScore": <integer 0-100>,
        "confidence": <float 0.0-1.0>,
        "verdict": <"approved"|"approved_with_review"|"blocked"|"pending_manual_review">,
        "riskLevel": <"low"|"medium"|"high"|"critical">,
        "requiresReview": <boolean>,
        "reviewDeadlineHours": <number|null>,
        "signals": [{"category": <string>, "code": <string>, "description": <string>, "weight": <float>}],
        "reasoning": <string 2-4 sentences>,
        "recommendations": [<string>],
        "blockedReason": <signal object|null>
        }
        \`\`\`
        
        Signal categories: velocity, geolocation, device_fingerprint, behavioral, amount_anomaly, blacklist, pattern_match, ai_detected
        
        Risk thresholds: 0-30=low/approved, 31-60=medium, 61-85=high/review, 86-100=critical/block
        Conservative bias: false negatives (missed fraud) cost more than false positives.`;
    }

    private buildPrompt(
        tx:        AnyTransaction,
        rules:     ReadonlyArray<RuleDefinition>,
        ruleDelta: number,
      ): string {
        const txData = JSON.stringify({
          ...tx,
          amountFormatted: `${(tx.amount / 100).toFixed(2)} ${tx.currency}`,
        }, null, 2);
     
        const rulesText = rules.length > 0
          ? rules.map((r) =>
              `• ${r.name} [${r.action}] impact:${r.riskScoreImpact > 0 ? '+' : ''}${r.riskScoreImpact} — ${r.description}`
            ).join('\n')
          : 'No custom rules configured.';
     
        return `## Transaction Data
        \`\`\`json
        ${txData}
        \`\`\`
        
        ## Active Fraud Rules
        ${rulesText}
        
        ## Rule Engine Pre-Score
        Rule delta applied: ${ruleDelta > 0 ? '+' : ''}${ruleDelta} points
        
        Analyze for fraud. Consider: amount anomalies, channel risk, authentication signals (3DS, PIN, CVV), behavioral patterns, rule triggers. Provide your JSON analysis.`;
    }

    private parseResponse(raw: string): ClaudeSchema{
        const match = raw.match(/```json\s*([\s\S]*?)\s*```/) ??
        raw.match(/\{[\s\S]*\}/)
        const jsonStr = match?.[1] ?? match?.[0] ?? '{}'

        try{
            const parsed: unknown = JSON.parse(jsonStr)
            if(!isvalidClaudeSchema(parsed)){
                this.logger.warn('Claude returned invalid schema, using fallback')
                return this.fullbackSchema();
            }

            return parsed;

        } catch {
            this.logger.error('Failed to parse Claude response JSON')
            return this.fullbackSchema();
        }
    }

    private fullbackSchema(): ClaudeSchema {
        return {
            riskScore: 50,
            confidence: 0.5,
            verdict: 'pending_manual_review',
            riskLevel: 'medium',
            requiresReview: true,
            reviewDeadlineHours: 48,
            signals: [],
            reasoning: 'Analysis could not be completed. Transaction flagged for manual review',
            recommendations: ['Perform manual review of this transaction'],
            blockedReason: null,
        }
    }
}
