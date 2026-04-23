import {
    Entity,
    Column,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm'

import type {
    TransactionId,
    AnalysisId,
    RiskScore,
    ConfidenceScore,
    ModelVersion,
    RiskLevel,
    Verdict,
    FraudSignal,
} from '../../../../shared/types'
import { TransactionEntity } from './transactions'

@Entity('analyses')
@Index(['transactionId', 'analyzedAt'])
export class AnalysisEntity {
    @PrimaryColumn({
        type: 'varchar',
        length: 36
    })
    id!: AnalysisId

    @Index()
    @Column({
        type: 'varchar',
        length: 36,
        name: 'transaction_id'
    })
    transactionId!: TransactionId

    @ManyToOne(() => TransactionEntity, (t) => t.analyses)
    @JoinColumn({ name: 'transaction_id' })
    transaction!: TransactionEntity

    @Column({
        type: 'varchar',
        length: 30,
        name: 'model_version'
    })
    modelVersion!: ModelVersion

    @Column({
        type: 'tinyint',
        unsigned: true,
        name: 'risk_score'
    })
    riskScore!: RiskScore

    @Column({
        type: 'decimal',
        precision: 4,
        scale: 3
    })
    confidence!: ConfidenceScore

    @Column({
        type: 'enum',
        enum: [
            'approved',
            'approved_with_review',
            'blocked',
            'pending_manual_review'
        ],
    })
    verdict!: Verdict;

    @Column({
        type: 'enum',
        enum: ['low','medium','high','critical'],
        name: 'risk_level',
    })
    riskLevel!: RiskLevel;
    
    @Column({ 
        type: 'boolean', 
        name: 'requires_review', 
        default: false })
    requiresReview!: boolean;
    
    @Column({ 
        type: 'json' 
    })
    signals!: ReadonlyArray<FraudSignal>;
    
    @Column({ 
        type: 'text' 
    })
    reasoning!: string;
    
    @Column({ 
        type: 'json' 
    })
    recommendations!: ReadonlyArray<string>;
    
    @Column({ 
        type: 'int', 
        name: 'processing_time_ms' 
    })
    processingTimeMs!: number;
    
    @Column({ 
        type: 'bigint', 
        nullable: true, 
        name: 'review_deadline_ms' 
    })
    reviewDeadlineMs!: number | null;
    
    @Column({ 
        type: 'json', 
        name: 'blocked_reason', 
        nullable: true })
    blockedReason!: FraudSignal | null;
    
    @Column({ 
        name: 'analyzed_at' 
    })
    analyzedAt!: Date;
}