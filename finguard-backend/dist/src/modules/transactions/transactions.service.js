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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const analysis_service_1 = require("../analysis/analysis.service");
const transactions_1 = require("../../common/interceptors/entities/transactions");
const analysis_1 = require("../../common/interceptors/entities/analysis");
const rules_1 = require("../../common/interceptors/entities/rules");
const types_1 = require("../../../shared/types");
let TransactionsService = class TransactionsService {
    txRepo;
    analysisRepo;
    ruleRepo;
    aiService;
    logger = new common_1.Logger(transactions_1.TransactionEntity.name);
    constructor(txRepo, analysisRepo, ruleRepo, aiService) {
        this.txRepo = txRepo;
        this.analysisRepo = analysisRepo;
        this.ruleRepo = ruleRepo;
        this.aiService = aiService;
    }
    toDto(tx, a) {
        return {
            id: tx.id,
            userId: tx.userId,
            amountMinor: Number(tx.amountMinor),
            currency: tx.currency,
            type: tx.type,
            channel: tx.channel,
            status: tx.status,
            ipAddress: tx.ipAddress,
            userAgent: tx.userAgent,
            description: tx.description,
            extraFields: tx.extraFields,
            createdAt: tx.createdAt.toISOString(),
            updatedAt: tx.updatedAt.toISOString(),
            latestAnalysis: a ? this.aiService.toResponseDto(a) : null
        };
    }
    entityToPayLoad(tx) {
        return {
            transactionId: tx.id,
            userId: tx.userId,
            timestampMs: tx.createdAt.getTime(),
            amount: Number(tx.amountMinor),
            currency: tx.currency,
            ipAddress: tx.ipAddress,
            userAgent: tx.userAgent,
            description: tx.description ?? undefined,
            type: tx.type,
            channel: tx.channel,
            ...(tx.extraFields ?? {}),
        };
    }
    async create(dto) {
        const tx = this.txRepo.create({
            id: (0, types_1.mkTransactionId)(dto.transactionId ?? (0, uuid_1.v4)()),
            userId: dto.userId,
            amountMinor: (0, types_1.mkAmountMinor)(dto.amountMinor),
            currency: dto.currency,
            type: dto.type,
            channel: dto.channel,
            status: 'pending',
            ipAddress: dto.ipAddress,
            userAgent: dto.userAgent,
            description: dto.description ?? null,
            extraFields: dto.extraFields ?? null
        });
        const saved = await this.txRepo.save(tx);
        return this.toDto(saved, null);
    }
    async findAll(q) {
        const page = q.page ?? 1;
        const limit = q.limit ?? 20;
        const qb = this.txRepo.createQueryBuilder('tx');
        if (q.type)
            qb.andWhere('tx.type = :type', {
                type: q.type
            });
        if (q.channel)
            qb.andWhere('tx.channel = :channel', {
                channel: q.channel
            });
        if (q.status)
            qb.andWhere('tx.status = :status', {
                status: q.status
            });
        qb.orderBy(`tx.${q.sortBy ?? 'createdAt'}`, q.sortOrder ?? 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const [items, total] = await qb.getManyAndCount();
        const ids = items.map((t) => t.id);
        const analyses = ids.length > 0
            ? await this.analysisRepo
                .createQueryBuilder('a')
                .where('a.transactionId IN (:...ids)', { ids })
                .orderBy('a.analyzedAt', 'DESC')
                .getMany()
            : [];
        const aMap = new Map();
        for (const a of analyses) {
            if (!aMap.has(a.transactionId))
                aMap.set(a.transactionId, a);
        }
        return {
            items: items.map((tx) => this.toDto(tx, aMap.get(tx.id) ?? null)),
            total, page, limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    async findOne(id) {
        const tx = await this.txRepo.findOne({ where: { id } });
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${id} not found `);
        const a = await this.analysisRepo.findOne({
            where: { transactionId: id },
            order: { analyzedAt: 'DESC' },
        });
        return this.toDto(tx, a ?? null);
    }
    async analyze(id) {
        const tx = await this.txRepo.findOne({ where: { id } });
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${id} not found `);
        if (tx.status === 'analyzing')
            throw new common_1.BadRequestException('Already analyzing');
        await this.txRepo.update(id, { status: 'analyzing' });
        const rules = await this.ruleRepo.find({
            where: { isActive: true },
            order: { priority: 'ASC' }
        });
        const ruleDefs = rules.map((r) => ({
            id: r.id, name: r.name, description: r.description,
            isActive: r.isActive, priority: r.priority,
            conditions: r.conditions, conditionLogic: r.conditionLogic,
            action: r.action, riskScoreImpact: r.riskScoreImpact,
            createdAt: r.createdAt, updatedAt: r.updatedAt
        }));
        const payload = this.entityToPayLoad(tx);
        try {
            const result = await this.aiService.analyze(payload, ruleDefs);
            const newStatus = result.decision.verdict === 'approved' ? 'approved'
                : result.decision.verdict === 'approved_with_review' ? 'approved_with_review'
                    : result.decision.verdict === 'blocked' ? 'blocked' : 'manual_review';
            await this.txRepo.update(id, { status: newStatus });
            const entity = await this.analysisRepo.findOne({ where: { id: result.analysisId } });
            return this.aiService.toResponseDto(entity);
        }
        catch (err) {
            await this.txRepo.update(id, { status: 'pending' });
            this.logger.error(`Analysus failed for tx ${id}`, err);
            throw err;
        }
    }
    async remove(id) {
        const tx = await this.txRepo.findOne({ where: { id } });
        if (!tx)
            throw new common_1.NotFoundException(`Transaction ${id} not found`);
        await this.analysisRepo.delete({ transactionId: id });
        await this.txRepo.delete(id);
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transactions_1.TransactionEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(analysis_1.AnalysisEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(rules_1.RuleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        analysis_service_1.AiAnalysisService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map