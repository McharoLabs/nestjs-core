import type { SelectQueryBuilder } from 'typeorm';

import type { AppBaseEntity } from '../entities/base.entity';
import type { BaseProjection } from '../projection/base.projection';
import type { Projection } from '../types/projection.type';

import { selectProjection } from './select-projection.util';

export async function getOneProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  alias: string,
  projection: Projection<TEntity>,
): Promise<TResult | null> {
  selectProjection(queryBuilder, alias, projection);

  const result = await queryBuilder.getOne();

  return result === null ? null : (result as unknown as TResult);
}

export async function getManyProjection<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  alias: string,
  projection: Projection<TEntity>,
): Promise<TResult[]> {
  selectProjection(queryBuilder, alias, projection);

  const results = await queryBuilder.getMany();

  return results as unknown as TResult[];
}
