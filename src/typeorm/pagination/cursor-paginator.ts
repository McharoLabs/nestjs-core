import { PaginationDirectionEnum } from '../../response/enums/pagination-direction.enum';
import { SortOrderEnum } from '../../response/enums/sort-order.enum';

import type { CursorPaginationResult } from './interfaces/cursor-pagination-result.interface';
import type { CursorPaginationOptions } from './interfaces/cursor-pagination-options.interface';
import type { BaseResponseDto } from '../../response';

export async function paginateCursor<T extends BaseResponseDto>({
  queryBuilder,
  alias,
  cursor,
  limit,
  direction,
  sortOrder,
}: CursorPaginationOptions<T>): Promise<CursorPaginationResult<T>> {
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

  let data = await queryBuilder.getMany();

  const hasMore = data.length > limit;

  if (hasMore) {
    data = data.slice(0, limit);
  }

  if (isPrevious) {
    data.reverse();
  }

  const first = data[0];
  const last = data[data.length - 1];

  if (first === undefined || last === undefined) {
    return {
      data: [],
      nextCursor: null,
      previousCursor: null,
      hasNext: false,
      hasPrevious: hasCursor,
    };
  }

  const firstId = first.id;
  const lastId = last.id;

  const hasNext = isPrevious ? hasCursor : hasMore;
  const hasPrevious = isPrevious ? hasMore : hasCursor;

  return {
    data,
    nextCursor: hasNext ? lastId : null,
    previousCursor: hasPrevious ? firstId : null,
    hasNext,
    hasPrevious,
  };
}
