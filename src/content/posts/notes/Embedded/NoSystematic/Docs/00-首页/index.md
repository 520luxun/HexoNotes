---
title: "00-首页"
published: 2026-11-18
description: "NoSystematic · 收件箱 [!abstract] 定位 这里不是「体系」，是收件箱 + 主题桶：没说清归属的、待验证的、临时记一笔的都放这。 成体系"
tags: ["索引", "导航"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs"
draft: false
order: 27
---

# NoSystematic · 收件箱

> **定位**
> 这里不是「体系」，是**收件箱 + 主题桶**：没说清归属的、待验证的、临时记一笔的都放这。
> 成体系的内容按下面的规则升格到库的顶层领域文件夹（`FreeRTOS`、`PCB` 等），不在这里长期维护。

## 三条铁律

1. **标题唯一**：重名就改名，不靠路径区分。
2. **至少一条边**：每篇至少有 1 个标签或 1 条双链，别让笔记变成孤岛。标签沿用两段式 `域/对象`（`嵌入式/C语言`、`工具链/Keil-ARM`…），不再新增扁平标签。
3. **图片进 assets**：`assets/<主题>/`，正文用 `文件名`。

## 主题桶

| 桶 | 放什么 | 入口 |
|---|---|---|
| 01 嵌入式基础 | C 语言、硬件体系、Linux 系统、音视频 | 嵌入式基础总览 |
| 02 工具链与构建 | Keil/ARM、GNU 交叉编译两条路线 | 工具链与构建总览 |
| 03 Linux 与网络共享 | WSL2、共享目录、远程开发 | Linux与网络共享总览 |
| 04 工程协作 | Git、分支、评审习惯 | 工程协作总览 |
| 05 电机与运动控制 | 电机分类、编码器、闭环、选型 | 电机与运动控制总览 |
| 06 环境手册 | ESP-IDF、Cursor、Windows 环境 | 环境手册总览 |
| 07 服务器与数据库 | openGauss 三篇 | 服务器与数据库总览 |

> 桶只是粗分类，不是体系。不确定放哪就扔在 `Docs/` 根目录，triage 时再归。

## 升格规则

| 触发条件 | 动作 |
|---|---|
| 同一主题 **≥ 3 篇** | 建顶层领域文件夹 + `00-总览`，整体迁出 |
| 被 **≥ 3 处**引用 | 同上 |
| 90 天没动、无入链 | 合并、归档或删除 |

## 收件箱体检（Dataview 自动）

> 以下清单由 Dataview 实时生成，不需要手工维护；若显示为代码块，说明插件未启用。

### 最近改动

```dataview
TABLE WITHOUT ID file.link AS 笔记, file.folder AS 桶, dateformat(file.mtime, "MM-dd") AS 改动
FROM "NoSystematic/Docs"
WHERE !startswith(file.name, "00-")
SORT file.mtime DESC
LIMIT 15
```

### 没有标签

```dataview
LIST
FROM "NoSystematic/Docs"
WHERE length(file.tags) = 0 AND !startswith(file.name, "00-")
```

### 疑似孤岛（没有入链）

```dataview
LIST
FROM "NoSystematic/Docs"
WHERE length(file.inlinks) = 0 AND !startswith(file.name, "00-")
```

### 超过 90 天没动

```dataview
LIST
FROM "NoSystematic/Docs"
WHERE file.mtime < date(today) - dur(90 days)
```
