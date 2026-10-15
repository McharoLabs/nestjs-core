import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class ResourceNotFoundException extends AppException {
  constructor(message: string, errors: Record<string, unknown> = {}) {
    super(message, HttpStatus.NOT_FOUND, errors);
  }
}
