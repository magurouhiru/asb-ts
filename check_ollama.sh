#!/bin/bash

OLLAMA_URL="http://ollama:11434"

# 1. 起動ステータスの確認
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$OLLAMA_URL/")

if [ "$STATUS" -ne 200 ]; then
    echo "【ERROR】Ollama に接続できません。(Status: $STATUS)"
    exit 1
fi

echo "【SUCCESS】Ollama は正常に起動しています。"
echo "--------------------------------------------"
echo "ダウンロード済みのモデル一覧:"

# 2. モデル一覧を取得して整形出力
# APIのレスポンス（JSON）から各モデルの "name" を抽出します
curl -s "$OLLAMA_URL/api/tags" | jq -r '.models[].name' | while read -r model; do
    echo "  - $model"
done