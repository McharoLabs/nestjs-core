type PlainObject = Record<string, unknown>;

const SKIPPED_KEYS = new Set([
  // Wrapper/system fields
  'success',
  'statusCode',
  'message',
  'path',
  'timestamp',
  'error',

  // Pagination/navigation fields
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

  // File/download values
  'url',
]);

function nativeHtmlEncode(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function encodeHtmlOutput<T>(value: T): T {
  return encodeValue(value) as T;
}

function encodeValue(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (key !== undefined && SKIPPED_KEYS.has(key)) {
      return value;
    }

    return nativeHtmlEncode(value);
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) => encodeValue(item));
  }

  if (typeof value === 'object') {
    const objectValue = value as PlainObject;
    const encodedObject: PlainObject = {};

    for (const [objectKey, objectFieldValue] of Object.entries(objectValue)) {
      encodedObject[objectKey] = SKIPPED_KEYS.has(objectKey)
        ? objectFieldValue
        : encodeValue(objectFieldValue, objectKey);
    }

    return encodedObject;
  }

  return value;
}
