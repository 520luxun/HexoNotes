---
title: "00-总览"
published: 2026-11-18
description: "工具链与构建 · 分区总览 [!note] 这是什么 同一份 C 代码，两条完全不同的「变成固件」路线： Keil / ARM（MDK + armclang，裸"
tags: ["嵌入式", "工具链", "索引"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/02-工具链与构建"
draft: false
order: 52
---

# 工具链与构建 · 分区总览

> **这是什么**
> 同一份 C 代码，两条完全不同的「变成固件」路线：
> **Keil / ARM**（MDK + armclang，裸机 Cortex-M）与 **GNU / Linux**（gcc 交叉工具链 + Make/CMake）。
> 先选路线，再读对应体系；两边都讲的「编译 → 链接 → 产物」可以互相印证。

## 两条路线

| 路线 | 主工具 | 目标 | 适合 | 入口 |
|---|---|---|---|---|
| Keil / ARM | MDK、armcc/armclang、armlink、fromelf | 裸机 Cortex-M | 单片机、RTOS、量产固件 | Keil/ARM 构建 |
| GNU / Linux | gcc 交叉工具链、Make、CMake、GDB | Linux / 裸机 ARM | 开源生态、SDK、可复现构建 | 交叉编译与构建总览 |

> **怎么选**
> 板子上跑的是 **RTOS 或裸机**、团队用 Keil → 走 Keil 体系；
> 板子上跑 **Linux**、要接 Yocto/Buildroot 或做 CI → 走 GNU 体系。
> 两条路线的链接脚本、启动文件、产物格式可以对照读，差异本身就是知识点。

## 体系地图

| 体系 | 篇数 | 内容 | 入口 |
|---|:--:|---|---|
| Keil / ARM 构建 | 14 | 构建全链路、10 个进阶专题、10 个相邻专题、边界与确定性 | Keil 体系总览 |
| 交叉编译与构建 | 7 | 启动流程、交叉工具链、GNU 生态、Makefile/CMake、SDL 移植、Windows 环境 | 交叉编译与构建总览 |

## 建议顺序

1. 先读 [Keil构建全链路详解（AC5-AC6）](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/keil构建全链路详解_ac5-ac6/) 的「全局总览」一节，建立源码 → `.o` → `.lib` → `.axf` → `.hex` 的直觉。
2. 再看 [交叉编译与工具链](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/交叉编译与工具链/)，理解 `arm-linux-gnueabihf-gcc` 这类前缀到底在说什么。
3. 工程化：[Makefile与CMake](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/makefile与cmake/) → [命令行与CI构建（Keil-ARM）](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/命令行与ci构建_keil-arm/)。
4. 出问题按图索骥：[HardFault定位与故障分析（Cortex-M）](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/hardfault定位与故障分析_cortex-m/)、[调试硬件与trace（Cortex-M）](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/调试硬件与trace_cortex-m/)。

## 相邻分区

- 语言与链接基础：C语言底层总览（[C与C++混合编程](../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/C语言底层知识体系/c与c_混合编程/)、[结构体与内存对齐](../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/C语言底层知识体系/结构体与内存对齐/)）
- 芯片内部：硬件与体系结构总览（[存储器与内存](../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/存储器与内存/)、[汇编与流水线](../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/汇编与流水线/)）
- Linux 环境：Linux与网络共享总览
- 团队协作：工程协作总览（Git 分支与 CI 习惯）
- 开发机环境：环境手册总览 —— ESP-IDF / Cursor / Windows 环境
- 部署目标机：服务器与数据库总览 —— openEuler 上的 openGauss
