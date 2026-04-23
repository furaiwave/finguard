import { Injectable, NestInterceptor, ExecutionContext, CallHandler, 
    HttpException, HttpStatus
} from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { type ApiResponse, type ApiError} from 'shared/types'

@Injectable()
export class ResponseIntercaptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        _ctx: ExecutionContext, 
        next: CallHandler<T>
    ): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((data): ApiResponse<T> => ({
                success: true,
                data,
                timestamp: new Date().toISOString()
            })),
            catchError((err: unknown) =>
                throwError((): ApiError => ({
                    success: false,
                    error: {
                        code: err instanceof HttpException
                            ? HttpStatus[err.getStatus()]
                            : 'INTERNAL ERROR',
                        message: err instanceof Error ? err.message : 'Unknown error'
                    },
                    timestamp: new Date().toISOString(),
                }))
            )
        )
    }
}