import type { ApiLinks, ApiMeta } from './api-response.interface';

export interface BuiltResponse<T> {
  message: string;
  data: T | null;
  meta: ApiMeta | null;
  links: ApiLinks | null;
}

export interface CursorMasker {
  maskNullable(value: number | null): string | null;
}
