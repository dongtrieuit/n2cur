import { DEFAULT_CURRENCIES } from './currencies';
import { MoneyReaderError } from './errors';
import { messages } from './messages';
import { parseAmount } from './parse-amount';
import { readDigitsVi } from './read-integer';
import { EN_MAX_DIGITS, readDigitsEn } from './read-integer-en';
import type { AmountInput, CurrencyConfig, Lang, MoneyReaderOptions, ReadOptions } from './types';

const DECIMAL_HANDLINGS = ['READ', 'IGNORE', 'REJECT'] as const;
const VND = 'VND';

export type SafeReadResult =
  | { ok: true; text: string }
  | { ok: false; error: MoneyReaderError };

export interface MoneyReader {
  /** Đọc số tiền thành chữ. Ném `MoneyReaderError` nếu lỗi nghiệp vụ. */
  read(amount: AmountInput, currencyCode: string, options?: ReadOptions): string;
  /** Giống `read` nhưng không ném lỗi – tiện cho binding UI. */
  safeRead(amount: AmountInput, currencyCode: string, options?: ReadOptions): SafeReadResult;
  /** Lấy cấu hình tiền tệ đang Active theo mã (đã chuẩn hóa), hoặc `undefined`. */
  getCurrency(currencyCode: string): CurrencyConfig | undefined;
  /** Danh sách tiền tệ đang Active. */
  listCurrencies(): CurrencyConfig[];
}

/** Bước 1: trim + viết hoa mã tiền tệ (" vnd " → "VND"). */
export function normalizeCurrencyCode(code: unknown): string {
  return String(code ?? '').trim().toUpperCase();
}

const isBlank = (s: string | null | undefined): boolean => !s || !s.trim();

function validateCurrency(c: CurrencyConfig, lang: Lang): void {
  const code = normalizeCurrencyCode(c.currency_code);
  const fail = (msg: string) => {
    throw new MoneyReaderError('INVALID_CONFIG', messages.invalidConfig(lang, code, msg), { currency_code: code });
  };
  if (isBlank(c.currency_name)) fail(messages.detailMissingName(lang));
  if (!(DECIMAL_HANDLINGS as readonly string[]).includes(c.decimal_handling)) {
    fail(messages.detailBadHandling(lang, DECIMAL_HANDLINGS.join(' / ')));
  }
  if (!Number.isInteger(c.decimal_scale) || c.decimal_scale < 0) fail(messages.detailBadScale(lang));
  if (c.decimal_separator !== undefined && c.decimal_separator !== '.' && c.decimal_separator !== ',') {
    throw new MoneyReaderError('INVALID_CONFIG', messages.invalidDecimalSeparator(lang, String(c.decimal_separator)), {
      currency_code: code,
    });
  }
  if (
    c.decimal_handling === 'READ' &&
    c.decimal_allowed &&
    (isBlank(c.minor_unit_singular) || isBlank(c.minor_unit_plural))
  ) {
    throw new MoneyReaderError(
      'MINOR_UNIT_MISSING',
      messages.minorUnitMissing(lang, code),
      { currency_code: code },
    );
  }
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function resolveMainUnitName(c: CurrencyConfig, integer: string, lang: Lang): string {
  if (lang === 'vi') return c.currency_name.trim();
  const isOne = integer === '1';
  if (isOne) {
    return (c.currency_name_en ?? c.currency_code).trim();
  }
  return (c.currency_name_en_plural ?? c.currency_name_en ?? c.currency_code).trim();
}

function resolveMinorUnitName(c: CurrencyConfig, minorDigits: string, lang: Lang): string {
  const isOne = minorDigits === '1';
  if (lang === 'vi') {
    const unit = isOne ? c.minor_unit_singular : c.minor_unit_plural;
    return String(unit ?? '').trim();
  }
  if (isOne) {
    const unit = c.minor_unit_singular_en ?? c.minor_unit_singular;
    return String(unit ?? '').trim();
  }
  const unit = c.minor_unit_plural_en ?? c.minor_unit_plural;
  return String(unit ?? '').trim();
}

/**
 * Tạo bộ đọc số tiền với danh mục tiền tệ tùy biến (vd nạp từ API Master Data).
 * @example
 * const reader = createMoneyReader({ currencies: await api.getCurrencies() });
 * reader.read('12.02', 'GBP'); // "Mười hai bảng Anh và hai pence"
 * reader.read('12.02', 'GBP', { lang: 'en' }); // "Twelve pounds and two pence"
 */
export function createMoneyReader(options: MoneyReaderOptions = {}): MoneyReader {
  const defaultLang = options.lang ?? 'vi';
  if (defaultLang !== 'vi' && defaultLang !== 'en') {
    throw new MoneyReaderError('INVALID_CONFIG', messages.invalidLang(String(defaultLang)));
  }
  const source = options.currencies ?? DEFAULT_CURRENCIES;
  if (!Array.isArray(source)) {
    throw new MoneyReaderError('INVALID_CONFIG', messages.currenciesNotArray(defaultLang));
  }

  // Chỉ bản ghi Active mới có hiệu lực; mã trùng thì lấy bản ghi Active đầu tiên.
  const registry = new Map<string, CurrencyConfig>();
  for (const c of source) {
    if (!c || c.active !== true) continue;
    const code = normalizeCurrencyCode(c.currency_code);
    if (code && !registry.has(code)) registry.set(code, { ...c, currency_code: code });
  }

  const getCurrency = (currencyCode: string) => registry.get(normalizeCurrencyCode(currencyCode));

  const read = (amount: AmountInput, currencyCode: string, readOptions: ReadOptions = {}): string => {
    const lang: Lang = readOptions.lang ?? defaultLang;
    if (lang !== 'vi' && lang !== 'en') {
      throw new MoneyReaderError('INVALID_CONFIG', messages.invalidLang(String(lang)));
    }

    // Bước 1-2: chuẩn hóa & tra cứu tiền tệ Active.
    const code = normalizeCurrencyCode(currencyCode);
    const currency = registry.get(code);
    if (!currency) {
      throw new MoneyReaderError(
        'CURRENCY_NOT_FOUND',
        messages.currencyNotFound(lang, code),
        { currency_code: code },
      );
    }
    validateCurrency(currency, lang);
    const vndStyle = code === VND;

    // Bước 3: tách phần nguyên / thập phân.
    const { integer, fraction } = parseAmount(amount, {
      ...readOptions,
      decimalSeparator: readOptions.decimalSeparator ?? currency.decimal_separator,
    });

    // Bước 5: xử lý phần thập phân.
    let minorDigits: string | null = null;
    switch (currency.decimal_handling) {
      case 'IGNORE':
        break;
      case 'REJECT':
        if (fraction !== '') {
          throw new MoneyReaderError(
            'DECIMAL_REJECTED',
            messages.decimalRejected(lang, code),
            { currency_code: code, amount: String(amount) },
          );
        }
        break;
      case 'READ': {
        const scale = currency.decimal_scale;
        if (fraction.length > scale) {
          throw new MoneyReaderError(
            'DECIMAL_SCALE_EXCEEDED',
            messages.decimalScaleExceeded(lang, code, scale),
            { currency_code: code, amount: String(amount), decimal_scale: scale },
          );
        }
        if (currency.decimal_allowed && fraction !== '') {
          minorDigits = fraction.padEnd(scale, '0').replace(/^0+(?=\d)/, '');
        }
        break;
      }
    }

    // Bước 4 & 6: đọc phần nguyên + tên đơn vị chính.
    let integerText: string;
    if (lang === 'en') {
      try {
        integerText = readDigitsEn(integer);
      } catch (err) {
        if (err instanceof RangeError) {
          throw new MoneyReaderError(
            'INVALID_AMOUNT',
            messages.invalidAmount(lang, messages.reasonTooLarge(lang, EN_MAX_DIGITS)),
            { input: String(amount), integer },
          );
        }
        throw err;
      }
    } else {
      integerText = readDigitsVi(integer, { vndStyle });
    }

    const mainUnit = resolveMainUnitName(currency, integer, lang);
    const parts: string[] = [integerText, mainUnit];

    // Bước 7: ghép phần lẻ.
    if (minorDigits !== null && minorDigits !== '0') {
      const minorUnit = resolveMinorUnitName(currency, minorDigits, lang);
      const minorText = lang === 'en' ? readDigitsEn(minorDigits) : readDigitsVi(minorDigits, { vndStyle });
      const connector = lang === 'en' ? 'and' : 'và';
      parts.push(connector, minorText, minorUnit);
    }

    // Bước 8: viết hoa chữ cái đầu.
    return capitalizeFirst(parts.join(' '));
  };

  const safeRead = (amount: AmountInput, currencyCode: string, readOptions?: ReadOptions): SafeReadResult => {
    try {
      return { ok: true, text: read(amount, currencyCode, readOptions) };
    } catch (err) {
      if (err instanceof MoneyReaderError) return { ok: false, error: err };
      throw err;
    }
  };

  return {
    read,
    safeRead,
    getCurrency,
    listCurrencies: () => Array.from(registry.values()),
  };
}

let defaultReader: MoneyReader | undefined;
const getDefaultReader = () => (defaultReader ??= createMoneyReader());

/**
 * Đọc số tiền thành chữ với danh mục mặc định (`DEFAULT_CURRENCIES`).
 * @example readMoney(1005001, 'VND') // "Một triệu không trăm linh năm nghìn không trăm lẻ một đồng"
 * @example readMoney(1005001, 'VND', { lang: 'en' }) // "One million five thousand one dong"
 */
export function readMoney(amount: AmountInput, currencyCode: string, options?: ReadOptions): string {
  return getDefaultReader().read(amount, currencyCode, options);
}

/** Phiên bản không ném lỗi của `readMoney`. */
export function safeReadMoney(amount: AmountInput, currencyCode: string, options?: ReadOptions): SafeReadResult {
  return getDefaultReader().safeRead(amount, currencyCode, options);
}
