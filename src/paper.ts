import type { NewsItem } from "./feeds.js";
import type { Quote } from "./market.js";
import { formatChange, formatQuote } from "./market.js";
import { CATEGORY_ORDER, type Category } from "./sources.js";

export interface Issue {
  /** 発行日 (YYYY-MM-DD, JST) */
  date: string;
  headline: string;
  lead: string;
  topItems: NewsItem[];
  items: NewsItem[];
  quotes: Quote[];
}

const PAPER_NAME = "経済日報";

export function renderIssue(issue: Issue, options: { isLatest: boolean }): string {
  const grouped = new Map<Category, NewsItem[]>();
  for (const item of issue.items) {
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category)!.push(item);
  }

  const sections = CATEGORY_ORDER.filter((c) => grouped.has(c))
    .map((category) => renderSection(category, grouped.get(category)!))
    .join("\n");

  const nav = options.isLatest
    ? `<a href="archive/">バックナンバー</a>`
    : `<a href="../">最新号</a> ・ <a href="./">バックナンバー</a>`;

  return page({
    title: `${PAPER_NAME} ${formatDateLabel(issue.date)}`,
    body: `
<header class="masthead">
  <div class="masthead-meta">${formatDateLabel(issue.date)}</div>
  <h1 class="paper-name">${PAPER_NAME}</h1>
  <div class="masthead-meta">${escapeHtml(String(issue.items.length))}本 ／ 朝刊</div>
</header>

<article class="lead">
  <h2 class="lead-headline">${escapeHtml(issue.headline)}</h2>
  ${issue.lead ? `<p class="lead-body">${escapeHtml(issue.lead)}</p>` : ""}
  ${renderTopItems(issue.topItems)}
</article>

${renderMarket(issue.quotes)}

<main class="sections">
${sections}
</main>

<footer class="colophon">
  <p>${nav}</p>
  <p>RSSで収集した公開記事の見出しを機械的に整理し、要約はAIが生成しています。投資判断は一次情報をご確認ください。</p>
</footer>
`,
  });
}

export interface ArchiveEntry {
  date: string;
  headline: string;
  file: string;
}

export function renderArchiveIndex(entries: ArchiveEntry[]): string {
  const rows = entries
    .map(
      (entry) => `  <li>
    <span class="archive-date">${formatDateLabel(entry.date)}</span>
    <a href="${escapeHtml(entry.file)}">${escapeHtml(entry.headline)}</a>
  </li>`
    )
    .join("\n");

  return page({
    title: `${PAPER_NAME} バックナンバー`,
    body: `
<header class="masthead">
  <div class="masthead-meta">縮刷版</div>
  <h1 class="paper-name">${PAPER_NAME}</h1>
  <div class="masthead-meta">全${entries.length}号</div>
</header>

<main class="sections">
  <ul class="archive-list">
${rows || "  <li>まだ発行された号はありません。</li>"}
  </ul>
</main>

<footer class="colophon">
  <p><a href="../">最新号</a></p>
</footer>
`,
  });
}

function renderTopItems(items: NewsItem[]): string {
  if (items.length === 0) return "";
  const lis = items
    .map(
      (item) => `    <li><a href="${escapeHtml(item.link)}">${escapeHtml(item.title)}</a>
      <span class="source">${escapeHtml(item.source)}</span></li>`
    )
    .join("\n");
  return `  <ul class="top-items">
${lis}
  </ul>`;
}

function renderMarket(quotes: Quote[]): string {
  if (quotes.length === 0) return "";
  const rows = quotes
    .map((quote) => {
      const dir = quote.changePct === null ? "flat" : quote.changePct > 0 ? "up" : quote.changePct < 0 ? "down" : "flat";
      return `      <tr>
        <th scope="row">${escapeHtml(quote.name)}</th>
        <td class="num">${escapeHtml(formatQuote(quote))}</td>
        <td class="num ${dir}">${escapeHtml(formatChange(quote))}</td>
      </tr>`;
    })
    .join("\n");

  return `<section class="market">
  <h2 class="section-heading">市況</h2>
  <table>
    <thead>
      <tr><th scope="col">銘柄</th><th scope="col" class="num">終値</th><th scope="col" class="num">前日比</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <p class="market-note">出典: Stooq (日足終値)</p>
</section>`;
}

function renderSection(category: Category, items: NewsItem[]): string {
  const lis = items
    .map(
      (item) => `    <li><a href="${escapeHtml(item.link)}">${escapeHtml(item.title)}</a>
      <span class="source">${escapeHtml(item.source)}</span></li>`
    )
    .join("\n");

  return `<section class="section">
  <h2 class="section-heading">${escapeHtml(category)}</h2>
  <ul class="articles">
${lis}
  </ul>
</section>`;
}

function page({ title, body }: { title: string; body: string }): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${STYLES}
</style>
</head>
<body>
<div class="paper">
${body}
</div>
</body>
</html>
`;
}

const STYLES = `:root {
  --ink: #16130f;
  --ink-soft: #5a534a;
  --rule: #c9c1b4;
  --paper: #f7f4ec;
  --accent: #8a1c1c;
  --up: #b3261e;
  --down: #1b5e9c;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ink: #ece7dd;
    --ink-soft: #a49c90;
    --rule: #3e3830;
    --paper: #14120f;
    --accent: #d98b8b;
    --up: #e2726a;
    --down: #7fb2e0;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", "Times New Roman", serif;
  line-height: 1.75;
}
.paper {
  max-width: 900px;
  margin: 0 auto;
  padding: 28px 20px 64px;
}
.masthead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 3px double var(--rule);
  flex-wrap: wrap;
}
.paper-name {
  margin: 0;
  font-size: clamp(30px, 7vw, 46px);
  letter-spacing: 0.34em;
  text-indent: 0.34em;
  font-weight: 700;
}
.masthead-meta {
  font-size: 13px;
  color: var(--ink-soft);
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.lead { padding: 22px 0 4px; border-bottom: 1px solid var(--rule); }
.lead-headline {
  margin: 0 0 12px;
  border-left: 5px solid var(--accent);
  padding-left: 14px;
  font-size: clamp(23px, 4.6vw, 34px);
  line-height: 1.45;
  letter-spacing: 0.02em;
}
.lead-body {
  margin: 0 0 16px;
  font-size: 16.5px;
  text-align: justify;
}
.top-items { list-style: none; margin: 0 0 20px; padding: 0; border-top: 1px solid var(--rule); }
.top-items li { padding: 9px 0; border-bottom: 1px dotted var(--rule); }
.top-items a { font-size: 16px; font-weight: 600; }
.market { padding: 18px 0; border-bottom: 1px solid var(--rule); }
.market table { width: 100%; border-collapse: collapse; font-size: 14px; }
.market th, .market td { padding: 5px 8px; border-bottom: 1px solid var(--rule); text-align: left; }
.market thead th { font-size: 12px; color: var(--ink-soft); letter-spacing: 0.1em; font-weight: 500; }
.market .num { text-align: right; font-variant-numeric: tabular-nums; }
.market .up { color: var(--up); }
.market .down { color: var(--down); }
.market-note { margin: 8px 0 0; font-size: 12px; color: var(--ink-soft); }
.sections { padding-top: 22px; }
@media (min-width: 720px) {
  .sections { column-count: 2; column-gap: 34px; column-rule: 1px solid var(--rule); }
}
.section { break-inside: avoid-column; margin: 0 0 26px; }
.section-heading {
  margin: 0 0 10px;
  font-size: 14px;
  letter-spacing: 0.22em;
  font-weight: 700;
  padding-bottom: 5px;
  border-bottom: 2px solid var(--ink);
}
.articles, .archive-list { list-style: none; margin: 0; padding: 0; }
.articles li { padding: 8px 0; border-bottom: 1px dotted var(--rule); }
.archive-list li { padding: 10px 0; border-bottom: 1px dotted var(--rule); }
.archive-date { display: inline-block; min-width: 11em; color: var(--ink-soft); font-size: 13px; }
a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--rule); }
a:hover { color: var(--accent); border-bottom-color: var(--accent); }
.source { display: block; font-size: 12px; color: var(--ink-soft); letter-spacing: 0.06em; }
.colophon {
  margin-top: 26px;
  padding-top: 14px;
  border-top: 3px double var(--rule);
  font-size: 12.5px;
  color: var(--ink-soft);
}
.colophon p { margin: 6px 0; }
@media print {
  body { background: #fff; color: #000; }
  a { border-bottom: none; }
}`;

export function formatDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}年${m}月${d}日(${weekday})`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
