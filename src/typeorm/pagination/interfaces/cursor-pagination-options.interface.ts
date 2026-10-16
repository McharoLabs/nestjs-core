import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { PaginationDirectionEnum, SortOrderEnum } from '../../../response';

export interface CursorPaginationOptions<T extends ObjectLiteral> {
  queryBuilder: SelectQueryBuilder<T>;
  alias: string;
  cursor?: number | null;
  limit: number;
  direction: PaginationDirectionEnum;
  sortOrder: SortOrderEnum;
}
