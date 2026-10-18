import type { AppBaseEntity } from '../entities/base.entity';
import type { BaseProjection } from '../projection/base.projection';

import { selectProjection } from '../query/select-projection.util';

import { PaginationDirectionEnum } from '../../response/enums/pagination-direction.enum';
import { SortOrderEnum } from '../../response/enums/sort-order.enum';
import type { CursorPaginationOptions } from '../pagination/interfaces/cursor-pagination-options.interface';
import type { CursorPaginationResult } from '../pagination/interfaces/cursor-pagination-result.interface';

// No mapper: return the requested projection type.
export function paginateCursor<
  TResult extends BaseProjection,
  TEntity extends AppBaseEntity = AppBaseEntity,
>(
  options: CursorPaginationOptions<TEntity, TResult> & {
    map?: undefined;
  },
): Promise<CursorPaginationResult<TResult>>;

// Mapper provided: return the mapped result type.
export function paginateCursor<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection,
>(
  options: CursorPaginationOptions<TEntity, TResult> & {
    map: (entity: TEntity) => TResult;
  },
): Promise<CursorPaginationResult<TResult>>;

// Implementation
export async function paginateCursor<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection = TEntity,
>(
  options: CursorPaginationOptions<TEntity, TResult>,
): Promise<CursorPaginationResult<TEntity | TResult>> {
  const {
    queryBuilder,
    alias,
    projection,
    cursor,
    limit,
    direction,
    sortOrder,
    map,
  } = options;

  validateLimit(limit);

  selectProjection(queryBuilder, alias, projection);

  const isPrevious = direction === PaginationDirectionEnum.PREVIOUS;
  const hasCursor = cursor !== null && cursor !== undefined;

  applyCursorFilter(
    queryBuilder,
    alias,
    cursor,
    hasCursor,
    direction,
    sortOrder,
  );

  queryBuilder
    .orderBy(`${alias}.id`, getQueryOrder(direction, sortOrder))
    .take(limit + 1);

  let entities = await queryBuilder.getMany();

  const hasMore = entities.length > limit;

  if (hasMore) {
    entities = entities.slice(0, limit);
  }

  if (isPrevious) {
    entities.reverse();
  }

  const first = entities.at(0);
  const last = entities.at(-1);

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

  const data = map ? entities.map(map) : projectEntities<TResult>(entities);

  return {
    data,
    nextCursor: hasNext ? last.id : null,
    previousCursor: hasPrevious ? first.id : null,
    hasNext,
    hasPrevious,
  };
}

function projectEntities<TResult extends BaseProjection>(
  entities: AppBaseEntity[],
): TResult[] {
  // Relies on selectProjection() selecting the requested shape.
  return entities as unknown as TResult[];
}

function validateLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('Pagination limit must be a positive integer.');
  }
}

function getQueryOrder(
  direction: PaginationDirectionEnum,
  sortOrder: SortOrderEnum,
): SortOrderEnum {
  if (direction !== PaginationDirectionEnum.PREVIOUS) {
    return sortOrder;
  }

  return sortOrder === SortOrderEnum.ASC
    ? SortOrderEnum.DESC
    : SortOrderEnum.ASC;
}

function applyCursorFilter<TEntity extends AppBaseEntity>(
  queryBuilder: CursorPaginationOptions<TEntity>['queryBuilder'],
  alias: string,
  cursor: number | null | undefined,
  hasCursor: boolean,
  direction: PaginationDirectionEnum,
  sortOrder: SortOrderEnum,
): void {
  if (!hasCursor || cursor === null || cursor === undefined) {
    return;
  }

  const isAscending = sortOrder === SortOrderEnum.ASC;
  const isPrevious = direction === PaginationDirectionEnum.PREVIOUS;

  const useGreaterThan = isAscending !== isPrevious;
  const operator = useGreaterThan ? '>' : '<';

  queryBuilder.andWhere(`${alias}.id ${operator} :cursor`, { cursor });
}
