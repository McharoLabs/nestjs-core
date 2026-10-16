import type { BaseResponseDto } from '../../../response';

export interface CursorPaginationResult<T extends BaseResponseDto> {
  data: T[];
  nextCursor: number | null;
  previousCursor: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
}
