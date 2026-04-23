import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransactionDto } from 'src/common/dto/create';
import { TransactionResponseDto } from 'src/common/dto/transResponse';
import { AnalysisResponseDto } from 'src/common/dto/responseAnalysis';
import { TransactionQueryDto } from 'src/common/dto/query';
import { AiAnalysisResult } from 'shared/types';
import { AiAnalysisService } from '../analysis/analysis.service';
import { TransactionEntity } from 'src/common/interceptors/entities/transactions';
import { AnalysisEntity } from 'src/common/interceptors/entities/analysis';
import { RuleEntity } from 'src/common/interceptors/entities/rules';
import { mkTransactionId, mkAmountMinor, type TransactionId, type AnyTransaction, type PaginatedResponse } from 'shared/types';

@Injectable()
export class TransactionsService {
    private readonly logger = new Logger(TransactionEntity.name)

    constructor(
        @InjectRepository(TransactionEntity) private readonly txRepo: Repository<TransactionEntity>,
        @InjectRepository(AnalysisEntity) private readonly analysisRepo: Repository<AnalysisEntity>,
        @InjectRepository(RuleEntity) private readonly ruleRepo: Repository<RuleEntity>,
        private readonly aiService: AiAnalysisService,
    ) {}

    private toDto(tx: TransactionEntity, a: AnalysisEntity | null): TransactionResponseDto{
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
        }
    }

    private entityToPayLoad(tx: TransactionEntity): AnyTransaction {
        return {
            transactionId: tx.id,
            userId: tx.userId as ReturnType<typeof import('../../../shared/types')['mkUserId']>,
            timestampMs: tx.createdAt.getTime(),
            amount: Number(tx.amountMinor) as ReturnType<typeof import('../../../shared/types')['mkAmountMinor']>,
            currency: tx.currency,
            ipAddress: tx.ipAddress,
            userAgent: tx.userAgent,
            description: tx.description ?? undefined,
            type: tx.type,
            channel: tx.channel,
            ...((tx.extraFields as object) ?? {}),
        } as unknown as AnyTransaction
    }

    async create(dto: CreateTransactionDto): Promise<TransactionResponseDto>{
        const tx = this.txRepo.create({
            id: mkTransactionId(dto.transactionId ?? uuidv4()),
            userId: dto.userId,
            amountMinor: mkAmountMinor(dto.amountMinor),
            currency: dto.currency,
            type: dto.type,
            channel: dto.channel,
            status: 'pending',
            ipAddress: dto.ipAddress,
            userAgent: dto.userAgent,
            description: dto.description ?? null,
            extraFields: dto.extraFields ?? null
        });
        const saved = await this.txRepo.save(tx)
        return this.toDto(saved, null)
    }

    async findAll(q: TransactionQueryDto): Promise<PaginatedResponse<TransactionResponseDto>>{
        const page = q.page ?? 1
        const limit = q.limit ?? 20

        const qb = this.txRepo.createQueryBuilder('tx')
        if(q.type) qb.andWhere('tx.type = :type', {
            type: q.type
        }) 

        if(q.channel) qb.andWhere('tx.channel = :channel', {
            channel: q.channel
        })

        if(q.status) qb.andWhere('tx.status = :status', {
            status: q.status
        })

        qb.orderBy(`tx.${q.sortBy ?? 'createdAt'}`, q.sortOrder ?? 'DESC')
            .skip((page - 1) * limit)
            .take(limit)

        const [items, total] = await qb.getManyAndCount()

        const ids = items.map((t) => t.id)
        const analyses = ids.length > 0
            ? await this.analysisRepo
                .createQueryBuilder('a')
                .where('a.transactionId IN (:...ids)', { ids })
                .orderBy('a.analyzedAt', 'DESC')
                .getMany()
            : []

        const aMap = new Map<TransactionId, AnalysisEntity>()
        for(const a of analyses){
            if(!aMap.has(a.transactionId)) aMap.set(a.transactionId, a);
        }

        return {
            items: items.map((tx) => this.toDto(tx, aMap.get(tx.id) ?? null)),
            total, page, limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async findOne(id: TransactionId): Promise<TransactionResponseDto>{
        const tx = await this.txRepo.findOne({ where: { id} })
        if(!tx) throw new NotFoundException(`Transaction ${id} not found `)
        const a = await this.analysisRepo.findOne({
            where: { transactionId: id },
            order: { analyzedAt: 'DESC' },
        })

        return this.toDto(tx, a ?? null)
    }

    async analyze(id: TransactionId): Promise<AnalysisResponseDto>{
        const tx = await this.txRepo.findOne({ where: { id } })
        if(!tx) throw new NotFoundException(`Transaction ${id} not found `)
        if(tx.status === 'analyzing') throw new BadRequestException('Already analyzing')

        await this.txRepo.update(id, { status: 'analyzing' })

        const rules = await this.ruleRepo.find({
            where: { isActive: true },
            order: { priority: 'ASC' }
        })

        const ruleDefs = rules.map((r) => ({
            id: r.id, name: r.name, description: r.description,
            isActive: r.isActive, priority: r.priority,
            conditions: r.conditions, conditionLogic: r.conditionLogic,
            action: r.action, riskScoreImpact: r.riskScoreImpact,
            createdAt: r.createdAt, updatedAt: r.updatedAt
        }))


        const payload = this.entityToPayLoad(tx)

        try{
            const result = await this.aiService.analyze(payload, ruleDefs)

            const newStatus = result.decision.verdict === 'approved' ? 'approved' 
                : result.decision.verdict === 'approved_with_review' ? 'approved_with_review'
                : result.decision.verdict === 'blocked' ? 'blocked' : 'manual_review'

            await this.txRepo.update(id, { status: newStatus })

            const entity = await this.analysisRepo.findOne({ where: { id: result.analysisId }})
            return this.aiService.toResponseDto(entity!)
        } catch (err) {
            await this.txRepo.update(id, { status: 'pending' })
            this.logger.error(`Analysus failed for tx ${id}`, err)
            throw err
        }
    }

    async remove(id: TransactionId): Promise<void>{
        const tx = await this.txRepo.findOne({ where: { id } })
        if(!tx) throw new NotFoundException(`Transaction ${id} not found`)
        await this.analysisRepo.delete({ transactionId: id })
        await this.txRepo.delete(id)
    }
}
