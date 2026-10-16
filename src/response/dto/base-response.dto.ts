import { ApiProperty } from '@nestjs/swagger';
import { MaskId } from '../../masker';

export abstract class BaseResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the resource.',
  })
  @MaskId()
  id: number;

  @ApiProperty({
    example: '2026-10-15T10:00:00.000Z',
    type: String,
    format: 'date-time',
    description: 'Date when the resource was created.',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-10-16T10:00:00.000Z',
    type: String,
    format: 'date-time',
    description: 'Date when the resource was last updated.',
  })
  updatedAt: Date;
}
