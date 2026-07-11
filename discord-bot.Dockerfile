# 定数の定義
ARG BUN_VERSION="1.3.14"

# ========================================================
# 1. 依存関係のインストール用ステージ (Base)
# ========================================================
FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /usr/src/app

# モノレポ全体の定義ファイルをコピーして、パッケージをキャッシュ
COPY package.json bun.lock bunfig.toml ./
# 各パッケージの定義ファイルだけを先にコピーしてキャッシュを最大化
COPY apps/discord-bot/package.json ./apps/discord-bot/
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/

# 依存をインストール
RUN bun install --frozen-lockfile --production --filter './apps/discord-bot'

# 全てのソースコードをコピー
COPY . .

# ========================================================
# 2. 本番実行用ステージ (Runner)
# ========================================================
FROM oven/bun:${BUN_VERSION}-slim AS runner
WORKDIR /usr/src/app

# # 安全のため、root以外のユーザーで実行
USER bun

# # 本番環境に必要なファイルだけを builder ステージから最小限コピー
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/package.json ./package.json
COPY --from=base /usr/src/app/packages/core ./packages/core
COPY --from=base /usr/src/app/apps/discord-bot ./apps/discord-bot

# # 環境変数の設定（本番モード）
# ENV NODE_ENV=production

# # 実行するディレクトリを作業ディレクトリに指定
WORKDIR /usr/src/app/apps/discord-bot

# # Discord Botの起動コマンド（package.jsonのscriptsに合わせて変更してください）
CMD ["bun", "run", "start"]