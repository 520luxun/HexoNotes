---
title: "CMSIS与Pack（Cortex-M）"
published: 2026-11-18
description: "CMSIS 与 Pack（CortexM） [!note] 定位 相邻专题第 9 项正式版。CMSIS 是软件接口标准，Pack 是分发与集成格式；前者决定“怎"
tags: ["嵌入式", "工具链/Keil-ARM"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系"
draft: false
order: 70
---

# CMSIS 与 Pack（Cortex-M）

> **定位**
> 相邻专题第 9 项正式版。CMSIS 是**软件接口标准**，Pack 是**分发与集成格式**；前者决定“怎么访问内核/外设”，后者决定“工程里这些文件从哪来”。

## 1. CMSIS 组件全景

| 组件 | 作用 | 是否常用 |
|---|---|---|
| CMSIS-Core | 内核寄存器、NVIC、SysTick、intrinsics、启动文件 | ✅ 必用 |
| CMSIS-Driver | 外设统一 API（UART/SPI/I2C…） | 视项目 |
| CMSIS-RTOS2 | RTOS 抽象层（FreeRTOS/RTX 实现） | 视项目 |
| CMSIS-DSP | FIR/FFT/矩阵等信号处理库 | 视项目 |
| CMSIS-NN | 神经网络算子 | 视项目 |
| CMSIS-SVD | 外设寄存器描述（调试器显示） | 调试用 |
| CMSIS-DAP | 调试探针固件/协议 | 探针厂商 |

## 2. CMSIS-Core：工程里最常打交道的部分

### 2.1 文件构成

| 文件 | 来源 | 作用 |
|---|---|---|
| `core_cm4.h` 等 | CMSIS | 内核寄存器、NVIC、SysTick、intrinsics |
| `system_<device>.c/.h` | 器件包 | `SystemInit()`、`SystemCoreClock` |
| `startup_<device>.s` | 器件包 | 向量表、`Reset_Handler` |
| `<device>.h` | 器件包 | 外设寄存器、中断号、基地址 |

### 2.2 常用能力

```c
NVIC_EnableIRQ(USART1_IRQn);
NVIC_SetPriority(USART1_IRQn, 5);
SysTick_Config(SystemCoreClock / 1000);   /* 1ms tick */

__disable_irq();
__DSB();
__ISB();
__enable_irq();
```

- `SystemCoreClock` 由 `SystemInit()`/时钟配置更新，`SysTick_Config` 依赖它；
- intrinsics 清单见构建文档 14.8；
- 中断号、外设基址都来自 `<device>.h`，**不要手写魔数**。

## 3. CMSIS-Driver 与 RTOS2

| 接口 | 模式 | 说明 |
|---|---|---|
| CMSIS-Driver | `Driver_USART0.Initialize(cb)` 等函数指针结构 | 外设抽象，便于换芯片/换板 |
| CMSIS-RTOS2 | `osThreadNew`、`osMutexAcquire`… | 应用不直接依赖 FreeRTOS/RTX API |

代价：多一层间接调用，代码体积与调用开销略增；小项目可直接用厂商 HAL。

## 4. Pack：器件支持包

### 4.1 结构

```
Vendor.Device_DFP.pack
├── Vendor.Device_DFP.pdsc      # XML 描述：器件、内存、组件、条件
├── Device/
│   ├── Include/<device>.h
│   ├── Source/startup_<device>.s
│   └── Source/system_<device>.c
├── CMSIS/                       # 可带 Core/Driver 副本
└── Boards/                      # 可选：BSP
```

| 概念 | 含义 |
|---|---|
| DFP | Device Family Pack，器件支持包 |
| BSP | Board Support Pack，板级支持包 |
| Component | 可勾选的功能块（Startup、Device Header、CMSIS-Core…） |
| RTE | Run-Time Environment，工程里的组件选择结果 |
| `.pdsc` | Pack 描述文件（XML），定义器件/组件/依赖 |

### 4.2 RTE 如何影响构建

勾选组件后，Keil 会：

1. 把组件源文件加入工程（或生成引用）；
2. 注入宏定义（如 `STM32F103xB`、`USE_HAL_DRIVER`）；
3. 生成 `RTE_Components.h` 与配置文件。

> 这些都会改变编译单元与依赖关系——组件变了，增量构建会重编相关文件（构建文档第 2 章）。

## 5. Pack Installer 与自建 Pack

- **Pack Installer**：搜索、安装、升级 DFP/BSP；离线可导入 `.pack`；
- **版本冲突**：同一器件多个 DFP 版本时，工程锁定的是 `uvprojx` 里记录的版本；
- **自建 Pack**（简述）：
  1. 准备目录结构与 `.pdsc`；
  2. 用 `packchk` 校验；
  3. 用 `7z` 打包为 `.pack`（本质是 zip）；
  4. 导入 Pack Installer。

## 6. 常见问题

| 现象 | 根因 | 处理 |
|---|---|---|
| 编译报寄存器未定义 | `<device>.h` 与芯片型号宏不匹配 | 检查 `-D` 宏与 DFP 版本 |
| 中断进不去 | 启动文件与器件不匹配 | 换对应 startup，核对向量表 |
| `SystemCoreClock` 不对 | 时钟未配置/未更新 | 检查 `SystemInit` 与 PLL |
| 组件勾选后编不过 | RTE 依赖未满足 | 看 Pack 依赖提示 |
| 换电脑后 RTE 丢失 | `.pack` 未安装 | 安装同版本 DFP |

## 7. 与构建文档的关系

- 启动文件与向量表（10.2–10.3）；
- 系统头文件与宏定义影响预处理（4.3）；
- 组件注入源文件影响依赖判定（2.x）；
- intrinsics（14.8）。
