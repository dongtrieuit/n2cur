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

const ERROR_LABELS: Record<string, { vi: string; en: string }> = {
  CURRENCY_NOT_FOUND: { vi: 'Không tìm thấy tiền tệ', en: 'Currency not found' },
  INVALID_AMOUNT: { vi: 'Số tiền không hợp lệ', en: 'Invalid amount' },
  DECIMAL_REJECTED: { vi: 'Từ chối phần thập phân', en: 'Decimal part rejected' },
  DECIMAL_SCALE_EXCEEDED: { vi: 'Vượt quá decimal_scale', en: 'Decimal scale exceeded' },
  MINOR_UNIT_MISSING: { vi: 'Thiếu đơn vị lẻ', en: 'Minor unit missing' },
  INVALID_CONFIG: { vi: 'Cấu hình không hợp lệ', en: 'Invalid configuration' },
};

const cloneDefaults = (): CurrencyConfig[] => DEFAULT_CURRENCIES.map((c) => ({ ...c }));

let currencies: CurrencyConfig[] = cloneDefaults();
let reader: MoneyReader = createMoneyReader({ currencies });
let currentLang: 'vi' | 'en' = 'vi';
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
      const displayName = currentLang === 'en' ? (config.currency_name_en ?? config.currency_name) : config.currency_name;
      opt.textContent = `${code} · ${displayName}`;
    } else {
      opt.textContent = `${code} · (inactive)`;
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
    resultLabel.textContent = currentLang === 'en' ? 'Result' : 'Kết quả';
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

  usageDesc.textContent = currentGuide.desc;
  stepsContainer.innerHTML = '';

  if (currentGuide.gifUrl) {
    const gifBanner = document.createElement('div');
    gifBanner.className = 'framework-gif-banner';
    gifBanner.innerHTML = `
      <div class="gif-header">
        <span class="gif-title">Demo cài đặt, setup &amp; coding: ${currentGuide.label}</span>
      </div>
      <img class="framework-demo-gif" src="${currentGuide.gifUrl}" alt="Demo ${currentGuide.label} Setup" />
    `;
    stepsContainer.append(gifBanner);
  }

  currentGuide.steps.forEach((step) => {
    const card = document.createElement('div');
    card.className = 'step-card';

    const header = document.createElement('div');
    header.className = 'step-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'step-title';
    titleEl.textContent = step.title;

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
    copyBtnEl.textContent = 'Sao chép';
    copyBtnEl.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(step.code);
        copyBtnEl.textContent = 'Đã chép!';
      } catch {
        copyBtnEl.textContent = 'Lỗi';
      }
      setTimeout(() => (copyBtnEl.textContent = 'Sao chép'), 1400);
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
      opt.value = opt.textContent = h;
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
    remove.title = 'Xóa';
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
  document.querySelectorAll<HTMLButtonElement>('.lang-seg').forEach((b) => {
    const active = b.dataset.lang === lang;
    b.classList.toggle('active', active);
    b.setAttribute('aria-checked', String(active));
  });
  renderCurrencyOptions();
  renderResult();
}

document.querySelectorAll<HTMLButtonElement>('.lang-seg').forEach((btn) =>
  btn.addEventListener('click', () => {
    setLang(btn.dataset.lang as 'vi' | 'en');
  }),
);

amountInput.addEventListener('input', renderResult);
currencySelect.addEventListener('change', renderResult);


copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultText.textContent ?? '');
    copyText.textContent = 'Đã chép!';
  } catch {
    copyText.textContent = 'Lỗi';
  }
  setTimeout(() => (copyText.textContent = 'Sao chép'), 1400);
});

const npmCopyBtn = $<HTMLButtonElement>('npm-copy-btn');
npmCopyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('npm i n2cur');
    const codeEl = npmCopyBtn.querySelector('code');
    if (codeEl) {
      codeEl.textContent = 'Đã chép npm i n2cur!';
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
    currency_name: 'tiền mới',
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
    exportBtn.textContent = 'Đã chép TS code!';
  } catch {
    exportBtn.textContent = 'Lỗi';
  }
  setTimeout(() => (exportBtn.textContent = 'Sao chép TS code'), 1600);
});

renderMasterTable();
renderUsage();
refreshAll();
