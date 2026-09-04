import { FEED_SOURCES } from "./sources.js";
import { fetchSource } from "./feeds.js";

/**
 * 全RSSソースに実際にアクセスして、取得できるか・件数はあるかを確認する。
 * 新しいソースを追加したときは必ずこれを通すこと (npm run check-sources)。
 */
async function main() {
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchSource));

  let failed = 0;
  for (const [i, result] of results.entries()) {
    const source = FEED_SOURCES[i];
    if (result.status === "rejected") {
      failed++;
      console.log(`FAIL   ${source.name} (${source.url}) — ${result.reason}`);
    } else if (result.value.length === 0) {
      failed++;
      console.log(`EMPTY  ${source.name} (${source.url})`);
    } else {
      console.log(`OK     ${source.name} — ${result.value.length}件 / 最新: ${result.value[0].title}`);
    }
  }

  console.log(`\n${FEED_SOURCES.length - failed}/${FEED_SOURCES.length} sources OK`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
