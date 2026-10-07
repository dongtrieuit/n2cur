# n2cur

<p align="center">
  <img src="./assets/og-image.png" alt="n2cur - Đọc số tiền thành chữ tiếng Việt & Tiếng Anh" width="100%" />
</p>

<p align="center">
  <strong>Thư viện JavaScript / TypeScript đọc số tiền thành chữ tiếng Việt &amp; Tiếng Anh chuẩn xác 100%</strong><br>
  Hỗ trợ <strong>React</strong>, <strong>Angular</strong>, <strong>Vue 3</strong>, <strong>Vanilla JS / Node.js</strong> và nhúng <strong>CDN</strong>.
</p>

<p align="center">
  <a href="https://github.com/dongtrieuit/n2cur"><img src="https://img.shields.io/github/license/dongtrieuit/n2cur?color=4f46e5" alt="License" /></a>
  <a href="https://www.npmjs.com/package/n2cur"><img src="https://img.shields.io/npm/v/n2cur?color=0891b2" alt="Version" /></a>
  <a href="https://github.com/dongtrieuit/n2cur"><img src="https://img.shields.io/badge/types-TypeScript-blue" alt="TypeScript" /></a>
  <a href="https://github.com/dongtrieuit/n2cur"><img src="https://img.shields.io/badge/author-dongtrieuit-111827" alt="Author" /></a>
</p>

<p align="center">
  <a href="https://n2cur.dts.io.vn/" target="_blank"><strong>Website Demo Dùng Thử Trực Tuyến: https://n2cur.dts.io.vn/</strong></a>
</p>

> Đang làm tính năng hóa đơn/thanh toán mà đau đầu vụ đọc số tiền thành chữ? Thôi đừng tự code lại nữa mấy bác! Bộ quy tắc trong n2cur đã được tối ưu qua vô số vòng nghiệm thu khó tính từ BU ngân hàng. Cài 1 dòng `npm i n2cur` là xong ngay!

---

## Tính năng nổi bật

- **Siêu nhẹ & Zero-Dependency**: Chỉ ~12 KB không phụ thuộc bất kỳ thư viện bên thứ ba nào.
- **Chính xác 100% tiếng Việt & Tiếng Anh (`lang: 'en'`)**:
  - Tiếng Việt: Đọc chuẩn các quy tắc `"không trăm"`, `"linh/lẻ"`, `"mốt/tư/lăm"`, chu kỳ `"tỷ tỷ"` lặp lại.
  - Tiếng Anh (`lang: 'en'`): Đọc chuẩn theo US Short Scale (`hundred`, `thousand`, `million`, `billion`... lên tới `decillion` $10^{33}$), tự động số ít/số nhiều (`US dollar`/`US dollars`, `cent`/`cents`, `penny`/`pence`).
- **Master Data API Linh hoạt**: Nạp và tùy biến danh mục tiền tệ (VND, USD, EUR, GBP, JPY, SGD...) động từ Backend API.
- **An toàn kiểu dữ liệu (Type-Safe)**: Hỗ trợ TypeScript type-defs đầy đủ, xử lý `BigInt` và số thực cực lớn mà không mất độ chính xác.
- **Đa nền tảng**: Hoạt động mượt mà trên React, Angular, Vue 3, Next.js, Nuxt, Node.js và trình duyệt qua CDN.

---

## Hướng dẫn cài đặt & tích hợp từng bước

### 1. React (Next.js / Vite / CRA)

<p align="center">
  <img src="./assets/react-demo.png" alt="React iMac M4 Setup Demo" width="100%" />
</p>

#### Bước 1: Cài đặt gói `n2cur`
```bash
npm install n2cur
```

#### Bước 2: Tạo Component đọc số tiền (`AmountInWords.tsx`)
```tsx
import { useMemo } from 'react';
import { createMoneyReader, type CurrencyConfig } from 'n2cur';

export function AmountInWords({ amount, currency = 'VND', lang = 'vi', currencies }: {
  amount: string | number;
  currency?: string;
  lang?: 'vi' | 'en';
  currencies?: CurrencyConfig[];
}) {
  const reader = useMemo(() => createMoneyReader({ currencies }), [currencies]);
  const res = reader.safeRead(amount, currency, { lang });

  if (!res.ok) return <span className="error">{res.error.message}</span>;
  return <span>{res.text}</span>;
}
```

#### Bước 3: Sử dụng trong App
```tsx
import { AmountInWords } from './AmountInWords';

export default function App() {
  return (
    <div>
      <p>Tiếng Việt: <AmountInWords amount="1005001" currency="VND" /></p>
      <p>English: <AmountInWords amount="105.50" currency="USD" lang="en" /></p>
    </div>
  );
}
```

#### Bước 4: Tùy chỉnh Master Data từ API (Tùy chọn)
```tsx
const currencies = await fetch('/api/currencies').then(r => r.json());
<AmountInWords amount="50.5" currency="USD" currencies={currencies} />
```

---

### 2. Angular (Component / Standalone Pipe)

<p align="center">
  <img src="./assets/angular-demo.png" alt="Angular iMac M4 Setup Demo" width="100%" />
</p>

#### Bước 1: Cài đặt gói `n2cur`
```bash
npm install n2cur
```

#### Bước 2: Tạo Standalone Pipe (`money-words.pipe.ts`)
```ts
import { Pipe, PipeTransform } from '@angular/core';
import { safeReadMoney, type Lang } from 'n2cur';

@Pipe({
  name: 'moneyWords',
  standalone: true
})
export class MoneyWordsPipe implements PipeTransform {
  transform(amount: string | number | null | undefined, currency = 'VND', lang: Lang = 'vi'): string {
    if (amount === null || amount === undefined || amount === '') return '';
    const res = safeReadMoney(amount, currency, { lang });
    return res.ok ? res.text : '';
  }
}
```

#### Bước 3: Sử dụng trong HTML Template
```html
<p>Thành tiền (VI): {{ totalAmount | moneyWords:'VND':'vi' }}</p>
<p>Total (EN): {{ totalAmount | moneyWords:'USD':'en' }}</p>
```

---

### 3. Vue 3 (Composition API)

<p align="center">
  <img src="./assets/vue-demo.png" alt="Vue 3 iMac M4 Setup Demo" width="100%" />
</p>

#### Bước 1: Cài đặt gói `n2cur`
```bash
npm install n2cur
```

#### Bước 2: Tạo Component (`AmountWords.vue`)
```vue
<script setup lang="ts">
import { computed } from 'vue';
import { safeReadMoney, type Lang } from 'n2cur';

const props = withDefaults(defineProps<{
  amount: string | number;
  currency?: string;
  lang?: Lang;
}>(), {
  currency: 'VND',
  lang: 'vi',
});

const text = computed(() => {
  const res = safeReadMoney(props.amount, props.currency, { lang: props.lang });
  return res.ok ? res.text : res.error.message;
});
</script>

<template>
  <span>{{ text }}</span>
</template>
```

---

### 4. Vanilla JavaScript & TypeScript

<p align="center">
  <img src="./assets/vanilla-demo.png" alt="Vanilla JS iMac M4 Setup Demo" width="100%" />
</p>

#### Bước 1: Cài đặt gói `n2cur`
```bash
npm install n2cur
```

#### Bước 2: Đọc số tiền trực tiếp (Tiếng Việt & Tiếng Anh)
```ts
import { readMoney, safeReadMoney } from 'n2cur';

// 1. Đọc Tiếng Việt (mặc định)
console.log(readMoney(1005001, 'VND')); 
// -> "Một triệu không trăm linh năm nghìn không trăm lẻ một đồng"

console.log(readMoney('12.02', 'GBP'));  
// -> "Mười hai bảng Anh và hai pence"

// 2. Đọc Tiếng Anh (English reading support)
console.log(readMoney(105.50, 'USD', { lang: 'en' }));
// -> "One hundred five US dollars and fifty cents"

console.log(readMoney('12.01', 'GBP', { lang: 'en' }));
// -> "Twelve pounds and one penny"

// Safe read không ném Exception khi nhập dữ liệu lỗi
const res = safeReadMoney(100, 'USD', { lang: 'en' });
if (res.ok) console.log(res.text);
```

#### Bước 3: Đọc phần lẻ có dấu phẩy `,` kiểu Việt Nam
```ts
import { readMoney } from 'n2cur';

readMoney('1.005.001,25', 'USD', { decimalSeparator: ',' });
// -> "Một triệu không trăm linh năm đô la Mỹ và hai mươi lăm cent"
```

---

### 5. Nhúng trực tiếp CDN (HTML)

<p align="center">
  <img src="./assets/cdn-demo.png" alt="CDN iMac M4 Setup Demo" width="100%" />
</p>

#### Bước 1: Nhúng qua CDN `unpkg`
```html
<script src="https://unpkg.com/n2cur/dist/n2cur.global.js"></script>
```

#### Bước 2: Sử dụng qua biến toàn cục `window.N2Cur`
```html
<script>
  // Đọc Tiếng Việt
  const viText = N2Cur.readMoney(1005001, 'VND');
  document.getElementById('total-vi').textContent = viText;

  // Đọc Tiếng Anh
  const enText = N2Cur.readMoney(105.50, 'USD', { lang: 'en' });
  document.getElementById('total-en').textContent = enText;
</script>
```

---

## Cấu hình Master Data tiền tệ (API Schema)

| Trường | Kiểu dữ liệu | Mô tả chi tiết |
| :--- | :--- | :--- |
| `currency_code` | `string` | Mã tiền tệ chuẩn ISO 4217 (`VND`, `USD`, `EUR`...) |
| `currency_name` | `string` | Tên đơn vị chính bằng tiếng Việt (`đồng`, `đô la Mỹ`, `bảng Anh`...) |
| `currency_name_en` | `string?` | Tên đơn vị chính số ít bằng Tiếng Anh (`US dollar`, `pound`, `euro`...) |
| `currency_name_en_plural` | `string?` | Tên đơn vị chính số nhiều bằng Tiếng Anh (`US dollars`, `pounds`...) |
| `decimal_handling` | `'READ' \| 'IGNORE' \| 'REJECT'` | Cách xử lý phần lẻ (`READ`: đọc lẻ, `IGNORE`: bỏ qua, `REJECT`: từ chối) |
| `decimal_scale` | `number` | Số chữ số tối đa phần lẻ (vd: 2 chữ số cent) |
| `decimal_allowed` | `boolean` | Cho phép đọc phần lẻ ra chữ hay không |
| `minor_unit_singular` | `string?` | Đơn vị lẻ số ít tiếng Việt (`cent`, `penny`...) |
| `minor_unit_plural` | `string?` | Đơn vị lẻ số nhiều tiếng Việt (`cents`, `pence`...) |
| `minor_unit_singular_en` | `string?` | Đơn vị lẻ số ít Tiếng Anh (`cent`, `penny`...) |
| `minor_unit_plural_en` | `string?` | Đơn vị lẻ số nhiều Tiếng Anh (`cents`, `pence`...) |
| `active` | `boolean` | Trạng thái kích hoạt (`true` mới có hiệu lực) |

---

## API Reference

### 1. `readMoney(amount, currencyCode, options?)`
Đọc số tiền và trả về chuỗi kết quả. `options.lang` nhận `'vi'` (mặc định) hoặc `'en'`. Ném lỗi `MoneyReaderError` nếu dữ liệu hoặc tiền tệ không hợp lệ.

### 2. `safeReadMoney(amount, currencyCode, options?)`
Đọc số tiền an toàn. Trả về `{ ok: true, text }` hoặc `{ ok: false, error }`.

### 3. `createMoneyReader({ currencies, lang? })`
Tạo instance đọc tiền với danh mục Master Data riêng từ API và thiết lập ngôn ngữ mặc định.

---

## License & Tác giả

Phát triển bởi **[dongtrieuit](https://github.com/dongtrieuit)**.

Mã nguồn mở cấp phép theo giấy phép [MIT License](LICENSE). Repository chính thức: [https://github.com/dongtrieuit/n2cur.git](https://github.com/dongtrieuit/n2cur.git).

