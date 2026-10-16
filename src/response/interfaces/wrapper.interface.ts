import type { BaseResponseDto } from '../dto/base-response.dto';
import type { ApiLinks, ApiMeta } from './api-response.interface';

export interface WrappedResponse<
  T extends BaseResponseDto | BaseResponseDto[] = BaseResponseDto,
> {
  data: T | null;
  message: string;
  meta: ApiMeta | null;
  links: ApiLinks | null;
}
