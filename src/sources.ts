export type Category = "金融政策" | "国内経済" | "海外経済" | "マーケット・企業";

/** 紙面での並び順(一面に近い順) */
export const CATEGORY_ORDER: Category[] = ["金融政策", "国内経済", "海外経済", "マーケット・企業"];

export interface FeedSource {
  name: string;
  url: string;
  category: Category;
}

/**
 * 掲載するRSS。すべて `npm run check-sources` で疎通を確認済み。
 * 追加・変更したときは必ず同じ確認を通すこと。
 */
export const FEED_SOURCES: FeedSource[] = [
  // 金融政策(中央銀行の一次情報)
  { name: "日本銀行", url: "https://www.boj.or.jp/rss/whatsnew.xml", category: "金融政策" },
  { name: "FRB", url: "https://www.federalreserve.gov/feeds/press_all.xml", category: "金融政策" },
  { name: "ECB", url: "https://www.ecb.europa.eu/rss/press.html", category: "金融政策" },

  // 国内経済
  { name: "NHK 経済", url: "https://www.nhk.or.jp/rss/news/cat5.xml", category: "国内経済" },
  { name: "Yahoo!ニュース 経済", url: "https://news.yahoo.co.jp/rss/topics/business.xml", category: "国内経済" },
  { name: "ロイター 日本語", url: "https://jp.reuters.com/rssFeed/topNews", category: "国内経済" },
  { name: "時事通信", url: "https://www.jiji.com/rss/rss2.xml", category: "国内経済" },
  { name: "産経 経済", url: "https://www.sankei.com/economy/rss.xml", category: "国内経済" },

  // 海外経済
  { name: "Nikkei Asia", url: "https://asia.nikkei.com/rss/feed/nar", category: "海外経済" },
  { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "海外経済" },
  { name: "CNBC Economy", url: "https://www.cnbc.com/id/20910258/device/rss/rss.html", category: "海外経済" },

  // マーケット・企業
  {
    name: "WSJ Markets",
    url: "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain",
    category: "マーケット・企業",
  },
  {
    name: "MarketWatch",
    url: "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    category: "マーケット・企業",
  },
];
