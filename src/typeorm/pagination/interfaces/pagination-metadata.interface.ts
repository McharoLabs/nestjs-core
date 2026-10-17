export interface PaginationMetadata {
  nextCursor: number | null;
  previousCursor: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
}
