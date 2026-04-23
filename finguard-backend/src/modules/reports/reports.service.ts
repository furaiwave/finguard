import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid'
import { mkReportId, type ReportId, type AmountMinor } from 'shared/types';
import { ReportEntity } from 'src/common/interceptors/entities/report';
import { TransactionEntity } from 'src/common/interceptors/entities/transactions';
import { AnalysisEntity } from 'src/common/interceptors/entities/analysis';
import { ReportData, FraudSummaryPayload, VolumePayload, RiskDistributionPayload, AiPerfomancePayload  } from 'shared/types';
import { GenerateReportDto } from 'src/common/dto/report';


@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(ReportEntity) private readonly rpRepo: Repository<ReportEntity>,
        @InjectRepository(TransactionEntity) private readonly txRepo: Repository<TransactionEntity>,
        @InjectRepository(AnalysisEntity) private readonly anRepo: Repository<AnalysisEntity>,
    ) {}

    async generate(dto: GenerateReportDto) {
        const { start, end } = this.dateRange(dto)
        const data = await this.buildData(dto.type, start, end)
        const rp = this.rpRepo.create({
            id: mkReportId(uuidv4()),
            name: dto.name,
            type: dto.type,
            period: dto.period,
            data,
            generatedAt: new Date(),
        })
        return this.rpRepo.save(rp)
    }

    async findAll(){
        return this.rpRepo.find({ order: { generatedAt: 'DESC' }})
    }

    async findOne(id: ReportId){
        const r = await this.rpRepo.findOne({ where: { id } })
        if(!r) throw new NotFoundException(`Report ${id} not found`)
        return r
    }

    async remove(id: ReportId): Promise<void>{
        if(!(await this.rpRepo.findOne({ where: { id } })))
            throw new NotFoundException(`Report ${id} not found`)
        await this.rpRepo.delete(id)
    }
    private async buildData(
        type: GenerateReportDto['type'],
        start: Date,
        end: Date,
    ): Promise<ReportData>{
        switch(type){
            case 'fraud_summary': return { type, payload: await this.fraudSummary(start, end)}
            case 'transaction_volume': return { type, payload: await this.volume(start, end)}
            case 'risk_distribution': return { type, payload: await this.riskDist(start, end)}
            case 'rule_effectiveness': return { type, payload: { rules: [] } }
            case 'ai_performance': return { type, payload: await this.aiPerf(start, end)}  
        }
    }

    private async fraudSummary(s: Date, e: Date): Promise<FraudSummaryPayload> {
        const txs = await this.txRepo.find({ where: { createdAt: Between(s, e) }})
        const flagged = txs.filter((t) => ['blocked', 'manual_review'].includes(t.status))
        const blocked = txs.filter((t) => t.status === 'blocked')
        const approved = txs.filter((t) => ['approved', 'approved_with_review'].includes(t.status))
        const total = txs.reduce((acc, t) => acc + Number(t.amountMinor), 0)
        const fraud = flagged.reduce((acc, t) => acc + Number(t.amountMinor), 0)

        return {
            totalTransactions: txs.length,
            flaggedCount: flagged.length,
            blockedCount: blocked.length,
            approvedCount: approved.length,
            totalAmountMinor: total as AmountMinor,
            fraudAmountMinor: fraud as AmountMinor,
            fraudRate: txs.length > 0 ? (flagged.length / txs.length) * 100 : 0,
            topSignals: [],
        }
    }

    private async volume(s: Date, e: Date): Promise<VolumePayload>{
        const txs = await this.txRepo.find({ where: { createdAt: Between(s, e) }})
        const byDate = new Map<string, { count: number; amount: number }> ()
        for(const tx of txs){
            const d = tx.createdAt.toISOString().split('T')[0]
            const p = byDate.get(d) ?? { count: 0, amount: 0 }
            byDate.set(d, { count: p.count + 1, amount: p.amount + Number(tx.amountMinor ) })
        }
        return {
            series: [...byDate.entries()].map(([date, { count, amount }]) => ({
                date, count, amountMinor: amount as AmountMinor,
            })),
            byChannel: {
                card_present: txs.filter((t) => t.channel === 'card_present').length,
                card_not_present: txs.filter((t) => t.channel === 'card_not_present').length,
                bank_transfer: txs.filter((t) => t.channel === 'bank_transfer').length,
                crypto: txs.filter((t) => t.channel === 'crypto').length,
                mobile_payment: txs.filter((t) => t.channel === 'mobile_payment').length,
                atm: txs.filter((t) => t.channel === 'atm').length
            },

            byType: {
                payment: txs.filter((t) => t.type === 'payment').length,
                transfer: txs.filter((t) => t.type === 'transfer').length,
                withdrawal: txs.filter((t) => t.type === 'withdrawal').length,
                deposit: txs.filter((t) => t.type === 'deposit').length,
                refund: txs.filter((t) => t.type === 'refund').length,
                chargeback: txs.filter((t) => t.type === 'chargeback').length,
            }
        }
    }

    private async riskDist(s: Date, e: Date): Promise<RiskDistributionPayload>{
        const ans = await this.anRepo.find({ where: { analyzedAt: Between(s, e) }})
        const counts = { low: 0, medium: 0, high: 0, critical: 0 }
        let scoreSum = 0;
        for(const a of ans) { counts[a.riskLevel]++; scoreSum += a.riskScore; }
        return { ...counts, avgScore: ans.length > 0 ? scoreSum / ans.length : 0 }
    }

    private async aiPerf(s: Date, e: Date): Promise<AiPerfomancePayload>{
        const ans = await this.anRepo.find({ where: { analyzedAt: Between(s, e)} })
        const n = ans.length || 1
        const breakdown = { 
            approved: 0, 
            approved_with_review: 0, 
            blocked: 0, 
            pending_manual_review: 0
        }
        let msSum = 0, confSum = 0
        for(const a of ans){
            msSum += a.processingTimeMs
            confSum += Number(a.confidence)
            breakdown[a.verdict]++
        }

        return {
            avgConfidence: confSum / n,
            avgProcessingMs: msSum / n,
            totalAnalyzed: ans.length,
            decisionBreakdown: breakdown
        }
    }

    private dateRange(dto: GenerateReportDto){
        const end = new Date(), start = new Date();
        if(dto.period === 'custom' && dto.startDate && dto.endDate)
            return { start: new Date(dto.startDate), end: new Date(dto.endDate) }

        if(dto.period === 'daily') start.setDate(end.getDate() - 1)
        if(dto.period === 'weekly') start.setDate(end.getDate() - 7)
        if(dto.period === 'monthly') start.setMonth(end.getMonth() - 1)
        return { start, end }
    }
}

