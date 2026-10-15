import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

import type { AuditContextStore } from './audit.types';

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditContextStore>();

  public run<T>(userId: string | null, callback: () => T): T {
    return this.storage.run({ userId }, callback);
  }

  public setUserId(userId: string | null): void {
    const store = this.storage.getStore();

    if (store === undefined) {
      return;
    }

    store.userId = userId;
  }

  public getUserId(): string | null {
    return this.storage.getStore()?.userId ?? null;
  }
}