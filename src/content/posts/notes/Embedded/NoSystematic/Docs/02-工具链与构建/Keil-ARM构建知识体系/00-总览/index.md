---
title: "00-总览"
published: 2026-11-18
description: "Keil/ARM 构建知识体系 · 总览 [!note] 这是什么 本文件夹是「Keil/ARM 构建」主题的完整知识库：构建主线 → 10 个进阶专题 → 1"
tags: ["嵌入式", "工具链/Keil-ARM", "索引"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系"
draft: false
order: 60
---

# Keil/ARM 构建知识体系 · 总览

> **这是什么**
> 本文件夹是「Keil/ARM 构建」主题的完整知识库：**构建主线 → 10 个进阶专题 → 10 个相邻专题 → 学科索引**，外加一篇说明“凭什么说它完整”的边界与确定性笔记。
> 阅读顺序：先主线，再按需跳到专题；边界笔记放在最后读，用于校准每条结论的可信度。

## 文件地图

| 文件 | 角色 | 说明 |
|---|---|---|
| [Keil构建全链路详解（AC5-AC6）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/keil构建全链路详解_ac5-ac6/) | **主线** | 源码 → 预处理 → 编译 → ELF → armar/armlink → fromelf → 启动 CRT；含 10 个进阶专题 |
| [ARM嵌入式工具链-相邻专题（大纲）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/arm嵌入式工具链-相邻专题_大纲/) | **索引** | 10 个相邻专题的入口表与待扩展清单 |
| [Keil-ARM构建知识体系-边界与确定性层级](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/keil-arm构建知识体系-边界与确定性层级/) | **方法论** | 六条边界与三档确定性，判断结论的适用范围 |
| [HardFault定位与故障分析（Cortex-M）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/hardfault定位与故障分析_cortex-m/) | 相邻 7 | CFSR/HFSR、栈帧、可粘贴 handler、十类案例 |
| [调试硬件与trace（Cortex-M）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/调试硬件与trace_cortex-m/) | 相邻 6 | SWD/JTAG、SWO/ITM、DWT、探针对比 |
| [Bootloader与IAP-OTA（Cortex-M）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/bootloader与iap-ota_cortex-m/) | 相邻 8 | 分区、跳转四步、双区、OTA、防砖 |
| [CMSIS与Pack（Cortex-M）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/cmsis与pack_cortex-m/) | 相邻 9 | Core/Driver/RTOS2、PDSC/DFP/RTE |
| [命令行与CI构建（Keil-ARM）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/命令行与ci构建_keil-arm/) | 相邻 10 | UV4、CMake、compile_commands、CI 门禁 |
| [静态分析与编码规范（MISRA）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/静态分析与编码规范_misra/) | 相邻 11 | MISRA、clang-tidy/cppcheck、偏离管理 |
| [测试与覆盖率（嵌入式）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/测试与覆盖率_嵌入式/) | 相邻 12 | Unity/CMock、gcov、HIL、回归 |
| [存储与内存映射（Cortex-M）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/存储与内存映射_cortex-m/) | 相邻 13 | 位带、RDP、等待周期、CCM |
| [复位与低功耗（Cortex-M）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/复位与低功耗_cortex-m/) | 相邻 14 | 复位源、BOOT、时钟树、三种低功耗 |
| [独立学科层索引（RTOS-功能安全-仿真-多核-安全）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/独立学科层索引_rtos-功能安全-仿真-多核-安全/) | 相邻 15 | RTOS/功能安全/仿真/多核/工具链/安全的入口 |

## 附件

- `assets/Keil-ARM/Keil构建流程图.png`：3200×7040 高清构建流程图
- `assets/Keil-ARM/Keil构建流程图_预览.png`：文档内嵌用的 1600 宽版本
- `assets/Keil-ARM/Keil构建流程图.html`：矢量源文件（浏览器打开可无损缩放）
- `assets/Keil-ARM/异常栈帧-基本帧与FP扩展帧.png` / `.html`：HardFault 栈帧图（4000×2400）
- `assets/Keil-ARM/Scatter-加载域执行域与RW-ZI.png` / `.html`：Scatter 布局图（4400×2600）
- `assets/Keil-ARM/armlink-单遍扫描与库顺序.png` / `.html`：库顺序机制图（4800×2400）
- `assets/Keil-ARM/armar-归档结构.png` / `.html`：归档字节布局图（4600×2600，**暂停使用**：BSD 布局与实测不符，待重出）

## 机制图目录

| 图 | 文件名（PNG / HTML 同名） | 所在小节 | 核对要点 |
|---|---|---|---|
| 总图 | Keil构建流程图 | 构建文档 1.2 | 构建期主链路 → Target 分支 → 库回流 → 运行期 CRT；文档内嵌为 `_预览` 版 |
| A | 异常栈帧-基本帧与FP扩展帧 | HardFault 笔记 3.3 | 基本帧 0x20 / FP 扩展帧 0x68；SP 指向 S0，R0 在 SP+0x48 |
| B | Scatter-加载域执行域与RW-ZI | 构建文档 8.3.3 | 加载域/执行域、RO/RW/ZI、scatterload 拷贝；三个链接符号 |
| C | armlink-单遍扫描与库顺序 | 构建文档 8.1（含校正注） | 单遍模型（GNU ld）；armlink 实测多遍、顺序不敏感；按需提取整个 .o |
| D | armar-归档结构 | 构建文档 7.3（暂停使用） | 实测：符号表首成员为 `/`，格式为“计数 + 成员偏移 + 名字串”；现图为 BSD 布局，待重出 |

> 五张图均在 `assets/Keil-ARM/`；总图为 3200×7040（文档内嵌 `Keil构建流程图_预览.png`），A–D 为 2 倍图；HTML 为矢量源，逐字核对以 HTML 为准。**D 因实测格式不符暂停使用**，总图与 C 的“单遍/库顺序”表述也已加校正注。

## 验证状态（重要）

> 约定：**[实测]** 在本机工具链（MDK 5.43 / AC5 5.06u7 / AC6 6.24）上跑过；**[文档]** 来自 ARM 文档/规范；**[未实测]** 依赖硬件、GUI 或特定板卡，尚未验证。看到正文里的〔未实测〕标记，即表示该条尚未被独立复现。

| 主题 | 状态 | 依据 |
|---|---|---|
| armar 归档格式、符号表、选项 | [实测] | hexdump + `--help` |
| `armar -n/-s`、成员原样、补位 | [实测] | 逐字节比对 |
| AC5/AC6 归档互操作 | [实测] | 交叉链接 |
| armlink 多遍扫描、顺序不敏感 | [实测] | 两种顺序 + 循环依赖 |
| armlink 整成员提取 | [实测] | `shared_sym` 随 `a.o` 进镜像 |
| `L6220E` / `L6016U` / `L6242E` | [实测] | 构造复现 |
| fromelf `i32/i32combined/bin/disassemble/-z/-s` | [实测] | 生成并校验 |
| Intel Hex 校验和 | [实测] | 全部 `sum&0xFF=0` |
| AC5 `at()` / AC6 `.ARM.__at_` | [实测] | 符号地址核对 |
| AC5/AC6 `#pragma arm` | [实测] | 编译通过/报错 |
| AC5 intrinsics 集合 | [实测] | 逐项编译 |
| stdatomic 8B 非 lock-free | [实测] | warning + `__sync_fetch_and_add_8` |
| `--callgraph` 含栈用量 | [实测] | 生成 `cg.htm` |

### 未验证清单

| 项 | 位置 | 原因 |
|---|---|---|
| `fromelf --bin` 段间空洞填 0 | 构建文档 9.2 | 未构造出干净的双段样本 |
| Static Call Graph 的 GUI 菜单路径 | 构建文档 8.9.2 | 未操作 uVision 界面 |
| UV4 批处理命令与返回码 | 命令行与 CI 第 2 节 | 未运行 UV4 |
| SWO/ITM/DWT、探针对比 | 调试硬件与 trace | 无探针/目标板 |
| HardFault 栈帧与位域行为 | HardFault 第 3 节 | 依 ARM 文档，未制造真实故障 |
| Bootloader 跳转与升级 | Bootloader 与 IAP/OTA | 无板卡 |
| Scatter 压缩/EMPTY/OVERLAY | 构建文档 8.8 | 未实测 |
| DWARF 行号表与断点 | 构建文档 11 | 未实测调试会话 |
| 重定位范围与 veneer | 构建文档 12 | 依文档 |
| FP ABI 混链报错 | 构建文档 14.4 | 未构造混链 |
| 位带/RDP/Flash 等待周期 | 存储与内存映射 | 依手册 |
| 复位类型与低功耗电流 | 复位与低功耗 | 无板 |
| RTOS/功能安全/仿真等 | 独立学科层索引 | 概念与资料 |

## 维护约定

1. **新增学科笔记**：在相邻专题索引的总览表加一行、入口表加链接，并在边界笔记 §1.2 登记；
2. **只写清单不写正文**：状态标“大纲”，不冒充完成；
3. **改主线**：同步更新构建文档 `0.4` 索引与 `0.5` 边界；
4. **文件移动**：本体系全部用 Obsidian 双链互链（按文件名解析），移动文件夹不影响链接。
