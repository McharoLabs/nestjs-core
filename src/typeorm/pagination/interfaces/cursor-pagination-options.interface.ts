import type { SelectQueryBuilder } from 'typeorm';

import type { AppBaseEntity } from '../../entities/base.entity';
import type { BaseProjection } from '../../projection/base.projection';
import type { Projection } from '../../types/projection.type';

import type { PaginationDirectionEnum } from '../../../response/enums/pagination-direction.enum';
import type { SortOrderEnum } from '../../../response/enums/sort-order.enum';

export interface CursorPaginationOptions<
  TEntity extends AppBaseEntity,
  TResult extends BaseProjection = TEntity,
> {
  queryBuilder: SelectQueryBuilder<TEntity>;
  alias: string;
  projection: Projection<TEntity>;
  cursor?: number | null;
  limit: number;
  direction: PaginationDirectionEnum;
  sortOrder: SortOrderEnum;
  map?: (entity: TEntity) => TResult;
}
