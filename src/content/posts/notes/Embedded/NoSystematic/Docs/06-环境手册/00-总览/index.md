---
title: "00-总览"
published: 2026-11-20
description: "环境手册 · 分区总览 [!note] 这是什么 这一区只放可以反复照做的手册：装环境、切版本、修断链、连远程。 判断标准：每篇都写清 机器、版本、实测日期，结"
tags: ["开发环境", "工具链", "索引"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/06-环境手册"
draft: false
order: 82
---

# 环境手册 · 分区总览

> **这是什么**
> 这一区只放**可以反复照做的手册**：装环境、切版本、修断链、连远程。
> 判断标准：每篇都写清 **机器、版本、实测日期**，结尾有「事实边界」（哪些实测、哪些转述）。

## 手册清单

| 手册 | 解决什么 | 环境基线 | 状态 |
|---|---|---|---|
| [ESP-IDF版本切换手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/esp-idf版本切换手册/) | ESP-IDF 5.1.6 / 6.0.2 双版本共存与切换（5 种方法、验证、回滚） | Windows 10 · ESP32-S3 · VS Code | 已实测 |
| [Cursor远程开发-iMX6ULL环境手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/cursor远程开发-imx6ull环境手册/) | Cursor Remote-SSH 连 Ubuntu 18.04 失败 → 离线安装 Cursor Server | Windows 10 + Ubuntu 18.04 · i.MX6ULL | 已实测 |
| [Windows开发环境整理手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/windows开发环境整理手册/) | Python 四版本治理、PATH 体检、IDE 断链修复、MinGW→MSYS2 迁移 | Windows 10 · CLion/VSCode/PyCharm/WebStorm | 已实测 |

## 怎么读

1. **赶时间**：只看每篇开头的 `TL;DR`，照抄命令。
2. **第一次做**：按「环境清单 → 原理 → 操作步骤 → 验证清单」顺序读。
3. **出问题**：直接跳到「排错速查」（按现象查），再回看原理。
4. **要交接**：读结尾的「事实边界」，那里写明哪些结论是实测、哪些是转述。

## 与知识笔记的分工

| | 本区（手册） | 其他分区（笔记） |
|---|---|---|
| 目的 | 复现一次具体操作 | 理解一个概念 |
| 写法 | 命令 + 验证 + 排错 + 回滚 | 是什么 → 为什么 → 坑在哪 |
| 时效 | 绑定版本，换版本要重测 | 相对稳定，可长期引用 |
| 入口 | 本页 | 各分区 `00-总览` |

## 维护细则

命名、frontmatter、与工程内文档的双份同步规则，见本区的维护索引：[DevVault 索引](../../../../../Embedded/NoSystematic/Docs/06-环境手册/devvault_索引/)。

## 相邻分区

- 这些环境装来干什么：嵌入式基础总览（语言与系统）、工具链与构建总览（构建两条路线）
- 远程机、虚拟机与共享目录：Linux与网络共享总览
- 环境搭好之后：服务器与数据库总览（openGauss 部署与运维）
