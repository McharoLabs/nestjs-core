import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { AuditContextService } from './audit-context.service';

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  public constructor(
    private readonly auditContextService: AuditContextService,
  ) {}

  public use(
    _request: Request,
    _response: Response,
    next: NextFunction,
  ): void {
    this.auditContextService.run(null, next);
  }
}