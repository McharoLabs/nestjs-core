import type { SelectQueryBuilder } from 'typeorm';

import type { AppBaseEntity } from '../entities/base.entity';
import type { BaseProjection } from '../projection/base.projection';
import type { Projection } from '../types/projection.type';

import { selectProjection } from './select-projection.util';

// --- getOneProjection Overloads ---
export function getOneProjection<TEntity extends AppBaseEntity>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  alias: string,
  projection: Projection<TEntity>,
): Promise<TEntity | null>;

export function getOneProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  alias: string,
  projection: Projection<TEntity>,
  map: (entity: TEntity) => TResult,
): Promise<TResult | null>;

// --- getOneProjection Implementation ---
export async function getOneProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  alias: string,
  projection: Projection<TEntity>,
  map?: (entity: TEntity) => TResult,
): Promise<TEntity | TResult | null> {
  selectProjection(queryBuilder, alias, projection);

  const result = await queryBuilder.getOne();

  if (result === null) {
    return null;
  }

  if (map) {
    return map(result);
  }

  return result;
}

// --- getManyProjection Overloads ---
export function getManyProjection<TEntity extends AppBaseEntity>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  alias: string,
  projection: Projection<TEntity>,
): Promise<TEntity[]>;

export function getManyProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  alias: string,
  projection: Projection<TEntity>,
  map: (entity: TEntity) => TResult,
): Promise<TResult[]>;

// --- getManyProjection Implementation ---
export async function getManyProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  alias: string,
  projection: Projection<TEntity>,
  map?: (entity: TEntity) => TResult,
): Promise<TEntity[] | TResult[]> {
  selectProjection(queryBuilder, alias, projection);

  const results = await queryBuilder.getMany();

  if (map) {
    return results.map(map);
  }

  return results;
}
