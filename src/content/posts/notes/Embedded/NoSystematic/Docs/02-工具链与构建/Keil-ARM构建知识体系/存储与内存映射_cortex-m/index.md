---
title: "存储与内存映射（Cortex-M）"
published: 2026-11-18
description: "存储与内存映射细节（CortexM） [!note] 定位 相邻专题第 13 项正式版。构建文档讲“段放哪”，本篇讲“地址空间本身长什么样、有什么特殊机制”。 "
tags: ["嵌入式", "工具链/Keil-ARM", "嵌入式/硬件"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系"
draft: false
order: 62
---

# 存储与内存映射细节（Cortex-M）

> **定位**
> 相邻专题第 13 项正式版。构建文档讲“段放哪”，本篇讲“地址空间本身长什么样、有什么特殊机制”。

## 1. 4 GB 地址空间

| 区域 | 地址范围 | 内容 |
|---|---|---|
| Code | `0x00000000–0x1FFFFFFF` | Flash / 别名（取决于 BOOT） |
| SRAM | `0x20000000–0x3FFFFFFF` | 片内 RAM、CCM |
| Peripheral | `0x40000000–0x5FFFFFFF` | 外设寄存器 |
| External RAM | `0x60000000–0x9FFFFFFF` | FMC/SDRAM |
| External Device | `0xA0000000–0xDFFFFFFF` | QSPI 等 |
| PPB | `0xE0000000–0xE00FFFFF` | 内核私有外设（NVIC/SCB/DWT） |

> 访问未映射地址或未开时钟的外设 → **总线错误**，常表现为 HardFault。

## 2. 位带（bit-band）

M3/M4 提供位带别名：把“位操作”映射成“字操作”，实现**原子位读写**。

```
外设别名：0x42000000 + (addr - 0x40000000) * 32 + bit * 4
SRAM 别名：0x22000000 + (addr - 0x20000000) * 32 + bit * 4
```

```c
#define BITBAND_SRAM(addr, bit) \
    (*(volatile uint32_t *)(0x22000000 + (((uint32_t)(addr) - 0x20000000) * 32) + ((bit) * 4)))
```

- 优点：单指令完成读改写，天然原子；
- 限制：只覆盖位带区，外设位带要求地址在 `0x40000000–0x400FFFFF`；
- M7 不支持位带（用普通读改写或硬件互斥）。

## 3. Flash 保护与选项字节

| 机制 | 作用 | 风险 |
|---|---|---|
| RDP Level 0 | 无保护 | — |
| RDP Level 1 | 禁止调试读取，可量产 | 解除会**全片擦除** |
| RDP Level 2 | 永久保护，不可解除 | 芯片报废级，慎用 |
| WRP | 写保护指定页 | 误写保护后无法升级 |
| Option Bytes | 复位/看门狗/BOOT 配置 | 配置错误导致连不上 |

> 调试期不要开 RDP≥1；量产前再开，并保留解锁流程。

## 4. Flash 等待周期与加速

| 器件 | 机制 | 配置 |
|---|---|---|
| F1 | 等待周期 `LATENCY` | ≤24 MHz 0WS，≤48 MHz 1WS，≤72 MHz 2WS（3.3 V） |
| F4 | ART Accelerator（指令缓存 + 预取） | 开 `FLASH_ACR` 的 PRFTEN/ICEN/DCEN |
| F7/H7 | L1 I-Cache/D-Cache | 使能 cache，注意 DMA 一致性 |

要点：

- 主频提高后**必须先配等待周期**，否则取指错乱（常见“跑飞”）；
- 开 cache 后，DMA 写入的内存可能读到旧数据 → 需要维护/绕过 cache；
- 等待周期与电压有关，降压时需降频或加等待。

## 5. CCM RAM（M4）

- 地址 `0x10000000` 起（F4 常见 64 KB）；
- 只有 CPU 能访问，**DMA 不能**；
- 适合放栈、热数据、DMA 不碰的缓冲；
- scatter 里需要单独定义执行域。

## 6. 外部存储

| 接口 | 用途 | 注意 |
|---|---|---|
| FMC/FSMC | SDRAM/SRAM/NOR | 时序参数、刷新 |
| QSPI | 外部 Flash | XIP 需配置内存映射模式 |
| SDMMC | 大容量存储 | 文件系统 |

XIP（就地执行）要保证：地址映射、cache/预取、时钟与读命令匹配。

## 7. 与构建文档的关系

- 段与 scatter 地址（8.3、8.8）；
- 自定义段放 RAM/CCM（6.7）；
- ZI 与启动清零（10.6）。

## 8. 常见坑

| 现象 | 根因 | 处理 |
|---|---|---|
| 一提高主频就跑飞 | 未配等待周期 | 按手册配 LATENCY |
| 访问外设即 HardFault | 时钟未使能/地址错 | 开时钟、核对基址 |
| DMA 数据不对 | 缓冲在 CCM 或未维护 cache | 换普通 SRAM / 清 cache |
| 升级后连不上 | WRP/RDP 误配 | 用 BOOT0 或擦除解锁 |
| 位带写无效 | M7 不支持/地址越界 | 改用普通写 + 屏障 |
