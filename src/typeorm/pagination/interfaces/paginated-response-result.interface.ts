import type { BaseResponseDto } from '../../../response';
import type { PaginationMetadata } from './pagination-metadata.interface';

export interface PaginatedResponseResult<
  T extends BaseResponseDto,
> extends PaginationMetadata {
  data: T[];
}
