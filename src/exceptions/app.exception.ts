import type { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    errors: Record<string, unknown> = {},
  ) {
    super(
      {
        message,
        errors,
      },
      status,
    );
  }

  getErrors(): Record<string, unknown> {
    const response = this.getResponse();

    if (typeof response === 'object' && 'errors' in response) {
      const errorBody = response as Record<string, unknown>;

      if (errorBody.errors !== null && typeof errorBody.errors === 'object') {
        return errorBody.errors as Record<string, unknown>;
      }
    }

    return {};
  }
}
