import type { ApiLinks, ApiMeta } from '../interfaces/api-response.interface';
import type {
  BuiltResponse,
  CursorMasker,
} from '../interfaces/built-response.interface';
import type { CursorPaginationResult } from '../../pagination/interfaces/cursor-pagination-result.interface';

export class ApiResponseBuilder<T> {
  private readonly data: T | null;
  private messageValue = 'Request successful';
  private meta: ApiMeta | null = null;
  private links: ApiLinks | null = null;

  public constructor(data: T | null) {
    this.data = data;
  }

  public message(message: string): this {
    this.messageValue = message;
    return this;
  }

  public withMessage(message: string): this {
    return this.message(message);
  }

  public withMeta(meta: ApiMeta): this {
    this.meta = meta;
    return this;
  }

  public withLinks(links: ApiLinks): this {
    this.links = links;
    return this;
  }

  public build(): BuiltResponse<T> {
    return {
      message: this.messageValue,
      data: this.data,
      meta: this.meta,
      links: this.links,
    };
  }
}

export class AppApiResponse {
  public static ok<T>(data: T): ApiResponseBuilder<T> {
    return new ApiResponseBuilder<T>(data);
  }

  public static paginated<T>(
    result: CursorPaginationResult<T>,
    masker: CursorMasker,
  ): ApiResponseBuilder<T[]> {
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