import type { BaseProjection } from '../../projection/base.projection';

export interface CursorPaginationResult<T extends BaseProjection> {
  data: T[];
  nextCursor: number | null;
  previousCursor: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
}
