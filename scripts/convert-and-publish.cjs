#!/usr/bin/env node
/**
 * Obsidian 文章转 Astro 格式
 * 自动提取标题、描述、标签，转换语法
 */

const fs = require('fs');
const path = require('path');

const ASTRO_BLOG_PATH = '/Users/macprowzb/work/astro-blog';
const BLOG_DIR = path.join(ASTRO_BLOG_PATH, 'src/data/blog');

// ============ 配置 ============
const AUTHOR = 'wzb';
const DEFAULT_TAGS = [];

// ============ 工具函数 ============

/**
 * 生成 slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

/**
 * 转换 Obsidian 高亮语法 ==text== 为 <mark>text</mark>
 */
function convertHighlights(content) {
  return content.replace(/==([^=]+)==/g, '<mark>$1</mark>');
}

/**
 * 转换 wiki links [[link]] 或 [[link|display]]
 */
function convertWikiLinks(content) {
  return content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, link, display) => {
    return display || link;
  });
}

/**
 * 提取标题（从文件内容第一行或 H1）
 */
function extractTitle(content, filename) {
  // 尝试从内容中找标题
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // H1 标题
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }

  // 从文件名提取（去掉扩展名）
  return filename.replace(/\.md$/, '');
}

/**
 * 提取描述（取前 150 个字符）
 */
function extractDescription(content) {
  // 去掉 frontmatter（如果有）
  let text = content.replace(/^---[\s\S]*?---\n/, '');

  // 去掉标题
  text = text.replace(/^#.+\n/gm, '');

  // 去掉代码块
  text = text.replace(/```[\s\S]*?```/g, '');

  // 去掉 [[ ]] 和 == ==
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2 || $1');
  text = text.replace(/==([^=]+)==/g, '$1');

  // 清理空白
  text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

  // 取前 150 字符
  return text.substring(0, 150) + (text.length > 150 ? '...' : '');
}

/**
 * 提取标签（从 #tag 或文件名目录）
 */
function extractTags(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const tags = [...DEFAULT_TAGS];

  // 从内容提取 #标签
  const tagMatches = content.match(/#[a-zA-Z\u4e00-\u9fa5-]+/g) || [];
  tagMatches.forEach(tag => {
    const tagName = tag.substring(1);
    if (!tags.includes(tagName)) {
      tags.push(tagName);
    }
  });

  // 从目录名提取
  const relativePath = filePath.replace('/Users/macprowzb/Obsidian Vault/', '');
  const dirParts = relativePath.split('/');
  if (dirParts.length > 1 && dirParts[0] !== '.') {
    const dirTag = dirParts[0];
    if (!tags.includes(dirTag) && !tags.includes('Obsidian')) {
      tags.push(dirTag);
    }
  }

  return tags;
}

/**
 * 格式化日期为 ISO 8601
 */
function formatDate() {
  return new Date().toISOString();
}

/**
 * 转换单个文件
 */
function convertFile(sourceFile) {
  console.log(`\n📄 处理: ${sourceFile}`);

  // 读取文件
  const content = fs.readFileSync(sourceFile, 'utf-8');
  const filename = path.basename(sourceFile, '.md');

  // 提取信息
  const title = extractTitle(content, filename);
  const slug = generateSlug(title);
  const description = extractDescription(content);
  const tags = extractTags(sourceFile);

  console.log(`  标题: ${title}`);
  console.log(`  Slug: ${slug}`);
  console.log(`  标签: ${tags.join(', ')}`);

  // 转换内容
  let convertedContent = convertWikiLinks(content);
  convertedContent = convertHighlights(convertedContent);

  // 构建 Astro frontmatter（不包含空的 ogImage）
  let frontmatter = `---
author: ${AUTHOR}
pubDatetime: ${formatDate()}
title: ${title}
featured: false
draft: false
tags:
${tags.map(t => '  - ' + t).join('\n')}
description: ${description}
---`;

  // 组合最终内容
  const finalContent = frontmatter + '\n' + convertedContent;

  // 保存
  const targetFile = path.join(BLOG_DIR, `${slug}.md`);
  fs.writeFileSync(targetFile, finalContent, 'utf-8');

  console.log(`  ✅ 已保存: ${targetFile}`);

  return { slug, targetFile };
}

/**
 * Git 推送
 */
function gitPush(slug, targetFile) {
  console.log('\n🚀 推送到 GitHub...');

  const { execSync } = require('child_process');

  try {
    execSync('git add "src/data/blog/' + slug + '.md"', {
      cwd: ASTRO_BLOG_PATH,
      stdio: 'inherit'
    });

    execSync('git commit -m "Publish: ' + slug + ' via Obsidian"', {
      cwd: ASTRO_BLOG_PATH,
      stdio: 'inherit'
    });

    execSync('git push origin master', {
      cwd: ASTRO_BLOG_PATH,
      stdio: 'inherit'
    });

    console.log('✅ 已推送到 GitHub，Vercel 将自动部署');
  } catch (error) {
    console.error('❌ Git 操作失败:', error.message);
    process.exit(1);
  }
}

// ============ 主程序 ============

const sourceFile = process.argv[2];

if (!sourceFile) {
  console.error('用法: node convert-and-publish.js <文件路径>');
  process.exit(1);
}

if (!fs.existsSync(sourceFile)) {
  console.error(`文件不存在: ${sourceFile}`);
  process.exit(1);
}

if (!sourceFile.endsWith('.md')) {
  console.error('只支持 .md 文件');
  process.exit(1);
}

// 确保目标目录存在
if (!fs.existsSync(BLOG_DIR)) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
}

// 转换
const { slug } = convertFile(sourceFile);

// 推送
gitPush(slug);
