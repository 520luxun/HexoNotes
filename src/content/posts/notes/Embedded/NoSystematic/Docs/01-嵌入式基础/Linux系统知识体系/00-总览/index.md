---
title: "00-总览"
published: 2026-11-18
description: "Linux系统知识体系 · 总览 [!note] 这是什么 嵌入式 Linux 的系统基础：命令与 Shell → 文件类型与 IO → 进程/线程通信。 20"
tags: ["嵌入式", "嵌入式/系统", "索引"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系"
draft: false
order: 47
---

# Linux系统知识体系 · 总览

> **这是什么**
> 嵌入式 Linux 的系统基础：**命令与 Shell → 文件类型与 IO → 进程/线程通信**。
> 2026-11-18 拆分自《嵌入式原理与实践》的 Linux 章节（另含《跨平台开发》的 fopen/open 一节），原问答标题保留为各篇二级标题。

## 文件地图

| 文件 | 一句话 |
|---|---|
| [Shell与命令的本质](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系/shell与命令的本质/) | Shell 角色与脚本基础；命令从输入到进程执行的完整流程 |
| [Linux命令速查手册](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系/linux命令速查手册/) | 八类常用命令速查表，附自制手册方法 |
| [Linux文件类型与IO](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系/linux文件类型与io/) | 七种文件类型与查看方法；fopen 与 open 的缓冲差异 |
| [进程间通信与线程同步](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系/进程间通信与线程同步/) | IPC 机制选型；线程共享数据 + 同步、TLS |

## 阅读顺序

1. 先用起来：[Linux命令速查手册](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系/linux命令速查手册/)（随手查）→ [Shell与命令的本质](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系/shell与命令的本质/)（懂原理）
2. 再看系统抽象：[Linux文件类型与IO](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系/linux文件类型与io/)
3. 最后进并发：[进程间通信与线程同步](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系/进程间通信与线程同步/)

## 相邻笔记

- 装 Linux 环境：[WSL2与Ubuntu完全使用指南](../../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/wsl2与ubuntu完全使用指南/)
- 跨机共享目录：[Ubuntu共享文件夹配置详解](../../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/ubuntu共享文件夹配置详解/)
- 交叉编译出 Linux 程序：[交叉编译与工具链](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/交叉编译与工具链/)
