import { describe, expect, it } from '@jest/globals';
import { encodeHtmlOutput } from '../../utils';

describe('encodeHtmlOutput', () => {
  describe('string encoding', () => {
    it('should encode HTML special characters', () => {
      const result = encodeHtmlOutput('<script>alert("XSS")</script>');

      expect(result).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      );
    });

    it('should encode ampersands and apostrophes', () => {
      const result = encodeHtmlOutput("Tom & Jerry's");

      expect(result).toBe('Tom &amp; Jerry&apos;s');
    });

    it('should encode HTML characters using named references where available', () => {
      const result = encodeHtmlOutput('<div>A & B</div>');

      expect(result).toBe('&lt;div&gt;A &amp; B&lt;/div&gt;');
    });

    it('should preserve an empty string', () => {
      expect(encodeHtmlOutput('')).toBe('');
    });
  });

  describe('skipped keys', () => {
    it.each([
      'success',
      'statusCode',
      'message',
      'path',
      'timestamp',
      'error',
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
      'url',
    ])('should preserve the value of the "%s" key', (key) => {
      const value = '<script>alert("XSS")</script>';
      const result = encodeHtmlOutput({ [key]: value });

      expect(result).toEqual({ [key]: value });
    });

    it('should preserve skipped fields while encoding other fields', () => {
      const input = {
        message: '<b>Response</b>',
        url: 'https://example.com/?a=1&b=2',
        name: '<b>John</b>',
        details: {
          error: '<i>Invalid input</i>',
          description: '<p>Some details</p>',
        },
      };

      expect(encodeHtmlOutput(input)).toEqual({
        message: '<b>Response</b>',
        url: 'https://example.com/?a=1&b=2',
        name: '&lt;b&gt;John&lt;/b&gt;',
        details: {
          error: '<i>Invalid input</i>',
          description: '&lt;p&gt;Some details&lt;/p&gt;',
        },
      });
    });

    it('should preserve skipped keys inside array objects', () => {
      const input = [
        {
          message: '<b>Not encoded</b>',
          name: '<b>Encoded</b>',
        },
      ];

      expect(encodeHtmlOutput(input)).toEqual([
        {
          message: '<b>Not encoded</b>',
          name: '&lt;b&gt;Encoded&lt;/b&gt;',
        },
      ]);
    });
  });

  describe('nested values', () => {
    it('should encode strings in nested objects', () => {
      const input = {
        user: {
          name: '<script>John</script>',
          profile: {
            description: '<p>Developer & tester</p>',
          },
        },
      };

      expect(encodeHtmlOutput(input)).toEqual({
        user: {
          name: '&lt;script&gt;John&lt;/script&gt;',
          profile: {
            description: '&lt;p&gt;Developer &amp; tester&lt;/p&gt;',
          },
        },
      });
    });

    it('should encode strings inside arrays', () => {
      const input = ['<b>First</b>', '<i>Second</i>'];

      expect(encodeHtmlOutput(input)).toEqual([
        '&lt;b&gt;First&lt;/b&gt;',
        '&lt;i&gt;Second&lt;/i&gt;',
      ]);
    });

    it('should encode nested arrays and objects', () => {
      const input = {
        items: [
          '<b>First</b>',
          {
            name: '<i>Second</i>',
            tags: ['<u>Third</u>'],
          },
        ],
      };

      expect(encodeHtmlOutput(input)).toEqual({
        items: [
          '&lt;b&gt;First&lt;/b&gt;',
          {
            name: '&lt;i&gt;Second&lt;/i&gt;',
            tags: ['&lt;u&gt;Third&lt;/u&gt;'],
          },
        ],
      });
    });
  });

  describe('special values', () => {
    it('should preserve null and undefined values', () => {
      const input = {
        nullValue: null,
        undefinedValue: undefined,
        name: '<b>John</b>',
      };

      expect(encodeHtmlOutput(input)).toEqual({
        nullValue: null,
        undefinedValue: undefined,
        name: '&lt;b&gt;John&lt;/b&gt;',
      });
    });

    it('should preserve Date instances', () => {
      const date = new Date('2026-10-15T12:00:00.000Z');
      const input = { createdAt: date };

      const result = encodeHtmlOutput(input);

      expect(result.createdAt).toBe(date);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should preserve numbers and booleans', () => {
      const input = {
        count: 10,
        amount: 12.5,
        active: true,
        deleted: false,
      };

      expect(encodeHtmlOutput(input)).toEqual(input);
    });

    it('should preserve null and undefined values', () => {
      const input = {
        nullValue: null,
        undefinedValue: undefined,
        name: '<b>John</b>',
      };

      expect(encodeHtmlOutput(input)).toEqual({
        nullValue: null,
        undefinedValue: undefined,
        name: '&lt;b&gt;John&lt;/b&gt;',
      });
    });

    it('should preserve numeric and boolean top-level values', () => {
      expect(encodeHtmlOutput(42)).toBe(42);
      expect(encodeHtmlOutput(true)).toBe(true);
      expect(encodeHtmlOutput(false)).toBe(false);
    });
  });

  describe('input immutability', () => {
    it('should not mutate the original object', () => {
      const input = {
        name: '<b>John</b>',
        nested: {
          description: '<p>Developer</p>',
        },
      };

      const originalName = input.name;
      const originalDescription = input.nested.description;

      const result = encodeHtmlOutput(input);

      expect(input.name).toBe(originalName);
      expect(input.nested.description).toBe(originalDescription);
      expect(result).not.toBe(input);
      expect(result.nested).not.toBe(input.nested);
    });

    it('should not mutate the original array', () => {
      const input = ['<b>First</b>', '<i>Second</i>'];

      const result = encodeHtmlOutput(input);

      expect(input).toEqual(['<b>First</b>', '<i>Second</i>']);
      expect(result).not.toBe(input);
    });
  });
});
