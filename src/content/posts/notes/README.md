---
title: "README"
published: 2026-07-19
description: "FreeRTOS 学习笔记 & 实战代码 基于 STM32F1 / STM32F4 平台的 FreeRTOS 实时操作系统学习资源，包含从入门到进阶的 19 篇"
tags: []
category: "FreeRTOS"
draft: false
order: 26
---
# FreeRTOS 学习笔记 & 实战代码

基于 **STM32F1 / STM32F4** 平台的 FreeRTOS 实时操作系统学习资源，包含从入门到进阶的 **19 篇系统笔记** 和 **22 个配套实验代码**（同时支持 Keil MDK 和 VSCode/STM32CubeIDE）。

---

## 📁 仓库结构

```
FreeRTOS/
├── 01 .. 19    *.md          # FreeRTOS 笔记（Obsidian Markdown 格式）
├── assets/
│   ├── Code/
│   │   ├── keil/             # Keil MDK 工程（22 个实验 + 模板工程）
│   │   │   ├── 1-1 ~ 1-22/   # 按章节组织的实验代码
│   │   │   ├── STM32F1C8T6-FreeRTOS/      # F103 裸工程模板
│   │   │   ├── STM32F407ZGT6-FreeRTOS/    # F407 裸工程模板
│   │   │   ├── STM32F429-FreeRTOS/        # F429 裸工程模板
│   │   │   └── SYSTEM/       # 公共库（delay/sys/usart/malloc/timer）
│   │   ├── vscode/           # VSCode (STM32CubeIDE) 工程（内容与 Keil 一致）
│   │   └── TIMER/            # 定时器相关独立工程
│   ├── PDF/                  # 参考文档 PDF
│   │   ├── FreeRTOS_Reference_Manual_V10.0.0.pdf
│   │   ├── FreeRTOS开发指南_V1.12.pdf
│   │   └── Mastering-the-FreeRTOS-Real-Time-Kernel.v1.1.0.pdf
│   └── FreeRTOS/             # 笔记引用图片资源
└── README.md
```

---

## 📖 笔记目录

| 序号 | 笔记 | 内容简介 |
|:---:|------|----------|
| 01 | [FreeRTOS 入门](./01%20FreeRTOS%E5%85%A5%E9%97%A8.md) | 裸机 vs RTOS、前后台系统、抢占式调度、任务状态转换 |
| 02 | [任务创建和删除](./02%20FreeRTOS%E4%BB%BB%E5%8A%A1%E5%88%9B%E5%BB%BA%E5%92%8C%E5%88%A0%E9%99%A4.md) | xTaskCreate / xTaskCreateStatic 静态与动态任务创建、vTaskDelete |
| 02+ | [动态分配的 API 解释](./02%20FreeRTOS%E5%8A%A8%E6%80%81%E5%88%86%E9%85%8D%E7%9A%84API%E8%A7%A3%E9%87%8A.md) | 动态内存分配 API 深入解读 |
| 03 | [任务挂起和恢复](./03%20FreeRTOS%E4%BB%BB%E5%8A%A1%E6%8C%82%E8%B5%B7%E5%92%8C%E6%81%A2%E5%A4%8D%E7%B3%BB%E5%88%97API%E5%87%BD%E6%95%B0.md) | vTaskSuspend / vTaskResume / xTaskResumeFromISR |
| 04 | [中断管理](./04%20FreeRTOS%E4%BB%BB%E5%8A%A1%E4%B8%AD%E6%96%AD%E7%AE%A1%E7%90%86.md) | 中断优先级配置、FromISR 系列 API |
| 05 | [临界段代码保护](./05%20FreeRTOS%E4%B8%B4%E7%95%8C%E6%AE%B5%E4%BB%A3%E7%A0%81%E4%BF%9D%E6%8A%A4.md) | taskENTER_CRITICAL / taskEXIT_CRITICAL 关中断保护 |
| 06 | [调度器的挂起和恢复](./06%20FreeRTOS%E4%BB%BB%E5%8A%A1%E8%B0%83%E5%BA%A6%E5%99%A8%E7%9A%84%E6%8C%82%E8%B5%B7%E5%92%8C%E6%81%A2%E5%A4%8D.md) | vTaskSuspendAll / xTaskResumeAll 调度锁机制 |
| 07 | [列表和列表项](./07%20FreeRTOS%E5%88%97%E8%A1%A8%E5%92%8C%E5%88%97%E8%A1%A8%E9%A1%B9.md) | 内核核心数据结构 List 与 List Item 原理解析 |
| 08 | [任务调度](./08%20FreeRTOS%E4%BB%BB%E5%8A%A1%E8%B0%83%E5%BA%A6.md) | 基于优先级的抢占式调度算法基础 |
| 08+ | [任务调度-详细解析](./08%20FreeRTOS%E4%BB%BB%E5%8A%A1%E8%B0%83%E5%BA%A6-%E8%AF%A6%E7%BB%86%E8%A7%A3%E6%9E%90.md) | 就绪列表、PendSV 异常、上下文切换流程 |
| 09 | [时间片轮询](./09%20FreeRTOS%E6%97%B6%E9%97%B4%E7%89%87%E8%BD%AE%E8%AF%A2.md) | 同优先级任务的时间片轮转调度机制 |
| 10 | [任务相关的其他 API](./10%20FreeRTOS%E4%BB%BB%E5%8A%A1%E7%9B%B8%E5%85%B3%E7%9A%84%E5%85%B6%E4%BB%96API%E5%87%BD%E6%95%B0.md) | uxTaskPriorityGet/Set、eTaskGetState 等辅助 API |
| 11 | [时间管理](./11%20FreeRTOS%E6%97%B6%E9%97%B4%E7%AE%A1%E7%90%86.md) | vTaskDelay vs vTaskDelayUntil 延时函数对比 |
| 12 | [消息队列](./12%20FreeRTOS%E6%B6%88%E6%81%AF%E9%98%9F%E5%88%97.md) | 队列创建、发送/接收、数据传递与阻塞 |
| 13 | [信号量](./13%20FreeRTOS%E4%BF%A1%E5%8F%B7%E9%87%8F.md) | 二值信号量、计数信号量、互斥量（优先级继承） |
| 14 | [队列集](./14%20FreeRTOS%E9%98%9F%E5%88%97%E9%9B%86.md) | Queue Set 多队列统一监听与事件处理 |
| 15 | [事件标志组](./15%20FreeRTOS%E4%BA%8B%E4%BB%B6%E6%A0%87%E5%BF%97%E7%BB%84.md) | 事件位、AND/OR 触发模式、任务同步 |
| 16 | [任务通知](./16%20FreeRTOS%E4%BB%BB%E5%8A%A1%E9%80%9A%E7%9F%A5.md) | 轻量级任务间通信——替代信号量/队列/事件组 |
| 17 | [软件定时器](./17%20FreeRTOS%E8%BD%AF%E4%BB%B6%E5%AE%9A%E6%97%B6%E5%99%A8.md) | xTimerCreate、回调函数、Daemon 任务 |
| 17+ | [软件定时器解释](./17-1%20%E8%BD%AF%E4%BB%B6%E5%AE%9A%E6%97%B6%E5%99%A8%E8%A7%A3%E9%87%8A.md) | 软件定时器实现原理补充说明 |
| 18 | [Tickless 低功耗模式](./18%20Tickless%E4%BD%8E%E5%8A%9F%E8%80%97%E6%A8%A1%E5%BC%8F.md) | Tickless 原理、低功耗配置与唤醒机制 |
| 19 | [内存管理](./19%20FreeRTOS%E5%86%85%E5%AD%98%E7%AE%A1%E7%90%86.md) | heap_1 ~ heap_5 五种内存分配方案对比与选型 |
| 19+ | [内存管理代码详解](./19-1%20%E5%86%85%E5%AD%98%E7%AE%A1%E7%90%86%E4%BB%A3%E7%A0%81%E8%AF%A6%E8%A7%A3.md) | heap_4 等内存分配源码逐行分析 |

---

## 🧭 学习路线

```
01.入门 ──→ 02.任务创建删除 ──→ 03.挂起恢复 ──→ 04.中断管理
                                              │
    12.消息队列 ←── 06-09.调度器 ←── 05.临界段保护
        │
    13.信号量 ──→ 15.事件标志组 ──→ 16.任务通知
        │
    14.队列集    17.软件定时器 ──→ 18.低功耗 ──→ 19.内存管理
```

---

## 💻 配套代码（22 个实验）

| 编号 | 实验内容 | 章节 | Keil | VSCode |
|:---:|----------|:---:|:---:|:---:|
| 1-1 | 任务创建和删除（动态方式） | 02 | ✅ | — |
| 1-2 | 任务创建和删除（静态方式） | 02 | ✅ | — |
| 1-3 | 任务挂起和恢复 | 03 | ✅ | — |
| 1-4 | 任务调度器的挂起和恢复 | 06 | ✅ | — |
| 1-5 | 列表和列表项 | 07 | ✅ | ✅ |
| 1-6 | 时间片轮 | 09 | ✅ | ✅ |
| 1-7 | 任务相关的其他 API 函数 | 10 | ✅ | ✅ |
| 1-8 | 任务运行时间统计 | 10 | ✅ | ✅ |
| 1-9 | 延时函数展示 | 11 | ✅ | ✅ |
| 1-10 | 队列操作 | 12 | ✅ | ✅ |
| 1-11 | 二值信号量 | 13 | ✅ | ✅ |
| 1-12 | 计数信号量 | 13 | ✅ | ✅ |
| 1-13 | 优先级翻转现象 | 13 | ✅ | ✅ |
| 1-14 | 互斥信号量 | 13 | ✅ | ✅ |
| 1-15 | 队列集 | 14 | ✅ | ✅ |
| 1-16 | 事件标志组 | 15 | ✅ | ✅ |
| 1-17 | 任务通知模拟二值信号量 | 16 | ✅ | ✅ |
| 1-18 | 任务通知模拟消息邮箱 | 16 | ✅ | ✅ |
| 1-19 | 任务通知模拟事件标志组 | 16 | ✅ | ✅ |
| 1-20 | 软件定时器 API 使用 | 17 | ✅ | ✅ |
| 1-21 | 低功耗 Tickless 模式 | 18 | ✅ | ✅ |
| 1-22 | 内存管理 | 19 | ✅ | ✅ |

---

## 🔧 硬件平台

| 芯片 | 内核 | 开发板 |
|------|------|--------|
| **STM32F103C8T6** | Cortex-M3 | 最小系统板 / 正点原子 Mini |
| **STM32F407ZGT6** | Cortex-M4 | 正点原子 探索者 |
| **STM32F429IGT6** | Cortex-M4 | 正点原子 阿波罗 |

---

## 🛠️ 开发环境

### Keil MDK
- IDE: Keil MDK-ARM V5
- 编译器: Arm Compiler 5 / 6
- 调试器: ST-Link / J-Link

### VSCode (STM32CubeIDE)
- 构建工具: STM32CubeIDE / GCC ARM Embedded
- 调试器: OpenOCD + ST-Link

---

## 🗂️ 参考文档

仓库 `assets/PDF/` 目录包含以下参考文档：

- `Cortex-M3权威指南.pdf` — ARM Cortex-M3 权威指南
- `FreeRTOS_Reference_Manual_V10.0.0.pdf` — FreeRTOS 官方 API 参考手册
- `FreeRTOS开发指南_V1.12.pdf` — FreeRTOS 开发指南中文版
- `Mastering-the-FreeRTOS-Real-Time-Kernel.v1.1.0.pdf` — FreeRTOS 官方内核指南
- `FreeRTOS课程讲义.pdf` — 配套讲义

---

## ⚡ 核心概念速查

| 概念 | 说明 |
|------|------|
| **任务 (Task)** | FreeRTOS 的基本执行单元，每个任务有自己的堆栈空间 |
| **调度器 (Scheduler)** | 基于优先级抢占 + 同级时间片轮转 |
| **队列 (Queue)** | 任务间数据传输的标准方式，支持 FIFO 和阻塞等待 |
| **信号量 (Semaphore)** | 二值信号量用于同步、计数信号量用于资源管理 |
| **互斥量 (Mutex)** | 支持优先级继承的互斥锁，防止优先级反转 |
| **事件标志组** | 多事件位并行等待，支持 AND/OR 触发模式 |
| **任务通知** | 速度最快、RAM 占用最小的任务间通信方式 |
| **软件定时器** | 基于 Daemon 任务的回调定时器，无需硬件定时器资源 |
| **临界段** | 通过关中断保护不可重入代码段 |
| **Tickless** | 在无任务运行时停止 SysTick 以降低功耗 |

---

## 📝 使用说明

- 📒 笔记使用 **Obsidian Markdown** 格式编写（Wiki 链接 + YAML Frontmatter）
- 🔗 推荐使用 [Obsidian](https://obsidian.md/) 打开以获得最佳笔记体验
- 🖼️ 笔记图片资源位于 `assets/FreeRTOS/` 目录
- 💻 Keil 工程目录: `assets/Code/keil/`
- 💻 VSCode 工程目录: `assets/Code/vscode/`

### 打开工程

**Keil 用户**: 在 `assets/Code/keil/` 下找到对应章节文件夹，双击 `.uvprojx` 文件打开。

**VSCode / STM32CubeIDE 用户**: 在 `assets/Code/vscode/` 下找到对应章节文件夹，用 IDE 导入工程。

---

## 📄 License

本仓库笔记与代码仅供学习交流使用，转载请注明出处。

FreeRTOS 内核源码版权归 Amazon Web Services, Inc. 所有，遵循 MIT 协议。

---

## 🔗 相关链接

- [FreeRTOS 官方文档](https://www.freertos.org/)
- [FreeRTOS GitHub](https://github.com/FreeRTOS/FreeRTOS)
- [Obsidian](https://obsidian.md/)
- [正点原子](http://www.openedv.com/)
