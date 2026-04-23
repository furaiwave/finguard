import { 
    Controller, Get, Post, Put, Delete, Patch,
    Body, Param, Query, HttpCode, HttpStatus,
    UsePipes, ValidationPipe, UseInterceptors
} from '@nestjs/common'
import { mkTransactionId, mkRuleId, mkReportId } from 'shared/types' 
import { CreateTransactionDto } from './dto/create'
import { TransactionQueryDto } from './dto/query'
import { CreateRuleDto } from './dto/createRule'
import { UpdateRulesDto } from './dto/update'
import { GenerateReportDto } from './dto/report'
import { TransactionsService } from 'src/modules/transactions/transactions.service'
import { RulesService } from 'src/modules/rules/rules.service'
import { ReportsService } from 'src/modules/reports/reports.service'
import { ResponseIntercaptor } from './interceptors/response'

const PIPES = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
})

@UseInterceptors(ResponseIntercaptor)
@UsePipes(PIPES)
@Controller('transactions')
export class TransactionController{
    constructor(private readonly txService: TransactionsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateTransactionDto){
        return this.txService.create(dto)
    }

    @Get()
    findAll(@Query() q: TransactionQueryDto){
        return this.txService.findAll(q)
    }

    @Get(':id')
    findOne(@Param('id') id: string){
        return this.txService.findOne(mkTransactionId(id))
    }

    @Post(':id/analyze')
    @HttpCode(HttpStatus.OK)
    analyze(@Param('id') id: string){
        return this.txService.analyze(mkTransactionId(id))
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string){
        return this.txService.remove(mkTransactionId(id))
    }
}

@UseInterceptors(ResponseIntercaptor)
@UsePipes(PIPES)
@Controller('rules')
export class RuleContoller {
    constructor(private readonly ruleService: RulesService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateRuleDto){
        return this.ruleService.create(dto)
    }

    @Get()
    findAll(){
        return this.ruleService.findAll()
    }

    @Get(':id')
    findOne(@Param('id') id: string){
        return this.ruleService.findOne(mkRuleId(id))
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateRulesDto){
        return this.ruleService.update(mkRuleId(id), dto)
    }

    @Patch(':id/toggle')
    toggle(@Param('id') id: string){
        return this.ruleService.toggle(mkRuleId(id))
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string){
        return this.ruleService.remove(mkRuleId(id))
    }
}

@UseInterceptors(ResponseIntercaptor)
@UsePipes(PIPES)
@Controller('reports')
export class ReportController{
    constructor(private readonly reportService: ReportsService) {}

    @Post('generate')
    @HttpCode(HttpStatus.CREATED)
    generate(@Body() dto: GenerateReportDto){
        return this.reportService.generate(dto)
    }

    @Get()
    findAll(){
        return this.reportService.findAll()
    }

    @Get(':id')
    findOne(@Param('id') id: string){
        return this.reportService.findOne(mkReportId(id))
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string){
        return this.reportService.remove(mkReportId(id))
    }
}