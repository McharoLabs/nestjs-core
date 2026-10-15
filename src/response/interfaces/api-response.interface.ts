import { ApiProperty } from '@nestjs/swagger';

export class ApiError {
  @ApiProperty({ example: 'BadRequestException' })
  code: string;

  @ApiProperty({
    example: {
      email: ['email must be an email'],
    },
    required: false,
  })
  details?: Record<string, string[]> | string;
}

export class ApiMeta {
  @ApiProperty({
    example: 10,
    description: 'Number of records returned in the current response.',
  })
  itemsPerPage: number;

  @ApiProperty({
    example: true,
    description: 'Whether another page exists after the current page.',
  })
  hasNext: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether another page exists before the current page.',
  })
  hasPrevious: boolean;

  @ApiProperty({
    type: String,
    example: 'a8K2mP9x',
    nullable: true,
    description: 'Masked cursor used to retrieve the next page.',
  })
  nextCursor: string | null;

  @ApiProperty({
    type: String,
    example: 'kP9xA8m2',
    nullable: true,
    description: 'Masked cursor used to retrieve the previous page.',
  })
  previousCursor: string | null;
}

export class ApiLinks {
  @ApiProperty({ type: String, required: false, nullable: true })
  previous?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  current?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  next?: string | null;
}

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Request successful' })
  message: string;

  @ApiProperty({ example: '/users' })
  path: string;

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ required: false, nullable: true })
  data: T | null;

  @ApiProperty({
    required: false,
    type: ApiMeta,
    nullable: true,
  })
  meta?: ApiMeta | null;

  @ApiProperty({
    required: false,
    type: ApiLinks,
    nullable: true,
  })
  links?: ApiLinks | null;

  @ApiProperty({
    required: false,
    type: ApiError,
    nullable: true,
  })
  error: ApiError | null;
}
