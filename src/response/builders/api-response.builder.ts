import type { ApiLinks, ApiMeta } from '../interfaces/api-response.interface';
import type { WrappedResponse } from '../interfaces/wrapper.interface';
import type { CursorPaginationResult } from '../../typeorm/pagination/interfaces/cursor-pagination-result.interface';
import { getMaskerService } from '../../masker/masker.registry';
import type { BaseResponseDto } from '../dto/base-response.dto';

export class ApiResponseBuilder<
  T extends BaseResponseDto | BaseResponseDto[] = BaseResponseDto,
> {
  private messageValue = 'Request successful';
  private metaValue: ApiMeta | null = null;
  private linksValue: ApiLinks | null = null;

  public constructor(private readonly data: T | null) {}

  public message(message: string): this {
    this.messageValue = message;
    return this;
  }

  public withMessage(message: string): this {
    return this.message(message);
  }

  public withMeta(meta: ApiMeta): this {
    this.metaValue = meta;
    return this;
  }

  public withLinks(links: ApiLinks): this {
    this.linksValue = links;
    return this;
  }

  public build(): WrappedResponse<T> {
    return {
      message: this.messageValue,
      data: this.data,
      meta: this.metaValue,
      links: this.linksValue,
    };
  }
}

export class AppApiResponse {
  public static ok<T extends BaseResponseDto>(data: T): ApiResponseBuilder<T> {
    return new ApiResponseBuilder<T>(data);
  }

  public static paginated<T extends BaseResponseDto>(
    result: CursorPaginationResult<T>,
  ): ApiResponseBuilder<T[]> {
    const masker = getMaskerService();

    const meta: ApiMeta = {
      itemsPerPage: result.data.length,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious,
      nextCursor: masker.maskNullable(result.nextCursor),
      previousCursor: masker.maskNullable(result.previousCursor),
    };

    return new ApiResponseBuilder<T[]>(result.data).withMeta(meta);
  }
}
