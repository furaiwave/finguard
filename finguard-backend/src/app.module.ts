import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './common/interceptors/entities/transactions';
import { AnalysisEntity } from './common/interceptors/entities/analysis';
import { RuleEntity } from './common/interceptors/entities/rules';
import { ReportEntity } from './common/interceptors/entities/report';
import { RulesService } from './modules/rules/rules.service';
import { ReportsService } from './modules/reports/reports.service';
import { AiAnalysisService } from './modules/analysis/analysis.service';
import { TransactionController, RuleContoller, ReportController } from './common/controllers';
import { TransactionsService } from './modules/transactions/transactions.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.getOrThrow('DB_HOST'),
        port: cfg.get<number>('DB_PORT', 3306),
        username: cfg.getOrThrow('DB_USER'),
        password: cfg.getOrThrow('DB_PASSWORD'),
        database: cfg.getOrThrow('DB_NAME'),
        entities: [TransactionEntity, AnalysisEntity, RuleEntity, ReportEntity],
        synchronize: cfg.get('NODE_ENV') !== 'production',
        charset: 'utf8mb4',
        timezone: 'Z',
      })
    }),
    TypeOrmModule.forFeature([
      TransactionEntity, AnalysisEntity, RuleEntity, ReportEntity
    ])
  ],
  controllers: [TransactionController, RuleContoller, ReportController],
  providers: [TransactionsService, RulesService, ReportsService, AiAnalysisService],
})
export class AppModule {}
