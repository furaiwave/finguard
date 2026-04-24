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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DatasetAnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const types_1 = require("../../../shared/types");
function isValidUlbSchema(data) {
    if (typeof data !== 'object' || data === null)
        return false;
    const d = data;
    return (typeof d['riskScore'] === 'number' &&
        typeof d['confidence'] === 'number' &&
        typeof d['verdict'] === 'string' &&
        (d['verdict'] === 'fraud' || d['verdict'] === 'legitimate') &&
        typeof d['riskLevel'] === 'string' &&
        Array.isArray(d['primarySignals']) &&
        typeof d['reasoning'] === 'string');
}
let DatasetAnalysisService = DatasetAnalysisService_1 = class DatasetAnalysisService {
    config;
    logger = new common_1.Logger(DatasetAnalysisService_1.name);
    client;
    constructor(config) {
        this.config = config;
        this.client = new sdk_1.default({
            apiKey: this.config.getOrThrow('ANTHROPIC_API_KEY'),
        });
    }
    async analyzeBatch(rows) {
        return Promise.all(rows.map((row) => this.analyzeRow(row)));
    }
    async analyzeRow(row) {
        const startMs = Date.now();
        const message = await this.client.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 400,
            system: this.systemPrompt(),
            messages: [{ role: 'user', content: this.buildPrompt(row) }],
        });
        const rawText = message.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('');
        const parsed = this.parseResponse(rawText);
        const finalScore = (0, types_1.mkRiskScore)(parsed.riskScore);
        const riskLevel = (0, types_1.scoreToRiskLevel)(finalScore);
        const processingTimeMs = Date.now() - startMs;
        const isCorrect = (parsed.verdict === 'fraud') === (row.trueClass === 1);
        return {
            rowIndex: row.rowIndex,
            amount: row.amount,
            trueClass: row.trueClass,
            verdict: parsed.verdict,
            riskScore: finalScore,
            riskLevel,
            confidence: (0, types_1.mkConfidence)(Math.min(1, Math.max(0, parsed.confidence))),
            reasoning: parsed.reasoning,
            primarySignals: [...parsed.primarySignals],
            processingTimeMs,
            isCorrect,
        };
    }
    systemPrompt() {
        return `You are a credit card fraud detection AI specializing in PCA-based behavioral analytics.
You receive transactions from the ULB Credit Card Fraud dataset where:
- V1-V28: PCA-transformed behavioral features (anonymized transaction patterns from real credit card data)
- Amount: transaction amount in USD
- Time: seconds elapsed since the observation period started

These features capture behavioral patterns including spending velocity, merchant anomalies, geographic signals, device patterns, and time-of-day behavior — all transformed via PCA for privacy.

Respond ONLY with a JSON code block:
\`\`\`json
{
  "riskScore": <integer 0-100>,
  "confidence": <float 0.0-1.0>,
  "verdict": <"fraud"|"legitimate">,
  "riskLevel": <"low"|"medium"|"high"|"critical">,
  "primarySignals": [<string in Ukrainian>, ...],
  "reasoning": <string 1-2 sentences in Ukrainian>
}
\`\`\`
Conservative bias: false negatives (missed fraud) cost more than false positives.`;
    }
    buildPrompt(row) {
        const rowAsRecord = row;
        const features = Array.from({ length: 28 }, (_, i) => {
            const key = `v${i + 1}`;
            return `V${i + 1}: ${rowAsRecord[key].toFixed(6)}`;
        }).join(', ');
        return `## Credit Card Transaction (ULB Dataset)
Amount: $${row.amount.toFixed(2)}
Time offset: ${row.time}s

PCA Behavioral Features:
${features}

Analyze this transaction for fraud. Respond with JSON only.`;
    }
    parseResponse(raw) {
        const match = raw.match(/```json\s*([\s\S]*?)\s*```/) ?? raw.match(/\{[\s\S]*\}/);
        const jsonStr = match?.[1] ?? match?.[0] ?? '{}';
        try {
            const parsed = JSON.parse(jsonStr);
            if (!isValidUlbSchema(parsed)) {
                this.logger.warn('Claude returned invalid ULB schema, using fallback');
                return this.fallbackSchema();
            }
            return parsed;
        }
        catch {
            this.logger.error('Failed to parse Claude ULB response JSON');
            return this.fallbackSchema();
        }
    }
    fallbackSchema() {
        return {
            riskScore: 50,
            confidence: 0.5,
            verdict: 'legitimate',
            riskLevel: 'medium',
            primarySignals: ['Аналіз не вдався'],
            reasoning: 'Аналіз не міг бути завершений через помилку парсингу відповіді.',
        };
    }
};
exports.DatasetAnalysisService = DatasetAnalysisService;
exports.DatasetAnalysisService = DatasetAnalysisService = DatasetAnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatasetAnalysisService);
//# sourceMappingURL=dataset.service.js.map