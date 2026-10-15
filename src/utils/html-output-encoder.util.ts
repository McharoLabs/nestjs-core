import * as he from 'he';

type PlainObject = Record<string, unknown>;

const SKIPPED_KEYS = new Set([
  // wrapper/system fields
  'success',
  'statusCode',
  'message',
  'path',
  'timestamp',
  'error',

  // pagination/navigation links & metadata
  'links',
  'first',
  'previous',
  'current',
  'next',
  'last',
  'itemsPerPage',
  'hasNext',
  'hasPrevious',
  'nextCursor',
  'previousCursor',

  // file/download values
  'url',
]);

// Explicitly provide a return type on the fallback function to satisfy explicit-function-return-type
const safeEncode =
  (
    he as unknown as {
      encode?: (
        text: string,
        options?: { useNamedReferences?: boolean },
      ) => string;
    }
  ).encode ?? ((text: string): string => text);

export function encodeHtmlOutput<T>(value: T): T {
  return encodeValue(value) as T;
}

function encodeValue(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (key && SKIPPED_KEYS.has(key)) {
      return value;
    }

    return safeEncode(value, {
      useNamedReferences: true,
    });
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => encodeValue(item));
  }

  if (typeof value === 'object') {
    const objectValue = value as PlainObject;
    const encodedObject: PlainObject = {};

    for (const [objectKey, objectFieldValue] of Object.entries(objectValue)) {
      if (SKIPPED_KEYS.has(objectKey)) {
        encodedObject[objectKey] = objectFieldValue;
        continue;
      }

      encodedObject[objectKey] = encodeValue(objectFieldValue, objectKey);
    }

    return encodedObject;
  }

  return value;
}
