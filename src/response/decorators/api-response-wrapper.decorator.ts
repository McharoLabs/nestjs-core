import { applyDecorators } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { ApiResponseDto, ApiMeta, ApiLinks } from '../dto/api-response.dto';

interface ApiResponseWrapperOptions {
  isArray?: boolean;
  hasPagination?: boolean;
}

type ResponseModel = Type<unknown>;

export function ApiResponseWrapper(
  model: ResponseModel,
  options: ApiResponseWrapperOptions = {},
): MethodDecorator {
  const { isArray = false, hasPagination = false } = options;

  const dataIsArray = isArray || hasPagination;

  const primitiveSchemas: Record<string, object> = {
    Boolean: { type: 'boolean' },
    String: { type: 'string' },
    Number: { type: 'number' },
  };

  const dataItemSchema = primitiveSchemas[model.name] ?? {
    $ref: getSchemaPath(model),
  };

  const dataSchema = dataIsArray
    ? {
        type: 'array',
        items: dataItemSchema,
      }
    : dataItemSchema;

  const properties: Record<string, object> = {
    data: dataSchema,
  };

  const extraModels: ResponseModel[] = [ApiResponseDto];

  if (!(model.name in primitiveSchemas)) {
    extraModels.push(model);
  }

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
