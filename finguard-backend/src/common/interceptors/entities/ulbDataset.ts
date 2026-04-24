import { Type } from 'class-transformer'
import { IsNumber, IsArray, ValidateNested, IsInt, Min, Max } from 'class-validator'

export class UlbRowDto {
    @IsInt() rowIndex!: number
    @IsNumber() 
    time!: number

    @IsNumber() 
    v1!: number

    @IsNumber() 
    v2!: number

    @IsNumber() 
    v3!: number

    @IsNumber() 
    v4!: number

    @IsNumber() 
    v5!: number

    @IsNumber() 
    v6!: number

    @IsNumber() 
    v7!: number

    @IsNumber() 
    v8!: number

    @IsNumber() 
    v9!: number

    @IsNumber() 
    v10!: number

    @IsNumber() 
    v11!: number

    @IsNumber() 
    v12!: number

    @IsNumber() 
    v13!: number

    @IsNumber() 
    v14!: number

    @IsNumber() 
    v15!: number

    @IsNumber() 
    v16!: number

    @IsNumber() 
    v17!: number

    @IsNumber() 
    v18!: number

    @IsNumber() 
    v19!: number

    @IsNumber() 
    v20!: number

    @IsNumber() 
    v21!: number

    @IsNumber() 
    v22!: number

    @IsNumber() 
    v23!: number

    @IsNumber() 
    v24!: number

    @IsNumber() 
    v25!: number

    @IsNumber() 
    v26!: number
    
    @IsNumber() 
    v27!: number

    @IsNumber() 
    v28!: number

    @IsNumber() 
    amount!: number

    @IsInt() 
    @Min(0) 
    @Max(1) 
    trueClass!: number
}

export class UlbBatchDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UlbRowDto)
    rows!: UlbRowDto[]
}
