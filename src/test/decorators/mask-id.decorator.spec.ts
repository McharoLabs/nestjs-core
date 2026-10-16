import { describe, expect, it, beforeEach } from '@jest/globals';
import { instanceToPlain } from 'class-transformer';
import { MaskId } from '../../masker/decorators/mask-id.decorator';
import { ICore } from '../../interfaces/core.interface';
import { MaskerService } from '../../masker';

class TestResponse {
  @MaskId()
  public id!: number | null | undefined;
}

describe('MaskId', () => {
  const config: ICore = {
    salt: 'test-salt-for-mask-id',
  };

  let service: MaskerService;

  beforeEach(() => {
    service = new MaskerService(config);
  });

  describe('serialization', () => {
    it('should mask the ID when converting an instance to plain data', () => {
      const response = new TestResponse();
      response.id = 123;

      const result = instanceToPlain(response) as TestResponse;

      expect(result.id).toBe(service.mask(123));
    });

    it('should not expose the original numeric ID during serialization', () => {
      const response = new TestResponse();
      response.id = 123;

      const result = instanceToPlain(response) as TestResponse;

      expect(result.id).not.toBe(123);
    });

    it('should preserve null values', () => {
      const response = new TestResponse();
      response.id = null;

      const result = instanceToPlain(response) as TestResponse;

      expect(result.id).toBeNull();
    });

    it('should preserve undefined values', () => {
      const response = new TestResponse();
      response.id = undefined;

      const result = instanceToPlain(response) as TestResponse;

      expect(result.id).toBeUndefined();
    });

    it('should leave the original instance unchanged', () => {
      const response = new TestResponse();
      response.id = 123;

      instanceToPlain(response);

      expect(response.id).toBe(123);
    });
  });

  describe('invalid input', () => {
    it('should reject string IDs during serialization', () => {
      const response = new TestResponse();
      response.id = '123' as unknown as number;

      expect(() => instanceToPlain(response)).toThrow('Invalid ID provided');
    });

    it('should reject boolean IDs during serialization', () => {
      const response = new TestResponse();
      response.id = true as unknown as number;

      expect(() => instanceToPlain(response)).toThrow('Invalid ID provided');
    });

    it('should reject object IDs during serialization', () => {
      const response = new TestResponse();
      response.id = {} as unknown as number;

      expect(() => instanceToPlain(response)).toThrow('Invalid ID provided');
    });
  });
});
