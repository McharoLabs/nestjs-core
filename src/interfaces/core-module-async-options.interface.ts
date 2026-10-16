import type { FactoryProvider, ModuleMetadata } from '@nestjs/common';
import type { ICore } from './core.interface';

export interface ICoreModuleAsyncOptions<
  TArgs extends unknown[] = unknown[],
> extends Pick<ModuleMetadata, 'imports'> {
  inject?: FactoryProvider<ICore>['inject'];
  useFactory: (...args: TArgs) => ICore | Promise<ICore>;
}
