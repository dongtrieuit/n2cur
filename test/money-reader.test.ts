import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CURRENCIES,
  MoneyReaderError,
  createMoneyReader,
  parseAmount,
  readMoney,
  safeReadMoney,
  type CurrencyConfig,
} from '../src';

const expectError = (fn: () => unknown, code: string) => {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(MoneyReaderError);
    expect((err as MoneyReaderError).code).toBe(code);
    return;
  }
  throw new Error(`Expected MoneyReaderError ${code}`);
};

describe('Bảng mẫu kết quả 7.2', () => {
  it.each<[number | string, string, string]>([
    [24, 'VND', 'Hai mươi tư đồng'],
    [24, 'EUR', 'Hai mươi bốn euro'],
    [105, 'VND', 'Một trăm lẻ năm đồng'],
    [105, 'USD', 'Một trăm linh năm đô la Mỹ'],
    [1005001, 'VND', 'Một triệu không trăm linh năm nghìn không trăm lẻ một đồng'],
    [12.01, 'GBP', 'Mười hai bảng Anh và một penny'],
    [12.02, 'GBP', 'Mười hai bảng Anh và hai pence'],
    [12.75, 'JPY', 'Mười hai yên Nhật'],
  ])('%s %s → %s', (amount, code, text) => {
    expect(readMoney(amount, code)).toBe(text);
  });
});

describe('readMoney – chuẩn hóa & tiền tệ', () => {
  it('trim + viết hoa mã tiền tệ', () => {
    expect(readMoney(24, ' vnd ')).toBe('Hai mươi tư đồng');
    expect(readMoney(5, 'sgd')).toBe('Năm đô la Singapore');
  });

  it('không đọc được → CURRENCY_NOT_FOUND', () => {
    expectError(() => readMoney(1, 'XYZ'), 'CURRENCY_NOT_FOUND');
    expectError(() => readMoney(1, ''), 'CURRENCY_NOT_FOUND');
  });

  it('bản ghi inactive không có hiệu lực', () => {
    const reader = createMoneyReader({
      currencies: DEFAULT_CURRENCIES.map((c) => (c.currency_code === 'USD' ? { ...c, active: false } : c)),
    });
    expectError(() => reader.read(1, 'USD'), 'CURRENCY_NOT_FOUND');
    expect(reader.getCurrency('usd')).toBeUndefined();
    expect(reader.listCurrencies().map((c) => c.currency_code)).not.toContain('USD');
  });

  it('mã trùng: lấy bản ghi active, bỏ bản inactive', () => {
    const base = DEFAULT_CURRENCIES.find((c) => c.currency_code === 'USD')!;
    const reader = createMoneyReader({
      currencies: [
        { ...base, currency_name: 'cũ', active: false },
        { ...base, currency_code: ' usd ', currency_name: 'đô la Mỹ' },
      ],
    });
    expect(reader.read(2, 'USD')).toBe('Hai đô la Mỹ');
  });
});

describe('readMoney – phần nguyên', () => {
  it.each<[number | string | bigint, string, string]>([
    [0, 'VND', 'Không đồng'],
    [21, 'USD', 'Hai mươi mốt đô la Mỹ'],
    [14, 'VND', 'Mười bốn đồng'],
    [15, 'VND', 'Mười lăm đồng'],
    [101, 'VND', 'Một trăm lẻ một đồng'],
    [1000, 'VND', 'Một nghìn đồng'],
    [1_000_050, 'VND', 'Một triệu không trăm năm mươi đồng'],
    [24_000_000, 'VND', 'Hai mươi tư triệu đồng'],
    [24_000_000, 'USD', 'Hai mươi bốn triệu đô la Mỹ'],
    ['1000000000000', 'VND', 'Một nghìn tỷ đồng'],
    [10n ** 18n, 'VND', 'Một tỷ tỷ đồng'],
  ])('%s %s → %s', (amount, code, text) => {
    expect(readMoney(amount, code)).toBe(text);
  });
});

describe('readMoney – phần thập phân', () => {
  it('READ: đọc phần lẻ theo scale, số ít / số nhiều', () => {
    expect(readMoney('0.01', 'GBP')).toBe('Không bảng Anh và một penny');
    expect(readMoney('0.5', 'USD')).toBe('Không đô la Mỹ và năm mươi cent');
    expect(readMoney('10.05', 'USD')).toBe('Mười đô la Mỹ và năm cent');
    expect(readMoney('10.15', 'EUR')).toBe('Mười euro và mười lăm cent');
    expect(readMoney('21.21', 'USD')).toBe('Hai mươi mốt đô la Mỹ và hai mươi mốt cent');
    expect(readMoney('1.24', 'SGD')).toBe('Một đô la Singapore và hai mươi bốn cent');
  });

  it('READ: phần lẻ bằng 0 thì không ghép "và"', () => {
    expect(readMoney('12.00', 'USD')).toBe('Mười hai đô la Mỹ');
    expect(readMoney(12, 'USD')).toBe('Mười hai đô la Mỹ');
    expect(readMoney('12.500', 'USD')).toBe('Mười hai đô la Mỹ và năm mươi cent');
  });

  it('READ: vượt scale → DECIMAL_SCALE_EXCEEDED (không làm tròn)', () => {
    expectError(() => readMoney('0.501', 'USD'), 'DECIMAL_SCALE_EXCEEDED');
    expectError(() => readMoney(0.501, 'USD'), 'DECIMAL_SCALE_EXCEEDED');
  });

  it('READ + decimal_allowed = false: kiểm tra scale nhưng không đọc phần lẻ', () => {
    const reader = createMoneyReader({
      currencies: [
        {
          currency_code: 'USD',
          currency_name: 'đô la Mỹ',
          decimal_handling: 'READ',
          decimal_scale: 2,
          decimal_allowed: false,
          active: true,
        },
      ],
    });
    expect(reader.read('12.34', 'USD')).toBe('Mười hai đô la Mỹ');
    expectError(() => reader.read('12.345', 'USD'), 'DECIMAL_SCALE_EXCEEDED');
  });

  it('IGNORE: bỏ qua phần lẻ', () => {
    expect(readMoney('12.75', 'JPY')).toBe('Mười hai yên Nhật');
    expect(readMoney('24.999', 'VND')).toBe('Hai mươi tư đồng');
  });

  it('REJECT: phần lẻ khác 0 → DECIMAL_REJECTED', () => {
    const reader = createMoneyReader({
      currencies: [
        {
          currency_code: 'KRW',
          currency_name: 'won Hàn Quốc',
          decimal_handling: 'REJECT',
          decimal_scale: 0,
          decimal_allowed: false,
          active: true,
        },
      ],
    });
    expect(reader.read('100', 'KRW')).toBe('Một trăm won Hàn Quốc');
    expect(reader.read('100.00', 'KRW')).toBe('Một trăm won Hàn Quốc');
    expectError(() => reader.read('100.5', 'KRW'), 'DECIMAL_REJECTED');
  });

  it('READ thiếu đơn vị lẻ → MINOR_UNIT_MISSING', () => {
    const usd = DEFAULT_CURRENCIES.find((c) => c.currency_code === 'USD')!;
    const reader = createMoneyReader({ currencies: [{ ...usd, minor_unit_plural: '' }] });
    expectError(() => reader.read('1.50', 'USD'), 'MINOR_UNIT_MISSING');
  });

  it('cấu hình sai → INVALID_CONFIG', () => {
    const usd = DEFAULT_CURRENCIES.find((c) => c.currency_code === 'USD')!;
    const bad = (patch: Partial<CurrencyConfig>) =>
      createMoneyReader({ currencies: [{ ...usd, ...patch } as CurrencyConfig] });
    expectError(() => bad({ decimal_handling: 'ROUND' as never }).read(1, 'USD'), 'INVALID_CONFIG');
    expectError(() => bad({ decimal_scale: -1 }).read(1, 'USD'), 'INVALID_CONFIG');
    expectError(() => bad({ currency_name: ' ' }).read(1, 'USD'), 'INVALID_CONFIG');
  });
});

describe('Đầu vào số tiền', () => {
  it('chuỗi với dấu phân cách', () => {
    expect(readMoney('1,005,001', 'VND')).toBe('Một triệu không trăm linh năm nghìn không trăm lẻ một đồng');
    expect(readMoney('1.005.001', 'VND', { decimalSeparator: ',' })).toBe(
      'Một triệu không trăm linh năm nghìn không trăm lẻ một đồng',
    );
    expect(readMoney('12,02', 'GBP', { decimalSeparator: ',' })).toBe('Mười hai bảng Anh và hai pence');
    expect(readMoney(' 1 000 000 ', 'VND')).toBe('Một triệu đồng');
  });

  it('nhóm phân cách sai → INVALID_AMOUNT (không đoán "12,01" thành 1201)', () => {
    expectError(() => readMoney('12,01', 'GBP'), 'INVALID_AMOUNT');
  });

  it('giá trị không hợp lệ → INVALID_AMOUNT', () => {
    for (const bad of [-1, NaN, Infinity, '-5', 'abc', '', '.', '1.2.3', -1n]) {
      expectError(() => readMoney(bad as never, 'VND'), 'INVALID_AMOUNT');
    }
  });

  it('parseAmount xử lý số dạng mũ & không lỗi float', () => {
    expect(parseAmount(1e21)).toEqual({ integer: '1000000000000000000000', fraction: '' });
    expect(parseAmount(1e-7)).toEqual({ integer: '0', fraction: '0000001' });
    expect(parseAmount(0.1 + 0.2)).toEqual({ integer: '0', fraction: '30000000000000004' });
    expect(parseAmount('007.50')).toEqual({ integer: '7', fraction: '5' });
  });
});

describe('safeReadMoney', () => {
  it('trả kết quả thay vì ném lỗi', () => {
    expect(safeReadMoney(24, 'VND')).toEqual({ ok: true, text: 'Hai mươi tư đồng' });
    const res = safeReadMoney(1, 'XYZ');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CURRENCY_NOT_FOUND');
  });
});

describe('readMoney – Tiếng Anh (lang: "en")', () => {
  it.each<[number | string, string, string]>([
    [1, 'USD', 'One US dollar'],
    [2, 'USD', 'Two US dollars'],
    [105.01, 'USD', 'One hundred five US dollars and one cent'],
    [105.50, 'USD', 'One hundred five US dollars and fifty cents'],
    [1, 'GBP', 'One pound'],
    [12.01, 'GBP', 'Twelve pounds and one penny'],
    [12.02, 'GBP', 'Twelve pounds and two pence'],
    [1, 'EUR', 'One euro'],
    [100, 'EUR', 'One hundred euros'],
    [12.75, 'JPY', 'Twelve yen'],
    [1000, 'VND', 'One thousand dong'],
    [1, 'SGD', 'One Singapore dollar'],
    [5, 'SGD', 'Five Singapore dollars'],
  ])('%s %s (en) → %s', (amount, code, text) => {
    expect(readMoney(amount, code, { lang: 'en' })).toBe(text);
  });

  it('custom Master Data fallback khi thiếu tên Tiếng Anh', () => {
    const reader = createMoneyReader({
      currencies: [
        {
          currency_code: 'MYR',
          currency_name: 'ringgit Malaysia',
          decimal_handling: 'READ',
          decimal_scale: 2,
          decimal_allowed: true,
          minor_unit_singular: 'sen',
          minor_unit_plural: 'sen',
          active: true,
        },
      ],
    });
    expect(reader.read(100, 'MYR', { lang: 'en' })).toBe('One hundred MYR');
    expect(reader.read('100.50', 'MYR', { lang: 'en' })).toBe('One hundred MYR and fifty sen');
  });

  it('dùng lang mặc định của reader và cho phép ghi đè theo từng lần đọc', () => {
    const reader = createMoneyReader({ lang: 'en' });
    expect(reader.read(2, 'USD')).toBe('Two US dollars');
    expect(reader.read(2, 'USD', { lang: 'vi' })).toBe('Hai đô la Mỹ');
  });

  it('từ chối lang không hợp lệ ở cấu hình reader và tùy chọn đọc', () => {
    expectError(() => createMoneyReader({ lang: 'fr' as never }), 'INVALID_CONFIG');
    const reader = createMoneyReader();
    expectError(() => reader.read(1, 'USD', { lang: 'fr' as never }), 'INVALID_CONFIG');
  });

  it('plural unit fallback dùng minor_unit_plural khi thiếu tên plural tiếng Anh', () => {
    const reader = createMoneyReader({
      currencies: [
        {
          currency_code: 'MYR',
          currency_name: 'ringgit Malaysia',
          decimal_handling: 'READ',
          decimal_scale: 2,
          decimal_allowed: true,
          minor_unit_singular: 'sen',
          minor_unit_plural: 'sens',
          minor_unit_singular_en: 'sen',
          active: true,
        },
      ],
    });
    expect(reader.read('1.02', 'MYR', { lang: 'en' })).toBe('One MYR and two sens');
  });

  it('đọc decimal separator kiểu comma, số dạng mũ, IGNORE và REJECT bằng tiếng Anh', () => {
    expect(readMoney('1.234,50', 'USD', { lang: 'en', decimalSeparator: ',' })).toBe(
      'One thousand two hundred thirty-four US dollars and fifty cents',
    );
    expect(readMoney(1e21, 'USD', { lang: 'en' })).toBe('One sextillion US dollars');
    expect(readMoney('12.75', 'JPY', { lang: 'en' })).toBe('Twelve yen');

    const reader = createMoneyReader({
      currencies: [
        {
          currency_code: 'KRW',
          currency_name: 'won Hàn Quốc',
          currency_name_en: 'won',
          currency_name_en_plural: 'won',
          decimal_handling: 'REJECT',
          decimal_scale: 0,
          decimal_allowed: false,
          active: true,
        },
      ],
    });
    expect(reader.read('100.00', 'KRW', { lang: 'en' })).toBe('One hundred won');
    expectError(() => reader.read('100.5', 'KRW', { lang: 'en' }), 'DECIMAL_REJECTED');
  });

  it('lấy decimal separator theo từng currency từ Master Data, cho phép override theo lần đọc', () => {
    const usd = DEFAULT_CURRENCIES.find((currency) => currency.currency_code === 'USD')!;
    const reader = createMoneyReader({ currencies: [{ ...usd, decimal_separator: ',' }] });

    expect(reader.read('1.234,50', 'USD', { lang: 'en' })).toBe(
      'One thousand two hundred thirty-four US dollars and fifty cents',
    );
    expect(reader.read('1,234.50', 'USD', { lang: 'en', decimalSeparator: '.' })).toBe(
      'One thousand two hundred thirty-four US dollars and fifty cents',
    );
  });

  it('từ chối decimal_separator sai trong Master Data', () => {
    const usd = DEFAULT_CURRENCIES.find((currency) => currency.currency_code === 'USD')!;
    const reader = createMoneyReader({ currencies: [{ ...usd, decimal_separator: ';' as never }] });
    expectError(() => reader.read('1.00', 'USD'), 'INVALID_CONFIG');
  });

  it('chuyển số nguyên vượt giới hạn tiếng Anh thành MoneyReaderError', () => {
    const res = safeReadMoney(`1${'0'.repeat(36)}`, 'USD', { lang: 'en' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBeInstanceOf(MoneyReaderError);
      expect(res.error.code).toBe('INVALID_AMOUNT');
      expect(res.error.message).toContain('largest English scale is decillion');
    }
  });

  it('localized error messages khi lang: "en"', () => {
    const res = safeReadMoney(1, 'XYZ', { lang: 'en' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('CURRENCY_NOT_FOUND');
      expect(res.error.message).toContain('No active currency configuration found for code "XYZ"');
    }

    const resInvalid = safeReadMoney(-10, 'USD', { lang: 'en' });
    expect(resInvalid.ok).toBe(false);
    if (!resInvalid.ok) {
      expect(resInvalid.error.code).toBe('INVALID_AMOUNT');
      expect(resInvalid.error.message).toContain('negative amounts are not supported');
    }
  });
});
