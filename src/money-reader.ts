import { DEFAULT_CURRENCIES } from './currencies';
import { MoneyReaderError } from './errors';
import { parseAmount } from './parse-amount';
import { readDigitsVi } from './read-integer';
import type { AmountInput, CurrencyConfig, MoneyReaderOptions, ReadOptions } from './types';

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

function validateCurrency(c: CurrencyConfig): void {
  const code = normalizeCurrencyCode(c.currency_code);
  const fail = (msg: string) => {
    throw new MoneyReaderError('INVALID_CONFIG', `Cấu hình tiền tệ ${code} không hợp lệ: ${msg}`, { currency_code: code });
  };
  if (isBlank(c.currency_name)) fail('thiếu currency_name');
  if (!(DECIMAL_HANDLINGS as readonly string[]).includes(c.decimal_handling)) {
    fail(`decimal_handling phải là ${DECIMAL_HANDLINGS.join(' / ')}`);
  }
  if (!Number.isInteger(c.decimal_scale) || c.decimal_scale < 0) fail('decimal_scale phải là số nguyên ≥ 0');
  if (
    c.decimal_handling === 'READ' &&
    c.decimal_allowed &&
    (isBlank(c.minor_unit_singular) || isBlank(c.minor_unit_plural))
  ) {
    throw new MoneyReaderError(
      'MINOR_UNIT_MISSING',
      `Tiền tệ ${code} dùng chế độ READ nhưng chưa khai báo đủ đơn vị lẻ số ít/số nhiều`,
      { currency_code: code },
    );
  }
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Tạo bộ đọc số tiền với danh mục tiền tệ tùy biến (vd nạp từ API Master Data).
 * @example
 * const reader = createMoneyReader({ currencies: await api.getCurrencies() });
 * reader.read('12.02', 'GBP'); // "Mười hai bảng Anh và hai pence"
 */
export function createMoneyReader(options: MoneyReaderOptions = {}): MoneyReader {
  const source = options.currencies ?? DEFAULT_CURRENCIES;
  if (!Array.isArray(source)) {
    throw new MoneyReaderError('INVALID_CONFIG', 'currencies phải là một mảng');
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
    // Bước 1-2: chuẩn hóa & tra cứu tiền tệ Active.
    const code = normalizeCurrencyCode(currencyCode);
    const currency = registry.get(code);
    if (!currency) {
      throw new MoneyReaderError(
        'CURRENCY_NOT_FOUND',
        `Không tìm thấy cấu hình tiền tệ đang hoạt động cho mã "${code}"`,
        { currency_code: code },
      );
    }
    validateCurrency(currency);
    const vndStyle = code === VND;

    // Bước 3: tách phần nguyên / thập phân.
    const { integer, fraction } = parseAmount(amount, readOptions);

    // Bước 5: xử lý phần thập phân.
    let minorDigits: string | null = null;
    switch (currency.decimal_handling) {
      case 'IGNORE':
        break;
      case 'REJECT':
        if (fraction !== '') {
          throw new MoneyReaderError(
            'DECIMAL_REJECTED',
            `Tiền tệ ${code} không chấp nhận phần thập phân`,
            { currency_code: code, amount: String(amount) },
          );
        }
        break;
      case 'READ': {
        const scale = currency.decimal_scale;
        if (fraction.length > scale) {
          throw new MoneyReaderError(
            'DECIMAL_SCALE_EXCEEDED',
            `Phần thập phân vượt quá ${scale} chữ số cho phép của ${code} (không tự động làm tròn)`,
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
    const parts: string[] = [readDigitsVi(integer, { vndStyle }), currency.currency_name.trim()];

    // Bước 7: ghép phần lẻ.
    if (minorDigits !== null && minorDigits !== '0') {
      const unit = minorDigits === '1' ? currency.minor_unit_singular : currency.minor_unit_plural;
      parts.push('và', readDigitsVi(minorDigits, { vndStyle }), String(unit).trim());
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
 */
export function readMoney(amount: AmountInput, currencyCode: string, options?: ReadOptions): string {
  return getDefaultReader().read(amount, currencyCode, options);
}

/** Phiên bản không ném lỗi của `readMoney`. */
export function safeReadMoney(amount: AmountInput, currencyCode: string, options?: ReadOptions): SafeReadResult {
  return getDefaultReader().safeRead(amount, currencyCode, options);
}
