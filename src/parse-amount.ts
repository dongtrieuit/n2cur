import { MoneyReaderError } from './errors';
import { messages } from './messages';
import type { AmountInput, Lang, ReadOptions } from './types';

export interface ParsedAmount {
  /** Phần nguyên dạng chuỗi chữ số, không có số 0 thừa ở đầu ("0" nếu bằng 0). */
  integer: string;
  /** Phần thập phân dạng chuỗi chữ số, đã bỏ số 0 thừa ở cuối ("" nếu không có). */
  fraction: string;
}

const invalid = (input: unknown, lang: Lang, reason: string): MoneyReaderError =>
  new MoneyReaderError('INVALID_AMOUNT', messages.invalidAmount(lang, reason), { input: String(input) });

/** Chuyển chuỗi số dạng mũ ("1.5e+21", "1e-7") thành dạng thập phân thường. */
function expandExponent(str: string): string {
  const match = /^(\d+)(?:\.(\d+))?e([+-]\d+)$/i.exec(str);
  if (!match) return str;
  const intPart = match[1] ?? '';
  const fracPart = match[2] ?? '';
  const exp = Number(match[3]);
  const digits = intPart + fracPart;
  const pointPos = intPart.length + exp;
  if (pointPos <= 0) return `0.${'0'.repeat(-pointPos)}${digits}`;
  if (pointPos >= digits.length) return digits + '0'.repeat(pointPos - digits.length);
  return `${digits.slice(0, pointPos)}.${digits.slice(pointPos)}`;
}

function normalizeParts(integer: string, fraction: string): ParsedAmount {
  return {
    integer: integer.replace(/^0+(?=\d)/, '') || '0',
    fraction: fraction.replace(/0+$/, ''),
  };
}

/**
 * Bước 1 & 3: chuẩn hóa số tiền và tách phần nguyên / phần thập phân.
 * Thao tác hoàn toàn trên chuỗi để tránh sai số dấu phẩy động và hỗ trợ số rất lớn.
 */
export function parseAmount(input: AmountInput, options: ReadOptions = {}): ParsedAmount {
  const lang: Lang = options.lang === 'en' ? 'en' : 'vi';

  if (typeof input === 'bigint') {
    if (input < 0n) throw invalid(input, lang, messages.reasonNegative(lang));
    return normalizeParts(input.toString(), '');
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw invalid(input, lang, messages.reasonNotFinite(lang));
    if (input < 0) throw invalid(input, lang, messages.reasonNegative(lang));
    const [i = '0', f = ''] = expandExponent(String(Math.abs(input))).split('.');
    return normalizeParts(i, f);
  }

  if (typeof input !== 'string') throw invalid(input, lang, messages.reasonBadType(lang));

  const decimalSeparator = options.decimalSeparator ?? '.';
  if (decimalSeparator !== '.' && decimalSeparator !== ',') {
    throw new MoneyReaderError('INVALID_CONFIG', messages.invalidDecimalSeparator(lang, String(decimalSeparator)));
  }
  const groupSeparator = decimalSeparator === '.' ? ',' : '.';

  let str = input.replace(/\s+/g, '');
  if (str.startsWith('+')) str = str.slice(1);
  if (str.startsWith('-')) throw invalid(input, lang, messages.reasonNegative(lang));

  const g = `\\${groupSeparator}`;
  const d = `\\${decimalSeparator}`;
  // Phân cách nghìn (nếu có) phải đúng nhóm 3 chữ số => tránh hiểu nhầm "12,01" thành 1201.
  const pattern = new RegExp(`^(\\d{1,3}(?:${g}\\d{3})+|\\d*)(?:${d}(\\d*))?$`);
  const match = pattern.exec(str);
  const intRaw = match?.[1] ?? '';
  const fracRaw = match?.[2] ?? '';
  if (!match || (intRaw === '' && fracRaw === '')) {
    throw invalid(input, lang, messages.reasonBadFormat(lang));
  }

  return normalizeParts(intRaw.split(groupSeparator).join('') || '0', fracRaw);
}
