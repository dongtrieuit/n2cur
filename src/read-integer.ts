/**
 * Logic đọc số nguyên tiếng Việt – CỐ ĐỊNH trong mã nguồn, không cấu hình qua danh mục (mục 4 & 8).
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'] as const;
const BASE_SCALES = ['', 'nghìn', 'triệu'] as const;

export interface ReadIntegerOptions {
  /**
   * Áp dụng quy tắc riêng của VND:
   * - "tư" thay cho "bốn" khi hàng chục > 1 (24 → hai mươi tư).
   * - "lẻ" thay cho "linh" ở nhóm đơn vị tận cùng bên phải (105 → một trăm lẻ năm).
   */
  vndStyle?: boolean;
}

const digit = (n: number): string => DIGITS[n] as string;

/**
 * Tên bậc cho cụm thứ `index` (0 = cụm đơn vị, tính từ phải):
 * "", nghìn, triệu, tỷ, nghìn tỷ, triệu tỷ, tỷ tỷ, nghìn tỷ tỷ...
 */
export function scaleName(index: number): string {
  const parts: string[] = [];
  const base = BASE_SCALES[index % 3];
  if (base) parts.push(base);
  for (let i = 0; i < Math.floor(index / 3); i++) parts.push('tỷ');
  return parts.join(' ');
}

interface GroupContext {
  /** Đã đọc một nhóm bậc cao hơn trước đó => bắt buộc đọc đủ hàng trăm. */
  full: boolean;
  /** Đây là nhóm đơn vị tận cùng bên phải. */
  isUnitGroup: boolean;
  vndStyle: boolean;
}

/** Đọc một nhóm 3 chữ số H/T/U (giá trị > 0). */
function readGroup(h: number, t: number, u: number, ctx: GroupContext): string[] {
  const words: string[] = [];

  // Hàng trăm
  if (h > 0 || ctx.full) words.push(digit(h), 'trăm');

  // Hàng chục + hàng đơn vị
  if (t === 0) {
    if (u > 0) {
      if (words.length > 0) words.push(ctx.vndStyle && ctx.isUnitGroup ? 'lẻ' : 'linh');
      words.push(digit(u)); // sau linh/lẻ hoặc đứng đầu: một / bốn / năm
    }
  } else if (t === 1) {
    words.push('mười');
    if (u === 5) words.push('lăm');
    else if (u > 0) words.push(digit(u)); // mười một, mười bốn
  } else {
    words.push(digit(t), 'mươi');
    if (u === 1) words.push('mốt');
    else if (u === 4) words.push(ctx.vndStyle ? 'tư' : 'bốn');
    else if (u === 5) words.push('lăm');
    else if (u > 0) words.push(digit(u));
  }

  return words;
}

/**
 * Đọc chuỗi chữ số nguyên không âm (vd "1005001") thành chữ tiếng Việt (chữ thường).
 * Đầu vào phải chỉ gồm chữ số.
 */
export function readDigitsVi(digits: string, options: ReadIntegerOptions = {}): string {
  if (!/^\d+$/.test(digits)) throw new TypeError(`Chuỗi số không hợp lệ: "${digits}"`);
  const normalized = digits.replace(/^0+(?=\d)/, '');
  if (/^0+$/.test(normalized)) return digit(0);

  const vndStyle = options.vndStyle === true;

  // Chia nhóm 3 chữ số từ phải sang trái.
  const padded = normalized.padStart(Math.ceil(normalized.length / 3) * 3, '0');
  const groupCount = padded.length / 3;

  const words: string[] = [];
  for (let g = 0; g < groupCount; g++) {
    const index = groupCount - 1 - g; // vị trí cụm tính từ phải
    const chunk = padded.slice(g * 3, g * 3 + 3);
    const h = Number(chunk[0]);
    const t = Number(chunk[1]);
    const u = Number(chunk[2]);
    if (h === 0 && t === 0 && u === 0) continue; // bỏ qua nhóm 000

    words.push(...readGroup(h, t, u, { full: words.length > 0, isUnitGroup: index === 0, vndStyle }));
    const scale = scaleName(index);
    if (scale) words.push(scale);
  }

  return words.join(' ');
}

/**
 * Đọc số nguyên không âm thành chữ tiếng Việt (chữ thường, không kèm đơn vị tiền).
 * @example readInteger(1005001, { vndStyle: true }) // "một triệu không trăm linh năm nghìn không trăm lẻ một"
 */
export function readInteger(value: number | bigint | string, options: ReadIntegerOptions = {}): string {
  let digits: string;
  if (typeof value === 'bigint') {
    if (value < 0n) throw new RangeError('Không hỗ trợ số âm');
    digits = value.toString();
  } else if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError('Giá trị number phải là số nguyên không âm an toàn; dùng bigint/string cho số lớn');
    }
    digits = String(value);
  } else {
    digits = value.trim();
  }
  return readDigitsVi(digits, options);
}
