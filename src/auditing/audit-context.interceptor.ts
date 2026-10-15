import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';

import { AuditContextService } from './audit-context.service';
import type { AuthenticatedRequest } from './audit.types';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  public constructor(
    private readonly auditContextService: AuditContextService,
  ) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = request.user?.id;

    this.auditContextService.setUserId(
      userId === undefined ? null : String(userId),
    );

    return next.handle();
  }
}