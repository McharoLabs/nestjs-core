import type { AppBaseEntity } from '../entities/base.entity';
import type { BaseProjection } from '../projection/base.projection';

import { selectProjection } from './select-projection.util';
import type { ProjectionQueryOptions } from './get-one-projection.util';

// No mapper: the caller specifies the result projection type.
export function getManyProjection<
  TResult extends BaseProjection,
  TEntity extends AppBaseEntity = AppBaseEntity,
>(
  options: ProjectionQueryOptions<TEntity, TResult> & {
    map?: undefined;
  },
): Promise<TResult[]>;

// With mapper: the caller specifies both entity and result types.
export function getManyProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  options: ProjectionQueryOptions<TEntity, TResult> & {
    map: (entity: TEntity) => TResult;
  },
): Promise<TResult[]>;

// Implementation
export async function getManyProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection = TEntity,
>(
  options: ProjectionQueryOptions<TEntity, TResult>,
): Promise<TEntity[] | TResult[]> {
  const { queryBuilder, alias, projection, map } = options;

  selectProjection(queryBuilder, alias, projection);

  const entities = await queryBuilder.getMany();

  if (map) {
    return entities.map(map);
  }

  return entities;
}
