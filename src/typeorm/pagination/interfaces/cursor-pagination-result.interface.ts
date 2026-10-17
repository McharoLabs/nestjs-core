import type { BaseProjection } from '../../projection/base.projection';
import type { PaginationMetadata } from './pagination-metadata.interface';

export interface CursorPaginationResult<
  T extends BaseProjection,
> extends PaginationMetadata {
  data: T[];
}
