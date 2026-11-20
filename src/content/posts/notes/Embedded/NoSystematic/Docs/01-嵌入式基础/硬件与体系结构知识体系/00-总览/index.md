---
title: "00-总览"
published: 2026-11-18
description: "硬件与体系结构知识体系 · 总览 [!note] 这是什么 从“什么是嵌入式”到芯片内部：系统概论 → 处理器类型 → GPU/NPU → 存储体系 → 汇编与"
tags: ["嵌入式", "嵌入式/硬件", "索引"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系"
draft: false
order: 32
---

# 硬件与体系结构知识体系 · 总览

> **这是什么**
> 从“什么是嵌入式”到芯片内部：**系统概论 → 处理器类型 → GPU/NPU → 存储体系 → 汇编与流水线**。
> 2026-11-18 拆分自《跨平台开发》与《嵌入式原理与实践》的硬件章节，原问答标题保留为各篇二级标题。

## 文件地图

| 文件 | 一句话 |
|---|---|
| [嵌入式系统概论](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/嵌入式系统概论/) | 嵌入式定义、特征与组成、应用领域、硬件基础、参考教材 |
| [处理器类型与架构](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/处理器类型与架构/) | ARM/MIPS/DSP/FPGA、CPU 分类、MCU/MPU/SoC/NPU/GPU 关系、手机多核价差 |
| [GPU与NPU](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/gpu与npu/) | 架构差异与分工、手机 SoC 协同、人脸识别流程实例 |
| [存储器与内存](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/存储器与内存/) | ROM/RAM/寄存器、代码运行全过程、内存层次、机械硬盘 |
| [汇编与流水线](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/汇编与流水线/) | 指令格式/寻址/类型/程序结构、5 级与 6 级整数流水线 |

## 阅读顺序

1. 入门建立全景：[嵌入式系统概论](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/嵌入式系统概论/) → [处理器类型与架构](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/处理器类型与架构/)
2. 理解存储与执行：[存储器与内存](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/存储器与内存/) → [汇编与流水线](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/汇编与流水线/)
3. AI 时代加分项：[GPU与NPU](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/gpu与npu/)

## 相邻体系

- C 语言怎么操作这些硬件：C语言底层总览（[结构体与内存对齐](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/C语言底层知识体系/结构体与内存对齐/)、[大小端与字节序](../../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/C语言底层知识体系/大小端与字节序/)）
- 程序怎么烧进芯片：交叉编译与构建总览（[启动流程与Bootloader](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/启动流程与bootloader/)）
- Cortex-M 的存储映射与启动细节：[存储与内存映射（Cortex-M）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/存储与内存映射_cortex-m/)、[Bootloader与IAP-OTA（Cortex-M）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/bootloader与iap-ota_cortex-m/)
