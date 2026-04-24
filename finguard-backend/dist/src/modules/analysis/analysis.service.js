"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiAnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const uuid_1 = require("uuid");
const types_1 = require("../../../shared/types");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const analysis_1 = require("../../common/interceptors/entities/analysis");
function isvalidClaudeSchema(data) {
    if (typeof data != 'object' || data === null)
        return false;
    const d = data;
    return (typeof d['riskScore'] === 'number' &&
        typeof d['confidence'] === 'number' &&
        typeof d['verdict'] === 'string' &&
        typeof d['riskLevel'] === 'string' &&
        typeof d['requiresReview'] === 'boolean' &&
        typeof d['reasoning'] === 'string' &&
        Array.isArray(d['signals']) &&
        Array.isArray(d['recommendations']));
}
let AiAnalysisService = AiAnalysisService_1 = class AiAnalysisService {
    config;
    repo;
    logger = new common_1.Logger(AiAnalysisService_1.name);
    client;
    modelVersion = (0, types_1.mkModelVersion)('claude-sonnet-4-5');
    constructor(config, repo) {
        this.config = config;
        this.repo = repo;
        this.client = new sdk_1.default({
            apiKey: this.config.getOrThrow('ANTHROPIC_API_KEY')
        });
    }
    async analyze(transaction, activeRules) {
        const startMs = Date.now();
        const ruleDelta = this.applyRules(transaction, activeRules);
        const message = await this.client.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1500,
            system: this.systemPrompt(),
            messages: [{ role: 'user', content: this.buildPrompt(transaction, activeRules, ruleDelta) }]
        });
        const rawText = message.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('');
        const parsed = this.parseResponse(rawText);
        const finalScore = (0, types_1.mkRiskScore)(parsed.riskScore + ruleDelta);
        const riskLevel = (0, types_1.scoreToRiskLevel)(finalScore);
        const decision = this.buildDecision(parsed, finalScore, riskLevel);
        const signals = parsed.signals.map((s) => ({
            ...s,
            weight: (0, types_1.mkConfidence)(Math.min(1, Math.max(0, s.weight)))
        }));
        const processingTimeMs = Date.now() - startMs;
        const entity = this.repo.create({
            id: (0, types_1.mkAnalysisId)((0, uuid_1.v4)()),
            transactionId: transaction.transactionId,
            modelVersion: this.modelVersion,
            riskScore: finalScore,
            confidence: (0, types_1.mkConfidence)(parsed.confidence),
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
        });
        const saved = await this.repo.save(entity);
        return {
            analysisId: saved.id,
            transactionId: transaction.transactionId,
            modelVersion: this.modelVersion,
            riskScore: finalScore,
            confidence: (0, types_1.mkConfidence)(parsed.confidence),
            decision: decision,
            signals: signals,
            reasoning: parsed.reasoning,
            recommendations: parsed.recommendations,
            processingTimeMs: processingTimeMs,
            analyzedAt: saved.analyzedAt,
        };
    }
    toResponseDto(a) {
        return {
            id: a.id,
            transactionId: a.transactionId,
            modelVersion: a.modelVersion,
            riskScore: a.riskScore,
            confidence: (0, types_1.mkConfidence)(Number(a.confidence)),
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
        };
    }
    applyRules(tx, rules) {
        let delta = 0;
        const txFlat = tx;
        for (const rule of rules) {
            if (!rule.isActive)
                continue;
            const results = rule.conditions.map((c) => {
                const val = txFlat[c.field];
                if (val === undefined)
                    return false;
                switch (c.operator) {
                    case 'gt': return Number(val) > Number(c.value);
                    case 'gte': return Number(val) >= Number(c.value);
                    case 'lt': return Number(val) < Number(c.value);
                    case 'lte': return Number(val) <= Number(c.value);
                    case 'eq': return String(val) === String(c.value);
                    case 'neq': return String(val) !== String(c.value);
                    case 'contains': return String(val).includes(String(c.value));
                    case 'not_contains': return !String(val).includes(String(c.value));
                    case 'in': return Array.isArray(c.value) && c.value.includes(val);
                    case 'not_in': return Array.isArray(c.value) && !c.value.includes(val);
                    default: return false;
                }
            });
            const triggered = rule.conditionLogic === 'AND'
                ? results.every(Boolean)
                : results.some(Boolean);
            if (triggered) {
                this.logger.debug(`Rule "${rule.name}" triggered → delta ${rule.riskScoreImpact}`);
                delta += rule.riskScoreImpact;
            }
        }
        return Math.max(-50, Math.min(50, delta));
    }
    buildDecision(parsed, score, riskLevel) {
        const reviewDeadlineMs = parsed.reviewDeadlineHours
            ? Date.now() + parsed.reviewDeadlineHours * 3_600_000
            : null;
        const primarySignal = parsed.signals[0] ?? null;
        const toSignal = (s) => s ? { ...s, weight: (0, types_1.mkConfidence)(s.weight) } : null;
        const effectiveVerdict = score <= 30 ? 'approved'
            : score <= 60 ? 'approved'
                : score <= 85 ? 'approved_with_review'
                    : 'blocked';
        const ORDER = {
            approved: 0, approved_with_review: 1, pending_manual_review: 2, blocked: 3
        };
        const finalVerdict = ORDER[parsed.verdict] >= ORDER[effectiveVerdict]
            ? parsed.verdict
            : effectiveVerdict;
        switch (finalVerdict) {
            case 'approved':
                return {
                    verdict: 'approved',
                    riskLevel: riskLevel,
                    requiresReview: false,
                    blockedReason: null,
                    reviewDeadlineMs: null,
                };
            case 'approved_with_review':
                return {
                    verdict: 'approved_with_review',
                    riskLevel: riskLevel,
                    requiresReview: true,
                    blockedReason: null,
                    reviewDeadlineMs: reviewDeadlineMs ?? Date.now() + 86_400_400,
                };
            case 'blocked':
                return {
                    verdict: 'blocked',
                    riskLevel: riskLevel,
                    requiresReview: false,
                    blockedReason: toSignal(parsed.blockedReason) ?? (primarySignal)
                        ? { ...primarySignal, weight: (0, types_1.mkConfidence)(primarySignal.weight) }
                        : {
                            category: 'ai_detected',
                            code: 'HIGH_RISK',
                            description: 'Risk exceeds critical threshold', weight: (0, types_1.mkConfidence)(1),
                        },
                    reviewDeadlineMs: null
                };
            case 'pending_manual_review':
                return {
                    verdict: 'pending_manual_review',
                    riskLevel: riskLevel,
                    requiresReview: true,
                    blockedReason: null,
                    reviewDeadlineMs: reviewDeadlineMs ?? Date.now() + 86_400_000,
                };
        }
    }
    systemPrompt() {
        return `You are an expert financial fraud detection AI.
        Analyze transactions and respond ONLY with a JSON code block.
        IMPORTANT: All text fields (reasoning, recommendations, signals descriptions, blockedReason description) MUST be written in Ukrainian language.
        Required schema:
        \`\`\`json
        {
        "riskScore": <integer 0-100>,
        "confidence": <float 0.0-1.0>,
        "verdict": <"approved"|"approved_with_review"|"blocked"|"pending_manual_review">,
        "riskLevel": <"low"|"medium"|"high"|"critical">,
        "requiresReview": <boolean>,
        "reviewDeadlineHours": <number|null>,
        "signals": [{"category": <string>, "code": <string>, "description": <string in Ukrainian>, "weight": <float>}],
        "reasoning": <string 2-4 sentences in Ukrainian>,
        "recommendations": [<string in Ukrainian>],
        "blockedReason": <signal object with description in Ukrainian|null>
        }
        \`\`\`

        Signal categories: velocity, geolocation, device_fingerprint, behavioral, amount_anomaly, blacklist, pattern_match, ai_detected

        Risk thresholds: 0-30=low/approved, 31-60=medium, 61-85=high/review, 86-100=critical/block
        Conservative bias: false negatives (missed fraud) cost more than false positives.`;
    }
    buildPrompt(tx, rules, ruleDelta) {
        const txData = JSON.stringify({
            ...tx,
            amountFormatted: `${(tx.amount / 100).toFixed(2)} ${tx.currency}`,
        }, null, 2);
        const rulesText = rules.length > 0
            ? rules.map((r) => `• ${r.name} [${r.action}] impact:${r.riskScoreImpact > 0 ? '+' : ''}${r.riskScoreImpact} — ${r.description}`).join('\n')
            : 'No custom rules configured.';
        return `## Transaction Data
        \`\`\`json
        ${txData}
        \`\`\`
        
        ## Active Fraud Rules
        ${rulesText}
        
        ## Rule Engine Pre-Score
        Rule delta applied: ${ruleDelta > 0 ? '+' : ''}${ruleDelta} points
        
        Analyze for fraud. Consider: amount anomalies, channel risk, authentication signals (3DS, PIN, CVV), behavioral patterns, rule triggers. Provide your JSON analysis. All text in Ukrainian.`;
    }
    parseResponse(raw) {
        const match = raw.match(/```json\s*([\s\S]*?)\s*```/) ??
            raw.match(/\{[\s\S]*\}/);
        const jsonStr = match?.[1] ?? match?.[0] ?? '{}';
        try {
            const parsed = JSON.parse(jsonStr);
            if (!isvalidClaudeSchema(parsed)) {
                this.logger.warn('Claude returned invalid schema, using fallback');
                return this.fullbackSchema();
            }
            return parsed;
        }
        catch {
            this.logger.error('Failed to parse Claude response JSON');
            return this.fullbackSchema();
        }
    }
    fullbackSchema() {
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
        };
    }
};
exports.AiAnalysisService = AiAnalysisService;
exports.AiAnalysisService = AiAnalysisService = AiAnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(analysis_1.AnalysisEntity)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], AiAnalysisService);
//# sourceMappingURL=analysis.service.js.map