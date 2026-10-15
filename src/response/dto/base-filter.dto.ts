import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { PaginationDirectionEnum } from '../enums/pagination-direction.enum';
import { SortOrderEnum } from '../enums/sort-order.enum';

export class BaseFilterDto {
  @ApiPropertyOptional({
    example: 123,
    description:
      'Decoded numeric cursor ID. Omit it when fetching the first page.',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number | null;

  @ApiPropertyOptional({
    enum: PaginationDirectionEnum,
    default: PaginationDirectionEnum.NEXT,
    example: PaginationDirectionEnum.NEXT,
    description:
      'NEXT retrieves records after the cursor; PREVIOUS retrieves records before the cursor.',
  })
  @IsOptional()
  @IsEnum(PaginationDirectionEnum)
  direction?: PaginationDirectionEnum;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    description: 'Number of records to return.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: SortOrderEnum,
    default: SortOrderEnum.DESC,
    description: 'Sort direction.',
  })
  @IsOptional()
  @IsEnum(SortOrderEnum)
  sortOrder?: SortOrderEnum;

  @ApiPropertyOptional({
    example: '2026-03-01T00:00:00.000Z',
    description: 'Created after this date.',
  })
  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @ApiPropertyOptional({
    example: '2026-03-20T23:59:59.000Z',
    description: 'Created before this date.',
  })
  @IsOptional()
  @IsDateString()
  createdAtTo?: string;
}
