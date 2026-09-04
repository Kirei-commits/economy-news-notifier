# economy-news-notifier

経済ニュースをRSSから毎日収集し、**新聞レイアウトのHTML(GitHub Pages)** として発行しつつ、要点をDiscordに通知するアプリ。
`ai-news-notifier` の仕組み(RSS収集 → 既読管理 → Gemini要約 → GitHub Actionsで定期実行)を応用しています。

- 朝刊: `https://<ユーザー名>.github.io/economy-news-notifier/`
- 縮刷版(バックナンバー): `/archive/`

## 紙面の作り方

1. `src/sources.ts` のRSSから新着記事を収集(既読は `data/seen.json` で除外)
2. Stooqから市況(日経平均・ドル円・S&P500など)を取得
3. Geminiが「一面の見出し」「リード文(総括)」「重要記事の選定」「英語見出しの和訳」を生成
4. `docs/index.html` に最新号、`docs/archive/YYYY-MM-DD.html` にバックナンバーを書き出し
5. Discordに一面の要約と紙面へのリンクを投稿

APIキーや市況が取れない場合も、取れた範囲で紙面は発行されます(Geminiなしなら原題のまま、市況なしなら市況欄を省略)。

## セットアップ

```bash
npm install
cp .env.example .env
# .env に DISCORD_WEBHOOK_URL と GEMINI_API_KEY を設定
npm start            # 紙面を生成してDiscordに投稿
npm run check-sources  # 全RSSソースの疎通確認
```

### Gemini API Key

1. https://aistudio.google.com/apikey でキーを発行
2. `.env` の `GEMINI_API_KEY` に設定

### Discord Webhook URL

1. 通知したいチャンネルの設定 →「連携サービス」→「ウェブフック」→「新しいウェブフック」
2. URLをコピーして `.env` の `DISCORD_WEBHOOK_URL` に設定

## GitHub側の設定

1. Settings → Secrets and variables → Actions に `DISCORD_WEBHOOK_URL` と `GEMINI_API_KEY` を登録
2. Settings → Pages で Source を「Deploy from a branch」、ブランチを `main` / フォルダを `/docs` に設定
3. Actions タブから `Daily Economy Paper` を手動実行して動作確認

`.github/workflows/daily.yml` が毎朝7:00 JSTに発行し、生成物(`docs/`, `data/`)を自動コミットします。

## 情報源

`src/sources.ts` に分野(金融政策 / 国内経済 / 海外経済 / マーケット・企業)付きで定義しています。
追加するときは必ず `npm run check-sources` で実際に取得できることを確認してください
(`Check RSS Sources` ワークフローが週次と `src/sources.ts` を変更したPRで自動実行します)。

## 注意

- 掲載しているのは各社の公開RSSの見出しとリンクで、本文は転載していません。
- リード文はAI生成です。投資判断の際は一次情報を確認してください。
