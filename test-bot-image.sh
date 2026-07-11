#!/usr/bin/env bash

# 1. エラー発生時に処理を中断する設定
set -euo pipefail

docker run --rm --env-file ./apps/discord-bot/.env asb_ts__discord_bot:latest