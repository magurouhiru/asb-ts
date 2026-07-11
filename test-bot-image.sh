#!/usr/bin/env bash

# 1. エラー発生時に処理を中断する設定
set -euo pipefail

make
docker run --rm --env-file ./apps/discord-bot/.env asb-ts_discord-bot:latest