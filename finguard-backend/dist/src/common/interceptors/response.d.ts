import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { type ApiResponse } from "../../../shared/types";
export declare class ResponseIntercaptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>>;
}
