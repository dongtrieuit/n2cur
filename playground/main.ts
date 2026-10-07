import {
  DEFAULT_CURRENCIES,
  createMoneyReader,
  normalizeCurrencyCode,
  type CurrencyConfig,
  type DecimalHandling,
  type MoneyReader,
} from '../src';
import { FRAMEWORK_GUIDES, highlight } from './snippets';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const amountInput = $<HTMLInputElement>('amount-input');
const currencySelect = $<HTMLSelectElement>('currency-select');
const resultBox = $<HTMLDivElement>('result-box');
const resultLabel = $<HTMLSpanElement>('result-label');
const resultText = $<HTMLParagraphElement>('result-text');
const resultCode = $<HTMLElement>('result-code');
const copyBtn = $<HTMLButtonElement>('copy-btn');
const copyText = $<HTMLSpanElement>('copy-text');

const usageTabs = $<HTMLDivElement>('usage-tabs');
const usageDesc = $<HTMLParagraphElement>('usage-desc');
const stepsContainer = $<HTMLDivElement>('steps-container');

const masterBody = $<HTMLTableSectionElement>('master-body');

const UI_TEXT: Record<'vi' | 'en', Record<string, string>> = {
  vi: {
    'language-label': 'Ngôn ngữ', 'brand-title': 'n2cur Trang chủ Demo Website', 'npm-title': 'n2cur trên npm registry',
    'github-title': 'Mã nguồn GitHub', 'copy-install-title': 'Sao chép lệnh cài đặt',
    'hero-title': 'Đọc tiền <span class="grad">thành chữ</span>: Việt &amp; Anh',
    'hero-subtitle': 'Thư viện JavaScript đọc số tiền thành chữ tiếng Việt &amp; Tiếng Anh (VND, USD, EUR, GBP, JPY, SGD) cho React, Angular, Vue, Node.js &amp; CDN.',
    'hero-quote': 'Cần đọc số tiền thành chữ cho hóa đơn, thanh toán? Cài <code>npm i n2cur</code> là dùng ngay.',
    'tester-title': 'Dùng thử', 'amount-label': 'Số tiền', 'currency-label': 'Tiền tệ', result: 'Kết quả', copy: 'Sao chép',
    'copy-title': 'Sao chép', 'usage-title': 'Hướng dẫn cài đặt & tích hợp', frameworks: 'Khung làm việc',
    'master-title': 'Cấu hình Master Data tiền tệ (API)', 'add-currency': '+ Thêm mã', 'copy-ts': 'Sao chép TS code',
    reset: 'Khôi phục mặc định', 'master-hint': 'Cấu hình tiền tệ active.', 'col-code': 'Mã', 'col-name-vi': 'Tên VI',
    'col-name-en-singular': 'Tên EN (Ít)', 'col-name-en-plural': 'Tên EN (Nhiều)', 'col-decimal-handling': 'Xử lý lẻ',
    'col-scale': 'Scale', 'col-decimal-separator': 'Dấu thập phân', 'col-read-decimal': 'Đọc lẻ',
    'col-minor-vi-singular': 'Lẻ VI ít', 'col-minor-vi-plural': 'Lẻ VI nhiều',
    'col-minor-en-singular': 'Lẻ EN ít', 'col-minor-en-plural': 'Lẻ EN nhiều', 'col-active': 'Active',
    'footer-copy': 'Phát triển bởi', 'footer-source': 'Mã nguồn trên', 'footer-license': 'MIT License',
    'step-copy': 'Sao chép', 'step-copied': 'Đã chép!', 'copy-error': 'Lỗi', 'npm-copied': 'Đã chép npm i n2cur!',
    'export-copied': 'Đã chép TS code!', 'remove-title': 'Xóa', 'gif-title': 'Demo cài đặt, setup & coding:',
  },
  en: {
    'language-label': 'Language', 'brand-title': 'n2cur demo homepage', 'npm-title': 'n2cur on npm registry',
    'github-title': 'GitHub source code', 'copy-install-title': 'Copy install command',
    'hero-title': 'Money <span class="grad">in words</span>: Vietnamese &amp; English',
    'hero-subtitle': 'A JavaScript library that spells out amounts in Vietnamese and English (VND, USD, EUR, GBP, JPY, SGD) for React, Angular, Vue, Node.js, and CDN.',
    'hero-quote': 'Need to spell out amounts for invoices or payments? Install <code>npm i n2cur</code> and get started.',
    'tester-title': 'Try it', 'amount-label': 'Amount', 'currency-label': 'Currency', result: 'Result', copy: 'Copy',
    'copy-title': 'Copy', 'usage-title': 'Installation & integration', frameworks: 'Frameworks',
    'master-title': 'Currency Master Data (API)', 'add-currency': '+ Add currency', 'copy-ts': 'Copy TS code',
    reset: 'Reset defaults', 'master-hint': 'Configure active currencies.', 'col-code': 'Code', 'col-name-vi': 'Name (VI)',
    'col-name-en-singular': 'Name EN (singular)', 'col-name-en-plural': 'Name EN (plural)', 'col-decimal-handling': 'Decimal handling',
    'col-scale': 'Scale', 'col-decimal-separator': 'Decimal separator', 'col-read-decimal': 'Read decimals',
    'col-minor-vi-singular': 'Minor VI (singular)', 'col-minor-vi-plural': 'Minor VI (plural)',
    'col-minor-en-singular': 'Minor EN (singular)', 'col-minor-en-plural': 'Minor EN (plural)', 'col-active': 'Active',
    'footer-copy': 'Built by', 'footer-source': 'Source on', 'footer-license': 'MIT License',
    'step-copy': 'Copy', 'step-copied': 'Copied!', 'copy-error': 'Error', 'npm-copied': 'Copied npm i n2cur!',
    'export-copied': 'Copied TS code!', 'remove-title': 'Remove', 'gif-title': 'Setup & coding demo:',
  },
};

const GUIDE_EN: Record<string, { desc: string; steps: string[] }> = {
  react: { desc: 'Install and use n2cur in a React application (Next.js, Vite, or CRA).', steps: [
    'Step 1: Install n2cur with npm', 'Step 2: Create a component to spell out amounts',
    'Step 3: Use the component in your UI', 'Step 4: Load Master Data from a backend API (optional)',
  ] },
  angular: { desc: 'Create a standalone pipe and use it directly in an Angular template.', steps: [
    'Step 1: Install n2cur', 'Step 2: Create a standalone amount-to-words pipe',
    'Step 3: Declare and use the pipe in an Angular template', 'Step 4: Configure Master Data with an Angular service (optional)',
  ] },
  vue: { desc: 'Integrate n2cur with the Vue 3 Composition API.', steps: [
    'Step 1: Install n2cur', 'Step 2: Create an amount-to-words component',
    'Step 3: Use the component in a Vue app', 'Step 4: Configure Master Data (optional)',
  ] },
  basic: { desc: 'Use n2cur directly in Node.js or plain JavaScript/TypeScript.', steps: [
    'Step 1: Install the n2cur package', 'Step 2: Import the library and spell out an amount',
    'Step 3: Use a comma as the decimal separator', 'Step 4: Load Master Data from an API',
  ] },
  cdn: { desc: 'Add n2cur to an HTML page with a script tag; no build tool required.', steps: [
    'Step 1: Load n2cur from the unpkg CDN', 'Step 2: Use the global window.N2Cur object',
    'Step 3: Configure Master Data with N2Cur.createMoneyReader',
  ] },
};

const ERROR_LABELS: Record<string, { vi: string; en: string }> = {
  CURRENCY_NOT_FOUND: { vi: 'Không tìm thấy tiền tệ', en: 'Currency not found' },
  INVALID_AMOUNT: { vi: 'Số tiền không hợp lệ', en: 'Invalid amount' },
  DECIMAL_REJECTED: { vi: 'Từ chối phần thập phân', en: 'Decimal part rejected' },
  DECIMAL_SCALE_EXCEEDED: { vi: 'Vượt quá decimal_scale', en: 'Decimal scale exceeded' },
  MINOR_UNIT_MISSING: { vi: 'Thiếu đơn vị lẻ', en: 'Minor unit missing' },
  INVALID_CONFIG: { vi: 'Cấu hình không hợp lệ', en: 'Invalid configuration' },
};

const cloneDefaults = (): CurrencyConfig[] => DEFAULT_CURRENCIES.map((c) => ({ ...c }));
const savedLanguage = (() => {
  try {
    return localStorage.getItem('n2cur-lang');
  } catch {
    return null;
  }
})();

let currencies: CurrencyConfig[] = cloneDefaults();
let reader: MoneyReader = createMoneyReader({ currencies });
let currentLang: 'vi' | 'en' = savedLanguage === 'en' ? 'en' : 'vi';
let activeSnippetId = 'react';

function rebuildReader(): void {
  try {
    reader = createMoneyReader({ currencies });
  } catch {
    /* ignore */
  }
}

function renderCurrencyOptions(): void {
  const previous = currencySelect.value || 'VND';
  const codes = [...new Set(currencies.map((c) => normalizeCurrencyCode(c.currency_code)).filter(Boolean))];
  currencySelect.innerHTML = '';
  for (const code of codes) {
    const config = reader.getCurrency(code);
    const opt = document.createElement('option');
    opt.value = code;
    if (config) {
      const displayName = currentLang === 'en' ? (config.currency_name_en ?? code) : config.currency_name;
      opt.textContent = `${code} · ${displayName}`;
    } else {
      opt.textContent = `${code} · (${currentLang === 'en' ? 'inactive' : 'ngừng hoạt động'})`;
    }
    currencySelect.append(opt);
  }
  currencySelect.value = codes.includes(previous) ? previous : (codes[0] ?? '');
}

function renderResult(): void {
  const amountStr = amountInput.value.trim();
  const codeStr = currencySelect.value;
  const res = reader.safeRead(amountStr, codeStr, { lang: currentLang });

  resultText.classList.remove('flash');
  void resultText.offsetWidth;
  resultText.classList.add('flash');

  if (res.ok) {
    resultBox.classList.remove('error');
    resultLabel.textContent = UI_TEXT[currentLang].result!;
    resultText.textContent = res.text;
    resultCode.textContent = '';
    copyBtn.hidden = false;
  } else {
    resultBox.classList.add('error');
    resultLabel.textContent = ERROR_LABELS[res.error.code]?.[currentLang] ?? (currentLang === 'en' ? 'Error' : 'Lỗi');
    resultText.textContent = res.error.message;
    resultCode.textContent = res.error.code;
    copyBtn.hidden = true;
  }
}

/* ---------------- Usage Tabs & Step Cards ---------------- */

function renderUsage(): void {
  usageTabs.innerHTML = '';
  const currentGuide = FRAMEWORK_GUIDES.find((s) => s.id === activeSnippetId) ?? FRAMEWORK_GUIDES[0]!;

  for (const guide of FRAMEWORK_GUIDES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tab ${guide.id === currentGuide.id ? 'active' : ''}`;
    btn.textContent = guide.label;
    btn.addEventListener('click', () => {
      activeSnippetId = guide.id;
      renderUsage();
    });
    usageTabs.append(btn);
  }

  usageDesc.textContent = currentLang === 'en' ? GUIDE_EN[currentGuide.id]?.desc ?? currentGuide.desc : currentGuide.desc;
  stepsContainer.innerHTML = '';

  if (currentGuide.gifUrl) {
    const gifBanner = document.createElement('div');
    gifBanner.className = 'framework-gif-banner';
    gifBanner.innerHTML = `
      <div class="gif-header">
        <span class="gif-title">${UI_TEXT[currentLang]['gif-title']} ${currentGuide.label}</span>
      </div>
      <img class="framework-demo-gif" src="${currentGuide.gifUrl}" alt="${UI_TEXT[currentLang]['gif-title']} ${currentGuide.label}" />
    `;
    stepsContainer.append(gifBanner);
  }

  currentGuide.steps.forEach((step, index) => {
    const card = document.createElement('div');
    card.className = 'step-card';

    const header = document.createElement('div');
    header.className = 'step-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'step-title';
    titleEl.textContent = currentLang === 'en' ? GUIDE_EN[currentGuide.id]?.steps[index] ?? step.title : step.title;

    header.append(titleEl);

    if (step.file) {
      const fileEl = document.createElement('span');
      fileEl.className = 'step-file-badge';
      fileEl.textContent = step.file;
      header.append(fileEl);
    }

    const panel = document.createElement('div');
    panel.className = 'code-panel';

    const panelHead = document.createElement('div');
    panelHead.className = 'code-panel-head';

    const codeLabel = document.createElement('span');
    codeLabel.className = 'code-file';
    codeLabel.textContent = step.file || 'Code';

    const copyBtnEl = document.createElement('button');
    copyBtnEl.type = 'button';
    copyBtnEl.className = 'ghost-btn small';
    copyBtnEl.textContent = UI_TEXT[currentLang]['step-copy']!;
    copyBtnEl.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(step.code);
        copyBtnEl.textContent = UI_TEXT[currentLang]['step-copied']!;
      } catch {
        copyBtnEl.textContent = UI_TEXT[currentLang]['copy-error']!;
      }
      setTimeout(() => (copyBtnEl.textContent = UI_TEXT[currentLang]['step-copy']!), 1400);
    });

    panelHead.append(codeLabel, copyBtnEl);

    const pre = document.createElement('pre');
    pre.className = 'snippet';
    const codeEl = document.createElement('code');
    codeEl.innerHTML = highlight(step.code);
    pre.append(codeEl);

    panel.append(panelHead, pre);
    card.append(header, panel);
    stepsContainer.append(card);
  });
}

/* ---------------- Master data table & Export ---------------- */

type Field = keyof CurrencyConfig;

function textCell(row: CurrencyConfig, field: Field, cls = ''): HTMLTableCellElement {
  const td = document.createElement('td');
  if (cls) td.className = cls;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = String(row[field] ?? '');
  if (cls) input.classList.add(cls);
  input.addEventListener('input', () => {
    (row as unknown as Record<string, unknown>)[field] = input.value;
    refreshAll();
  });
  td.append(input);
  return td;
}

function switchCell(row: CurrencyConfig, field: 'active' | 'decimal_allowed', tr?: HTMLTableRowElement): HTMLTableCellElement {
  const td = document.createElement('td');
  const label = document.createElement('label');
  label.className = 'switch';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = row[field];
  input.addEventListener('change', () => {
    row[field] = input.checked;
    if (tr) tr.classList.toggle('inactive', !input.checked);
    refreshAll();
  });
  label.append(input, document.createElement('span'));
  td.append(label);
  return td;
}

function decimalSeparatorCell(row: CurrencyConfig): HTMLTableCellElement {
  const td = document.createElement('td');
  const select = document.createElement('select');
  for (const separator of ['.', ','] as const) {
    const option = document.createElement('option');
    option.value = separator;
    option.textContent = separator === '.' ? '1,234.56' : '1.234,56';
    select.append(option);
  }
  select.value = row.decimal_separator ?? '.';
  select.addEventListener('change', () => {
    row.decimal_separator = select.value as '.' | ',';
    refreshAll();
  });
  td.append(select);
  return td;
}

function renderMasterTable(): void {
  masterBody.innerHTML = '';
  currencies.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.classList.toggle('inactive', !row.active);

    tr.append(
      textCell(row, 'currency_code', 'code'),
      textCell(row, 'currency_name', 'name'),
      textCell(row, 'currency_name_en', 'name'),
      textCell(row, 'currency_name_en_plural', 'name'),
    );

    const handlingTd = document.createElement('td');
    const select = document.createElement('select');
    for (const h of ['READ', 'IGNORE', 'REJECT'] as DecimalHandling[]) {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = currentLang === 'en'
        ? ({ READ: 'Read', IGNORE: 'Ignore', REJECT: 'Reject' } as const)[h]
        : h;
      select.append(opt);
    }
    select.value = row.decimal_handling;
    select.addEventListener('change', () => {
      row.decimal_handling = select.value as DecimalHandling;
      refreshAll();
    });
    handlingTd.append(select);

    const scaleTd = document.createElement('td');
    const scale = document.createElement('input');
    scale.type = 'number';
    scale.min = '0';
    scale.className = 'scale';
    scale.value = String(row.decimal_scale);
    scale.addEventListener('input', () => {
      row.decimal_scale = scale.value === '' ? Number.NaN : Number(scale.value);
      refreshAll();
    });
    scaleTd.append(scale);

    const removeTd = document.createElement('td');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-btn';
    remove.title = UI_TEXT[currentLang]['remove-title']!;
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      currencies.splice(index, 1);
      renderMasterTable();
      refreshAll();
    });
    removeTd.append(remove);

    tr.append(
      handlingTd,
      scaleTd,
      decimalSeparatorCell(row),
      switchCell(row, 'decimal_allowed'),
      textCell(row, 'minor_unit_singular'),
      textCell(row, 'minor_unit_plural'),
      textCell(row, 'minor_unit_singular_en'),
      textCell(row, 'minor_unit_plural_en'),
      switchCell(row, 'active', tr),
      removeTd,
    );
    masterBody.append(tr);
  });
}

function refreshAll(): void {
  rebuildReader();
  renderCurrencyOptions();
  renderResult();
}

/* ---------------- Controls ---------------- */

function setLang(lang: 'vi' | 'en'): void {
  currentLang = lang;
  try {
    localStorage.setItem('n2cur-lang', lang);
  } catch {
    /* language selection still works if storage is unavailable */
  }
  document.documentElement.lang = lang;
  document.title = lang === 'en' ? 'n2cur — Money in words' : 'n2cur — Đọc số tiền thành chữ';
  const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (metaDescription) {
    metaDescription.content = lang === 'en'
      ? 'Spell out currency amounts in Vietnamese and English with n2cur.'
      : 'Đọc số tiền thành chữ tiếng Việt và tiếng Anh với thư viện n2cur.';
  }
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n!;
    element.textContent = UI_TEXT[lang][key] ?? element.textContent ?? '';
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((element) => {
    const key = element.dataset.i18nTitle!;
    element.title = UI_TEXT[lang][key] ?? element.title;
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((element) => {
    const key = element.dataset.i18nAriaLabel!;
    element.setAttribute('aria-label', UI_TEXT[lang][key] ?? element.getAttribute('aria-label') ?? '');
  });
  $('hero-title').innerHTML = UI_TEXT[lang]['hero-title']!;
  $('hero-subtitle').innerHTML = UI_TEXT[lang]['hero-subtitle']!;
  $('hero-quote').innerHTML = UI_TEXT[lang]['hero-quote']!;
  $('master-hint').textContent = UI_TEXT[lang]['master-hint']!;
  $('footer-copy').textContent = UI_TEXT[lang]['footer-copy']!;
  $('footer-source').textContent = UI_TEXT[lang]['footer-source']!;
  $('footer-license').textContent = UI_TEXT[lang]['footer-license']!;
  document.querySelectorAll<HTMLButtonElement>('.global-lang-btn').forEach((b) => {
    const active = b.dataset.lang === lang;
    b.classList.toggle('active', active);
    b.setAttribute('aria-checked', String(active));
  });
  renderMasterTable();
  renderUsage();
  renderCurrencyOptions();
  renderResult();
}

document.querySelectorAll<HTMLButtonElement>('.global-lang-btn').forEach((btn) =>
  btn.addEventListener('click', () => {
    setLang(btn.dataset.lang as 'vi' | 'en');
  }),
);

amountInput.addEventListener('input', renderResult);
currencySelect.addEventListener('change', renderResult);


copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultText.textContent ?? '');
    copyText.textContent = UI_TEXT[currentLang]['step-copied']!;
  } catch {
    copyText.textContent = UI_TEXT[currentLang]['copy-error']!;
  }
  setTimeout(() => (copyText.textContent = UI_TEXT[currentLang].copy!), 1400);
});

const npmCopyBtn = $<HTMLButtonElement>('npm-copy-btn');
npmCopyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('npm i n2cur');
    const codeEl = npmCopyBtn.querySelector('code');
    if (codeEl) {
      codeEl.textContent = UI_TEXT[currentLang]['npm-copied']!;
      setTimeout(() => (codeEl.textContent = 'npm i n2cur'), 1500);
    }
  } catch {
    /* ignore */
  }
});

$('reset-btn').addEventListener('click', () => {
  currencies = cloneDefaults();
  renderMasterTable();
  refreshAll();
});

$('add-currency-btn').addEventListener('click', () => {
  currencies.push({
    currency_code: 'NEW',
    currency_name: currentLang === 'en' ? 'new currency' : 'tiền mới',
    decimal_handling: 'REJECT',
    decimal_scale: 0,
    decimal_separator: '.',
    decimal_allowed: false,
    minor_unit_singular: '',
    minor_unit_plural: '',
    active: true,
  });
  renderMasterTable();
  refreshAll();
});

const exportBtn = $<HTMLButtonElement>('export-btn');
exportBtn.addEventListener('click', async () => {
  const code = `import { createMoneyReader, type CurrencyConfig } from 'n2cur';

const currencies: CurrencyConfig[] = ${JSON.stringify(currencies, null, 2)};

export const moneyReader = createMoneyReader({ currencies });`;

  try {
    await navigator.clipboard.writeText(code);
    exportBtn.textContent = UI_TEXT[currentLang]['export-copied']!;
  } catch {
    exportBtn.textContent = UI_TEXT[currentLang]['copy-error']!;
  }
  setTimeout(() => (exportBtn.textContent = UI_TEXT[currentLang]['copy-ts']!), 1600);
});

renderMasterTable();
renderUsage();
setLang(currentLang);
refreshAll();
