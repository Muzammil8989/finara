import { numberToWords, formatWithCommas } from '@/lib/utils/format-amount';

describe('numberToWords', () => {
  it('returns Zero for 0', () => {
    expect(numberToWords(0)).toBe('Zero');
  });

  it('converts single digits', () => {
    expect(numberToWords(1)).toBe('One');
    expect(numberToWords(9)).toBe('Nine');
  });

  it('converts teens', () => {
    expect(numberToWords(11)).toBe('Eleven');
    expect(numberToWords(19)).toBe('Nineteen');
  });

  it('converts tens', () => {
    expect(numberToWords(20)).toBe('Twenty');
    expect(numberToWords(45)).toBe('Forty Five');
  });

  it('converts hundreds', () => {
    expect(numberToWords(100)).toBe('One Hundred');
    expect(numberToWords(250)).toBe('Two Hundred Fifty');
  });

  it('converts thousands', () => {
    expect(numberToWords(1000)).toBe('One Thousand');
    expect(numberToWords(5500)).toBe('Five Thousand Five Hundred');
  });

  it('converts millions', () => {
    expect(numberToWords(1_000_000)).toBe('One Million');
    expect(numberToWords(2_500_000)).toBe('Two Million Five Hundred Thousand');
  });

  it('converts billions', () => {
    expect(numberToWords(1_000_000_000)).toBe('One Billion');
  });

  it('handles negative numbers (uses absolute value)', () => {
    expect(numberToWords(-5)).toBe('Five');
  });

  it('handles decimal input (floors to integer)', () => {
    expect(numberToWords(9.99)).toBe('Nine');
  });
});

describe('formatWithCommas', () => {
  it('returns empty string for 0', () => {
    expect(formatWithCommas('0')).toBe('');
  });

  it('returns empty string for negative values', () => {
    expect(formatWithCommas('-100')).toBe('');
  });

  it('returns empty string for non-numeric input', () => {
    expect(formatWithCommas('abc')).toBe('');
  });

  it('formats thousands with commas', () => {
    expect(formatWithCommas('1000')).toBe('1,000');
    expect(formatWithCommas('1000000')).toBe('1,000,000');
  });

  it('formats decimal numbers', () => {
    expect(formatWithCommas('1234.56')).toBe('1,234.56');
  });

  it('formats small numbers without commas', () => {
    expect(formatWithCommas('500')).toBe('500');
  });
});
