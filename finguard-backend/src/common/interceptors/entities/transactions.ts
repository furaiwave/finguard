import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index
} from 'typeorm'

import type {
    TransactionChannel,
    TransactionId,
    TransactionStatus,
    TransactionType,
    AmountMinor,
    CurrencyCode,
} from '../../../../shared/types'
import { AnalysisEntity } from './analysis'

@Entity('transactions')
@Index(['status', 'createdAt'])
@Index(['type', 'channel'])
export class TransactionEntity {
    @PrimaryColumn({
        type: 'varchar',
        length: 36
    })
    id!: TransactionId

    @Index()
    @Column({
        type: 'varchar',
        length: 36,
        name: 'user_id'
    })
    userId!: string

    @Column({
        type: 'bigint',
        unsigned: true,
        name: 'amount_minor'
    })
    amountMinor!: AmountMinor

    @Column({
        type: 'varchar',
        length: 3,
    })
    currency!: CurrencyCode

    @Column({
        type: 'enum',
        enum: ['payment', 'transfer', 'withdrawal', 'deposit', 'refund', 'chargeback']
    })
    type!: TransactionType

    @Column({
        type: 'enum',
        enum: ['card_present', 'card_not_present', 'bank_transfer', 'crypto', 'mobile_payment', 'atm']
    })
    channel!: TransactionChannel

    @Index()
    @Column({
        type: 'enum',
        enum: [
            'pending',
            'analyzing',
            'approved',
            'approved_with_review',
            'blocked',
            'manual_review'
        ],
        default: 'pending',
      })
    status!: TransactionStatus;

    @Index()
    @Column({
        type: 'varchar',
        length: 45,
        name: 'ip_address'
    })
    ipAddress!: string

    @Column({ 
        type: 'text',
        name: 'user_agent',
    })
    userAgent!: string 

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({
        type: 'json',
        name: 'extra_fields',
        nullable: true
    })
    extraFields!: Readonly<Record<string, unknown>> | null

    @CreateDateColumn({
        name: 'created_at'
    })
    createdAt!: Date

    @UpdateDateColumn({
        name: 'updated_at'
    })
    updatedAt!: Date

    @OneToMany(() => AnalysisEntity, (a) => a.transaction)
    analyses!: AnalysisEntity[]
}