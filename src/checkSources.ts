import { FEED_SOURCES } from "./sources.js";
import { fetchSource } from "./feeds.js";

/**
 * 全RSSソースに実際にアクセスして、取得できるか・件数はあるかを確認する。
 * 新しいソースを追加したときは必ずこれを通すこと (npm run check-sources)。
 */
async function main() {
  let failed = 0;

  for (const source of FEED_SOURCES) {
    try {
      const items = await fetchSource(source);
      if (items.length === 0) {
        failed++;
        console.log(`EMPTY  ${source.name} (${source.url})`);
        continue;
      }
      console.log(`OK     ${source.name} — ${items.length}件 / 最新: ${items[0].title}`);
    } catch (err) {
      failed++;
      console.log(`FAIL   ${source.name} (${source.url}) — ${(err as Error).message}`);
    }
  }

  console.log(`\n${FEED_SOURCES.length - failed}/${FEED_SOURCES.length} sources OK`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
