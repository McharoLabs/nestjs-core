import type { BaseResponseDto } from '../../../response';

export interface PaginatedResponseResult<T extends BaseResponseDto> {
  data: T[];
  nextCursor: number | null;
  previousCursor: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
}
