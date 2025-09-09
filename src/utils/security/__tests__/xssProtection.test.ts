import { describe, it, expect } from 'vitest'
import {
  sanitizeInput,
  sanitizeHtml,
  sanitizeUrl,
  sanitizeObject,
  validateUrl,
  isDangerous,
  encodeHtmlEntities,
} from '../xssProtection'

describe('XSS Protection Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello'
      const result = sanitizeInput(input)
      expect(result).toBe('Hello')
    })

    it('should remove dangerous attributes', () => {
      const input = '<div onclick="alert()">Content</div>'
      const result = sanitizeInput(input)
      expect(result).toBe('<div>Content</div>')
    })

    it('should preserve safe content', () => {
      const input = '<p>This is <strong>safe</strong> content</p>'
      const result = sanitizeInput(input)
      expect(result).toBe('<p>This is <strong>safe</strong> content</p>')
    })

    it('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <script>alert()</script> World</p>'
      const result = sanitizeHtml(input)
      expect(result).toBe('Hello  World')
    })

    it('should decode HTML entities', () => {
      const input = '&lt;script&gt;alert()&lt;/script&gt;'
      const result = sanitizeHtml(input)
      expect(result).toBe('<script>alert()</script>')
    })
  })

  describe('sanitizeUrl', () => {
    it('should allow safe URLs', () => {
      const safeUrls = [
        'https://example.com',
        'http://localhost:3000',
        'mailto:test@example.com',
        '/relative/path',
        '#anchor'
      ]

      safeUrls.forEach(url => {
        expect(sanitizeUrl(url)).toBe(url)
      })
    })

    it('should block dangerous URLs', () => {
      const dangerousUrls = [
        'javascript:alert()',
        'data:text/html,<script>alert()</script>',
        'vbscript:msgbox()',
        'file:///etc/passwd'
      ]

      dangerousUrls.forEach(url => {
        expect(sanitizeUrl(url)).toBe('')
      })
    })

    it('should handle malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        '://malformed',
        null,
        undefined,
        ''
      ]

      malformedUrls.forEach(url => {
        const result = sanitizeUrl(url as string)
        expect(typeof result).toBe('string')
      })
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const input = {
        name: '<script>alert()</script>John',
        profile: {
          bio: '<img src=x onerror=alert()>Bio',
          url: 'javascript:alert()',
        },
        tags: ['<script>tag1</script>', 'safe-tag']
      }

      const result = sanitizeObject(input)
      
      expect(result.name).toBe('John')
      expect(result.profile.bio).toBe('Bio')
      expect(result.profile.url).toBe('')
      expect(result.tags).toEqual(['tag1', 'safe-tag'])
    })

    it('should handle arrays correctly', () => {
      const input = ['<script>item1</script>', 'safe-item', '<img onerror=alert()>']
      const result = sanitizeObject(input)
      expect(result).toEqual(['item1', 'safe-item', ''])
    })

    it('should preserve non-string values', () => {
      const input = {
        number: 42,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined,
        date: new Date('2023-01-01'),
      }

      const result = sanitizeObject(input)
      expect(result.number).toBe(42)
      expect(result.boolean).toBe(true)
      expect(result.nullValue).toBe(null)
      expect(result.undefinedValue).toBe(undefined)
      expect(result.date).toBeInstanceOf(Date)
    })
  })

  describe('validateUrl', () => {
    it('should validate URLs correctly', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://localhost:3000')).toBe(true)
      expect(validateUrl('mailto:test@example.com')).toBe(true)
      expect(validateUrl('/relative/path')).toBe(true)
      
      expect(validateUrl('javascript:alert()')).toBe(false)
      expect(validateUrl('data:text/html,<script>')).toBe(false)
      expect(validateUrl('')).toBe(false)
      expect(validateUrl(null as any)).toBe(false)
    })
  })

  describe('isDangerous', () => {
    it('should detect dangerous content', () => {
      const dangerousInputs = [
        '<script>alert()</script>',
        '<img src=x onerror=alert()>',
        '<svg onload=alert()>',
        '<iframe src="javascript:alert()">',
        'javascript:alert()',
        'vbscript:msgbox()'
      ]

      dangerousInputs.forEach(input => {
        expect(isDangerous(input)).toBe(true)
      })
    })

    it('should allow safe content', () => {
      const safeInputs = [
        'Hello world',
        '<p>Safe HTML</p>',
        '<a href="https://example.com">Link</a>',
        'user@example.com',
        '123-456-7890'
      ]

      safeInputs.forEach(input => {
        expect(isDangerous(input)).toBe(false)
      })
    })
  })

  describe('encodeHtmlEntities', () => {
    it('should encode HTML entities', () => {
      const input = '<script>alert("XSS")</script>'
      const result = encodeHtmlEntities(input)
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
    })

    it('should handle quotes and ampersands', () => {
      const input = 'Tom & Jerry say "Hello"'
      const result = encodeHtmlEntities(input)
      expect(result).toBe('Tom &amp; Jerry say &quot;Hello&quot;')
    })

    it('should handle empty input', () => {
      expect(encodeHtmlEntities('')).toBe('')
      expect(encodeHtmlEntities(null as any)).toBe('')
      expect(encodeHtmlEntities(undefined as any)).toBe('')
    })
  })
})