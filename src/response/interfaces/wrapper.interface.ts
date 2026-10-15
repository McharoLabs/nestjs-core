import type { ApiLinks, ApiMeta } from './api-response.interface';

export interface WrappedResponse<T> {
  data?: T | null;
  message?: string;
  meta?: ApiMeta | null;
  links?: ApiLinks | null;
}
