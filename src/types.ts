/**
 * Chế độ xử lý phần lẻ thập phân (Decimal Handling).
 * - READ:   Quy đổi phần lẻ theo `decimal_scale` và đọc kèm đơn vị lẻ (nếu `decimal_allowed`).
 * - IGNORE: Bỏ qua phần lẻ, chỉ đọc phần nguyên.
 * - REJECT: Báo lỗi nếu phần lẻ khác 0.
 */
export type DecimalHandling = 'READ' | 'IGNORE' | 'REJECT';

/**
 * Bản ghi danh mục tiền tệ (Master Data).
 * Tên trường giữ nguyên dạng snake_case như danh mục để FE có thể truyền thẳng dữ liệu từ API.
 */
export interface CurrencyConfig {
  /** Mã ISO 4217 (VND, USD...). Tự động trim + viết hoa khi tra cứu. */
  currency_code: string;
  /** Tên tiếng Việt của đơn vị chính (đồng, đô la Mỹ...). */
  currency_name: string;
  /** Cách xử lý phần lẻ. */
  decimal_handling: DecimalHandling;
  /** Số chữ số phần lẻ chuẩn (2 = nhân 100). */
  decimal_scale: number;
  /** Cho phép đọc phần lẻ ra văn bản. */
  decimal_allowed: boolean;
  /** Tên đơn vị lẻ khi giá trị lẻ = 1 (penny, cent). */
  minor_unit_singular?: string | null;
  /** Tên đơn vị lẻ khi giá trị lẻ > 1 (pence, cent). */
  minor_unit_plural?: string | null;
  /** Chỉ bản ghi active = true mới có hiệu lực. */
  active: boolean;
}

/** Kiểu số tiền đầu vào. Ưu tiên `string`/`bigint` cho số lớn hoặc cần chính xác tuyệt đối. */
export type AmountInput = number | bigint | string;

export interface ReadOptions {
  /**
   * Dấu thập phân khi đầu vào là chuỗi. Mặc định `'.'`.
   * - `'.'`: `"1005001.25"` hoặc `"1,005,001.25"` (dấu `,` là phân cách nghìn).
   * - `','`: `"1.005.001,25"` (dấu `.` là phân cách nghìn).
   */
  decimalSeparator?: '.' | ',';
}

export interface MoneyReaderOptions {
  /** Danh mục tiền tệ. Mặc định: `DEFAULT_CURRENCIES`. */
  currencies?: readonly CurrencyConfig[];
}
