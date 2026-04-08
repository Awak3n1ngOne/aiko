# 发布到 Vercel - 使用说明

## 创建的文件

### 1. Obsidian 插件
路径: `Obsidian Vault/.obsidian/plugins/publish-to-vercel/`

### 2. 发布脚本
路径: `astro-blog/scripts/publish-to-vercel.sh`

### 3. Astro 模板
路径: `Obsidian Vault/.obsidian/templates/Astro Blog Post.md`

---

## 如何启用插件

Obsidian 默认只允许社区插件，要启用本地插件需要：

### 方法一：使用 BRAT 插件（推荐）

1. 在 Obsidian 中安装 **BRAT** 插件（社区插件）
2. 设置 -> BRAT -> Add a plugin from a GitHub repository
3. 输入此仓库地址即可自动更新

### 方法二：手动启用本地插件

1. 打开 Obsidian 设置
2. 进入 **Community Plugins**（社区插件）
3. 如果看到 "Restricted mode" 提示，点击 "Turn on community plugins"
4. 然后你会看到本地插件选项（有时需要关闭安全模式）

### 方法三：直接启用

Obsidian 的插件加载机制：
- 检查 `.obsidian/plugins/<plugin-id>/manifest.json`
- 如果 `manifest.json` 存在且有效，插件会出现在「已安装插件」列表中
- 用户需要手动开启开关

---

## 工作流程

### 1. 写文章
使用模板创建文章：`Ctrl+P` → "Templater: Astro Blog Post"

### 2. 发布
在文章文件上 **右键** → **发布到 Vercel**

或者用命令面板：`Ctrl+P` → "发布当前文章到 Vercel"

### 3. 自动执行
脚本会：
1. 复制文章到 `astro-blog/src/data/blog/`
2. Git add + commit + push
3. Vercel 检测到 GitHub 更新，自动部署

---

## 如果右键菜单没有出现

检查：
1. 插件是否已启用（设置 → 社区插件 → 已安装）
2. 文件是否是 `.md` 格式
3. 控制台是否有报错（设置 → 开发者工具）

---

## 调试

查看控制台输出：
```bash
# 在终端运行可以测试脚本
/Users/macprowzb/work/astro-blog/scripts/publish-to-vercel.sh "/Users/macprowzb/Obsidian Vault/你的文章.md"
```
