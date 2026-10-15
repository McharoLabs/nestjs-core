export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: number | null;
  previousCursor: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
}
