import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class NotAcceptableException extends AppException {
  constructor(message: string, errors: Record<string, unknown> = {}) {
    super(message, HttpStatus.NOT_ACCEPTABLE, errors);
  }
}
