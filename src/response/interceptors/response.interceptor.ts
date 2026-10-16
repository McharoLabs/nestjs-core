import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiResponseDto } from '../dto/api-response.dto';
import type { BaseResponseDto } from '../dto/base-response.dto';
import { encodeHtmlOutput } from '../../utils';
import type { WrappedResponse } from '../interfaces/wrapper.interface';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidDate(value: unknown): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value !== 'string') {
    return false;
  }

  return value.length > 0 && !Number.isNaN(Date.parse(value));
}

function isBaseResponseDto(value: unknown): value is BaseResponseDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    Number.isFinite(value.id) &&
    isValidDate(value.createdAt) &&
    isValidDate(value.updatedAt)
  );
}

function assertBaseResponseDto(
  value: unknown,
): asserts value is BaseResponseDto | BaseResponseDto[] | null {
  if (value === null) {
    return;
  }

  if (Array.isArray(value)) {
    if (!value.every(isBaseResponseDto)) {
      throw new InternalServerErrorException(
        'Response data must contain objects extending BaseResponseDto.',
      );
    }

    return;
  }

  if (!isBaseResponseDto(value)) {
    throw new InternalServerErrorException(
      'Response data must extend BaseResponseDto.',
    );
  }
}

function isWrappedResponse(
  value: unknown,
): value is WrappedResponse<BaseResponseDto | BaseResponseDto[]> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    'data' in value &&
    'message' in value &&
    typeof value.message === 'string' &&
    'meta' in value &&
    'links' in value
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor<
  unknown,
  ApiResponseDto
> {
  public intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiResponseDto> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((result: unknown): ApiResponseDto => {
        const wrapped = isWrappedResponse(result);
        const data: unknown = wrapped ? result.data : result;

        assertBaseResponseDto(data);

        return {
          success: true,
          statusCode: response.statusCode,
          message: wrapped ? result.message : 'Request successful',
          path: request.originalUrl,
          timestamp: new Date().toISOString(),
          data: encodeHtmlOutput(data),
          meta: wrapped ? result.meta : null,
          links: wrapped ? result.links : null,
          error: null,
        };
      }),
    );
  }
}
