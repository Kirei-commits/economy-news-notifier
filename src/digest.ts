import type { NewsItem } from "./feeds.js";
import type { Quote } from "./market.js";
import { formatChange, formatQuote } from "./market.js";

const MODEL = "gemini-3.6-flash";

export interface Digest {
  /** 一面の主見出し */
  headline: string;
  /** 一面のリード文(300字程度の総括) */
  lead: string;
  /** 一面に立てる記事のインデックス(items と対応) */
  top: number[];
  /** items と同順・同数の日本語見出し */
  titles: string[];
}

export function fallbackDigest(items: NewsItem[]): Digest {
  return {
    headline: "本日の経済",
    lead: "",
    top: [],
    titles: items.map((item) => item.title),
  };
}

export async function buildDigest(
  apiKey: string,
  items: NewsItem[],
  quotes: Quote[]
): Promise<Digest> {
  if (items.length === 0) return fallbackDigest(items);

  const list = items.map((item, i) => ({
    i,
    source: item.source,
    category: item.category,
    title: item.title,
  }));
  const market = quotes.map((q) => `${q.name} ${formatQuote(q)} (${formatChange(q)})`).join(" / ");

  const prompt = [
    "あなたは経済新聞の編集長です。以下は本日集まった経済ニュースの見出し一覧です。",
    "これをもとに、日刊紙の一面を組んでください。",
    "",
    "指示:",
    "1. headline: 本日の経済を一言で表す主見出し。25字以内、体言止め。誇張や煽りは避ける。",
    "2. lead: 一面のリード文。300字程度の日本語。全体の流れ(金融政策・国内・海外・市況)を俯瞰し、",
    "   何が起きたかを事実ベースで要約する。見出しにない情報を創作しない。断定できないことは書かない。",
    "3. top: 特に重要な記事のインデックスを重要度順に3〜5件。",
    "4. titles: 入力と同じ順序・同じ件数で、各記事の日本語見出し。英語の見出しは自然な日本語に訳し、",
    "   日本語の見出しはそのまま(冗長な場合のみ簡潔に整える)。固有名詞・企業名・指標名は無理に和訳しない。",
    "",
    market ? `本日の市況: ${market}` : "本日の市況データは取得できていません。",
    "",
    "記事一覧(JSON):",
    JSON.stringify(list),
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            headline: { type: "STRING" },
            lead: { type: "STRING" },
            top: { type: "ARRAY", items: { type: "INTEGER" } },
            titles: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["headline", "lead", "top", "titles"],
        },
      },
    }),
  });

  if (!res.ok) {
    console.error(`[warn] Gemini digest failed: ${res.status} ${await res.text()}`);
    return fallbackDigest(items);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  try {
    const parsed = text ? (JSON.parse(text) as Partial<Digest>) : null;
    if (parsed && Array.isArray(parsed.titles) && parsed.titles.length === items.length) {
      return {
        headline: parsed.headline?.trim() || "本日の経済",
        lead: parsed.lead?.trim() ?? "",
        top: (parsed.top ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < items.length).slice(0, 5),
        titles: parsed.titles.map((t, i) => t?.trim() || items[i].title),
      };
    }
  } catch {
    // 下の警告に落ちる
  }

  console.error("[warn] Gemini returned an unexpected format; falling back to raw headlines");
  return fallbackDigest(items);
}
