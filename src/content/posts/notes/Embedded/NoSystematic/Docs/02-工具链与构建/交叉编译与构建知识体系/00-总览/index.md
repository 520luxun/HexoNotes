---
title: "00-总览"
published: 2026-11-18
description: "交叉编译与构建知识体系 · 总览 [!note] 这是什么 GNU/Linux 路线的构建全景：启动流程 → 交叉编译工具链 → GNU 生态 → Makefi"
tags: ["嵌入式", "工具链/交叉编译", "工具链", "索引"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系"
draft: false
order: 53
---

# 交叉编译与构建知识体系 · 总览

> **这是什么**
> GNU/Linux 路线的构建全景：**启动流程 → 交叉编译工具链 → GNU 生态 → Makefile/CMake**。
> 与 Keil/ARM 路线（[Keil构建全链路详解（AC5-AC6）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/keil构建全链路详解_ac5-ac6/)）互补：这边讲开源工具链与 Linux 目标，那边讲 MDK 与裸机 Cortex-M。
> 2026-11-18 拆分自《跨平台开发》的构建章节，原问答标题保留为各篇二级标题。

## 文件地图

| 文件 | 一句话 |
|---|---|
| [启动流程与Bootloader](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/启动流程与bootloader/) | X86/ARM 启动全流程、Bootloader/Kernel/Ramfs/Rootfs 接力、Flash 分区 |
| [交叉编译与工具链](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/交叉编译与工具链/) | 工具链组成与命名前缀、依赖库获取、file 验证产物、常见问题 |
| [GNU与开源生态](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/gnu与开源生态/) | GNU 起源与哲学、GCC/glibc/GDB/Make、嵌入式的关联与局限 |
| [Makefile与CMake](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/makefile与cmake/) | Makefile 结构、CMake 交叉编译配置、选型与完整示例 |
| [Windows构建环境（MSYS2与Cygwin）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/windows构建环境_msys2与cygwin/) | Windows 上的类 Unix 工具链：MSYS2 / Cygwin 安装、换源、选型 |

## 阅读顺序

1. 先在 Windows 上备好环境（可选）：[Windows构建环境（MSYS2与Cygwin）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/windows构建环境_msys2与cygwin/)
2. 先懂目标机怎么跑起来：[启动流程与Bootloader](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/启动流程与bootloader/)
3. 再懂代码怎么编过去：[交叉编译与工具链](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/交叉编译与工具链/) → [GNU与开源生态](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/gnu与开源生态/)
4. 最后组织工程：[Makefile与CMake](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/makefile与cmake/)
5. 实战演练：[SDL1.2.15 移植与编译指南](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/sdl1_2_15_移植与编译指南/)（第三方库交叉编译全流程）

## 相邻体系

- Keil/ARM 裸机路线：Keil/ARM 构建知识体系总览
- 语言与链接基础：C语言底层总览（[C与C++混合编程](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/C语言底层知识体系/c与c_混合编程/)）
- Linux 环境准备：[WSL2与Ubuntu完全使用指南](../../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/wsl2与ubuntu完全使用指南/)
