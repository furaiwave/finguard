import { 
    Controller, Get, Post, Put, Delete, Patch,
    Body, Param, Query, HttpCode, HttpStatus,
    UsePipes, ValidationPipe, UseInterceptors
} from '@nestjs/common'
import { mkTransactionId, mkRuleId, mkReportId } from 'shared/types' 
import type { CreateTransactionDto } from './dto/create'
import type { TransactionQueryDto } from './dto/query'
import type { CreateRuleDto } from './dto/createRule'
import type { UpdateRulesDto } from './dto/update'
import type { GenerateReportDto } from './dto/report'