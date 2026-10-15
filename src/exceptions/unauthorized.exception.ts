import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class UnauthorizedException extends AppException {
  constructor(message: string, errors: Record<string, unknown> = {}) {
    super(message, HttpStatus.UNAUTHORIZED, errors);
  }
}
