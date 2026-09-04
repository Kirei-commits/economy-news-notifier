import Parser from "rss-parser";
import { FEED_SOURCES, type Category, type FeedSource } from "./sources.js";

/** 1ソースあたり紙面に載せる上限(多すぎると紙面が埋もれる) */
const MAX_ITEMS_PER_SOURCE = 8;

export interface NewsItem {
  source: string;
  category: Category;
  english: boolean;
  title: string;
  link: string;
  id: string;
  isoDate?: string;
}

const parser = new Parser({ timeout: 20000 });

export async function fetchSource(source: FeedSource): Promise<NewsItem[]> {
  const feed = await parser.parseURL(source.url);
  return (feed.items ?? []).slice(0, MAX_ITEMS_PER_SOURCE).map((item) => ({
    source: source.name,
    category: source.category,
    english: source.english ?? false,
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
