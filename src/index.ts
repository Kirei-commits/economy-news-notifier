import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fetchAllFeeds, type NewsItem } from "./feeds.js";
import { loadSeen, saveSeen } from "./seenStore.js";
import { postToDiscord } from "./discord.js";
import { fetchMarket, formatChange, formatQuote, type Quote } from "./market.js";
import { buildDigest, fallbackDigest, type Digest } from "./digest.js";
import { renderArchiveIndex, renderIssue, formatDateLabel, type ArchiveEntry } from "./paper.js";

/** 1号あたりに載せる記事の上限 */
const MAX_ITEMS_PER_ISSUE = 60;

const DOCS_DIR = fileURLToPath(new URL("../docs/", import.meta.url));
const ARCHIVE_DIR = `${DOCS_DIR}archive/`;
const ISSUES_FILE = fileURLToPath(new URL("../data/issues.json", import.meta.url));

async function main() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const seen = await loadSeen();
  const allItems = await fetchAllFeeds();
  const newItems = allItems.filter((item) => !seen.has(item.id)).slice(0, MAX_ITEMS_PER_ISSUE);

  if (newItems.length === 0) {
    console.log("No new items. 本日は発行なし。");
    return;
  }

  const quotes = await fetchMarket();

  let digest: Digest;
  if (geminiApiKey) {
    digest = await buildDigest(geminiApiKey, newItems, quotes);
  } else {
    console.warn("[warn] GEMINI_API_KEY is not set; 要約・和訳なしで発行します。");
    digest = fallbackDigest(newItems);
  }
  newItems.forEach((item, i) => (item.title = digest.titles[i]));

  const date = todayInTokyo();
  const topItems = digest.top.map((i) => newItems[i]);
  const html = renderIssue({ date, headline: digest.headline, lead: digest.lead, topItems, items: newItems, quotes }, { isLatest: true });

  await publish(date, digest.headline, html);

  if (webhookUrl) {
    await postToDiscord(webhookUrl, formatDiscordMessage(date, digest, topItems, newItems, quotes));
    console.log(`Posted the ${date} issue to Discord.`);
  } else {
    console.warn("[warn] DISCORD_WEBHOOK_URL is not set; 紙面の生成のみ行いました。");
  }

  for (const item of newItems) seen.add(item.id);
  await saveSeen(seen);

  console.log(`Published the ${date} issue with ${newItems.length} article(s).`);
}

/** docs/ に最新号・バックナンバー・縮刷版の目次を書き出す */
async function publish(date: string, headline: string, latestHtml: string): Promise<void> {
  await mkdir(ARCHIVE_DIR, { recursive: true });

  const file = `${date}.html`;
  await writeFile(`${DOCS_DIR}index.html`, latestHtml);
  await writeFile(`${ARCHIVE_DIR}${file}`, latestHtml.replaceAll('href="archive/"', 'href="./"'));

  const issues = await loadIssues();
  const entries = [{ date, headline, file }, ...issues.filter((issue) => issue.date !== date)].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  await writeFile(ISSUES_FILE, JSON.stringify(entries, null, 2));
  await writeFile(`${ARCHIVE_DIR}index.html`, renderArchiveIndex(entries));
}

async function loadIssues(): Promise<ArchiveEntry[]> {
  try {
    return JSON.parse(await readFile(ISSUES_FILE, "utf-8")) as ArchiveEntry[];
  } catch {
    return [];
  }
}

function formatDiscordMessage(
  date: string,
  digest: Digest,
  topItems: NewsItem[],
  items: NewsItem[],
  quotes: Quote[]
): string {
  const lines = [`📰 **経済日報 ${formatDateLabel(date)}**`, "", `**${digest.headline}**`];

  if (digest.lead) lines.push("", digest.lead);

  if (quotes.length > 0) {
    lines.push("", "**市況**", quotes.map((q) => `${q.name} ${formatQuote(q)} (${formatChange(q)})`).join(" / "));
  }

  const highlights = topItems.length > 0 ? topItems : items.slice(0, 5);
  lines.push("", "**主なニュース**");
  for (const item of highlights) {
    lines.push(`- [${item.title}](${item.link}) — ${item.source}`);
  }

  const paperUrl = resolvePaperUrl();
  lines.push("", paperUrl ? `全${items.length}本の紙面はこちら → ${paperUrl}` : `本日は全${items.length}本を掲載。`);

  return lines.join("\n");
}

function resolvePaperUrl(): string | null {
  if (process.env.PAPER_URL) return process.env.PAPER_URL;

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) return null;
  const [owner, repo] = repository.split("/");
  return `https://${owner.toLowerCase()}.github.io/${repo}/`;
}

function todayInTokyo(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
