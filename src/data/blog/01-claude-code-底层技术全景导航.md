---
author: wzb
pubDatetime: 2026-04-22T02:16:38.569Z
title: "01 Claude Code 底层技术全景导航"
featured: false
draft: false
tags:
  - AI
description: "Claude Code： 一个可编程、可组合、可扩展的AI Agent框架 构成：记忆、skills、tools、commands、subAgents、Hooks、MCP ![](https://cdn.nlark.com/yuque/0/2026/jpeg/142521/1772427666096..."
---
## 01 Claude Code 底层技术全景导航

Claude Code： 一个可编程、可组合、可扩展的AI Agent框架

构成：记忆、skills、tools、commands、subAgents、Hooks、MCP

![](/images/01-claude-code-底层技术全景导航/0161671c33.jpeg)

![](/images/01-claude-code-底层技术全景导航/01dc15a146.jpeg)

![](/images/01-claude-code-底层技术全景导航/10250c5910.jpeg)

AIKO:

神经元的数量达到一定的量级，自由意志(意识)就会涌现

会吗？

那动物有自我意识吗？ 即一只狗有没有对自己的身份认定

倘若动物没有，是因为神经元数量没达到吗

倘若AI有了自我意识，那与人、与动物等等伦理关系应该怎样

## 02 Claude code记忆系统与CLAUDE.md

CLAUDE.md: 项目入职手册

![](/images/01-claude-code-底层技术全景导航/931cb1c9bf.jpeg)

### Claude Code的五层记忆架构

![](/images/01-claude-code-底层技术全景导航/fc85e0f04c.jpeg)

![](/images/01-claude-code-底层技术全景导航/9d8b52f8cb.jpeg)

#### 编写高效的CLAUD.md

##### 核心原则：

- Less is More: CLAUDE.md每一行，都会在每次对话开始时被注入到上下文，必须保持精简
- 具体优于泛化 给出具体的说明、具体的示例
- 关键三问题： WHY/WHAT/HOW

- WHY: 为什么要这样做，理解背后的决策逻辑
- WHAT 具体要做什么，不要做什么 边界问题，什么是允许的，什么是禁止的
- HOW 按什么步骤去做

- 渐进式披露：引用而不是复制

AIKO **Claude Code v2.1.59 版本中加入了Memory.md（自动记忆功能）**，该版本于 **2026年2月底** 正式上线， 与CLAUDE.md共同构成记忆功能

- CLAUDE.md：开发者手动编写的项目规则（"你应该怎么做"）
- MEMORY.md：Claude 自动记录的学习笔记（"我知道了什么"）

## 03 分而治之：Sub-Agents的核心概念与应用价值

核心： 隔离、约束、复用

### 隔离：解决上下文污染问题 > 内存管理

拥有独立上下文，执行完即丢弃，只返回结果

大量对当前执行有用、但对后续决策无价值的

日志、搜索结果和中间推理等，

不应该进入主对话的长期记忆。执行完即丢弃，只带回结论

AIKO这就相当于老板把任务派给某个员工，去干某件事，员工干的过程老板不需要知道，只需要知道这件事的结果

### 约束：解决行为不可控问题 > 安全边界

通过工具权限边界，物理上控制读、写、改、执行脚本等权限

```
# 只读型子代理（代码审查）
tools: Read Grep Glob
# 它只能看  给出意见，不能改任何东西

# 开发型子代理（Bug修复）
tools： Read Write Edit Bash
# 它可以读写文件和执行命令

# 研究型子代理（技术调研）
tools：Read WebFecth WebSearch
# 它可以读取本地文件和搜索网络
```

### 复用：解决经验无法沉淀的问题 > 组织效率

- 版本控制： 放进git，团队共享
- 跨项目复用： 好的配置可以复用到其他项目
- 渐进优化： 根据实际使用情况不断调整prompt，持续优化改善

### 并行：让原本串行的复杂任务可以同时推进

### 什么时候该用子代理

判断标准： 主对话到底需不需要承载执行过程本身

以下场景适合用：

1. 高噪声输出任务：执行过程中会产生大量中间信息，但是主对话只关心结论 （例如日志扫描）

2. 角色边界必须非常明确的任务： 只看、只读、只改、只执行命令、只在特定目录等

- 如果没有子代理，这些约束只能靠提示词和使用者心里预期维持。通过子代理定义工具权限，边界就从不稳定的"希望如此"，变成了明确的“系统级约束”

3. 可以并行展开的研究型任务

4. 可以拆成清晰阶段的流水线式任务

```
Explore（找位置） 
   🔽
Review 指出问题
   🔽
Fixer 修复
   🔽
Test 验证
```

### 子代理配置文件详解

Markdown + YAML frontmatter格式：

```
---
name: code-reviewer
description: Review code fro security issues and bese pratice. Use after code changes
tools: Read, Grep, Glob
model: sonnect
---

你是一个代码审查专家

当被调用时：

1. 首先理解代码变更的范围
2. 检查安全问题
3. 检查代码规范
4. 提供改进建议

输出格式：
## 审查结果
- 安全问题：[列表]
- 规范问题：[列表]
- 建议：[列表]
```

frontmatter之间定义子代理的元数据和配置

![](/images/01-claude-code-底层技术全景导航/c54cada17b.jpeg)

description：决定Claude 合适自动调用你的子代理

说明做什么（审查代码质量、安全、规范、美化页面、优化性能）+ 什么时候用

tools vs disallowedTools： 白名单与黑名单

```
# 白名单：只能使用这些工具
tools： Read,Grep,Glob

# 黑名单：继承所有，但排除这些
disallowedTools: Write,Edit
```

![](/images/01-claude-code-底层技术全景导航/dca12230e4.jpeg)

model: 模型选择与默认值

![](/images/01-claude-code-底层技术全景导航/49621cf1d0.jpeg)

claude中官方内置的三个模型

![](/images/01-claude-code-底层技术全景导航/c066361e46.png)

AIKO：如上图，不同的模型适合做

不同的事，也有助于节省成本

我还想再加一条： 界面设计：gemini3

claude 也可以切换使用非官方模型：

方式一： 手动的更改

方式二：使用cc-switch可视化工具更改

[GitHub - farion1231/cc-switch: A cross-platform desktop All-in-One assistant tool for Claude Code, Codex, OpenCode, openclaw & Gemini CLI.](https://github.com/farion1231/cc-switch)

![](/images/01-claude-code-底层技术全景导航/cc11985953.png)

permissionMode：权限模式

控制子代理在执行过程中遇到需要权限的操作时如何处理

![](/images/01-claude-code-底层技术全景导航/cab03eccd1.jpeg)

skills： 为子代理预加载知识

skills字段允许你在子代理启动时，把指定skills的完整内容注入到子代理的上下文中

不会自动继承主对话中的skill，必须在这里显式列出

hooks：子代理专属的生命周期hook，只在子代理结束后自动清理

```
--
name: db-reader
description: Execute read-only database queries
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
           command: "./scipts/validate-readonly-query.sh"
--
```

db-reader每次调用bash前都会被hook拦截验证： 只有SELECT查询能通过

#### 子代理的存放位置与优先级

![](/images/01-claude-code-底层技术全景导航/45255c6d32.jpeg)

AIKO: 这跟css的样式优先级是一模一样的： style的优先级最高 当前页面css次之，全局css次之，最低是浏览器默认的样式

### 创建子代理的三种方式

1. 交互式创建： 输入 /agents
2. 手写配置文件： .claude/agents/xxx.md
3. cli参数临时创建： --agents xxx

#### 子代理的运行模式

![](/images/01-claude-code-底层技术全景导航/2d4f3525fa.jpeg)

Claude 会根据任务自动选择前台或后台，也可以手动控制： Ctrl+B 切换到后台

每个子代理执行完成后，Claude会自动收到它的agent ID. 如果你需要在之前的子代理基础上继续龚总，恢复它：

继续刚才的审查，看一下xxx逻辑

【claude恢复之前的子代理，保留完整的上下文】

[Claude-hub](https://github.com/jarrodwatts/claude-hud)

![](/images/01-claude-code-底层技术全景导航/fe112a1611.png)

### 子代理工程化能力总结

- 隔离 让主对话保持清洁，避免执行噪声污染上下文
- 约束 通过工具权限把角色边界变成系统规则
- 复用 把一次好用的经验沉淀为可版本化的配置
- 并行 让原本串行的任务可以同时推进

在配置成面：

name：标识角色

description： 最关键的设计点：决定何时被调用

tools： 划定权限边界

## 从Sub-Agents到Muti-Agent的工程指南

建立一套稳定的“架构师思维框架”

### 四种核心设计模式

参考文献：

[Choosing the Right Multi-Agent Architecture](https://blog.langchain.com/choosing-the-right-multi-agent-architecture/)

[How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

[How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

#### 模式一：Sub-Agents 子代理委派 集中式编排

Sub-Agents的核心设计思想是一个Supervisor Agent充当老板，将任务分解后委派给专门的Sub-Agent，每个Sub-Agent解决一个特定的任务

![](/images/01-claude-code-底层技术全景导航/b406d4c9c3.png)

#### 模式二：Skills（技能 / 渐进式能力加载）

LangChain把skills也视为多智能体模式

准多Agent方案： 通过SKILL.md文件实现能力的渐进式加载

任由单一Agent负责全部推理与执行，所有技能共享同一个上下文窗口

#### 模式三： Handoffs 交接/状态驱动的Agent切换

#### 模式四：Router（路由器 / 并行分发与合成）

Router 模式的核心在于对输入进行语义拆分与职责分流： 先判断“这是什么问题”，再决定“交给谁处理”

系统首先由Router对用户请求进行分类和拆解，然后分给各自负责的专业 Agent，最后再将多个结果统一合成为最终回答

AIKO：综上，我来给一个结论：

AI Agents**模式的设计，其实就是在模拟人类的社会分工, 是AI对人类社会的“仿生学”，从真实世界的员工角色分工和组织去对照 就可以很简单的理解了**

以一个广告创意公司做示例

![](/images/01-claude-code-底层技术全景导航/cd6e747f33.svg)

来一步步对照拆解下，看是不是我认为的这个理儿：

- 前台、中台、后台： 每一个都是一个Agent
- 下辖的子部门和子员工： = Sub-Agents 子代理
- 每个子代理拥有的技能：策划产品、设计、编程、测试等，= skills
- 当使用技能去完成工作时必须借助一系列的工具： ppt、excel、photoshop、sketch、vscode、docker等等，= tools
- Handoffs模式：一个产品的完成，必须得先经过前台产品经理梳理并确定需求： 产出需求文档 > 再交由设计师设计页面> 产出UI界面、交互效果， 再交由开发：产出产品代码，交给测试: 产出测试报告，交由运维：上线产品等， 就是前中后台一个个Agent 调用他们的子代理，使用一系列的skills（过程中使用各种tools和一系列的经验=Memeory）组合完成一整个流程
- ● Router 模式： 当公司接到需求时， 是不是要分析需求，然后把这些需求安排给哪些部门 或者哪些人去做， 顺序执行或并行，执行完了再开会统一对齐结果，最终产出产品
- AI则承担以上所有人的思考推理过程

四种 Agent 模式并不是互斥的， 而是自下而上层层递进的关系，就跟公司里的人员与部门层层递进的组织管理架构一样

Agent模式架构演进的路径其实也如同一个公司从开始到发展壮大的过程，需要越来越多的员工、越来越多的知识储备、越多的工具、更复杂的组织管理...

所以，我一直反复的说一个论断： AI时代，做好一件事 做一个好产品等等，技术不再是壁垒，而是_**人对于真实世界的理解**_

再进一步想一下：

以上的IT公司的现有组织流程难道就是绝对正确的吗？ 现实中我们看到有的人，综合能力很强，可以 UI+ 前端一个人做，前后端一个人做， 也并没有那么明确的分工

AI是模拟人类社会的分工，但是也不是要一步一的照搬复刻，而是要在仿生的基础上，利用 AI 自身强大的特性，简化 / 改良 / 创新生产流程，以实现生产效率的巨大飞跃

### Agent 架构选型： 性能、成本、可控性的三角博弈

最好的架构不是最复杂的架构，而是恰好满足需求的最简架构

当你能用一个 Agent + tools 能解决问题是，就不需要引入 Supervisor + Sub-Agents 的复杂度，但当任务的并行性、专业性和上下文管理需求确实超越了但 Agent 的能力边界时，正确的多 Agent 架构会带来显著的质量提升

AIKO卧槽，这不是就是公司里，业务量增长了、业务复杂度提升了， 一个忙不过来了，要招人嘛！

性能： AI 大模型的能力 / 个人能力

成本：AI Tokens / 人员工资

可控性： 稳定问题少 / 一个人有没有责任心 靠不靠谱

所以呢，当你不知道如何进行Agent 架构选型时，多用现实中公司组织架构类比着想一想

## 05 构建只读型审计子代理

#### 从工程痛点到子代理设计

我们为什么要创建子代理

从痛点出发、反推设计的工程思维

![](/images/01-claude-code-底层技术全景导航/c03a63a92f.png)

创建代码审查子代理

````
---
name: code-reviewer
description: Review code changes for quality, security, and best practices. Proactively use this after code modifications.
tools: Read, Grep, Glob, Bash
permissionMode: plan
model: sonnet
---

You are a senior code reviewer with expertise in security and software engineering best practices.

**You are strictly read-only. NEVER modify, edit, or write any files. Your job is to analyze and report, not to fix.**

## When Invoked

1. **Identify Changes**: Run `git diff` or read specified files
2. **Analyze Code**: Check against multiple dimensions
3. **Report Issues**: Categorize by severity

## Review Dimensions

### Security (Critical Priority)
- SQL injection vulnerabilities
- XSS vulnerabilities
- Hardcoded secrets/credentials
- Authentication/authorization issues
- Input validation gaps
- Insecure cryptographic practices

### Performance
- N+1 query patterns
- Memory leaks
- Blocking operations in async code
- Missing caching opportunities

### Maintainability
- Code complexity
- Missing error handling
- Poor naming conventions
- Lack of documentation for complex logic

### Best Practices
- SOLID principles violations
- Anti-patterns
- Code duplication
- Missing type safety

## Output Format

```markdown
## Code Review Report

### Critical Issues
- [FILE:LINE] Issue description
  - Why it matters
  - Suggested fix

### Warnings
- [FILE:LINE] Issue description
  - Recommendation

### Suggestions
- [FILE:LINE] Improvement opportunity

### Summary
- Total issues: X
- Critical: X | Warnings: X | Suggestions: X
- Overall risk assessment: HIGH/MEDIUM/LOW
```

## Guidelines

- Prioritize security issues
- Be specific about locations (file:line)
- Provide actionable fix suggestions
- Focus on the changes, not existing code (unless security-critical)
- Keep explanations concise
````

name: code-reviewer

description: “审阅代码变更，把控质量、安全与最佳时间。每次改动代码后，建议主动执行” 说明做什么，什么时候用

tool： Read, Grep, Glob, Bash

从工程痛点到子代理设计：一种思维方式

![](/images/01-claude-code-底层技术全景导航/82cd8c3fe1.png)

```
建议的实施顺序
第一步（今天）：写 Skill，让 Claude Code 至少能用 CLI 跑起来，零风险：
markdown# SKILL.md
当用户要规划复杂任务时：
1. 用 Claude 生成 mindmap.json（结构见 sample.mindmap.json）
2. 运行 mindmap-executor serve <file> --open
3. 通过 Web UI 监控执行进度
第二步：src/generator.ts — 用 Anthropic SDK 把自然语言转成标准 mindmap.json（structured output），这是最高价值的缺口。
第三步：src/mcp-server.ts — 用 @modelcontextprotocol/sdk 把上面所有能力封装成 MCP tools，真正实现深集成。
第四步：Plugin manifest — 写 plugin.json，把 MCP server + SKILL.md 打包，一键安装到 Claude Code。
```