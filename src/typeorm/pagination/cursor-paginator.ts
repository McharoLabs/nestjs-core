import { PaginationDirectionEnum } from '../../response/enums/pagination-direction.enum';
import { SortOrderEnum } from '../../response/enums/sort-order.enum';

import type { CursorPaginationResult } from './interfaces/cursor-pagination-result.interface';
import type { CursorPaginationOptions } from './interfaces/cursor-pagination-options.interface';
import type { BaseProjection } from '../projection/base.projection';

export function paginateCursor<TEntity extends BaseProjection>(
  options: CursorPaginationOptions<TEntity, TEntity> & {
    map?: undefined;
  },
): Promise<CursorPaginationResult<TEntity>>;

export function paginateCursor<
  TEntity extends BaseProjection,
  TResult extends BaseProjection,
>(
  options: CursorPaginationOptions<TEntity, TResult> & {
    map: (entity: TEntity) => TResult;
  },
): Promise<CursorPaginationResult<TResult>>;

export async function paginateCursor<
  TEntity extends BaseProjection,
  TResult extends BaseProjection = TEntity,
>(
  options: CursorPaginationOptions<TEntity, TResult>,
): Promise<CursorPaginationResult<TEntity | TResult>> {
  const { queryBuilder, alias, cursor, limit, direction, sortOrder, map } =
    options;

  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('Pagination limit must be a positive integer.');
  }

  const isPrevious = direction === PaginationDirectionEnum.PREVIOUS;
  const isAscending = sortOrder === SortOrderEnum.ASC;
  const hasCursor = cursor !== null && cursor !== undefined;

  const useGreaterThan =
    (isAscending && !isPrevious) || (!isAscending && isPrevious);

  if (hasCursor) {
    queryBuilder.andWhere(`${alias}.id ${useGreaterThan ? '>' : '<'} :cursor`, {
      cursor,
    });
  }

  const queryOrder = isPrevious
    ? isAscending
      ? SortOrderEnum.DESC
      : SortOrderEnum.ASC
    : sortOrder;

  queryBuilder.orderBy(`${alias}.id`, queryOrder).take(limit + 1);

  let entities = await queryBuilder.getMany();

  const hasMore = entities.length > limit;

  if (hasMore) {
    entities = entities.slice(0, limit);
  }

  if (isPrevious) {
    entities.reverse();
  }

  const first = entities[0];
  const last = entities[entities.length - 1];

  if (first === undefined || last === undefined) {
    return {
      data: [],
      nextCursor: null,
      previousCursor: null,
      hasNext: false,
      hasPrevious: hasCursor,
    };
  }

  const hasNext = isPrevious ? hasCursor : hasMore;
  const hasPrevious = isPrevious ? hasMore : hasCursor;

  const data = map ? entities.map(map) : entities;

  return {
    data,
    nextCursor: hasNext ? last.id : null,
    previousCursor: hasPrevious ? first.id : null,
    hasNext,
    hasPrevious,
  };
}
