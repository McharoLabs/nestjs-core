import { applyDecorators } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import {
  ApiLinks,
  ApiMeta,
  ApiResponseDto,
} from '../interfaces/api-response.interface';

interface ApiResponseWrapperOptions {
  isArray?: boolean;
  hasPagination?: boolean;
}

export function ApiResponseWrapper(
  model: Type<unknown>,
  options: ApiResponseWrapperOptions = {},
): MethodDecorator {
  const { isArray = false, hasPagination = false } = options;

  const dataIsArray = hasPagination || isArray;

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

  if (hasPagination) {
    properties.meta = {
      $ref: getSchemaPath(ApiMeta),
    };

    properties.links = {
      $ref: getSchemaPath(ApiLinks),
    };
  }

  const extraModels: Type<unknown>[] = [ApiResponseDto, model];

  if (hasPagination) {
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
            properties,
          },
        ],
      },
    }),
  );
}
