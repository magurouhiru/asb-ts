#!/usr/bin/env bash

# 1. エラー発生時に処理を中断する設定
set -euo pipefail

echo "⏳ .gitignore から .dockerignore を生成中..."

# 2. .gitignore が存在するかチェック
if [ ! -f .gitignore ]; then
    echo "❌ エラー: .gitignore が見つかりません。"
    exit 1
fi

# 4. .dockerignore の自動生成
{
    echo "# ========================================================"
    echo "# WARNING: このファイルは .gitignore から自動生成されています。"
    echo "# 直接編集せず、.gitignore または build.sh を修正してください。"
    echo "# ========================================================"
    echo ""
    
    # 元の .gitignore の中身をコピー
    cat .gitignore
    
    echo ""
    echo "# --------------------------------------------------------"
    echo "# Docker 専用の追加除外設定"
    echo "# --------------------------------------------------------"
    echo ".git"
    echo ".gitignore"
    echo ".dockerignore"
    echo "build.sh" # このスクリプト自体も除外
} > .dockerignore

echo "✅ .dockerignore の生成が完了しました。"
