# economy-news-notifier

経済ニュースをRSSから収集し、新聞レイアウトのHTML(GitHub Pages)として日刊で発行しつつDiscordに通知するNode.js/TypeScriptアプリ。
姉妹アプリ `ai-news-notifier` (AIニュースのDiscord通知) と同じ構成を応用している。

## 構成

- `src/sources.ts` — RSSフィード一覧(分野カテゴリ付き)
- `src/feeds.ts` — フィード取得(失敗したソースは警告して読み飛ばす)
- `src/market.ts` — Stooqから市況を取得(APIキー不要、取れない銘柄は落とす)
- `src/digest.ts` — Geminiで一面見出し・リード文・重要記事の選定・英語見出しの和訳
- `src/paper.ts` — 新聞レイアウトのHTML生成(明朝・段組み・市況表)
- `src/index.ts` — メイン処理: 収集 → 既読除外 → 市況 → 要約 → 紙面出力 → Discord投稿
- `src/seenStore.ts` — 既読記事IDの永続化 (`data/seen.json`)
- `src/checkSources.ts` — 全ソースの疎通確認 (`npm run check-sources`)
- `docs/` — 発行済みの紙面(GitHub Pagesの公開ディレクトリ)。手で編集しない
- `.github/workflows/daily.yml` — 毎朝7:00 JSTの自動発行

## 開発

```bash
npm install
npm run dev
npm run typecheck
npm run check-sources
```

## 注意点

- `data/seen.json` と `data/issues.json`、`docs/` はGitHub Actionsが自動コミットする生成物。ローカルでの不要なコミットに注意。
- 新しいRSSソースを追加する際は、`npm run check-sources` で実際に取得できることを確認してからマージすること(存在しないURLを推測で追加しない)。
- 外部サービス(RSS・Stooq・Gemini)は落ちる前提。どれが欠けても紙面は発行できる状態を保つこと。
