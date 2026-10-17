import type { AppBaseEntity } from '../entities/base.entity';
import type { BaseProjection } from '../projection/base.projection';

type ProjectionValue<T> = T extends readonly (infer U)[]
  ? U extends BaseProjection
    ? Projection<U & AppBaseEntity>
    : boolean
  : T extends BaseProjection
    ? Projection<T & AppBaseEntity>
    : boolean;

export type Projection<T extends AppBaseEntity> = {
  [K in keyof T]?: ProjectionValue<T[K]>;
};
