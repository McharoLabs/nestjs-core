import { DynamicModule, Module } from '@nestjs/common';

import type { ICoreModuleAsyncOptions } from './interfaces/core-module-async-options.interface';
import { CORE_CONFIG } from './constants/core.constants';
import { MaskerService } from './masker';

@Module({})
export class CoreModule {
  public static forRootAsync<TArgs extends unknown[] = unknown[]>(
    options: ICoreModuleAsyncOptions<TArgs>,
  ): DynamicModule {
    return {
      module: CoreModule,
      imports: [...(options.imports ?? [])],
      providers: [
        {
          provide: CORE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        MaskerService,
      ],
      exports: [MaskerService],
    };
  }
}
