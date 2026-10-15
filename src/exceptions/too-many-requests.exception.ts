import { HttpStatus } from '@nestjs/common';

import { AppException } from './app.exception';

export class TooManyRequestsException extends AppException {
  constructor(message: string, errors: Record<string, unknown> = {}) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, errors);
  }
}
