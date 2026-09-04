import Parser from "rss-parser";
import { FEED_SOURCES, type Category, type FeedSource } from "./sources.js";

/** 1ソースあたり紙面に載せる上限(多すぎると紙面が埋もれる) */
const MAX_ITEMS_PER_SOURCE = 8;

/**
 * 1ソースの取得を打ち切るまでの時間。
 * rss-parser 内蔵の timeout はリダイレクト先や応答が細切れの場合に効かないことがあるため、
 * fetch + AbortSignal で確実に打ち切る。
 */
const FETCH_TIMEOUT_MS = 15000;

const USER_AGENT =
  "economy-news-notifier/1.0 (+https://github.com/Kirei-commits/economy-news-notifier)";

export interface NewsItem {
  source: string;
  category: Category;
  title: string;
  link: string;
  id: string;
  isoDate?: string;
}

const parser = new Parser();

export async function fetchSource(source: FeedSource): Promise<NewsItem[]> {
  const res = await fetch(source.url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const feed = await parser.parseString(await res.text());
  return (feed.items ?? []).slice(0, MAX_ITEMS_PER_SOURCE).map((item) => ({
    source: source.name,
    category: source.category,
    title: (item.title ?? "(no title)").trim(),
    link: item.link ?? "",
    id: item.guid ?? item.link ?? `${source.name}:${item.title}`,
    isoDate: item.isoDate,
  }));
}

export async function fetchAllFeeds(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchSource));

  const items: NewsItem[] = [];
  for (const [i, result] of results.entries()) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      console.error(`[warn] failed to fetch ${FEED_SOURCES[i].name}: ${result.reason}`);
    }
  }
  return items;
}
