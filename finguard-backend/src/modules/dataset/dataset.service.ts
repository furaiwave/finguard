import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import type { UlbRowDto } from 'src/common/interceptors/entities/ulbDataset'
import { mkRiskScore, mkConfidence, scoreToRiskLevel } from 'shared/types'
import type { RiskLevel } from 'shared/types'

type UlbVerdict = 'fraud' | 'legitimate'

type UlbClaudeSchema = {
    readonly riskScore: number
    readonly confidence: number
    readonly verdict: UlbVerdict
    readonly riskLevel: RiskLevel
    readonly primarySignals: ReadonlyArray<string>
    readonly reasoning: string
}

function isValidUlbSchema(data: unknown): data is UlbClaudeSchema {
    if (typeof data !== 'object' || data === null) return false
    const d = data as Record<string, unknown>
    return (
        typeof d['riskScore'] === 'number' &&
        typeof d['confidence'] === 'number' &&
        typeof d['verdict'] === 'string' &&
        (d['verdict'] === 'fraud' || d['verdict'] === 'legitimate') &&
        typeof d['riskLevel'] === 'string' &&
        Array.isArray(d['primarySignals']) &&
        typeof d['reasoning'] === 'string'
    )
}

export type UlbAnalysisResult = {
    rowIndex: number
    amount: number
    trueClass: 0 | 1
    verdict: UlbVerdict
    riskScore: number
    riskLevel: RiskLevel
    confidence: number
    reasoning: string
    primarySignals: string[]
    processingTimeMs: number
    isCorrect: boolean
}

@Injectable()
export class DatasetAnalysisService {
    private readonly logger = new Logger(DatasetAnalysisService.name)
    private readonly client: Anthropic

    constructor(private readonly config: ConfigService) {
        this.client = new Anthropic({
            apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
        })
    }

    async analyzeBatch(rows: UlbRowDto[]): Promise<UlbAnalysisResult[]> {
        return Promise.all(rows.map((row) => this.analyzeRow(row)))
    }

    private async analyzeRow(row: UlbRowDto): Promise<UlbAnalysisResult> {
        const startMs = Date.now()

        const message = await this.client.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 400,
            system: this.systemPrompt(),
            messages: [{ role: 'user', content: this.buildPrompt(row) }],
        })

        const rawText = message.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('')

        const parsed = this.parseResponse(rawText)
        const finalScore = mkRiskScore(parsed.riskScore)
        const riskLevel = scoreToRiskLevel(finalScore)
        const processingTimeMs = Date.now() - startMs
        const isCorrect = (parsed.verdict === 'fraud') === (row.trueClass === 1)

        return {
            rowIndex: row.rowIndex,
            amount: row.amount,
            trueClass: row.trueClass as 0 | 1,
            verdict: parsed.verdict,
            riskScore: finalScore,
            riskLevel,
            confidence: mkConfidence(Math.min(1, Math.max(0, parsed.confidence))),
            reasoning: parsed.reasoning,
            primarySignals: [...parsed.primarySignals],
            processingTimeMs,
            isCorrect,
        }
    }

    private systemPrompt(): string {
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
Conservative bias: false negatives (missed fraud) cost more than false positives.`
    }

    private buildPrompt(row: UlbRowDto): string {
        const rowAsRecord = row as unknown as Record<string, number>
        const features = Array.from({ length: 28 }, (_, i) => {
            const key = `v${i + 1}`
            return `V${i + 1}: ${rowAsRecord[key].toFixed(6)}`
        }).join(', ')

        return `## Credit Card Transaction (ULB Dataset)
Amount: $${row.amount.toFixed(2)}
Time offset: ${row.time}s

PCA Behavioral Features:
${features}

Analyze this transaction for fraud. Respond with JSON only.`
    }

    private parseResponse(raw: string): UlbClaudeSchema {
        const match = raw.match(/```json\s*([\s\S]*?)\s*```/) ?? raw.match(/\{[\s\S]*\}/)
        const jsonStr = match?.[1] ?? match?.[0] ?? '{}'
        try {
            const parsed: unknown = JSON.parse(jsonStr)
            if (!isValidUlbSchema(parsed)) {
                this.logger.warn('Claude returned invalid ULB schema, using fallback')
                return this.fallbackSchema()
            }
            return parsed
        } catch {
            this.logger.error('Failed to parse Claude ULB response JSON')
            return this.fallbackSchema()
        }
    }

    private fallbackSchema(): UlbClaudeSchema {
        return {
            riskScore: 50,
            confidence: 0.5,
            verdict: 'legitimate',
            riskLevel: 'medium',
            primarySignals: ['Аналіз не вдався'],
            reasoning: 'Аналіз не міг бути завершений через помилку парсингу відповіді.',
        }
    }
}
