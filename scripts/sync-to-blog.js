#!/usr/bin/env node

/**
 * Obsidian 笔记同步到 Astro 博客
 *
 * 用法：
 *   node scripts/sync-to-blog.js <note-path>
 *   node scripts/sync-to-blog.js "My Note"          # 按标题查找
 *   node scripts/sync-to-blog.js --all               # 同步所有带 blog 标签的笔记
 *   node scripts/sync-to-blog.js --publish <slug>    # 发布已同步的文章（去掉 draft）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname, basename, extname, relative } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VAULT_PATH = "/Users/macprowzb/Obsidian Vault";
const BLOG_PATH = "/Users/macprowzb/work/astro-blog";
const BLOG_CONTENT = join(BLOG_PATH, "src/data/blog");
const VAULT_NOTES = join(VAULT_PATH, "notes");

// 确保目标目录存在
if (!existsSync(BLOG_CONTENT)) {
  mkdirSync(BLOG_CONTENT, { recursive: true });
}

/**
 * 生成 URL 友好的 slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, "")  // 保留中文、字母、数字、连字符
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 解析 Obsidian frontmatter（YAML）
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const yaml = match[1];
  const body = content.slice(match[0].length).trimStart();
  const frontmatter = {};

  yaml.split("\n").forEach(line => {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) return;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // 移除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // 处理数组（tags）
    if (value.startsWith("- ")) {
      frontmatter[key] = [value.slice(2)];
      return;
    }

    // 处理布尔值
    if (value === "true") value = true;
    else if (value === "false") value = false;

    frontmatter[key] = value;
  });

  // 处理多行数组（tags 可能跨多行）
  const yamlLines = yaml.split("\n");
  for (let i = 0; i < yamlLines.length; i++) {
    if (yamlLines[i].trim().startsWith("tags:") && yamlLines[i].includes("[")) {
      const arrMatch = yamlLines[i].match(/tags:\s*\[(.*)\]/);
      if (arrMatch) {
        frontmatter.tags = arrMatch[1].split(",").map(t => t.trim().replace(/["']/g, ""));
      }
    }
    // 多行数组格式：tags:\n  - tag1\n  - tag2
    if (yamlLines[i].trim().startsWith("tags:") && !yamlLines[i].includes("[") && i + 1 < yamlLines.length) {
      const tags = [];
      for (let j = i + 1; j < yamlLines.length; j++) {
        if (yamlLines[j].trim().startsWith("- ")) {
          tags.push(yamlLines[j].trim().slice(2).replace(/["']/g, ""));
        } else if (yamlLines[j].trim() === "") {
          continue;
        } else {
          break;
        }
      }
      if (tags.length > 0) {
        frontmatter.tags = tags;
      }
    }
  }

  return { frontmatter, body };
}

/**
 * 转换 Obsidian frontmatter 为 Astro 博客格式
 */
function convertFrontmatter(obsFm, slug) {
  const now = new Date().toISOString();

  return {
    author: obsFm.author || obsFm.作者 || "wzb",
    pubDatetime: obsFm.pubDatetime || obsFm.date || obsFm.created || now,
    title: obsFm.title || obsFm.标题 || "Untitled",
    // slug 不需要写入 frontmatter，由文件名推导
    featured: obsFm.featured || false,
    draft: obsFm.draft !== undefined ? obsFm.draft : true,
    tags: obsFm.tags || [],
    ogImage: obsFm.ogImage || "",
    description: obsFm.description || obsFm.描述 || obsFm.summary || "",
  };
}

/**
 * 将 frontmatter 对象序列化为 YAML 字符串
 */
function toYaml(fm) {
  let yaml = "---\n";
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      yaml += `${key}:\n`;
      value.forEach(v => {
        yaml += `  - ${v}\n`;
      });
    } else if (typeof value === "boolean") {
      yaml += `${key}: ${value}\n`;
    } else {
      yaml += `${key}: ${value}\n`;
    }
  }
  yaml += "---";
  return yaml;
}

/**
 * 转换 Obsidian 特有语法为博客兼容格式
 */
function convertObsidianSyntax(body, noteName) {
  // 1. 转换 Wiki-links [[note]] -> [note](/notes/slug)
  body = body.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "[$2](/notes/$1)");
  body = body.replace(/\[\[([^\]]+)\]\]/g, (match, text) => {
    const slug = generateSlug(text);
    return `[${text}](/notes/${slug})`;
  });

  // 2. 转换嵌入图片 ![[image.png]] -> 标准 Markdown
  body = body.replace(/!\[\[([^\]]+)\]\]/g, (match, filename) => {
    // 如果图片在 vault 的 attachments 目录，需要相对路径处理
    return `![${filename}](/images/${filename})`;
  });

  // 3. 转换 callout/admonition 语法
  body = body.replace(/> \[!(\w+)\](.*)\n((?:>(?:[^\n]*\n?)*)*)/g, (match, type, title, content) => {
    const cleanContent = content.replace(/^>\s?/gm, "").trim();
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    return `> **${label}${title ? ": " + title.trim() : ""}**\n> \n${content}`;
  });

  // 4. 移除 Obsidian 特有块引用 ID（如 ^abc123）
  body = body.replace(/\s*\^[a-zA-Z0-9]+$/gm, "");

  // 5. 转换 Dataview 查询块为注释（博客无法渲染）
  body = body.replace(/```dataview[\s\S]*?```/g, "<!-- Dataview query removed - not supported in blog -->");

  // 6. 移除 make-md 等插件的特殊标记
  body = body.replace(/%%[\s\S]*?%%/g, "");

  // 7. 转换高亮标记 ==text== -> **text**
  body = body.replace(/==([^=]+)==/g, "**$1**");

  return body;
}

/**
 * 复制笔记附带图片
 */
function copyAttachments(notePath, blogDir) {
  const noteDir = dirname(notePath);
  const noteName = basename(notePath, extname(notePath));

  // 检查同名文件夹（Obsidian 附件文件夹）
  const attachmentsFolder = join(noteDir, noteName);
  if (existsSync(attachmentsFolder)) {
    const imagesDir = join(BLOG_PATH, "public/images");
    if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

    execSync(`find "${attachmentsFolder}" -type f \\( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.webp" -o -name "*.svg" \\) -exec cp {} "${imagesDir}/" \\;`);
  }

  // 检查 vault 级别的 attachments 目录
  const vaultAttachments = join(VAULT_PATH, "attachments");
  if (existsSync(vaultAttachments)) {
    const imagesDir = join(BLOG_PATH, "public/images");
    execSync(`cp "${vaultAttachments}"/* "${imagesDir}/" 2>/dev/null || true`);
  }
}

/**
 * 同步单篇笔记到博客
 */
function syncNote(notePath) {
  console.log(`\n📝 正在同步: ${notePath}`);

  if (!existsSync(notePath)) {
    console.error(`❌ 文件不存在: ${notePath}`);
    return false;
  }

  const content = readFileSync(notePath, "utf-8");
  const { frontmatter: obsFm, body } = parseFrontmatter(content);

  const title = obsFm.title || basename(notePath, extname(notePath));
  const fileName = basename(notePath, extname(notePath)); // 使用文件名作为 slug

  const blogFm = convertFrontmatter(obsFm, fileName);
  const convertedBody = convertObsidianSyntax(body, title);

  const outputContent = `${toYaml(blogFm)}\n\n${convertedBody}\n`;
  const outputPath = join(BLOG_CONTENT, `${fileName}.md`);

  writeFileSync(outputPath, outputContent, "utf-8");
  console.log(`✅ 已转换: ${fileName}.md`);

  // 复制附件图片
  copyAttachments(notePath);

  return outputPath;
}

/**
 * Git commit + push 触发 Vercel 部署
 */
function deploy(message = "blog: sync notes from obsidian") {
  console.log("\n🚀 正在部署到 Vercel...");

  try {
    // 切换到 git repo root（上层目录）
    const GIT_ROOT = join(BLOG_PATH, "..");

    // Git add（相对路径在 git repo root 下）
    execSync(`git -C "${GIT_ROOT}" add "astro-blog/src/data/blog/"`, { stdio: "inherit" });

    // 检查是否有变更
    const status = execSync(`git -C "${GIT_ROOT}" status --porcelain "astro-blog/src/data/blog/"`, { encoding: "utf-8" }).trim();
    if (!status) {
      console.log("ℹ️  没有变更，跳过部署");
      return true;
    }

    // Commit
    execSync(`git -C "${GIT_ROOT}" commit -m "${message}"`, { stdio: "inherit" });

    // 确保 remote 使用 SSH
    try {
      execSync(`git -C "${GIT_ROOT}" remote set-url origin git@github.com:Awak3n1ngOne/aiko.git`, { stdio: "ignore" });
    } catch { /* ignore if already set */ }
    execSync(`git -C "${GIT_ROOT}" push`, { stdio: "inherit" });

    console.log("\n✅ 已推送，Vercel 将自动构建部署");
    return true;
  } catch (err) {
    console.error(`❌ 部署失败: ${err.message}`);
    return false;
  }
}

// --- CLI ---

const [action, ...args] = process.argv.slice(2);

if (action === "--publish" && args[0]) {
  // 发布：将 draft 改为 false
  const slug = args[0];
  const filePath = join(BLOG_CONTENT, `${slug}.md`);

  if (!existsSync(filePath)) {
    console.error(`❌ 未找到文章: ${slug}`);
    process.exit(1);
  }

  const content = readFileSync(filePath, "utf-8");
  const updated = content.replace(/draft:\s*true/, "draft: false");
  writeFileSync(filePath, updated);
  console.log(`✅ 已发布: ${slug}`);
  deploy(`blog: publish ${slug}`);

} else if (action === "--all") {
  // 同步所有笔记（需要指定目录）
  console.log("⚠️  --all 需要配合标签过滤，暂未实现。请指定具体笔记路径。");

} else if (action && (action.endsWith(".md") || existsSync(action))) {
  // 同步指定文件
  const resolvedPath = existsSync(action) ? action : join(VAULT_PATH, action);
  const result = syncNote(resolvedPath);

  if (result) {
    const confirmed = deploy(`blog: sync ${basename(result, ".md")}`);
    if (confirmed) {
      console.log("\n🎉 同步并部署完成！");
    }
  }
} else {
  console.log(`
📝 Obsidian → Astro Blog 同步工具

用法：
  node scripts/sync-to-blog.js <笔记路径>    同步并部署单篇笔记
  node scripts/sync-to-blog.js "笔记标题"    按标题查找并同步
  node scripts/sync-to-blog.js --publish <slug>  发布草稿文章
  node scripts/sync-to-blog.js --all         同步所有笔记

示例：
  node scripts/sync-to-blog.js "notes/我的文章.md"
  node scripts/sync-to-blog.js --publish my-article
  `);
}
