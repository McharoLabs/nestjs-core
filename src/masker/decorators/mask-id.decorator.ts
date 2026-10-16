import { Transform } from 'class-transformer';
import { getMaskerService } from '../masker.registry';

export function MaskId(): PropertyDecorator {
  return Transform(
    ({ value }: { value: unknown }): string | null | undefined => {
      if (value === null) {
        return null;
      }

      if (value === undefined) {
        return undefined;
      }

      if (typeof value !== 'number') {
        throw new TypeError('Invalid ID provided');
      }

      return getMaskerService().mask(value);
    },
    {
      toPlainOnly: true,
    },
  );
}
