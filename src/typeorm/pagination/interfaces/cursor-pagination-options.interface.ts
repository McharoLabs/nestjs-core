import type { SelectQueryBuilder } from 'typeorm';
import type { PaginationDirectionEnum, SortOrderEnum } from '../../../response';
import type { BaseProjection } from '../../projection/base.projection';

export interface CursorPaginationOptions<T extends BaseProjection> {
  queryBuilder: SelectQueryBuilder<T>;
  alias: string;
  cursor?: number | null;
  limit: number;
  direction: PaginationDirectionEnum;
  sortOrder: SortOrderEnum;
}
