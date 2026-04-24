"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const transactions_1 = require("./common/interceptors/entities/transactions");
const analysis_1 = require("./common/interceptors/entities/analysis");
const rules_1 = require("./common/interceptors/entities/rules");
const report_1 = require("./common/interceptors/entities/report");
const rules_service_1 = require("./modules/rules/rules.service");
const reports_service_1 = require("./modules/reports/reports.service");
const analysis_service_1 = require("./modules/analysis/analysis.service");
const controllers_1 = require("./common/controllers");
const transactions_service_1 = require("./modules/transactions/transactions.service");
const dataset_service_1 = require("./modules/dataset/dataset.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    type: 'mysql',
                    host: cfg.getOrThrow('DB_HOST'),
                    port: cfg.get('DB_PORT', 3306),
                    username: cfg.getOrThrow('DB_USER'),
                    password: cfg.getOrThrow('DB_PASSWORD'),
                    database: cfg.getOrThrow('DB_NAME'),
                    entities: [transactions_1.TransactionEntity, analysis_1.AnalysisEntity, rules_1.RuleEntity, report_1.ReportEntity],
                    synchronize: cfg.get('NODE_ENV') !== 'production',
                    charset: 'utf8mb4',
                    timezone: 'Z',
                })
            }),
            typeorm_1.TypeOrmModule.forFeature([
                transactions_1.TransactionEntity, analysis_1.AnalysisEntity, rules_1.RuleEntity, report_1.ReportEntity
            ])
        ],
        controllers: [controllers_1.TransactionController, controllers_1.RuleContoller, controllers_1.ReportController, controllers_1.DatasetController],
        providers: [transactions_service_1.TransactionsService, rules_service_1.RulesService, reports_service_1.ReportsService, analysis_service_1.AiAnalysisService, dataset_service_1.DatasetAnalysisService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map