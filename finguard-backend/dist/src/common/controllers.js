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
exports.ReportController = exports.DatasetController = exports.RuleContoller = exports.TransactionController = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("../../shared/types");
const create_1 = require("./dto/create");
const query_1 = require("./dto/query");
const createRule_1 = require("./dto/createRule");
const update_1 = require("./dto/update");
const report_1 = require("./dto/report");
const ulbDataset_1 = require("./interceptors/entities/ulbDataset");
const transactions_service_1 = require("../modules/transactions/transactions.service");
const rules_service_1 = require("../modules/rules/rules.service");
const reports_service_1 = require("../modules/reports/reports.service");
const dataset_service_1 = require("../modules/dataset/dataset.service");
const response_1 = require("./interceptors/response");
const PIPES = new common_1.ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
});
let TransactionController = class TransactionController {
    txService;
    constructor(txService) {
        this.txService = txService;
    }
    create(dto) {
        return this.txService.create(dto);
    }
    findAll(q) {
        return this.txService.findAll(q);
    }
    findOne(id) {
        return this.txService.findOne((0, types_1.mkTransactionId)(id));
    }
    analyze(id) {
        return this.txService.analyze((0, types_1.mkTransactionId)(id));
    }
    remove(id) {
        return this.txService.remove((0, types_1.mkTransactionId)(id));
    }
};
exports.TransactionController = TransactionController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_1.CreateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_1.TransactionQueryDto]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/analyze'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "analyze", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "remove", null);
exports.TransactionController = TransactionController = __decorate([
    (0, common_1.UseInterceptors)(response_1.ResponseIntercaptor),
    (0, common_1.UsePipes)(PIPES),
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionController);
let RuleContoller = class RuleContoller {
    ruleService;
    constructor(ruleService) {
        this.ruleService = ruleService;
    }
    create(dto) {
        return this.ruleService.create(dto);
    }
    findAll() {
        return this.ruleService.findAll();
    }
    findOne(id) {
        return this.ruleService.findOne((0, types_1.mkRuleId)(id));
    }
    update(id, dto) {
        return this.ruleService.update((0, types_1.mkRuleId)(id), dto);
    }
    toggle(id) {
        return this.ruleService.toggle((0, types_1.mkRuleId)(id));
    }
    remove(id) {
        return this.ruleService.remove((0, types_1.mkRuleId)(id));
    }
};
exports.RuleContoller = RuleContoller;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createRule_1.CreateRuleDto]),
    __metadata("design:returntype", void 0)
], RuleContoller.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RuleContoller.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RuleContoller.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_1.UpdateRulesDto]),
    __metadata("design:returntype", void 0)
], RuleContoller.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RuleContoller.prototype, "toggle", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RuleContoller.prototype, "remove", null);
exports.RuleContoller = RuleContoller = __decorate([
    (0, common_1.UseInterceptors)(response_1.ResponseIntercaptor),
    (0, common_1.UsePipes)(PIPES),
    (0, common_1.Controller)('rules'),
    __metadata("design:paramtypes", [rules_service_1.RulesService])
], RuleContoller);
let DatasetController = class DatasetController {
    datasetService;
    constructor(datasetService) {
        this.datasetService = datasetService;
    }
    analyzeBatch(dto) {
        return this.datasetService.analyzeBatch(dto.rows);
    }
};
exports.DatasetController = DatasetController;
__decorate([
    (0, common_1.Post)('analyze-batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ulbDataset_1.UlbBatchDto]),
    __metadata("design:returntype", void 0)
], DatasetController.prototype, "analyzeBatch", null);
exports.DatasetController = DatasetController = __decorate([
    (0, common_1.UseInterceptors)(response_1.ResponseIntercaptor),
    (0, common_1.UsePipes)(PIPES),
    (0, common_1.Controller)('dataset'),
    __metadata("design:paramtypes", [dataset_service_1.DatasetAnalysisService])
], DatasetController);
let ReportController = class ReportController {
    reportService;
    constructor(reportService) {
        this.reportService = reportService;
    }
    generate(dto) {
        return this.reportService.generate(dto);
    }
    findAll() {
        return this.reportService.findAll();
    }
    findOne(id) {
        return this.reportService.findOne((0, types_1.mkReportId)(id));
    }
    remove(id) {
        return this.reportService.remove((0, types_1.mkReportId)(id));
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_1.GenerateReportDto]),
    __metadata("design:returntype", void 0)
], ReportController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportController.prototype, "remove", null);
exports.ReportController = ReportController = __decorate([
    (0, common_1.UseInterceptors)(response_1.ResponseIntercaptor),
    (0, common_1.UsePipes)(PIPES),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportController);
//# sourceMappingURL=controllers.js.map