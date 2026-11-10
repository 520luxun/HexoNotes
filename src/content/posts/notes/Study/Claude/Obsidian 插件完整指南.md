---
title: "Obsidian 插件完整指南"
published: 2026-07-17
description: ""
tags: ["obsidian", "plugins", "配置"]
category: "学习笔记"
draft: false
---

# Obsidian 插件完整指南

> 共 **22 个社区插件**（13 启用 / 9 未启用）+ **25 个核心插件**（24 启用 / 1 禁用）
> 数据采集自 `.obsidian/plugins/*/manifest.json` 和 `.obsidian/core-plugins.json` · 最后更新 2026-07-17

---

## 一、核心插件（Core Plugins）

Obsidian 内置插件，无需安装，可在「设置 → 核心插件」中开关。

| 插件 | 状态 | 功能说明 |
|------|:--:|---------|
| **文件浏览器** (file-explorer) | ✅ | 左侧文件树面板，浏览和管理 vault 中的文件和文件夹 |
| **全局搜索** (global-search) | ✅ | `Ctrl+Shift+F` 全文搜索，支持正则、路径过滤 |
| **快速切换** (switcher) | ✅ | `Ctrl+O` 快速打开文件，输入文件名即时跳转 |
| **关系图谱** (graph) | ✅ | 可视化笔记之间的双向链接关系，支持局部/全局视图 |
| **反向链接** (backlink) | ✅ | 显示当前笔记被哪些笔记引用，右侧面板查看 |
| **白板** (canvas) | ✅ | 无限画布，自由放置笔记卡片、图片、连线，适合头脑风暴 |
| **出链** (outgoing-link) | ✅ | 显示当前笔记引用了哪些笔记 |
| **标签面板** (tag-pane) | ✅ | 列出 vault 中所有标签及其出现次数，点击筛选 |
| **脚注** (footnotes) | ✅ | 支持 Markdown 脚注语法 `[^1]` |
| **属性** (properties) | ✅ | 编辑笔记的 YAML frontmatter 元数据，支持类型化字段 |
| **页面预览** (page-preview) | ✅ | `Ctrl+鼠标悬停` 预览链接内容，无需打开笔记 |
| **日记** (daily-notes) | ✅ | 快速创建/打开当天日记，可指定文件夹和模板 |
| **模板** (templates) | ✅ | 插入预定义模板文件内容到当前笔记 |
| **笔记重组** (note-composer) | ✅ | 合并/拆分笔记 |
| **命令面板** (command-palette) | ✅ | `Ctrl+P` 搜索并执行所有命令 |
| **斜杠命令** (slash-command) | ✅ | 编辑器中 `/` 触发命令菜单 |
| **编辑器状态** (editor-status) | ✅ | 底部状态栏显示光标位置、字数等 |
| **书签** (bookmarks) | ✅ | 收藏常用文件/文件夹/搜索结果/图谱 |
| **Markdown 导入** (markdown-importer) | ✅ | 从其他笔记应用导入 Markdown 文件 |
| **漫游笔记** (random-note) | ✅ | 随机打开一篇笔记，适合回顾/发现 |
| **大纲** (outline) | ✅ | 显示当前笔记的标题结构，点击快速跳转 |
| **字数统计** (word-count) | ✅ | 右下角显示当前笔记字数、字符数 |
| **幻灯片** (slides) | ✅ | 将笔记渲染为演示文稿 |
| **录音机** (audio-recorder) | ✅ | 在笔记中录制并嵌入音频 |
| **工作区** (workspaces) | ✅ | 保存/切换不同的面板布局 |
| **文件恢复** (file-recovery) | ✅ | 意外关闭后恢复未保存的修改 |
| **同步** (sync) | ✅ | Obsidian Sync 官方同步服务 |
| **数据库** (bases) | ✅ | 表格/数据库视图管理笔记 |
| **网页查看器** (webviewer) | ✅ | 在 Obsidian 内嵌入网页 |
| **ZK 前缀** (zk-prefixer) | ❌ | 自动生成 Zettelkasten 风格的 12 位时间戳作为笔记标题 |
| **发布** (publish) | ❌ | Obsidian Publish 官方发布服务 |

---

## 二、社区插件 — 已启用 ✅

### 1. Claudian `v2.0.34`

| 项 | 值 |
|----|-----|
| **作者** | Yishen Tu |
| **插件 ID** | `realclaudian` |
| **描述** | 将 Claude Code、Codex 等编程 agent 嵌入 vault。vault 成为 agent 的工作目录，agent 可读写文件、搜索、执行 bash 命令、编排多步骤工作流 |

**核心能力**:
- 🤖 多模型 AI 助手（Claude Opus/Sonnet/Haiku/Fable）
- 📂 Vault 级文件操作：读取、编辑、创建，精确到行号
- 🔗 笔记上下文感知：可读取当前笔记、链接笔记、编辑器选中内容
- 🖥️ Bash 终端：在 vault 内执行 shell 命令
- 🌐 网页内容读取：可获取 Obsidian 内置浏览器中选中的网页内容
- 🔧 多步骤编排：跨文件重构、批量操作、自动化流程

**典型用法**:
- 代码审查、Bug 修复
- 知识整理、批量文档生成
- 图表绘制（搭配 Excalidraw 技能）
- Vault 自动化管理

---

### 2. Excalidraw `v2.25.3`

| 项 | 值 |
|----|-----|
| **作者** | Zsolt Viczian |
| **插件 ID** | `obsidian-excalidraw-plugin` |
| **描述** | 在 Obsidian 中直接创建和编辑矢量绘图，支持脚本自动化、Markdown 嵌入、双向链接 |

**核心能力**:
- ✏️ 手绘风格/干净线条矢量图：流程图、架构图、思维导图
- 🔗 元素 ↔ 笔记双向链接
- 📝 图表内嵌入 Markdown 笔记内容
- 🎨 丰富元素：形状、箭头、图片、自由绘图、文本
- 📜 脚本引擎：自动生成/修改图表元素
- 🖼️ 导出 PNG/SVG/Excalidraw JSON
- 🔲 4D 无限画布（缩放+旋转+嵌套）

**典型用法**:
- 系统架构、数据流图
- 头脑风暴草图
- 笔记可视化
- 搭配 `.excalidraw` 技能（如 `Claude 模型梯级对比.excalidraw`）

---

### 3. PDF++ `v0.40.31`

| 项 | 值 |
|----|-----|
| **作者** | Ryota Ushio |
| **插件 ID** | `pdf-plus` |
| **描述** | Obsidian 原生的 PDF 标注工具，支持高亮、批注、双向链接 |

**核心能力**:
- 🖊️ 多色高亮 + 下划线标注
- 📝 PDF 页面批注/评论
- 🔗 标注 → Obsidian 笔记双向链接
- 📋 摘录引用：选中段落一键生成引用块
- 🔍 PDF 全文本搜索
- 📊 标注集中管理面板

**典型用法**:
- 论文/电子书深度阅读
- 文献摘录 → 知识库
- 学习笔记与原文对照

---

### 4. Calendar `v1.5.10`

| 项 | 值 |
|----|-----|
| **作者** | Liam Cain |
| **插件 ID** | `calendar` |
| **描述** | 日历视图显示 Daily Notes，支持月/周视图、活动热力图 |

**核心能力**:
- 📅 右侧面板嵌入月历
- 🔵 有日记的日期自动标记圆点
- 📊 年度活动热力图
- ⏪ 周历模式切换

**典型用法**:
- 追踪每日写作习惯
- 快速跳转历史日记
- 写作频率可视化

---

### 5. Templater `v2.20.6`

| 项 | 值 |
|----|-----|
| **作者** | SilentVoid |
| **插件 ID** | `templater-obsidian` |
| **描述** | 高级模板引擎，支持类 Handlebars 动态变量和 JavaScript 脚本 |

**核心能力**:
- 🔧 动态变量：`<% tp.date.now() %>`、`<% tp.file.title %>` 等
- 📜 JS 脚本：模板中可执行任意 JavaScript
- 📂 文件夹模板：指定文件夹自动套用
- ⚡ 触发模板：新建文件/日记时自动应用
- 🔄 命令调用：模板内触发 Obsidian 命令

**与 `Daily/日记模板.md` 的配合**:
模板中的 `{{date:YYYY-MM-DD HH:mm}}` 和 `{{date:YYYY 年 MM 月 DD 日 dddd}}` 由 Templater 自动替换为实际日期。

---

### 6. Recent Files `v1.7.9`

| 项 | 值 |
|----|-----|
| **作者** | Tony Grosinger |
| **插件 ID** | `recent-files-obsidian` |
| **描述** | 侧边栏显示最近打开的文件列表 |

**核心能力**:
- 📋 按时间倒序展示最近文件
- 🔍 从列表中快速跳转
- ⚙️ 可配置显示的条目数量

---

### 7. Local REST API with MCP `v4.1.7`

| 项 | 值 |
|----|-----|
| **作者** | Adam Coddington |
| **插件 ID** | `obsidian-local-rest-api` |
| **描述** | 提供安全的 HTTPS REST API 和 MCP 服务器，供外部程序读写 vault |

**核心能力**:
- 🌐 REST API：程序化操作笔记、文件夹、标签
- 🔌 MCP 服务器：Claude Desktop / 外部 AI 直连 vault
- 🛡️ API Key / 证书双重认证
- 📡 实时 WebSocket 事件通知（文件变更、创建等）

**典型用法**:
- 自动化脚本（如 iOS 快捷指令写笔记）
- Claude Desktop 通过 MCP 读取知识库
- Raycast/Alfred 等效率工具集成

---

### 8. Better Export PDF `v2.0.3`

| 项 | 值 |
|----|-----|
| **作者** | l1xnan |
| **插件 ID** | `better-export-pdf` |
| **描述** | 增强 PDF 导出，支持预览、书签大纲、页眉页脚 |

**核心能力**:
- 👁️ 导出前实时预览
- 📑 基于标题层级自动生成 PDF 书签（大纲）
- 📄 自定义页眉/页脚（日期、文件名、页码）
- 🎨 可配置导出样式（字体、页边距、纸张大小）

---

### 9. Dataview `v0.5.68` ✅

| 项 | 值 |
|----|-----|
| **作者** | Michael Brenan |
| **插件 ID** | `dataview` |
| **描述** | 数据查询引擎——用类 SQL 语法跨 vault 查询笔记元数据、动态生成列表/表格/日历 |

**核心能力**:
- 📊 DQL：`TABLE` `LIST` `TASK` `CALENDAR` 四种视图
- 🔢 DataviewJS：JavaScript API 实现复杂自定义渲染
- 🏷️ 基于 frontmatter YAML + 内联字段 `field:: value` 过滤

**快速上手**:

````markdown
```dataview
TABLE weather, mood
FROM "Daily"
SORT file.ctime DESC
LIMIT 7
```
````

---

### 10. Omnisearch `v1.29.3` ✅

| 项 | 值 |
|----|-----|
| **作者** | Simon Cambier |
| **插件 ID** | `omnisearch` |
| **描述** | 高性能搜索引擎——模糊匹配、实时结果、PDF/图片内容索引 |

**核心能力**:
- 🔍 拼错也能搜（`pluggin` → `plugin`）
- 🚀 打字即出结果，无需按回车
- 📄 索引 PDF 和图片中的文字
- 🏋️ 智能排序：标题匹配优先 + 修改时间加权

**打开方式**: `Ctrl+P` → `Omnisearch: Open search`，建议绑快捷键 `Ctrl+Shift+O`。

---

### 11. Notebook Navigator `v3.2.3` ✅

| 项 | 值 |
|----|-----|
| **作者** | Johan Sanneblad |
| **插件 ID** | `notebook-navigator` |
| **描述** | 增强双面板文件浏览器——文件夹树 + 标签浏览 + 预览 + 键盘导航 |

**核心能力**:
- 📂 文件夹树 + 🏷️ 标签浏览器双面板
- 👁️ 侧边预览（不打开笔记就能看到内容）
- ⌨️ 纯键盘操作（支持 Vim 风格快捷键）
- 📌 置顶收藏 + 拖拽排序

**打开方式**: 点击左侧边栏的 Notebook Navigator 图标（替换默认文件浏览器）。

---

### 12. Another Quick Switcher `v14.7.0` ✅

| 项 | 值 |
|----|-----|
| **作者** | tadashi-aikawa |
| **插件 ID** | `obsidian-another-quick-switcher` |
| **描述** | 比内置 Quick Switcher 更强的文件切换器——模糊搜索、最近文件、标签搜索、反向链接搜索 |

**核心能力**:
- 🔍 高级模糊匹配（比内置 `Ctrl+O` 更智能）
- 📂 最近文件快速回访
- 🏷️ 按标签过滤 + 🔗 按反向链接搜索
- ⭐ 与书签联动

**打开方式**: `Ctrl+P` → `Another Quick Switcher: Open`，建议替换默认 `Ctrl+O` 绑定。

---

### 13. Commander `v0.5.7` ✅

| 项 | 值 |
|----|-----|
| **作者** | jsmorabito & phibr0 |
| **插件 ID** | `cmdr` |
| **描述** | 界面命令定制——任意位置添加按钮、创建宏、增强移动端工具栏 |

**核心能力**:
- 🔘 标题栏/状态栏/侧边栏添加自定义命令按钮
- 🧩 宏命令：组合多条命令一键触发
- 📱 移动端工具栏定制

**快速上手**: `设置 → Commander → 选择一个位置（如状态栏）→ Add Command → 选择常用命令（如 `Git: Commit`）`。

---

## 三、社区插件 — 未启用 ⏸️

> 以下插件已安装但未启用，每个都有突出的能力——按需开启即可。

### 14. Tasks `v8.2.2`

| 项 | 值 |
|----|-----|
| **作者** | Clare Macrae & Ilyas Landikov |
| **插件 ID** | `obsidian-tasks-plugin` |
| **描述** | 全局任务管理——截止日期、重复任务、优先级、完成日期 |

**Emoji 约定**: 📅 截止 · ✅ 完成 · ⏫🔼🔽 优先级 · 🔁 重复 · 🛫 开始

**启用后可在任意笔记中写**:
````markdown
```tasks
not done
due before next week
sort by priority
```
````

---

### 15. Git `v2.38.6`

**作者** Vinzent — 定时自动 commit+push，历史对比，冲突合并。适合需要版本控制的 vault。

---

### 16. Style Settings `v1.0.9`

**作者** mgmeyers — 主题 CSS 变量可视调节。与主题配合调整配色/字体/布局。

---

### 17. Terminal `v3.26.0`

**作者** polyipseity — 嵌入式终端面板，支持 PowerShell/Git Bash/WSL/CMD。

---

### 18. Tag Wrangler `v0.6.4`

**作者** PJ Eby — 批量重命名/合并标签。标签多了以后必备。

---

### 19. QuickAdd `v2.12.3`

**作者** Christian B. B. Houmann — 快速捕获想法、插入模板、宏命令。

---

### 20. File Explorer Note Count `v1.2.4`

**作者** Ozan Tellioglu — 文件夹旁显示笔记数量。

---

### 21. Advanced Canvas `v6.5.0`

| 项 | 值 |
|----|-----|
| **插件 ID** | `advanced-canvas` |
| **描述** | 增强白板（Canvas）功能——更多节点类型、样式控制、快捷操作 |

**核心能力**:
- 🎨 节点样式自定义（颜色、边框、圆角）
- ➕ 更多节点形状（圆形、菱形、云朵等）
- 🔗 连线样式增强
- 📐 对齐/分布辅助

---

### 22. Charts `v3.9.0`

| 项 | 值 |
|----|-----|
| **插件 ID** | `obsidian-charts` |
| **描述** | 在笔记中嵌入交互式图表，基于 Chart.js |

**核心能力**:
- 📊 支持柱状图、折线图、饼图、雷达图等
- 🎨 可自定义颜色和样式
- 📋 数据源支持 CSV 格式

**快速上手**:
````markdown
```chartsview
type: bar
data:
  - label: 周一
    value: 12
  - label: 周二
    value: 19
```
````

---

## 四、启用建议

| 场景 | 你已启用 ✅ | 建议再加 |
|------|-----------|---------|
| **每日写日记** | Templater + Calendar + Dataview | QuickAdd |
| **知识管理** | Dataview + Omnisearch + Tag Wrangler | Tasks |
| **深度阅读** | PDF++ + Omnisearch | — |
| **图表/可视化** | Excalidraw | — |
| **界面效率** | Another Quick Switcher + Notebook Navigator + Commander + Recent Files | — |
| **AI 辅助** | Claudian + Local REST API | — |
| **文件导出** | Better Export PDF | — |
| **版本控制** | — | Git |

---

## 五、快捷键速查

| 快捷键 | 功能 | 插件 |
|--------|------|------|
| `Ctrl+O` | 快速切换文件 | 核心 |
| `Ctrl+P` | 命令面板 | 核心 |
| `Ctrl+Shift+F` | 全局搜索 | 核心 |
| `Ctrl+Shift+O` | Omnisearch 智能搜索 | Omnisearch |
| `Ctrl+E` | 切换编辑/阅读模式 | 核心 |
| `Ctrl+悬停` | 页面预览 | 核心 |

---

## 六、插件使用详解

### Claudian — AI 助手

**🔹 打开方式**

方式一：点击左侧边栏的 Claudian 图标（聊天气泡）
方式二：`Ctrl+P` → 搜索 `Claudian` → `Open Chat`

**🔹 基本对话**

在聊天框输入问题即可。Claudian 会自动读取当前打开的笔记作为上下文。

**🔹 引用文件**

在对话中用 `@文件名` 引用 vault 中的笔记，Claudian 会读取并理解其内容。例如：

```
@Obsidian 插件完整指南.md 帮我总结这份文档的核心要点
```

**🔹 引用网页**

在 Obsidian 内置浏览器中选中网页文字，然后在 Claudian 中说：

```
帮我翻译这段选中内容
```

**🔹 执行多步骤任务**

```
帮我：
1. 把 Daily/ 文件夹下所有日记的 weather 字段统计出来
2. 统计每种天气出现的天数
3. 生成一份汇总笔记
```

**🔹 代码审查**

打开代码文件，选中要审查的代码片段，然后说：

```
审查这段代码的安全性和性能问题
```

---

### Excalidraw — 绘图

**🔹 创建新图**

`Ctrl+P` → `Excalidraw: Create new drawing`，选择保存位置和文件名。

**🔹 基本操作**

| 操作 | 方式 |
|------|------|
| 选择工具 | 顶部工具栏或快捷键 `1-9` |
| 画矩形 | 按 `R` 然后拖拽 |
| 画箭头 | 按 `A` 从一个元素拖到另一个 |
| 添加文字 | 按 `T` 点击画布 |
| 缩放画布 | `Ctrl+滚轮` |
| 平移画布 | 按住空格拖拽，或鼠标中键拖拽 |

**🔹 嵌入到笔记**

在 Markdown 笔记中用 `![](图表名.excalidraw)` 即可嵌入。嵌入后双击可以编辑。

**🔹 配置样式**

在 Excalidraw 设置中可调整默认字体、颜色主题、粗糙度等。

---

### PDF++ — PDF 标注

**🔹 打开 PDF**

将 PDF 文件放入 vault 任意位置，在 Obsidian 文件浏览器中点击即可打开。

**🔹 高亮标注**

选中 PDF 中的文字 → 弹出工具栏 → 选择颜色高亮。也可右键 → `PDF++: Highlight selection`。

**🔹 添加批注**

高亮后，点击高亮块旁边的 `+` 按钮添加文字批注。批注支持 Markdown。

**🔹 摘录到笔记**

选中文字 → 右键 → `PDF++: Extract to new note` → 自动创建笔记并建立双向链接。

**🔹 查看所有标注**

右侧面板 → `PDF++` 标签 → 集中查看当前 PDF 的所有标注。

**🔹 搜索 PDF 内容**

`Ctrl+Shift+F` 全局搜索会自动索引 vault 中所有 PDF 的文本内容。

---

### Calendar — 日历视图

**🔹 打开日历**

右侧面板点击日历图标。如果没有，`设置 → 核心插件 → 日记 → 开启`，日历会自动关联 Daily Notes。

**🔹 创建/打开日记**

点击日历中的任意日期即可打开或创建当天日记。

**🔹 切换视图**

日历面板右上角切换月/周视图。底部显示年度活动热力图。

---

### Templater — 高级模板

**🔹 创建模板文件**

在 vault 中创建任意 `.md` 文件作为模板，使用 Templater 语法：

```markdown
---
created: <% tp.date.now("YYYY-MM-DD HH:mm") %>
tags: [日记]
---

# <% tp.date.now("YYYY 年 MM 月 DD 日 dddd") %>

## 今天做了什么
-
```

**🔹 设置 Daily Notes 模板**

`设置 → 核心插件 → 日记 → 模板文件` → 选择你的模板文件。
或者在 Templater 设置中：`设置 → Templater → Folder Templates` → 指定 `Daily/` 文件夹使用日记模板。

**🔹 常用变量速查**

| 变量 | 输出示例 |
|------|---------|
| `<% tp.date.now("YYYY-MM-DD") %>` | 2026-07-17 |
| `<% tp.date.now("dddd") %>` | 星期四 |
| `<% tp.file.title %>` | 当前文件名 |
| `<% tp.file.folder() %>` | 当前文件所在文件夹 |
| `<% tp.file.cursor() %>` | 光标定位点 |
| `<% tp.system.prompt() %>` | 弹窗输入框 |

**🔹 手动插入模板**

`Ctrl+P` → `Templater: Insert template` → 选择模板文件。

---

### Local REST API with MCP — 外部连接

**🔹 获取 API Key**

`设置 → Local REST API → Generate API Key`。复制生成的 key 保存到安全位置。

**🔹 测试连接**

在命令行中（先获取 HTTPS 证书 fingerprint）：

```powershell
# PowerShell 示例：读取今天的日记
Invoke-RestMethod -Uri "https://localhost:27124/Daily/" `
  -CertificateThumbprint "YOUR_CERT_FINGERPRINT" `
  -Headers @{"Authorization"="Bearer YOUR_API_KEY"}
```

**🔹 Claude Desktop 连接（MCP 方式）**

在 Claude Desktop 的 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-obsidian"]
    }
  }
}
```

重启 Claude Desktop 后即可在对话中访问 vault 内容。

---

### Better Export PDF — 导出 PDF

**🔹 导出当前笔记**

打开任意笔记 → `Ctrl+P` → `Better Export PDF: Export current note to PDF`。

**🔹 配置页眉页脚**

`设置 → Better Export PDF → Header & Footer` → 自定义内容。可用变量：

| 变量 | 含义 |
|------|------|
| `{title}` | 笔记标题 |
| `{date}` | 当前日期 |
| `{page}` | 当前页码 |
| `{total}` | 总页数 |

**🔹 预览模式**

`Ctrl+P` → `Better Export PDF: Export preview` → 弹出预览窗口，确认后再导出。

---

### Dataview — 数据查询

**🔹 基本查询**

在任意笔记中插入 dataview 代码块：

````markdown
```dataview
LIST
FROM "Daily"
WHERE mood = "开心"
SORT file.ctime DESC
```
````

渲染后自动显示所有符合条件的日记列表。

**🔹 表格查询**（最常用）

````markdown
```dataview
TABLE weather, mood, file.ctime AS "日期"
FROM "Daily"
SORT file.ctime DESC
LIMIT 10
```
````

**🔹 任务聚合**

````markdown
```dataview
TASK
FROM "Daily"
WHERE !completed
GROUP BY file.link
```
````

**🔹 日历热力图**

````markdown
```dataview
CALENDAR file.ctime
FROM "Daily"
```
````

**🔹 WHERE 常用条件**

| 条件 | 含义 |
|------|------|
| `WHERE weather = "晴"` | 精确匹配 |
| `WHERE weather != null` | 字段存在 |
| `WHERE contains(tags, "日记")` | 标签包含 |
| `WHERE file.ctime >= date(today) - dur(7 days)` | 最近 7 天 |

---

### Tasks — 任务管理 ✨ 推荐启用

**🔹 创建任务**

在任意笔记中用特定格式写任务：

```markdown
- [ ] 写周报 📅 2026-07-22 ⏫
- [ ] 买牛奶 🛫 2026-07-17 🔁 every week
- [x] 完成复习 ✅ 2026-07-16
```

**🔹 日期快捷键**

在编辑任务时，用以下方式快速插入日期：

| 操作 | 结果 |
|------|------|
| `Tasks: Create or edit task` 命令 | 弹出日期选择面板 |
| 手动输入 `📅 2026-07-22` | 设定截止日期 |

**🔹 全局任务面板**

在任意笔记中加入：

````markdown
```tasks
not done
sort by due
```
````

这会自动列出 vault 中所有未完成任务，按截止日期排序。

**🔹 常用过滤条件**

| 查询 | 含义 |
|------|------|
| `not done` | 未完成 |
| `due before next week` | 下周前到期 |
| `due today` | 今天到期 |
| `priority is high` | 高优先级 |
| `path includes Daily` | 只在日记文件中 |
| `heading includes 今天做了什么` | 特定标题下 |

---

### Omnisearch — 全文搜索

**🔹 打开搜索**

`Ctrl+P` → `Omnisearch: Open search` 或设置快捷键。

**🔹 使用技巧**

- **模糊搜索**：拼错也能找到（如 `pluggin` 能找到 `plugin`）
- **快捷键过滤**：搜索框内按 `Ctrl+F` 切换到文件搜索
- **PDF 内容**：启用后索引 vault 中所有 PDF 的文本
- **排除路径**：在设置中可配置排除文件夹

---

### Notebook Navigator — 增强文件浏览器

**🔹 打开方式**

点击左侧边栏的 Notebook Navigator 图标（📓），替换默认文件浏览器。

**🔹 双面板布局**

左侧：文件夹树 → 浏览 vault 结构
右侧：标签列表 / 文件预览 → 多维度导航

**🔹 键盘操作**

| 按键 | 功能 |
|------|------|
| `↑↓` | 上下移动选择 |
| `→` | 展开文件夹 |
| `←` | 折叠文件夹 |
| `Enter` | 打开笔记 |
| `Space` | 预览笔记（不打开） |
| `Backspace` | 返回上级 |
| `Tab` | 切换左右面板 |

**🔹 置顶笔记**

右键文件 → `Pin to top` → 常用笔记始终在最前面。

---

### Another Quick Switcher — 增强文件切换

**🔹 替换默认 Ctrl+O**

`设置 → 快捷键 → 搜索 Another Quick Switcher → Open` → 绑定 `Ctrl+O`（会覆盖核心插件的快速切换）。

**🔹 搜索模式**

打开后默认显示最近文件。输入搜索词后支持：

| 搜索前缀 | 功能 |
|----------|------|
| 直接输入文件名 | 模糊匹配所有文件 |
| `#标签名` | 按标签过滤 |
| `@笔记名` | 搜索反向链接 |
| `/文件夹名` | 限定文件夹范围 |

**🔹 增强功能 vs 内置**

| 能力 | 内置 Ctrl+O | Another Quick Switcher |
|------|:----------:|:----------------------:|
| 模糊匹配 | 基础 | 高级（拼音/近似词） |
| 最近文件 | ❌ | ✅ |
| 标签搜索 | ❌ | ✅ |
| 反向链接搜索 | ❌ | ✅ |

---

### Commander — 界面按钮定制

**🔹 添加按钮**

`设置 → Commander → 选择一个位置`：

- **状态栏**（底部）：适合常用小命令
- **标题栏**（顶部）：适合宏命令
- **侧边栏**（左侧）：适合面板开关

点击 `Add Command` → 搜索并选择命令（如 `Git: Commit all changes`）。

**🔹 创建宏**

`Macros → New Macro` → 添加多条命令 → 给宏起名 → 把宏按钮放到界面任意位置。

**示例宏：「保存并提交」**
1. `Workspaces: Save and load layout`
2. `Git: Commit all changes`
3. `Git: Push`

**🔹 移动端**

Commander 对手机/平板工具栏有专门优化——可隐藏/重排工具栏按钮。

---

### Advanced Canvas — 增强白板

**🔹 创建白板**

`Ctrl+P` → `Canvas: Create new canvas`，或右键文件夹 → `New canvas`。

**🔹 增强节点类型**

右键白板 → 除了默认矩形卡片，Advanced Canvas 新增：
- ⬜ 圆角卡片、🟠 圆形节点、🔷 菱形节点
- 📝 便签风格节点、☁️ 云朵形状

**🔹 样式定制**

选中节点 → 右侧属性面板：
- 背景色 / 边框色 / 边框宽度
- 圆角大小
- 透明度

**🔹 对齐工具**

多选节点 → 右键 → `Align` → 左对齐/居中/右对齐/顶对齐/等距分布。

---

### Charts — 图表嵌入

**🔹 插入柱状图**

````markdown
```chartsview
type: bar
data:
  - label: 周一
    value: 12
  - label: 周二
    value: 19
  - label: 周三
    value: 8
width: 100%
height: 300
```
````

**🔹 支持图表类型**

| type 值 | 图表 |
|---------|------|
| `bar` | 柱状图 |
| `line` | 折线图 |
| `pie` | 饼图 |
| `doughnut` | 环形图 |
| `radar` | 雷达图 |
| `polarArea` | 极地区域图 |

**🔹 自定义颜色**

````markdown
```chartsview
type: pie
colors:
  - "#3b82f6"
  - "#60a5fa"
  - "#93c5fd"
data:
  - label: 工作
    value: 40
  - label: 学习
    value: 25
  - label: 休息
    value: 35
```
````

**🔹 搭配 Dataview 动态数据**

可以先用 Dataview 聚合统计数据，再手动填入 Charts。未来可探索 DataviewJS → Charts 的联动。

---

### Git — 版本控制

**🔹 首次设置**

1. 终端中进入 vault 目录：`cd "D:/ObsidianFirstNotes/Embedded Learning"`
2. 初始化 Git：`git init`
3. 创建 `.gitignore`，排除 `.obsidian/workspace.json` 等敏感文件
4. 添加远程仓库：`git remote add origin <你的仓库 URL>`

**🔹 配置自动备份**

`设置 → Git → Backup`：
- **Vault backup interval**：设为 30（每 30 分钟自动 commit）
- **Auto pull interval**：设为 0 表示关闭
- 开启 `Push on backup` 自动推送到远程

**🔹 手动操作**

| 命令 | 功能 |
|------|------|
| `Ctrl+P` → `Git: Commit all changes` | 提交所有更改 |
| `Ctrl+P` → `Git: Push` | 推送到远程 |
| `Ctrl+P` → `Git: Pull` | 拉取远程更新 |
| `Ctrl+P` → `Git: Open history` | 查看文件历史 |
| `Ctrl+P` → `Git: View diff` | 查看差异对比 |

---

### Tag Wrangler — 标签管理

**🔹 打开标签面板**

左侧边栏 → 标签图标（或 `Ctrl+P` → `Tag Wrangler: Open tag pane`）。

**🔹 重命名标签**

在标签面板中右键某个标签 → `Rename tag` → 输入新名称。**所有**使用该标签的笔记会同步更新。

**🔹 合并标签**

右键标签 → `Merge tag` → 选择目标标签。此操作不可逆，会先弹出确认。

---

### QuickAdd — 快速捕获

**🔹 创建捕获命令**

`设置 → QuickAdd → Manage Macros` → 新建 → 选择 `Template` 类型 → 选择模板文件。

**🔹 绑定快捷键**

`设置 → 快捷键 → 搜索 QuickAdd` → 给你的捕获命令绑定 `Ctrl+Shift+N` 等快捷键。

**🔹 快速添加想法**

按快捷键 → 弹出输入框 → 输入内容 → 自动按模板创建笔记。

---

### PDF++ — 快捷键速查

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+F` | 在 PDF 中搜索 |
| `Ctrl++/-` | 缩放 |
| 选中文字 | 弹出高亮工具栏 |
| 右键 → Extract | 摘录到新笔记 |

---

## 七、高效工作流推荐

### 每日写作流

```
1. 打开 Obsidian → Calendar 面板 → 点击今天日期
2. 日记模板自动填充日期 → 填写 weather / mood
3. 在各板块中写作
4. Git 每 30 分钟自动备份
```

### 知识整理流

```
1. PDF++ 打开文档阅读 → 高亮关键段落 → 摘录到笔记
2. 在笔记中用 Dataview 聚合近期高亮内容
3. 添加 #待整理 标签
4. 周末用 Tasks 筛选待整理任务统一处理
```

### AI 辅助流

```
1. 打开要处理的笔记
2. 右侧打开 Claudian 面板
3. 让 AI 总结、翻译、改写、扩写当前笔记
4. AI 可直接修改 vault 中的文件
```
