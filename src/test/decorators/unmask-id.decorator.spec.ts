import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, beforeEach } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { UnmaskId } from '../../masker/decorators/unmask-id.decorator';
import { ICore } from '../../interfaces/core.interface';
import { MaskerService } from '../../masker';

class TestRequest {
  @UnmaskId()
  public id!: number | string | null | undefined;
}

describe('UnmaskId', () => {
  const config: ICore = {
    salt: 'test-salt-for-unmask-id',
  };

  let service: MaskerService;

  beforeEach(() => {
    service = new MaskerService(config);
  });

  describe('DTO transformation', () => {
    it('should transform a valid masked ID into a number', () => {
      const maskedId = service.mask(123);

      const result = plainToInstance(TestRequest, {
        id: maskedId,
      });

      expect(result.id).toBe(123);
    });

    it('should preserve null values', () => {
      const result = plainToInstance(TestRequest, {
        id: null,
      });

      expect(result.id).toBeNull();
    });

    it('should preserve undefined values', () => {
      const result = plainToInstance(TestRequest, {
        id: undefined,
      });

      expect(result.id).toBeUndefined();
    });

    it('should preserve an empty string', () => {
      const result = plainToInstance(TestRequest, {
        id: '',
      });

      expect(result.id).toBe('');
    });
  });

  describe('invalid input', () => {
    it('should throw BadRequestException for an invalid masked ID', () => {
      expect(() =>
        plainToInstance(TestRequest, {
          id: 'invalid!',
        }),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for a numeric input', () => {
      expect(() =>
        plainToInstance(TestRequest, {
          id: 123,
        }),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for a boolean input', () => {
      expect(() =>
        plainToInstance(TestRequest, {
          id: true,
        }),
      ).toThrow(BadRequestException);
    });

    it('should use the expected error message', () => {
      try {
        plainToInstance(TestRequest, {
          id: 'invalid!',
        });

        throw new Error('Expected transformation to fail');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(BadRequestException);

        if (error instanceof BadRequestException) {
          expect(error.message).toBe('Invalid ID provided');
        } else {
          throw error;
        }
      }
    });
  });
});
