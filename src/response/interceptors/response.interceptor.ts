import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { ApiResponseDto } from '../interfaces/api-response.interface';
import type { WrappedResponse } from '../interfaces/wrapper.interface';
import { encodeHtmlOutput } from '../../utils';

function isWrappedResponse<T>(value: unknown): value is WrappedResponse<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'data' in value || 'message' in value || 'meta' in value || 'links' in value
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  public intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseDto<T>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((result: T | WrappedResponse<T>): ApiResponseDto<T> => {
        const wrapped = isWrappedResponse<T>(result);

        const data: T | null = wrapped ? (result.data ?? null) : result;

        return {
          success: true,
          statusCode: response.statusCode,
          message: wrapped
            ? (result.message ?? 'Request successful')
            : 'Request successful',
          path: request.originalUrl ?? request.url,
          timestamp: new Date().toISOString(),
          data: encodeHtmlOutput(data),
          meta: wrapped ? (result.meta ?? null) : null,
          links: wrapped ? (result.links ?? null) : null,
          error: null,
        };
      }),
    );
  }
}
