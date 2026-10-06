export type MoneyReaderErrorCode =
  | 'CURRENCY_NOT_FOUND'
  | 'INVALID_AMOUNT'
  | 'DECIMAL_REJECTED'
  | 'DECIMAL_SCALE_EXCEEDED'
  | 'MINOR_UNIT_MISSING'
  | 'INVALID_CONFIG';

/** Lỗi nghiệp vụ khi đọc số tiền. Dùng `code` để xử lý/hiển thị thông báo phù hợp. */
export class MoneyReaderError extends Error {
  readonly code: MoneyReaderErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: MoneyReaderErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'MoneyReaderError';
    this.code = code;
    this.details = details;
    // Giữ đúng prototype khi transpile xuống ES5.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isMoneyReaderError(err: unknown): err is MoneyReaderError {
  return err instanceof MoneyReaderError;
}
