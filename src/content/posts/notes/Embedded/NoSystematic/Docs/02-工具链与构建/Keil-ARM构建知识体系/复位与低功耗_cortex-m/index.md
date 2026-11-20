---
title: "复位与低功耗（Cortex-M）"
published: 2026-11-18
description: "复位与低功耗（CortexM） [!note] 定位 相邻专题第 14 项正式版。上电到 main 之前发生了什么、为什么一进低功耗调试器就掉线。 1. 复位源"
tags: ["嵌入式", "工具链/Keil-ARM", "嵌入式/硬件"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系"
draft: false
order: 65
---

# 复位与低功耗（Cortex-M）

> **定位**
> 相邻专题第 14 项正式版。上电到 `main` 之前发生了什么、为什么一进低功耗调试器就掉线。

## 1. 复位源

| 复位 | 触发 | 典型用途 |
|---|---|---|
| POR | 上电 | 冷启动 |
| BOR | 电压跌落 | 防低压跑飞 |
| 软件复位 | `NVIC_SystemReset()` | 升级/故障恢复 |
| 看门狗 | IWDG/WWDG | 死锁恢复 |
| 引脚复位 | NRST | 外部按键/探针 |
| 低功耗唤醒 | Standby 唤醒 | 周期唤醒 |

判据：读 `RCC->CSR` 的 `PINRSTF/PORRSTF/SFTRSTF/IWDGRSTF/WWDGRSTF/LPWRRSTF/BORRSTF`，**读完写 `RMVF` 清除**。启动早期记录复位源，是排查“莫名重启”的第一步。

## 2. 启动模式（BOOT）

以 STM32F1 为例：

| BOOT0 | BOOT1 | 启动区 |
|---|---|---|
| 0 | x | 主 Flash |
| 1 | 0 | 系统存储器（出厂 Bootloader，串口下载） |
| 1 | 1 | 内置 SRAM |

作用：

- 变砖救援：拉高 BOOT0 从系统区启动，用串口 ISP 重新烧录；
- 调试：从 SRAM 启动可绕过 Flash 保护。

## 3. 时钟树

```
HSI(内部 RC) ─┐
HSE(外部晶振) ─┼→ PLL → SYSCLK → AHB 分频 → HCLK
              │                    └→ APB1/APB2 分频 → PCLK
LSI/LSE ──────┴→ RTC / IWDG
```

| 概念 | 要点 |
|---|---|
| HSE 起振失败 | 晶振/负载电容/启动时间；可配 CSS 切回 HSI |
| PLL 倍频 | 受电压与 Flash 等待周期约束 |
| CSS | 时钟安全系统，HSE 失效自动切 HSI 并产生 NMI |
| `SystemCoreClock` | 必须与真实主频一致（SWO/延时/波特率都依赖它） |

## 4. 低功耗模式

| 模式 | CPU | 时钟 | SRAM | 唤醒 | 电流量级 |
|---|---|---|---|---|---|
| Sleep | 停 | 外设运行 | 保持 | 任意中断 | mA 级 |
| Stop | 停 | 全停（除 LSI/LSE） | 保持 | EXTI/RTC | µA 级 |
| Standby | 断电 | 全停 | 丢失 | WKUP/RTC | µA 以下 |

```c
__WFI();                 /* 进 Sleep/Stop，等中断 */
PWR_EnterSTOPMode(...);  /* Stop：需重配时钟 */
PWR_EnterSTANDBYMode();  /* Standby：唤醒等于复位 */
```

要点：

- **WFI vs WFE**：WFI 等中断，WFE 等事件（可被 `SEV` 唤醒）；
- Stop 唤醒后**系统时钟会切回 HSI**，必须重新配置 PLL；
- Standby 唤醒走复位流程，`main` 从头执行；
- 进低功耗前关掉不需要的外设时钟与 GPIO 漏电。

## 5. 低功耗与调试

- Stop/Standby 下调试器**必然掉线**（内核时钟停了）；
- 部分芯片有 `DBGMCU` 的 “debug in low power” 位，可让调试器在低功耗下保持连接（会增大电流，仅调试用）；
- 测功耗时：断开调试器、拔掉 SWD、关闭 LED 与稳压器静态电流。

## 6. 常见坑

| 现象 | 根因 | 处理 |
|---|---|---|
| 上电偶发不启动 | HSE 起振慢/失败 | 增加启动时间、配 CSS |
| 唤醒后跑飞 | Stop 后未重配时钟 | 唤醒先 `SystemInit` 式重配 |
| 电流降不下来 | GPIO 悬空/外设时钟未关 | 配模拟/下拉，关时钟 |
| 调试器连不上 | 芯片在 Stop/Standby | Connect under reset、开 DBGMCU |
| 看门狗反复复位 | 低功耗期间未喂狗/未关 | 低功耗前处理 IWDG |

## 7. 与构建文档的关系

- 启动流程与 `SystemInit`（10.3）；
- 向量表与 VTOR（10.2）；
- 复位后 `.data/.bss` 初始化（10.5–10.6）。
