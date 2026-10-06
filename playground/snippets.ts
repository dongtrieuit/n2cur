export interface CodeStep {
  title: string;
  file?: string;
  code: string;
}

export interface FrameworkGuide {
  id: string;
  label: string;
  desc: string;
  gifUrl: string;
  steps: CodeStep[];
}

export const FRAMEWORK_GUIDES: FrameworkGuide[] = [
  {
    id: 'react',
    label: 'React',
    desc: 'Hướng dẫn cài đặt và sử dụng n2cur trong ứng dụng React (Next.js, Vite, CRA).',
    gifUrl: '/assets/react-demo.png',
    steps: [
      {
        title: 'Bước 1: Cài đặt thư viện n2cur qua npm',
        file: 'Terminal',
        code: `npm install n2cur`,
      },
      {
        title: 'Bước 2: Tạo Component hiển thị số tiền thành chữ',
        file: 'AmountInWords.tsx',
        code: `import { useMemo } from 'react';
import { readMoney, createMoneyReader, type CurrencyConfig } from 'n2cur';

export function AmountInWords({ amount, currency = 'VND', currencies }: {
  amount: string | number;
  currency?: string;
  currencies?: CurrencyConfig[];
}) {
  const reader = useMemo(() => createMoneyReader({ currencies }), [currencies]);
  const res = reader.safeRead(amount, currency);

  if (!res.ok) return <span className="error">{res.error.message}</span>;
  return <span className="amount-words">{res.text}</span>;
}`,
      },
      {
        title: 'Bước 3: Sử dụng Component trong Giao diện',
        file: 'App.tsx',
        code: `import { AmountInWords } from './AmountInWords';

export default function App() {
  return (
    <div>
      <p>Tổng tiền: <AmountInWords amount="1005001" currency="VND" /></p>
    </div>
  );
}`,
      },
      {
        title: 'Bước 4: Tùy chỉnh Master Data từ API Backend (Tùy chọn)',
        file: 'Checkout.tsx',
        code: `// Nạp danh mục tiền tệ từ Backend API
const currencies = await fetch('/api/currencies').then(r => r.json());

// Truyền prop currencies vào Component
<AmountInWords amount="50.5" currency="USD" currencies={currencies} />`,
      },
    ],
  },
  {
    id: 'angular',
    label: 'Angular',
    desc: 'Hướng dẫn tạo Standalone Pipe sử dụng trực tiếp trong Angular Template.',
    gifUrl: '/assets/angular-demo.png',
    steps: [
      {
        title: 'Bước 1: Cài đặt thư viện n2cur',
        file: 'Terminal',
        code: `npm install n2cur`,
      },
      {
        title: 'Bước 2: Tạo Standalone Pipe chuyển đổi số tiền',
        file: 'money-words.pipe.ts',
        code: `import { Pipe, PipeTransform } from '@angular/core';
import { safeReadMoney } from 'n2cur';

@Pipe({
  name: 'moneyWords',
  standalone: true
})
export class MoneyWordsPipe implements PipeTransform {
  transform(amount: string | number | null | undefined, currency = 'VND'): string {
    if (amount === null || amount === undefined || amount === '') return '';
    const res = safeReadMoney(amount, currency);
    return res.ok ? res.text : '';
  }
}`,
      },
      {
        title: 'Bước 3: Khai báo và dùng trong Angular Template',
        file: 'app.component.ts & app.component.html',
        code: `// app.component.ts
import { Component } from '@angular/core';
import { MoneyWordsPipe } from './money-words.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MoneyWordsPipe],
  template: \`<p>Thành tiền: {{ totalAmount | moneyWords:'VND' }}</p>\`
})
export class AppComponent {
  totalAmount = 1005001;
}`,
      },
      {
        title: 'Bước 4: Tùy chỉnh Master Data qua Angular Service (Tùy chọn)',
        file: 'money-reader.service.ts',
        code: `import { Injectable } from '@angular/core';
import { createMoneyReader, type CurrencyConfig } from 'n2cur';

@Injectable({ providedIn: 'root' })
export class MoneyReaderService {
  createReader(currencies: CurrencyConfig[]) {
    return createMoneyReader({ currencies });
  }
}`,
      },
    ],
  },
  {
    id: 'vue',
    label: 'Vue 3',
    desc: 'Hướng dẫn tích hợp n2cur với Vue 3 Composition API.',
    gifUrl: '/assets/vue-demo.png',
    steps: [
      {
        title: 'Bước 1: Cài đặt thư viện n2cur',
        file: 'Terminal',
        code: `npm install n2cur`,
      },
      {
        title: 'Bước 2: Tạo Component chuyển đổi số tiền',
        file: 'AmountWords.vue',
        code: `<script setup lang="ts">
import { computed } from 'vue';
import { safeReadMoney } from 'n2cur';

const props = defineProps<{
  amount: string | number;
  currency?: string;
}>();

const text = computed(() => {
  const res = safeReadMoney(props.amount, props.currency || 'VND');
  return res.ok ? res.text : res.error.message;
});
</script>

<template>
  <span class="money-text">{{ text }}</span>
</template>`,
      },
      {
        title: 'Bước 3: Sử dụng Component trong App Vue',
        file: 'App.vue',
        code: `<script setup lang="ts">
import AmountWords from './AmountWords.vue';
</script>

<template>
  <p>Tổng tiền: <AmountWords amount="1005001" currency="VND" /></p>
</template>`,
      },
      {
        title: 'Bước 4: Tùy chỉnh Master Data (Tùy chọn)',
        file: 'useCurrencies.ts',
        code: `import { createMoneyReader } from 'n2cur';

const apiCurrencies = await fetch('/api/currencies').then(r => r.json());
const reader = createMoneyReader({ currencies: apiCurrencies });`,
      },
    ],
  },
  {
    id: 'basic',
    label: 'Vanilla JS / TS',
    desc: 'Hướng dẫn sử dụng trực tiếp trong Node.js hoặc JavaScript/TypeScript thuần.',
    gifUrl: '/assets/vanilla-demo.png',
    steps: [
      {
        title: 'Bước 1: Cài đặt gói n2cur',
        file: 'Terminal',
        code: `npm install n2cur`,
      },
      {
        title: 'Bước 2: Import và đọc số tiền',
        file: 'main.ts',
        code: `import { readMoney, safeReadMoney } from 'n2cur';

// Đọc nhanh với cấu hình mặc định (VND, USD, EUR, GBP, JPY, SGD)
console.log(readMoney(24, 'VND'));        // "Hai mươi tư đồng"
console.log(readMoney('12.02', 'GBP'));   // "Mười hai bảng Anh và hai pence"

// Safe read không ném exception khi nhập sai
const res = safeReadMoney(100, 'USD');
if (res.ok) console.log(res.text);`,
      },
      {
        title: 'Bước 3: Định dạng thập phân kiểu Việt Nam (dấu phẩy ",")',
        file: 'custom-sep.ts',
        code: `import { readMoney } from 'n2cur';

// Truyền decimalSeparator là ',' khi nhận chuỗi có dấu phẩy
readMoney('1.005.001,25', 'USD', { decimalSeparator: ',' });
// -> "Một triệu không trăm linh năm đô la Mỹ và hai mươi lăm cent"`,
      },
      {
        title: 'Bước 4: Tùy chỉnh Master Data từ API',
        file: 'custom-master.ts',
        code: `import { createMoneyReader } from 'n2cur';

const currencies = await fetch('/api/currencies').then(r => r.json());
const reader = createMoneyReader({ currencies });
console.log(reader.read('100', 'USD'));`,
      },
    ],
  },
  {
    id: 'cdn',
    label: 'CDN / HTML',
    desc: 'Nhúng trực tiếp qua thẻ script trên trang HTML không cần build tool.',
    gifUrl: '/assets/cdn-demo.png',
    steps: [
      {
        title: 'Bước 1: Nhúng thư viện n2cur qua CDN unpkg',
        file: 'index.html',
        code: `<script src="https://unpkg.com/n2cur/dist/n2cur.global.js"></script>`,
      },
      {
        title: 'Bước 2: Sử dụng qua biến toàn cục window.N2Cur',
        file: 'script.js',
        code: `<script>
  // Đọc số tiền mặc định
  const text = N2Cur.readMoney(1005001, 'VND');
  document.getElementById('total-text').textContent = text;
  // -> "Một triệu không trăm linh năm nghìn không trăm lẻ một đồng"
</script>`,
      },
      {
        title: 'Bước 3: Tùy chỉnh Master Data với N2Cur.createMoneyReader',
        file: 'custom-cdn.js',
        code: `<script>
  const reader = N2Cur.createMoneyReader({ currencies: myApiCurrencies });
  console.log(reader.read(50, 'USD'));
</script>`,
      },
    ],
  },
];

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TOKEN =
  /(\/\/.*$|<!--[\s\S]*?-->)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`]*`)|\b(import|from|export|default|const|let|var|function|return|await|async|new|class|implements|if|else|try|catch|throw|type|private|interface|npm|yarn|pnpm|install|add)\b|\b(\d+(?:\.\d+)?|true|false|null)\b|(@\w+)/gm;

/** Tô màu cú pháp đơn giản cho đoạn code mẫu. */
export function highlight(code: string): string {
  let out = '';
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    const index = m.index ?? 0;
    out += escapeHtml(code.slice(last, index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : 'd';
    out += `<span class="${cls}">${escapeHtml(m[0])}</span>`;
    last = index + m[0].length;
  }
  return out + escapeHtml(code.slice(last));
}
