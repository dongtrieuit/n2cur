import { describe, expect, it } from 'vitest';
import { readInteger, scaleName } from '../src';

const vnd = (n: number | bigint | string) => readInteger(n, { vndStyle: true });
const fx = (n: number | bigint | string) => readInteger(n);

describe('scaleName', () => {
  it('lặp lại bậc "tỷ" cho các cụm lớn', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(scaleName)).toEqual([
      '', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ', 'tỷ tỷ', 'nghìn tỷ tỷ',
    ]);
  });
});

describe('readInteger – cơ bản', () => {
  it.each([
    [0, 'không'],
    [1, 'một'],
    [5, 'năm'],
    [10, 'mười'],
    [11, 'mười một'],
    [14, 'mười bốn'],
    [15, 'mười lăm'],
    [20, 'hai mươi'],
    [21, 'hai mươi mốt'],
    [25, 'hai mươi lăm'],
    [99, 'chín mươi chín'],
    [100, 'một trăm'],
    [110, 'một trăm mười'],
    [111, 'một trăm mười một'],
    [1000, 'một nghìn'],
    [1_000_000, 'một triệu'],
    [1_000_000_000, 'một tỷ'],
  ])('%s → %s', (n, text) => {
    expect(fx(n)).toBe(text);
    expect(vnd(n)).toBe(text);
  });
});

describe('readInteger – biến âm "tư" (chỉ VND, T > 1)', () => {
  it('VND', () => {
    expect(vnd(24)).toBe('hai mươi tư');
    expect(vnd(14)).toBe('mười bốn');
    expect(vnd(4)).toBe('bốn');
    expect(vnd(104)).toBe('một trăm lẻ bốn');
    expect(vnd(24_000)).toBe('hai mươi tư nghìn');
  });
  it('ngoại tệ', () => {
    expect(fx(24)).toBe('hai mươi bốn');
    expect(fx(24_000)).toBe('hai mươi bốn nghìn');
  });
});

describe('readInteger – "linh" / "lẻ"', () => {
  it('VND dùng "lẻ" ở nhóm đơn vị, "linh" ở nhóm lớn', () => {
    expect(vnd(101)).toBe('một trăm lẻ một');
    expect(vnd(105)).toBe('một trăm lẻ năm');
    expect(vnd(105_000)).toBe('một trăm linh năm nghìn');
    expect(vnd(1_005_001)).toBe('một triệu không trăm linh năm nghìn không trăm lẻ một');
  });
  it('ngoại tệ luôn dùng "linh"', () => {
    expect(fx(105)).toBe('một trăm linh năm');
    expect(fx(1_005_001)).toBe('một triệu không trăm linh năm nghìn không trăm linh một');
  });
});

describe('readInteger – nhóm 000 và "không trăm"', () => {
  it.each([
    [1001, 'một nghìn không trăm lẻ một'],
    [1010, 'một nghìn không trăm mười'],
    [1021, 'một nghìn không trăm hai mươi mốt'],
    [1_000_050, 'một triệu không trăm năm mươi'],
    [1_000_000_001, 'một tỷ không trăm lẻ một'],
    [2_000_500_000, 'hai tỷ năm trăm nghìn'],
    [15_000_000, 'mười lăm triệu'],
    [123_456_789, 'một trăm hai mươi ba triệu bốn trăm năm mươi sáu nghìn bảy trăm tám mươi chín'],
  ])('%s (VND) → %s', (n, text) => {
    expect(vnd(n)).toBe(text);
  });

  it('bậc lớn: nghìn tỷ / triệu tỷ / tỷ tỷ', () => {
    expect(vnd('1000000000000')).toBe('một nghìn tỷ');
    expect(vnd('1000001000000')).toBe('một nghìn tỷ không trăm linh một triệu');
    expect(vnd('5000000000000000')).toBe('năm triệu tỷ');
    expect(vnd(10n ** 18n)).toBe('một tỷ tỷ');
    expect(vnd(10n ** 21n)).toBe('một nghìn tỷ tỷ');
  });
});

describe('readInteger – đầu vào không hợp lệ', () => {
  it('ném lỗi', () => {
    expect(() => fx(-1)).toThrow(RangeError);
    expect(() => fx(1.5)).toThrow(RangeError);
    expect(() => fx(2 ** 60)).toThrow(RangeError);
    expect(() => fx('12a')).toThrow(TypeError);
  });
});
