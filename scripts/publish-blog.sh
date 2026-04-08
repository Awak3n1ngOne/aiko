#!/bin/bash
# 同步当前编辑的 Obsidian 笔记到 Astro 博客并部署
# 用法：./scripts/publish-blog.sh "笔记标题或路径"

set -e

VAULT_PATH="/Users/macprowzb/Obsidian Vault"
BLOG_PATH="/Users/macprowzb/work/astro-blog"
NOTE_INPUT="$1"

if [ -z "$NOTE_INPUT" ]; then
  echo "❌ 请提供笔记路径或标题"
  echo "用法：./scripts/publish-blog.sh <笔记路径或标题>"
  exit 1
fi

# 解析笔记路径
if [[ "$NOTE_INPUT" == /* ]]; then
  NOTE_PATH="$NOTE_INPUT"
elif [[ -f "$VAULT_PATH/$NOTE_INPUT" ]]; then
  NOTE_PATH="$VAULT_PATH/$NOTE_INPUT"
elif [[ -f "$VAULT_PATH/notes/$NOTE_INPUT" ]]; then
  NOTE_PATH="$VAULT_PATH/notes/$NOTE_INPUT"
else
  # 尝试按标题查找
  FOUND=$(find "$VAULT_PATH" -name "${NOTE_INPUT}*" -type f 2>/dev/null | head -1)
  if [ -z "$FOUND" ]; then
    echo "❌ 找不到笔记: $NOTE_INPUT"
    exit 1
  fi
  NOTE_PATH="$FOUND"
  echo "📍 找到笔记: $NOTE_PATH"
fi

# 执行同步
cd "$BLOG_PATH"
node scripts/sync-to-blog.js "$NOTE_PATH"
