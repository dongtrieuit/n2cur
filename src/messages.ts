import type { Lang } from './types';

/**
 * Thông báo lỗi theo ngôn ngữ. `error.code` không đổi theo `lang`, chỉ `error.message` thay đổi.
 * Gom về một chỗ để hai bản dịch luôn đi cùng nhau.
 */
export const messages = {
  invalidAmount: (lang: Lang, reason: string) =>
    lang === 'en' ? `Invalid amount: ${reason}` : `Số tiền không hợp lệ: ${reason}`,

  reasonNegative: (lang: Lang) => (lang === 'en' ? 'negative amounts are not supported' : 'không hỗ trợ số âm'),
  reasonNotFinite: (lang: Lang) => (lang === 'en' ? 'must be a finite number' : 'phải là số hữu hạn'),
  reasonBadType: (lang: Lang) =>
    lang === 'en' ? 'must be a number, bigint or string' : 'phải là number, bigint hoặc string',
  reasonBadFormat: (lang: Lang) => (lang === 'en' ? 'invalid format' : 'định dạng không đúng'),
  reasonTooLarge: (lang: Lang, maxDigits: number) =>
    lang === 'en'
      ? `the integer part exceeds ${maxDigits} digits (largest English scale is decillion)`
      : `phần nguyên vượt quá ${maxDigits} chữ số (bậc lớn nhất tiếng Anh là decillion)`,

  invalidDecimalSeparator: (lang: Lang, value: string) =>
    lang === 'en' ? `Invalid decimalSeparator: ${value}` : `decimalSeparator không hợp lệ: ${value}`,

  currencyNotFound: (lang: Lang, code: string) =>
    lang === 'en'
      ? `No active currency configuration found for code "${code}"`
      : `Không tìm thấy cấu hình tiền tệ đang hoạt động cho mã "${code}"`,

  decimalRejected: (lang: Lang, code: string) =>
    lang === 'en' ? `Currency ${code} does not accept a decimal part` : `Tiền tệ ${code} không chấp nhận phần thập phân`,

  decimalScaleExceeded: (lang: Lang, code: string, scale: number) =>
    lang === 'en'
      ? `Decimal part exceeds the ${scale} digits allowed for ${code} (no automatic rounding)`
      : `Phần thập phân vượt quá ${scale} chữ số cho phép của ${code} (không tự động làm tròn)`,

  minorUnitMissing: (lang: Lang, code: string) =>
    lang === 'en'
      ? `Currency ${code} uses READ mode but is missing singular/plural minor unit names`
      : `Tiền tệ ${code} dùng chế độ READ nhưng chưa khai báo đủ đơn vị lẻ số ít/số nhiều`,

  invalidConfig: (lang: Lang, code: string, detail: string) =>
    lang === 'en'
      ? `Invalid configuration for currency ${code}: ${detail}`
      : `Cấu hình tiền tệ ${code} không hợp lệ: ${detail}`,

  detailMissingName: (lang: Lang) => (lang === 'en' ? 'currency_name is missing' : 'thiếu currency_name'),
  detailBadHandling: (lang: Lang, allowed: string) =>
    lang === 'en' ? `decimal_handling must be ${allowed}` : `decimal_handling phải là ${allowed}`,
  detailBadScale: (lang: Lang) =>
    lang === 'en' ? 'decimal_scale must be an integer ≥ 0' : 'decimal_scale phải là số nguyên ≥ 0',

  currenciesNotArray: (lang: Lang) => (lang === 'en' ? 'currencies must be an array' : 'currencies phải là một mảng'),
  invalidLang: (value: string) => `lang không hợp lệ / invalid lang: "${value}" (vi | en)`,
};
