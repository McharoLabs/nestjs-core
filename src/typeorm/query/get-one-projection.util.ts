import type { SelectQueryBuilder } from 'typeorm';

import type { AppBaseEntity } from '../entities/base.entity';
import type { BaseProjection } from '../projection/base.projection';
import type { Projection } from '../types/projection.type';

import { selectProjection } from './select-projection.util';

export interface ProjectionQueryOptions<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection = TEntity,
> {
  queryBuilder: SelectQueryBuilder<TEntity>;
  alias: string;
  projection: Projection<TEntity>;
  map?: (entity: TEntity) => TResult;
}

// No mapper: the caller specifies the result projection type.
export function getOneProjection<
  TResult extends BaseProjection,
  TEntity extends AppBaseEntity = AppBaseEntity,
>(
  options: ProjectionQueryOptions<TEntity, TResult> & {
    map?: undefined;
  },
): Promise<TResult | null>;

// With mapper: the caller specifies both entity and result types.
export function getOneProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  options: ProjectionQueryOptions<TEntity, TResult> & {
    map: (entity: TEntity) => TResult;
  },
): Promise<TResult | null>;

// Implementation
export async function getOneProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection = TEntity,
>(
  options: ProjectionQueryOptions<TEntity, TResult>,
): Promise<TEntity | TResult | null> {
  const { queryBuilder, alias, projection, map } = options;

  selectProjection(queryBuilder, alias, projection);

  const entity = await queryBuilder.getOne();

  if (!entity) {
    return null;
  }

  if (map) {
    return map(entity);
  }

  return entity;
}
