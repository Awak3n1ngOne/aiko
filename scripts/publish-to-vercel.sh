#!/bin/bash
# 发布文章到 Astro Blog 并推送到 GitHub
# 使用智能转换脚本，自动处理 Obsidian 格式

NODE_PATH="/opt/homebrew/bin/node"
NODE_SCRIPT="/Users/macprowzb/work/astro-blog/scripts/convert-and-publish.cjs"
SOURCE_FILE="$1"

if [ -z "$SOURCE_FILE" ]; then
    echo "错误: 请指定源文件路径"
    echo "用法: $0 <文件路径>"
    exit 1
fi

if [ ! -f "$SOURCE_FILE" ]; then
    echo "错误: 文件不存在: $SOURCE_FILE"
    exit 1
fi

if [ ! "${SOURCE_FILE: -3}" == ".md" ]; then
    echo "错误: 只支持 .md 文件"
    exit 1
fi

# 运行 Node.js 转换脚本
"$NODE_PATH" "$NODE_SCRIPT" "$SOURCE_FILE"
