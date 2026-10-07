import { describe, expect, it } from 'vitest';
import { readDigitsEn, readInteger, EN_MAX_DIGITS } from '../src';

describe('readDigitsEn', () => {
  it.each([
    ['0', 'zero'],
    ['1', 'one'],
    ['5', 'five'],
    ['10', 'ten'],
    ['11', 'eleven'],
    ['14', 'fourteen'],
    ['15', 'fifteen'],
    ['20', 'twenty'],
    ['21', 'twenty-one'],
    ['25', 'twenty-five'],
    ['99', 'ninety-nine'],
    ['100', 'one hundred'],
    ['105', 'one hundred five'],
    ['110', 'one hundred ten'],
    ['115', 'one hundred fifteen'],
    ['125', 'one hundred twenty-five'],
    ['1000', 'one thousand'],
    ['1005', 'one thousand five'],
    ['1015', 'one thousand fifteen'],
    ['1000000', 'one million'],
    ['1005001', 'one million five thousand one'],
    ['1000000000', 'one billion'],
    ['1000000000000', 'one trillion'],
  ])('%s → %s', (input, expected) => {
    expect(readDigitsEn(input)).toBe(expected);
  });

  it('handles large composite numbers', () => {
    expect(readDigitsEn('123456789')).toBe(
      'one hundred twenty-three million four hundred fifty-six thousand seven hundred eighty-nine'
    );
  });

  it('handles maximum supported scale (decillion - 10^33)', () => {
    const oneDecillion = '1' + '0'.repeat(33);
    expect(readDigitsEn(oneDecillion)).toBe('one decillion');

    const max36Digits = '9'.repeat(36);
    expect(readDigitsEn(max36Digits)).toContain('decillion');
  });

  it('throws RangeError for numbers exceeding maximum supported digits', () => {
    const overMax = '1' + '0'.repeat(36); // 37 digits
    expect(() => readDigitsEn(overMax)).toThrow(RangeError);
  });
});

describe('readInteger with lang: "en"', () => {
  it('reads numbers in English via readInteger option', () => {
    expect(readInteger(0, { lang: 'en' })).toBe('zero');
    expect(readInteger(105, { lang: 'en' })).toBe('one hundred five');
    expect(readInteger('1005001', { lang: 'en' })).toBe('one million five thousand one');
    expect(readInteger(123456789n, { lang: 'en' })).toBe(
      'one hundred twenty-three million four hundred fifty-six thousand seven hundred eighty-nine'
    );
  });

  it('throws localized RangeError when exceeding scale limit with lang: "en"', () => {
    const overMax = '1' + '0'.repeat(36);
    expect(() => readInteger(overMax, { lang: 'en' })).toThrow(/exceeds 36 digits/i);
  });
});

