import {
    Entity,
    Column,
    PrimaryColumn,
} from 'typeorm'

import type {
    ReportId,
    ReportData,
    ReportPeriod,
    ReportType
} from '../../../../shared/types'

@Entity('reports')
export class ReportEntity {
    @PrimaryColumn({ type: 'varchar', length: 36 })
    id!: ReportId

    @Column({ type: 'varchar', length: 200 })
    name!: string

    @Column({
        type: 'enum',
        enum: [
            'fraud_summary',
            'transaction_volume',
            'risk_distribution',
            'rule_effectiveness',
            'ai_performance'
        ]
    })
    type!: ReportType

    @Column({
        type: 'enum',
        enum: [
            'daily',
            'weekly',
            'monthly',
            'custom'
        ]
    })
    period!: ReportPeriod

    @Column({
        type: 'json',
    })
    data!: ReportData

    @Column({
        type: 'datetime',
        name: 'generated_at'
    })
    generatedAt!: Date
}