#!/bin/bash
# 发布文章到 Astro Blog 并推送到 GitHub

# 配置
ASTRO_BLOG_PATH="/Users/macprowzb/work/astro-blog"
OBSIDIAN_VAULT_PATH="/Users/macprowzb/Obsidian Vault"
SOURCE_FILE="$1"

if [ -z "$SOURCE_FILE" ]; then
    echo "错误: 请指定源文件路径"
    exit 1
fi

# 获取文件名（不含扩展名）作为 slug
BASENAME=$(basename "$SOURCE_FILE" .md)
# 将空格和特殊字符替换为连字符，生成 slug
SLUG=$(echo "$BASENAME" | sed 's/[[:space:][:punct:]]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
TARGET_DIR="$ASTRO_BLOG_PATH/src/data/blog"
TARGET_FILE="$TARGET_DIR/${SLUG}.md"

echo "📄 源文件: $SOURCE_FILE"
echo "📄 Slug: $SLUG"

# 复制文件
cp "$SOURCE_FILE" "$TARGET_FILE"

# 处理文件内容：将 title 的值规范化（使用 slug 格式的标题）
# 读取原始 title
ORIGINAL_TITLE=$(grep -m1 "^title:" "$SOURCE_FILE" | sed 's/^title:[[:space:]]*//' | sed 's/^"//;s/"$//' | sed "s/^'//;s/'$//")

# 如果 title 包含空格，在 frontmatter 中保留原始格式，但文件名用 slug
# 更新文件（确保 title 格式正确）
sed -i '' "1,/^---$/s/^title:.*/title: ${ORIGINAL_TITLE}/" "$TARGET_FILE"

echo "✅ 文章已复制到: $TARGET_FILE"

# 跳转到博客目录并推送
cd "$ASTRO_BLOG_PATH" || exit 1

# Git 操作
git add "src/data/blog/${SLUG}.md"
git commit -m "Publish: ${SLUG} via Obsidian"
git push origin master

echo "✅ 已推送到 GitHub，Vercel 将自动部署"
