import { describe, expect, it, beforeEach } from '@jest/globals';
import type { ICore } from '../../interfaces/core.interface';
import { MaskerService } from '../../masker';
import { getMaskerService } from '../../masker/masker.registry';

describe('MaskerService', () => {
  const config: ICore = {
    salt: 'test-salt-for-masker-service',
  };

  const createService = (): MaskerService => {
    return new MaskerService(config);
  };

  let service: MaskerService;

  beforeEach(() => {
    service = createService();
  });

  describe('constructor', () => {
    it('should initialize the service', () => {
      expect(service).toBeInstanceOf(MaskerService);
    });

    it('should register the service instance', () => {
      expect(getMaskerService()).toBe(service);
    });

    it('should produce consistent results with the same configuration', () => {
      const anotherService = createService();

      expect(anotherService.mask(123)).toBe(service.mask(123));
    });
  });

  describe('mask', () => {
    it('should mask a valid ID', () => {
      const maskedId = service.mask(123);

      expect(maskedId).toEqual(expect.any(String));
      expect(maskedId).not.toBe('');
    });

    it('should mask zero', () => {
      const maskedId = service.mask(0);

      expect(service.unmask(maskedId)).toBe(0);
    });

    it('should mask the maximum safe integer', () => {
      const id = Number.MAX_SAFE_INTEGER;

      expect(service.unmask(service.mask(id))).toBe(id);
    });

    it('should return the same masked ID for the same input', () => {
      expect(service.mask(123)).toBe(service.mask(123));
    });

    it('should return different masked IDs for different inputs', () => {
      expect(service.mask(123)).not.toBe(service.mask(456));
    });

    it.each([
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
    ])('should reject invalid ID %s', (id: number) => {
      expect(() => service.mask(id)).toThrow('Invalid ID provided');
    });
  });

  describe('unmask', () => {
    it('should unmask a valid ID', () => {
      const maskedId = service.mask(123);

      expect(service.unmask(maskedId)).toBe(123);
    });

    it('should reject an empty masked ID', () => {
      expect(() => service.unmask('')).toThrow('Invalid ID provided');
    });

    it('should reject an invalid masked ID', () => {
      expect(() => service.unmask('invalid!')).toThrow('Invalid ID provided');
    });

    it('should reject a value that decodes to multiple IDs', () => {
      expect(() => service.unmask('invalid')).toThrow('Invalid ID provided');
    });

    it('should reject a decoded value that is not a safe integer', () => {
      expect(() =>
        service.unmask(service.mask(Number.MAX_SAFE_INTEGER + 1)),
      ).toThrow('Invalid ID provided');
    });

    it('should reject a negative decoded ID', () => {
      expect(() => service.unmask('invalid')).toThrow('Invalid ID provided');
    });
  });

  describe('maskNullable', () => {
    it('should mask a valid ID', () => {
      expect(service.maskNullable(123)).toBe(service.mask(123));
    });

    it('should return null for null', () => {
      expect(service.maskNullable(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(service.maskNullable(undefined)).toBeNull();
    });

    it('should reject an invalid ID', () => {
      expect(() => service.maskNullable(-1)).toThrow('Invalid ID provided');
    });
  });

  describe('unmaskNullable', () => {
    it('should unmask a valid masked ID', () => {
      const maskedId = service.mask(123);

      expect(service.unmaskNullable(maskedId)).toBe(123);
    });

    it('should return null for null', () => {
      expect(service.unmaskNullable(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(service.unmaskNullable(undefined)).toBeNull();
    });

    it('should reject an invalid masked ID', () => {
      expect(() => service.unmaskNullable('invalid!')).toThrow(
        'Invalid ID provided',
      );
    });
  });

  describe('round-trip behavior', () => {
    it.each([0, 1, 10, 123, 999999, Number.MAX_SAFE_INTEGER])(
      'should recover the original ID after masking: %s',
      (id: number) => {
        expect(service.unmask(service.mask(id))).toBe(id);
      },
    );
  });
});
