import { applyDecorators } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import type { BaseResponseDto } from '../dto/base-response.dto';
import { ApiResponseDto, ApiMeta, ApiLinks } from '../dto/api-response.dto';

interface ApiResponseWrapperOptions {
  isArray?: boolean;
  hasPagination?: boolean;
}

export function ApiResponseWrapper<T extends BaseResponseDto>(
  model: Type<T>,
  options: ApiResponseWrapperOptions = {},
): MethodDecorator {
  const { isArray = false, hasPagination = false } = options;

  const dataIsArray = isArray || hasPagination;

  const dataSchema = dataIsArray
    ? {
        type: 'array',
        items: {
          $ref: getSchemaPath(model),
        },
      }
    : {
        $ref: getSchemaPath(model),
      };

  const properties: Record<string, object> = {
    data: dataSchema,
  };

  const extraModels: Type<unknown>[] = [ApiResponseDto, model];

  if (hasPagination) {
    properties.meta = {
      $ref: getSchemaPath(ApiMeta),
    };

    properties.links = {
      $ref: getSchemaPath(ApiLinks),
    };

    extraModels.push(ApiMeta, ApiLinks);
  }

  return applyDecorators(
    ApiExtraModels(...extraModels),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(ApiResponseDto),
          },
          {
            type: 'object',
            properties,
          },
        ],
      },
    }),
  );
}
