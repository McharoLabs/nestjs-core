import { Injectable } from '@nestjs/common';
import {
  DataSource,
  type EntitySubscriberInterface,
  type InsertEvent,
  type ObjectLiteral,
  type SoftRemoveEvent,
  type UpdateEvent,
} from 'typeorm';

import { AuditContextService } from './audit-context.service';
import { isAuditableEntity } from './audit.types';

@Injectable()
export class AuditSubscriber
  implements EntitySubscriberInterface<ObjectLiteral>
{
  public constructor(
    dataSource: DataSource,
    private readonly auditContextService: AuditContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  public beforeInsert(event: InsertEvent<ObjectLiteral>): void {
    if (!isAuditableEntity(event.entity)) {
      return;
    }

    const userId = this.auditContextService.getUserId();

    if (userId === null) {
      return;
    }

    event.entity.createdBy ??= userId;
    event.entity.updatedBy ??= userId;
  }

  public beforeUpdate(event: UpdateEvent<ObjectLiteral>): void {
    if (!isAuditableEntity(event.entity)) {
      return;
    }

    const userId = this.auditContextService.getUserId();

    if (userId !== null) {
      event.entity.updatedBy = userId;
    }
  }

  public beforeSoftRemove(event: SoftRemoveEvent<ObjectLiteral>): void {
    if (!isAuditableEntity(event.entity)) {
      return;
    }

    const userId = this.auditContextService.getUserId();

    if (userId !== null) {
      event.entity.deletedBy = userId;
    }
  }
}