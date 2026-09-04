/**
 * 市況データ (Stooq の CSV。APIキー不要)。
 * 取得できない銘柄はそのまま落として、紙面は残りだけで組む。
 */

export interface Quote {
  name: string;
  last: number;
  changePct: number | null;
  digits: number;
  asOf: string;
}

interface Symbol {
  name: string;
  code: string;
  digits: number;
}

const SYMBOLS: Symbol[] = [
  { name: "日経平均", code: "^nkx", digits: 2 },
  { name: "TOPIX", code: "^tpx", digits: 2 },
  { name: "ドル円", code: "usdjpy", digits: 3 },
  { name: "ユーロ円", code: "eurjpy", digits: 3 },
  { name: "S&P500", code: "^spx", digits: 2 },
  { name: "NASDAQ100", code: "^ndx", digits: 2 },
  { name: "金 (ドル/oz)", code: "xauusd", digits: 2 },
  { name: "WTI原油", code: "cl.f", digits: 2 },
];

export async function fetchMarket(): Promise<Quote[]> {
  const results = await Promise.allSettled(SYMBOLS.map(fetchQuote));

  const quotes: Quote[] = [];
  for (const [i, result] of results.entries()) {
    if (result.status === "fulfilled" && result.value) {
      quotes.push(result.value);
    } else {
      const reason = result.status === "rejected" ? result.reason : "no data";
      console.error(`[warn] market quote unavailable: ${SYMBOLS[i].name} (${reason})`);
    }
  }
  return quotes;
}

async function fetchQuote(symbol: Symbol): Promise<Quote | null> {
  // 直近2週間の日足だけ取る (全履歴を落とすと重いため)
  const to = new Date();
  const from = new Date(to.getTime() - 14 * 24 * 60 * 60 * 1000);
  const url =
    `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol.code)}` +
    `&d1=${yyyymmdd(from)}&d2=${yyyymmdd(to)}&i=d`;

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const rows = (await res.text())
    .trim()
    .split("\n")
    .slice(1) // ヘッダ行 (Date,Open,High,Low,Close,Volume)
    .map((line) => line.split(","))
    .filter((cols) => cols.length >= 5 && Number.isFinite(Number(cols[4])));

  const latest = rows.at(-1);
  if (!latest) return null;

  const prev = rows.at(-2);
  const last = Number(latest[4]);
  const prevClose = prev ? Number(prev[4]) : NaN;

  return {
    name: symbol.name,
    last,
    changePct: Number.isFinite(prevClose) && prevClose !== 0 ? ((last - prevClose) / prevClose) * 100 : null,
    digits: symbol.digits,
    asOf: latest[0],
  };
}

function yyyymmdd(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

export function formatQuote(quote: Quote): string {
  return quote.last.toLocaleString("ja-JP", {
    minimumFractionDigits: quote.digits,
    maximumFractionDigits: quote.digits,
  });
}

export function formatChange(quote: Quote): string {
  if (quote.changePct === null) return "—";
  const sign = quote.changePct > 0 ? "+" : "";
  return `${sign}${quote.changePct.toFixed(2)}%`;
}
