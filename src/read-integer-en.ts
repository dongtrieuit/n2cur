/**
 * Đọc số nguyên tiếng Anh (US style, short scale).
 * - Không chèn "and" bên trong số: 105 → "one hundred five". "and" chỉ dùng để nối phần lẻ tiền tệ.
 * - Gạch nối cho 21–99: 24 → "twenty-four".
 */

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
] as const;

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'] as const;

const SCALES = [
  '', 'thousand', 'million', 'billion', 'trillion', 'quadrillion',
  'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion',
] as const;

/** Số chữ số tối đa của phần nguyên đọc được bằng tiếng Anh (đến decillion = 10^33 → 36 chữ số). */
export const EN_MAX_DIGITS = SCALES.length * 3;

/** Đọc số 1..99. */
function readTens(n: number): string {
  if (n < 20) return ONES[n] as string;
  const tens = TENS[Math.floor(n / 10)] as string;
  const unit = n % 10;
  return unit === 0 ? tens : `${tens}-${ONES[unit]}`;
}

/** Đọc một nhóm 3 chữ số (1..999). */
function readGroup(n: number): string[] {
  const words: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) words.push(ONES[hundreds] as string, 'hundred');
  if (rest > 0) words.push(readTens(rest));
  return words;
}

/**
 * Đọc chuỗi chữ số nguyên không âm thành chữ tiếng Anh (chữ thường).
 * @example readDigitsEn('1005001') // "one million five thousand one"
 */
export function readDigitsEn(digits: string): string {
  if (!/^\d+$/.test(digits)) throw new TypeError(`Invalid digit string: "${digits}"`);
  const normalized = digits.replace(/^0+(?=\d)/, '');
  if (normalized === '0') return ONES[0];
  if (normalized.length > EN_MAX_DIGITS) {
    throw new RangeError(`Number exceeds ${EN_MAX_DIGITS} digits (largest supported scale is decillion)`);
  }

  const padded = normalized.padStart(Math.ceil(normalized.length / 3) * 3, '0');
  const groupCount = padded.length / 3;

  const words: string[] = [];
  for (let g = 0; g < groupCount; g++) {
    const value = Number(padded.slice(g * 3, g * 3 + 3));
    if (value === 0) continue; // bỏ qua nhóm 000
    words.push(...readGroup(value));
    const scale = SCALES[groupCount - 1 - g];
    if (scale) words.push(scale);
  }

  return words.join(' ');
}
