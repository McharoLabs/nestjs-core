import type { SelectQueryBuilder } from 'typeorm';

import type { PaginationDirectionEnum } from '../../../response/enums/pagination-direction.enum';
import type { SortOrderEnum } from '../../../response/enums/sort-order.enum';
import type { BaseProjection } from '../../projection/base.projection';

export interface CursorPaginationOptions<
  TEntity extends BaseProjection,
  TResult extends BaseProjection = TEntity,
> {
  queryBuilder: SelectQueryBuilder<TEntity>;
  alias: string;
  cursor?: number | null;
  limit: number;
  direction: PaginationDirectionEnum;
  sortOrder: SortOrderEnum;
  map?: (entity: TEntity) => TResult;
}
