import { HttpStatus } from '@nestjs/common';

import { AppException } from './app.exception';

export class ServiceUnavailableException extends AppException {
  constructor(message: string, errors: Record<string, unknown> = {}) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, errors);
  }
}
