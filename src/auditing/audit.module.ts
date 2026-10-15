import {
  Global,
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AuditContextInterceptor } from './audit-context.interceptor';
import { AuditContextMiddleware } from './audit-context.middleware';
import { AuditContextService } from './audit-context.service';
import { AuditSubscriber } from './audit.subscriber';

@Global()
@Module({
  providers: [
    AuditContextService,
    AuditSubscriber,
    AuditContextMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
  ],
  exports: [AuditContextService],
})
export class AuditModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuditContextMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}