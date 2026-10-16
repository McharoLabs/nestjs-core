import { BadRequestException, createParamDecorator } from '@nestjs/common';

import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { getMaskerService } from '../masker.registry';

export const UnmaskIdParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { params: { id?: string | string[] } }>();

    const maskedId = request.params.id;

    if (typeof maskedId !== 'string' || !maskedId) {
      throw new BadRequestException('Invalid ID provided');
    }

    try {
      const id = getMaskerService().unmask(maskedId);

      request.params.id = String(id);

      return id;
    } catch {
      throw new BadRequestException('Invalid ID provided');
    }
  },
);
