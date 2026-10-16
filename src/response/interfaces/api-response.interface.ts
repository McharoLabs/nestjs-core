export interface ApiMeta {
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextCursor: string | null;
  previousCursor: string | null;
}

export interface ApiLinks {
  previous?: string | null;
  current?: string | null;
  next?: string | null;
}
