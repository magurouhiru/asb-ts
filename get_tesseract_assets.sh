#!/bin/bash

# エラーが発生したら停止
set -e

# 保存先ディレクトリ
TARGET_DIR="./tesseract-assets"
mkdir -p "$TARGET_DIR"

echo "📂 ターゲットディレクトリを作成しました: $TARGET_DIR"

# バージョンの指定
# TESS_VERSION="5.2.1"
# CORE_VERSION="5.2.4"

# ⬇️ 取得したい言語を配列で定義（必要なだけ追加してください）
LANGUAGES=("eng" "jpn" )

# echo "📥 1. tesseract.min.js をダウンロード中..."
# curl -sL "https://unpkg.com{TESS_VERSION}/dist/tesseract.min.js" -o "${TARGET_DIR}/tesseract.min.js"

# echo "📥 2. worker.min.js をダウンロード中..."
# curl -sL "https://unpkg.com{TESS_VERSION}/dist/worker.min.js" -o "${TARGET_DIR}/worker.min.js"

# echo "📥 3. tesseract-core.wasm.js をダウンロード中..."
# curl -sL "https://unpkg.com{CORE_VERSION}/tesseract-core.wasm.js" -o "${TARGET_DIR}/tesseract-core.wasm.js"

echo "📥 4. 言語データを一括ダウンロード中..."
for LANG in "${LANGUAGES[@]}"; do
  echo "   -> ${LANG}.traineddata を取得中..."
  curl -sL "https://github.com/tesseract-ocr/tessdata_fast/raw/refs/heads/main/${LANG}.traineddata" -o "${TARGET_DIR}/${LANG}.traineddata"
done

echo "✨ すべてのファイルのダウンロードが完了しました！"
ls -lh "$TARGET_DIR"