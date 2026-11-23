import { ActionSheetIOS, Alert, Platform, Share } from 'react-native';

import type { Transaction } from '@/components/TransactionsProvider';
import type { BudgetProgress } from '@/lib/budgets';
import type { ReportPeriod, ReportStats } from '@/lib/reportStats';

export type FormatFn = (amountUsd: number, opts?: { sign?: boolean; decimals?: number }) => string;

export type ExportBalanceSheetInput = {
  accountName?: string;
  accountEmail?: string;
  currencyCode: string;
  format: FormatFn;
  totalAssetsUsd: number;
  totalLiabilitiesUsd: number;
  netWorthUsd: number;
  liquidPct: number;
  debtToAssetPct: number;
  monthlyIncomeUsd: number;
  assetGroups: Array<{
    category: { label: string; color: string };
    subtotalUsd: number;
    items: Array<{ name: string; amountUsd: number; note?: string }>;
  }>;
  liabilityGroups: Array<{
    category: { label: string; color: string };
    subtotalUsd: number;
    items: Array<{ name: string; amountUsd: number; note?: string }>;
  }>;
};

export type ExportFinancialSummaryInput = {
  accountName: string;
  accountEmail?: string;
  currencyCode: string;
  format: FormatFn;
  cashBalanceUsd: number;
  totalAssetsUsd: number;
  totalLiabilitiesUsd: number;
  netWorthUsd: number;
  report30d: ReportStats;
  activeBudgets: BudgetProgress[];
  recentTransactions: Transaction[];
  getCategoryLabel: (id: string) => { label: string; color: string };
};

export type ExportSpendingReportInput = {
  accountName?: string;
  accountEmail?: string;
  period: ReportPeriod;
  currencyCode: string;
  format: FormatFn;
  stats: ReportStats;
  getCategoryLabel: (id: string) => { label: string; color: string };
};

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const PDF_BASE_STYLES = `
  @page { margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 30px 36px 30px;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1c1a17;
    background: #ffffff;
    font-size: 12px;
    line-height: 1.45;
  }
  .doc { width: 100%; }
  .header {
    background: #141513;
    color: #ffffff;
    border-radius: 16px;
    padding: 22px 24px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .brand {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.6px;
    color: #e8d2b5;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .doc-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.3px;
  }
  .doc-sub {
    font-size: 11px;
    color: #a5a79b;
    margin-top: 4px;
  }
  .meta-right {
    text-align: right;
    font-size: 11px;
    color: #d0d2ca;
  }
  .currency-pill {
    display: inline-block;
    background: #e8d2b5;
    color: #1c1a17;
    font-weight: 700;
    font-size: 10px;
    padding: 3px 9px;
    border-radius: 999px;
    margin-bottom: 5px;
  }
  .kpi-grid {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
  }
  .kpi-card {
    flex: 1;
    background: #faf8f5;
    border: 1px solid #e6e7e2;
    border-radius: 12px;
    padding: 12px 14px;
  }
  .kpi-card.highlight {
    background: #f5ece0;
    border-color: #d9bf9c;
  }
  .kpi-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #6e7065;
    margin-bottom: 4px;
  }
  .kpi-value {
    font-size: 17px;
    font-weight: 700;
    color: #1c1a17;
  }
  .kpi-value.pos { color: #1f7a50; }
  .kpi-value.neg { color: #c0392b; }
  .kpi-sub {
    font-size: 10px;
    color: #6e7065;
    margin-top: 2px;
  }
  .section {
    margin-bottom: 18px;
    page-break-inside: avoid;
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #1c1a17;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }
  .section-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #1c1a17;
  }
  .section-total {
    font-size: 13px;
    font-weight: 700;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6e7065;
    padding: 6px 8px;
    border-bottom: 1px solid #e6e7e2;
  }
  th.num, td.num { text-align: right; }
  td {
    padding: 7px 8px;
    border-bottom: 1px solid #f0f1ed;
    font-size: 11.5px;
    vertical-align: top;
  }
  tr.group-row td {
    background: #faf8f5;
    font-weight: 700;
    color: #1c1a17;
    border-top: 1px solid #e6e7e2;
  }
  tr.item-row td.name {
    padding-left: 20px;
    color: #3a3b35;
  }
  .item-note {
    display: block;
    font-size: 10px;
    color: #8a8c80;
  }
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    margin-right: 6px;
    vertical-align: middle;
  }
  .bar-track {
    width: 100%;
    height: 6px;
    background: #eceee9;
    border-radius: 999px;
    overflow: hidden;
    margin-top: 4px;
  }
  .bar-fill {
    height: 100%;
    border-radius: 999px;
  }
  .summary-box {
    background: #141513;
    color: #ffffff;
    border-radius: 12px;
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
  }
  .summary-box-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.9px;
    color: #e8d2b5;
    font-weight: 700;
  }
  .summary-box-sub {
    font-size: 10px;
    color: #a5a79b;
    margin-top: 2px;
  }
  .summary-box-val {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
  }
  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 999px;
    font-size: 9.5px;
    font-weight: 700;
  }
  .badge-ok { background: #e2f5eb; color: #1f7a50; }
  .badge-warn { background: #fef3c7; color: #b45309; }
  .badge-over { background: #fde8e8; color: #c0392b; }
  .empty-note {
    color: #8a8c80;
    font-style: italic;
    padding: 8px 0;
  }
  .footer {
    margin-top: 22px;
    padding-top: 10px;
    border-top: 1px solid #e6e7e2;
    display: flex;
    justify-content: space-between;
    font-size: 9.5px;
    color: #8a8c80;
  }
`;

function wrapPdfHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${PDF_BASE_STYLES}</style>
</head>
<body>
  <div class="doc">${body}</div>
</body>
</html>`;
}

export function buildBalanceSheetText(input: ExportBalanceSheetInput): string {
  const { format } = input;
  const today = formatToday();
  const lines: string[] = [
    `POCKITO · PERSONAL BALANCE SHEET`,
    ...(input.accountName
      ? [`Account: ${input.accountName}${input.accountEmail ? ` (${input.accountEmail})` : ''}`]
      : []),
    `As of ${today} · Currency: ${input.currencyCode}`,
    `========================================`,
    ``,
    `EXECUTIVE SUMMARY`,
    `  Net Worth (Equity) : ${format(input.netWorthUsd)}`,
    `  Total Assets       : ${format(input.totalAssetsUsd)}`,
    `  Total Liabilities  : ${format(input.totalLiabilitiesUsd)}`,
    `  Liquid Cash Share  : ${input.liquidPct}%`,
    `  Debt-to-Asset      : ${input.debtToAssetPct}%`,
    `  30-Day Income      : ${format(input.monthlyIncomeUsd)}`,
    ``,
    `ASSETS`,
    `----------------------------------------`,
  ];

  if (input.assetGroups.length === 0) {
    lines.push(`  No assets recorded`);
  } else {
    for (const g of input.assetGroups) {
      lines.push(`  ${g.category.label.toUpperCase()} — ${format(g.subtotalUsd)}`);
      for (const it of g.items) {
        lines.push(`    • ${it.name}: ${format(it.amountUsd)}${it.note ? ` (${it.note})` : ''}`);
      }
    }
  }
  lines.push(`  TOTAL ASSETS: ${format(input.totalAssetsUsd)}`);
  lines.push(``);
  lines.push(`LIABILITIES`);
  lines.push(`----------------------------------------`);

  if (input.liabilityGroups.length === 0) {
    lines.push(`  No liabilities recorded`);
  } else {
    for (const g of input.liabilityGroups) {
      lines.push(`  ${g.category.label.toUpperCase()} — ${format(g.subtotalUsd)}`);
      for (const it of g.items) {
        lines.push(`    • ${it.name}: ${format(it.amountUsd)}${it.note ? ` (${it.note})` : ''}`);
      }
    }
  }
  lines.push(`  TOTAL LIABILITIES: ${format(input.totalLiabilitiesUsd)}`);
  lines.push(`========================================`);
  lines.push(`NET WORTH (ASSETS - LIABILITIES): ${format(input.netWorthUsd)}`);
  lines.push(`Generated by Pockito`);
  return lines.join('\n');
}

export function buildBalanceSheetHtml(input: ExportBalanceSheetInput): string {
  const { format } = input;
  const today = formatToday();

  const renderRows = (
    groups: ExportBalanceSheetInput['assetGroups'],
    emptyText: string,
  ) => {
    if (groups.length === 0) {
      return `<p class="empty-note">${escapeHtml(emptyText)}</p>`;
    }
    const rows = groups
      .map((g) => {
        const groupRow = `
          <tr class="group-row">
            <td><span class="dot" style="background:${escapeHtml(g.category.color)}"></span>${escapeHtml(g.category.label)}</td>
            <td class="num">${escapeHtml(format(g.subtotalUsd))}</td>
          </tr>`;
        const itemRows = g.items
          .map(
            (it) => `
          <tr class="item-row">
            <td class="name">
              ${escapeHtml(it.name)}
              ${it.note ? `<span class="item-note">${escapeHtml(it.note)}</span>` : ''}
            </td>
            <td class="num">${escapeHtml(format(it.amountUsd))}</td>
          </tr>`,
          )
          .join('');
        return groupRow + itemRows;
      })
      .join('');
    return `<table><thead><tr><th>Category / Item</th><th class="num">Value</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  const ownerSub = input.accountName
    ? `${escapeHtml(input.accountName)}${input.accountEmail ? ` · ${escapeHtml(input.accountEmail)}` : ''}`
    : 'Statement of Financial Position';

  const body = `
    <div class="header">
      <div>
        <div class="brand">Pockito · Wealth Statement</div>
        <h1 class="doc-title">Personal Balance Sheet</h1>
        <div class="doc-sub">${ownerSub}</div>
      </div>
      <div class="meta-right">
        <div class="currency-pill">${escapeHtml(input.currencyCode)}</div>
        <div>As of ${escapeHtml(today)}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card highlight">
        <div class="kpi-label">Net Worth (Equity)</div>
        <div class="kpi-value ${input.netWorthUsd >= 0 ? 'pos' : 'neg'}">${escapeHtml(format(input.netWorthUsd))}</div>
        <div class="kpi-sub">Assets minus liabilities</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Assets</div>
        <div class="kpi-value pos">${escapeHtml(format(input.totalAssetsUsd))}</div>
        <div class="kpi-sub">${input.liquidPct}% liquid cash</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Liabilities</div>
        <div class="kpi-value neg">${escapeHtml(format(input.totalLiabilitiesUsd))}</div>
        <div class="kpi-sub">${input.debtToAssetPct}% debt-to-asset</div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <span class="section-title">Assets</span>
        <span class="section-total" style="color:#1f7a50;">${escapeHtml(format(input.totalAssetsUsd))}</span>
      </div>
      ${renderRows(input.assetGroups, 'No assets recorded.')}
    </div>

    <div class="section">
      <div class="section-head">
        <span class="section-title">Liabilities</span>
        <span class="section-total" style="color:#c0392b;">${escapeHtml(format(input.totalLiabilitiesUsd))}</span>
      </div>
      ${renderRows(input.liabilityGroups, 'No liabilities recorded.')}
    </div>

    <div class="summary-box">
      <div>
        <div class="summary-box-label">Total Net Worth (Owner&apos;s Equity)</div>
        <div class="summary-box-sub">30-Day Income Context: ${escapeHtml(format(input.monthlyIncomeUsd))}</div>
      </div>
      <div class="summary-box-val">${escapeHtml(format(input.netWorthUsd))}</div>
    </div>

    <div class="footer">
      <span>Pockito Personal Finance &amp; Wealth Tracker</span>
      <span>Generated ${escapeHtml(today)} · All values in ${escapeHtml(input.currencyCode)}</span>
    </div>
  `;

  return wrapPdfHtml(body, 'Pockito Balance Sheet');
}

export function buildFinancialSummaryText(
  input: ExportFinancialSummaryInput,
): string {
  const { format, report30d } = input;
  const today = formatToday();
  const lines: string[] = [
    `POCKITO · PERSONAL FINANCIAL SUMMARY`,
    `Account: ${input.accountName}${input.accountEmail ? ` (${input.accountEmail})` : ''}`,
    `Generated: ${today} · Currency: ${input.currencyCode}`,
    `========================================`,
    ``,
    `NET WORTH & BALANCES`,
    `----------------------------------------`,
    `  Cash Balance       : ${format(input.cashBalanceUsd)}`,
    `  Total Assets       : ${format(input.totalAssetsUsd)}`,
    `  Total Liabilities  : ${format(input.totalLiabilitiesUsd)}`,
    `  Net Worth          : ${format(input.netWorthUsd)}`,
    ``,
    `30-DAY CASHFLOW`,
    `----------------------------------------`,
    `  Income             : ${format(report30d.incomeUsd)}`,
    `  Expenses           : ${format(report30d.expenseUsd)}`,
    `  Net Cashflow       : ${format(report30d.netUsd, { sign: true })}`,
    `  Savings Rate       : ${report30d.savingsRate !== null ? `${report30d.savingsRate}%` : '—'}`,
    `  Daily Avg Spend    : ${format(report30d.dailyAvgSpendUsd)}`,
  ];

  if (input.activeBudgets.length > 0) {
    lines.push(``);
    lines.push(`ACTIVE BUDGETS`);
    lines.push(`----------------------------------------`);
    for (const b of input.activeBudgets) {
      const pct = Math.round(b.percent);
      lines.push(
        `  • ${b.title} (${b.periodShortLabel}): ${format(b.spentUsd)} / ${format(b.limitUsd)} (${pct}%)`,
      );
    }
  }

  if (report30d.categories.length > 0) {
    lines.push(``);
    lines.push(`TOP SPENDING CATEGORIES (30D)`);
    lines.push(`----------------------------------------`);
    for (const c of report30d.categories.slice(0, 6)) {
      lines.push(
        `  • ${c.category.label}: ${format(c.amountUsd)} (${Math.round(c.percent)}%, ${c.count} tx)`,
      );
    }
  }

  if (input.recentTransactions.length > 0) {
    lines.push(``);
    lines.push(`RECENT TRANSACTIONS`);
    lines.push(`----------------------------------------`);
    for (const tx of input.recentTransactions.slice(0, 10)) {
      const cat = input.getCategoryLabel(tx.categoryId);
      const signed = format(tx.type === 'income' ? tx.amountUsd : -tx.amountUsd, {
        sign: true,
      });
      lines.push(
        `  • ${formatShortDate(tx.date)} · ${tx.title} [${cat.label}] ${signed}`,
      );
    }
  }

  lines.push(`========================================`);
  lines.push(`Generated by Pockito`);
  return lines.join('\n');
}

export function buildFinancialSummaryHtml(
  input: ExportFinancialSummaryInput,
): string {
  const { format, report30d } = input;
  const today = formatToday();

  const budgetsHtml =
    input.activeBudgets.length === 0
      ? `<p class="empty-note">No active budgets configured.</p>`
      : `<table>
          <thead>
            <tr>
              <th>Budget</th>
              <th>Period</th>
              <th class="num">Spent / Limit</th>
              <th class="num">Status</th>
            </tr>
          </thead>
          <tbody>
            ${input.activeBudgets
              .map((b) => {
                const badgeClass =
                  b.status === 'exceeded'
                    ? 'badge-over'
                    : b.status === 'warning'
                      ? 'badge-warn'
                      : 'badge-ok';
                const statusLabel =
                  b.status === 'exceeded'
                    ? 'Exceeded'
                    : b.status === 'warning'
                      ? 'Near Limit'
                      : 'On Track';
                return `
                <tr>
                  <td><strong>${escapeHtml(b.title)}</strong></td>
                  <td>${escapeHtml(b.periodShortLabel)}</td>
                  <td class="num">${escapeHtml(format(b.spentUsd))} / ${escapeHtml(format(b.limitUsd))} (${Math.round(b.percent)}%)</td>
                  <td class="num"><span class="badge ${badgeClass}">${statusLabel}</span></td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>`;

  const categoriesHtml =
    report30d.categories.length === 0
      ? `<p class="empty-note">No expenses recorded in the last 30 days.</p>`
      : `<table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="num">Transactions</th>
              <th class="num">Share</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${report30d.categories
              .slice(0, 8)
              .map(
                (c) => `
              <tr>
                <td>
                  <span class="dot" style="background:${escapeHtml(c.category.color)}"></span>
                  <strong>${escapeHtml(c.category.label)}</strong>
                  <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, Math.round(c.percent))}%;background:${escapeHtml(c.category.color)};"></div></div>
                </td>
                <td class="num">${c.count}</td>
                <td class="num">${Math.round(c.percent)}%</td>
                <td class="num"><strong>${escapeHtml(format(c.amountUsd))}</strong></td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>`;

  const recentTxHtml =
    input.recentTransactions.length === 0
      ? `<p class="empty-note">No transactions logged yet.</p>`
      : `<table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${input.recentTransactions
              .slice(0, 12)
              .map((tx) => {
                const cat = input.getCategoryLabel(tx.categoryId);
                const signed = format(
                  tx.type === 'income' ? tx.amountUsd : -tx.amountUsd,
                  { sign: true },
                );
                const amtColor = tx.type === 'income' ? '#1f7a50' : '#c0392b';
                return `
                <tr>
                  <td>${escapeHtml(formatShortDate(tx.date))}</td>
                  <td><strong>${escapeHtml(tx.title)}</strong></td>
                  <td><span class="dot" style="background:${escapeHtml(cat.color)}"></span>${escapeHtml(cat.label)}</td>
                  <td class="num" style="color:${amtColor};font-weight:700;">${escapeHtml(signed)}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>`;

  const body = `
    <div class="header">
      <div>
        <div class="brand">Pockito · Financial Dossier</div>
        <h1 class="doc-title">Personal Financial Summary</h1>
        <div class="doc-sub">${escapeHtml(input.accountName)}${input.accountEmail ? ` · ${escapeHtml(input.accountEmail)}` : ''}</div>
      </div>
      <div class="meta-right">
        <div class="currency-pill">${escapeHtml(input.currencyCode)}</div>
        <div>${escapeHtml(today)}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card highlight">
        <div class="kpi-label">Net Worth</div>
        <div class="kpi-value ${input.netWorthUsd >= 0 ? 'pos' : 'neg'}">${escapeHtml(format(input.netWorthUsd))}</div>
        <div class="kpi-sub">Cash: ${escapeHtml(format(input.cashBalanceUsd))}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">30D Income</div>
        <div class="kpi-value pos">${escapeHtml(format(report30d.incomeUsd))}</div>
        <div class="kpi-sub">Savings rate: ${report30d.savingsRate !== null ? `${report30d.savingsRate}%` : '—'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">30D Expenses</div>
        <div class="kpi-value neg">${escapeHtml(format(report30d.expenseUsd))}</div>
        <div class="kpi-sub">Avg ${escapeHtml(format(report30d.dailyAvgSpendUsd))}/day</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">30D Net</div>
        <div class="kpi-value ${report30d.netUsd >= 0 ? 'pos' : 'neg'}">${escapeHtml(format(report30d.netUsd, { sign: true }))}</div>
        <div class="kpi-sub">${report30d.txCount} transactions</div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <span class="section-title">Active Budgets</span>
        <span class="section-total">${input.activeBudgets.length} active</span>
      </div>
      ${budgetsHtml}
    </div>

    <div class="section">
      <div class="section-head">
        <span class="section-title">30-Day Spending Breakdown</span>
        <span class="section-total">${escapeHtml(format(report30d.expenseUsd))}</span>
      </div>
      ${categoriesHtml}
    </div>

    <div class="section">
      <div class="section-head">
        <span class="section-title">Recent Activity</span>
        <span class="section-total">Latest ${Math.min(12, input.recentTransactions.length)}</span>
      </div>
      ${recentTxHtml}
    </div>

    <div class="footer">
      <span>Pockito Personal Finance &amp; Wealth Tracker</span>
      <span>Generated ${escapeHtml(today)} · All values in ${escapeHtml(input.currencyCode)}</span>
    </div>
  `;

  return wrapPdfHtml(body, 'Pockito Financial Summary');
}

export function buildSpendingReportText(
  input: ExportSpendingReportInput,
): string {
  const { stats, format, period } = input;
  const today = formatToday();
  const periodLabel = period === 'All' ? 'All Time' : `Last ${period}`;
  const lines: string[] = [
    `POCKITO · SPENDING & CASHFLOW REPORT (${periodLabel})`,
    ...(input.accountName
      ? [`Account: ${input.accountName}${input.accountEmail ? ` (${input.accountEmail})` : ''}`]
      : []),
    `Generated: ${today} · Currency: ${input.currencyCode}`,
    `========================================`,
    ``,
    `OVERVIEW`,
    `----------------------------------------`,
    `  Income             : ${format(stats.incomeUsd)}`,
    `  Expenses           : ${format(stats.expenseUsd)}`,
    `  Net Cashflow       : ${format(stats.netUsd, { sign: true })}`,
    `  Savings Rate       : ${stats.savingsRate !== null ? `${stats.savingsRate}%` : '—'}`,
    `  Daily Avg Spend    : ${format(stats.dailyAvgSpendUsd)}`,
    `  Monthly Avg Spend  : ${format(stats.monthlyAvgSpendUsd)}`,
    `  Total Transactions : ${stats.txCount}`,
    ``,
    `SPENDING BY CATEGORY`,
    `----------------------------------------`,
  ];

  if (stats.categories.length === 0) {
    lines.push(`  No expenses recorded in this period.`);
  } else {
    for (const c of stats.categories) {
      lines.push(
        `  • ${c.category.label}: ${format(c.amountUsd)} (${c.percent.toFixed(1)}%, ${c.count} tx)`,
      );
    }
  }

  lines.push(``);
  lines.push(`HIGHLIGHTS`);
  lines.push(`----------------------------------------`);
  lines.push(
    `  Largest Expense    : ${stats.largestExpense ? `${format(stats.largestExpense.amountUsd)} (${stats.largestExpense.title})` : '—'}`,
  );
  lines.push(
    `  Largest Income     : ${stats.largestIncome ? `${format(stats.largestIncome.amountUsd)} (${stats.largestIncome.title})` : '—'}`,
  );
  lines.push(
    `  Peak Spending Day  : ${stats.peakSpendingDay ? `${formatShortDate(stats.peakSpendingDay.date)} (${format(stats.peakSpendingDay.amountUsd)})` : '—'}`,
  );
  lines.push(
    `  Best Earning Day   : ${stats.bestEarningDay ? `${formatShortDate(stats.bestEarningDay.date)} (${format(stats.bestEarningDay.amountUsd)})` : '—'}`,
  );
  lines.push(`========================================`);
  lines.push(`Generated by Pockito`);
  return lines.join('\n');
}

export function buildSpendingReportHtml(
  input: ExportSpendingReportInput,
): string {
  const { stats, format, period } = input;
  const today = formatToday();
  const periodLabel = period === 'All' ? 'All Time' : `Last ${period}`;

  const categoriesTable =
    stats.categories.length === 0
      ? `<p class="empty-note">No expenses recorded in this period.</p>`
      : `<table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="num">Transactions</th>
              <th class="num">Share</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${stats.categories
              .map(
                (c) => `
              <tr>
                <td>
                  <span class="dot" style="background:${escapeHtml(c.category.color)}"></span>
                  <strong>${escapeHtml(c.category.label)}</strong>
                  <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, Math.round(c.percent))}%;background:${escapeHtml(c.category.color)};"></div></div>
                </td>
                <td class="num">${c.count}</td>
                <td class="num">${c.percent.toFixed(1)}%</td>
                <td class="num"><strong>${escapeHtml(format(c.amountUsd))}</strong></td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>`;

  const reportOwnerPrefix = input.accountName
    ? `${escapeHtml(input.accountName)} · `
    : '';

  const body = `
    <div class="header">
      <div>
        <div class="brand">Pockito · Analytics Report</div>
        <h1 class="doc-title">Spending &amp; Cashflow Report</h1>
        <div class="doc-sub">${reportOwnerPrefix}Period: ${escapeHtml(periodLabel)} · ${stats.txCount} total transactions</div>
      </div>
      <div class="meta-right">
        <div class="currency-pill">${escapeHtml(input.currencyCode)}</div>
        <div>Generated ${escapeHtml(today)}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Income</div>
        <div class="kpi-value pos">${escapeHtml(format(stats.incomeUsd))}</div>
        <div class="kpi-sub">Total inflows</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Expenses</div>
        <div class="kpi-value neg">${escapeHtml(format(stats.expenseUsd))}</div>
        <div class="kpi-sub">${stats.expenseCount} expense entries</div>
      </div>
      <div class="kpi-card highlight">
        <div class="kpi-label">Net Cashflow</div>
        <div class="kpi-value ${stats.netUsd >= 0 ? 'pos' : 'neg'}">${escapeHtml(format(stats.netUsd, { sign: true }))}</div>
        <div class="kpi-sub">Savings: ${stats.savingsRate !== null ? `${stats.savingsRate}%` : '—'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Daily / Monthly Avg</div>
        <div class="kpi-value">${escapeHtml(format(stats.dailyAvgSpendUsd))}</div>
        <div class="kpi-sub">${escapeHtml(format(stats.monthlyAvgSpendUsd))}/mo</div>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <span class="section-title">Category Breakdown</span>
        <span class="section-total">${escapeHtml(format(stats.expenseUsd))}</span>
      </div>
      ${categoriesTable}
    </div>

    <div class="section">
      <div class="section-head">
        <span class="section-title">Period Highlights</span>
        <span class="section-total">${escapeHtml(periodLabel)}</span>
      </div>
      <table>
        <tbody>
          <tr>
            <td><strong>Largest Expense</strong></td>
            <td>${stats.largestExpense ? `${escapeHtml(input.getCategoryLabel(stats.largestExpense.categoryId).label)} · ${escapeHtml(stats.largestExpense.title)}` : '—'}</td>
            <td class="num" style="color:#c0392b;font-weight:700;">${stats.largestExpense ? escapeHtml(format(stats.largestExpense.amountUsd)) : '—'}</td>
          </tr>
          <tr>
            <td><strong>Largest Income</strong></td>
            <td>${stats.largestIncome ? `${escapeHtml(input.getCategoryLabel(stats.largestIncome.categoryId).label)} · ${escapeHtml(stats.largestIncome.title)}` : '—'}</td>
            <td class="num" style="color:#1f7a50;font-weight:700;">${stats.largestIncome ? escapeHtml(format(stats.largestIncome.amountUsd)) : '—'}</td>
          </tr>
          <tr>
            <td><strong>Peak Spending Day</strong></td>
            <td>${stats.peakSpendingDay ? escapeHtml(formatShortDate(stats.peakSpendingDay.date)) : '—'}</td>
            <td class="num" style="color:#c0392b;font-weight:700;">${stats.peakSpendingDay ? escapeHtml(format(stats.peakSpendingDay.amountUsd)) : '—'}</td>
          </tr>
          <tr>
            <td><strong>Best Earning Day</strong></td>
            <td>${stats.bestEarningDay ? escapeHtml(formatShortDate(stats.bestEarningDay.date)) : '—'}</td>
            <td class="num" style="color:#1f7a50;font-weight:700;">${stats.bestEarningDay ? escapeHtml(format(stats.bestEarningDay.amountUsd)) : '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>Pockito Personal Finance &amp; Wealth Tracker</span>
      <span>Generated ${escapeHtml(today)} · All values in ${escapeHtml(input.currencyCode)}</span>
    </div>
  `;

  return wrapPdfHtml(body, `Pockito Report (${periodLabel})`);
}

export function buildPdfFilename(accountName: string | undefined, docSlug: string): string {
  const userSlug = (accountName ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cleanDoc = docSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return userSlug ? `${userSlug}-pockito-${cleanDoc}.pdf` : `pockito-${cleanDoc}.pdf`;
}

async function exportAsPdf(
  html: string,
  title: string,
  fileName?: string,
): Promise<void> {
  try {
    const Print = await import('expo-print');
    const Sharing = await import('expo-sharing');
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    let shareUri = uri;
    if (fileName) {
      try {
        const { File, Paths } = await import('expo-file-system');
        const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
        const source = new File(uri);
        const target = new File(Paths.cache, safeName);
        if (target.exists) {
          target.delete();
        }
        await source.move(target);
        shareUri = target.uri;
      } catch (renameErr) {
        console.warn('Could not rename exported PDF:', renameErr);
      }
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(shareUri, {
        mimeType: 'application/pdf',
        dialogTitle: title,
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Share.share({ url: shareUri, title });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ExpoPrint') || msg.includes('ExpoSharing') || msg.includes('native module')) {
      throw new Error(
        'PDF export requires rebuilding your development build after adding expo-print & expo-sharing. Use "Share Text Report" for now or rebuild with EAS/expo run.',
      );
    }
    throw err;
  }
}

async function exportAsText(text: string, title: string): Promise<void> {
  await Share.share({ message: text, title });
}

export function promptDocumentExport(options: {
  title: string;
  fileName?: string;
  buildHtml: () => string;
  buildText: () => string;
}): void {
  const runPdf = () => {
    void exportAsPdf(options.buildHtml(), options.title, options.fileName).catch((err) => {
      Alert.alert(
        'PDF Export Unavailable',
        err instanceof Error ? err.message : 'Unable to generate PDF.',
        [
          { text: 'Share as Text Instead', onPress: () => void exportAsText(options.buildText(), options.title) },
          { text: 'OK', style: 'cancel' },
        ],
      );
    });
  };

  const runText = () => {
    void exportAsText(options.buildText(), options.title).catch(() => {});
  };

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: options.title,
        message: 'Choose how you want to export this document',
        options: ['Export Styled PDF', 'Share Formatted Text', 'Cancel'],
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) runPdf();
        else if (index === 1) runText();
      },
    );
    return;
  }

  Alert.alert(options.title, 'Choose how you want to export this document', [
    { text: 'Export Styled PDF', onPress: runPdf },
    { text: 'Share Formatted Text', onPress: runText },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
