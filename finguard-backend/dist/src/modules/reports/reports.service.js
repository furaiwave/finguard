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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const types_1 = require("../../../shared/types");
const report_1 = require("../../common/interceptors/entities/report");
const transactions_1 = require("../../common/interceptors/entities/transactions");
const analysis_1 = require("../../common/interceptors/entities/analysis");
let ReportsService = class ReportsService {
    rpRepo;
    txRepo;
    anRepo;
    constructor(rpRepo, txRepo, anRepo) {
        this.rpRepo = rpRepo;
        this.txRepo = txRepo;
        this.anRepo = anRepo;
    }
    async generate(dto) {
        const { start, end } = this.dateRange(dto);
        const data = await this.buildData(dto.type, start, end);
        const rp = this.rpRepo.create({
            id: (0, types_1.mkReportId)((0, uuid_1.v4)()),
            name: dto.name,
            type: dto.type,
            period: dto.period,
            data,
            generatedAt: new Date(),
        });
        return this.rpRepo.save(rp);
    }
    async findAll() {
        return this.rpRepo.find({ order: { generatedAt: 'DESC' } });
    }
    async findOne(id) {
        const r = await this.rpRepo.findOne({ where: { id } });
        if (!r)
            throw new common_1.NotFoundException(`Report ${id} not found`);
        return r;
    }
    async remove(id) {
        if (!(await this.rpRepo.findOne({ where: { id } })))
            throw new common_1.NotFoundException(`Report ${id} not found`);
        await this.rpRepo.delete(id);
    }
    async buildData(type, start, end) {
        switch (type) {
            case 'fraud_summary': return { type, payload: await this.fraudSummary(start, end) };
            case 'transaction_volume': return { type, payload: await this.volume(start, end) };
            case 'risk_distribution': return { type, payload: await this.riskDist(start, end) };
            case 'rule_effectiveness': return { type, payload: { rules: [] } };
            case 'ai_performance': return { type, payload: await this.aiPerf(start, end) };
        }
    }
    async fraudSummary(s, e) {
        const txs = await this.txRepo.find({ where: { createdAt: (0, typeorm_2.Between)(s, e) } });
        const flagged = txs.filter((t) => ['blocked', 'manual_review'].includes(t.status));
        const blocked = txs.filter((t) => t.status === 'blocked');
        const approved = txs.filter((t) => ['approved', 'approved_with_review'].includes(t.status));
        const total = txs.reduce((acc, t) => acc + Number(t.amountMinor), 0);
        const fraud = flagged.reduce((acc, t) => acc + Number(t.amountMinor), 0);
        return {
            totalTransactions: txs.length,
            flaggedCount: flagged.length,
            blockedCount: blocked.length,
            approvedCount: approved.length,
            totalAmountMinor: total,
            fraudAmountMinor: fraud,
            fraudRate: txs.length > 0 ? (flagged.length / txs.length) * 100 : 0,
            topSignals: [],
        };
    }
    async volume(s, e) {
        const txs = await this.txRepo.find({ where: { createdAt: (0, typeorm_2.Between)(s, e) } });
        const byDate = new Map();
        for (const tx of txs) {
            const d = tx.createdAt.toISOString().split('T')[0];
            const p = byDate.get(d) ?? { count: 0, amount: 0 };
            byDate.set(d, { count: p.count + 1, amount: p.amount + Number(tx.amountMinor) });
        }
        return {
            series: [...byDate.entries()].map(([date, { count, amount }]) => ({
                date, count, amountMinor: amount,
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
        };
    }
    async riskDist(s, e) {
        const ans = await this.anRepo.find({ where: { analyzedAt: (0, typeorm_2.Between)(s, e) } });
        const counts = { low: 0, medium: 0, high: 0, critical: 0 };
        let scoreSum = 0;
        for (const a of ans) {
            counts[a.riskLevel]++;
            scoreSum += a.riskScore;
        }
        return { ...counts, avgScore: ans.length > 0 ? scoreSum / ans.length : 0 };
    }
    async aiPerf(s, e) {
        const ans = await this.anRepo.find({ where: { analyzedAt: (0, typeorm_2.Between)(s, e) } });
        const n = ans.length || 1;
        const breakdown = {
            approved: 0,
            approved_with_review: 0,
            blocked: 0,
            pending_manual_review: 0
        };
        let msSum = 0, confSum = 0;
        for (const a of ans) {
            msSum += a.processingTimeMs;
            confSum += Number(a.confidence);
            breakdown[a.verdict]++;
        }
        return {
            avgConfidence: confSum / n,
            avgProcessingMs: msSum / n,
            totalAnalyzed: ans.length,
            decisionBreakdown: breakdown
        };
    }
    dateRange(dto) {
        const end = new Date(), start = new Date();
        if (dto.period === 'custom' && dto.startDate && dto.endDate)
            return { start: new Date(dto.startDate), end: new Date(dto.endDate) };
        if (dto.period === 'daily')
            start.setDate(end.getDate() - 1);
        if (dto.period === 'weekly')
            start.setDate(end.getDate() - 7);
        if (dto.period === 'monthly')
            start.setMonth(end.getMonth() - 1);
        return { start, end };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_1.ReportEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(transactions_1.TransactionEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(analysis_1.AnalysisEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map