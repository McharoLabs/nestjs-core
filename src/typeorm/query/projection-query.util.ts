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

// --- getOneProjection Overloads ---
export function getOneProjection<TEntity extends AppBaseEntity>(
  options: ProjectionQueryOptions<TEntity, TEntity> & {
    map?: undefined;
  },
): Promise<TEntity | null>;

export function getOneProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  options: ProjectionQueryOptions<TEntity, TResult> & {
    map: (entity: TEntity) => TResult;
  },
): Promise<TResult | null>;

// --- getOneProjection Implementation ---
export async function getOneProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection = TEntity,
>(
  options: ProjectionQueryOptions<TEntity, TResult>,
): Promise<TEntity | TResult | null> {
  const { queryBuilder, alias, projection, map } = options;

  selectProjection(queryBuilder, alias, projection);

  const entity = await queryBuilder.getOne();

  if (entity === null) {
    return null;
  }

  if (map) {
    return map(entity);
  }

  return entity;
}

// --- getManyProjection Overloads ---
export function getManyProjection<TEntity extends AppBaseEntity>(
  options: ProjectionQueryOptions<TEntity, TEntity> & {
    map?: undefined;
  },
): Promise<TEntity[]>;

export function getManyProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  options: ProjectionQueryOptions<TEntity, TResult> & {
    map: (entity: TEntity) => TResult;
  },
): Promise<TResult[]>;

// --- getManyProjection Implementation ---
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
