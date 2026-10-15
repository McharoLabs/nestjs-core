import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class BadRequestException extends AppException {
  constructor(message: string, errors: Record<string, unknown> = {}) {
    super(message, HttpStatus.BAD_REQUEST, errors);
  }
}
