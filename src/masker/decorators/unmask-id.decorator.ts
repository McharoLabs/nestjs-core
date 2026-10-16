import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { getMaskerService } from '../masker.registry';

export function UnmaskId(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }): unknown => {
    if (value === null || value === undefined || value === '') {
      return value;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Invalid ID provided');
    }

    try {
      return getMaskerService().unmask(value);
    } catch {
      throw new BadRequestException('Invalid ID provided');
    }
  });
}
