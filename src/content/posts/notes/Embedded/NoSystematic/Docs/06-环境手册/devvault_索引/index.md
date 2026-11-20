---
title: "DevVault 索引"
published: 2026-11-19
description: "DevVault 索引 DevVault 只放可反复查的手册：环境搭建、工具链、版本管理这类做过一次、以后还要照着再做的文档。 与教程/学习笔记的区别：这里"
tags: ["索引", "嵌入式"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/06-环境手册"
draft: false
order: 84
---

# DevVault 索引

> `DevVault` 只放**可反复查的手册**：环境搭建、工具链、版本管理这类"做过一次、以后还要照着再做"的文档。
> 与教程/学习笔记的区别：这里的每篇都写清 **机器、版本、实测日期**，并在结尾标出"哪些是实测、哪些是转述"。
>
> 本索引位于 `Docs/06-环境手册/`，与 环境手册总览 分工：总览给地图，本页记清单、约定与维护流程。

---

## 1. 文档清单

| 文档 | 讲什么 | 适用环境 | 最近核对 |
|---|---|---|---|
| [ESP-IDF版本切换手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/esp-idf版本切换手册/) | ESP-IDF **5.1.6 / 6.0.2** 双版本共存与切换（5 种切换方法、验证、排错、回滚） | Windows 10 · ESP32-S3 · VS Code | 2026-11-19 |
| [Cursor远程开发-iMX6ULL环境手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/cursor远程开发-imx6ull环境手册/) | Cursor Remote-SSH 连 Ubuntu 18.04 失败 → **离线安装 Cursor Server** 全流程与排错 | Windows 10 + Ubuntu 18.04 虚拟机 · i.MX6ULL | 2026-11-19 |
| [Windows开发环境整理手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/windows开发环境整理手册/) | Python 多版本治理（4 个版本各锁死的原因）、PATH 体检、IDE 断链修复、MinGW→MSYS2 迁移、全盘环境扫描方法 | Windows 10 · CLion/VSCode/PyCharm/WebStorm · MSYS2 | 2026-11-19 |

**关联工程 / 主机：**

| 文档 | 对应工程或设备 |
|---|---|
| [ESP-IDF版本切换手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/esp-idf版本切换手册/) | `D:\Code\VSCodeCode\ESP32S3\Routine`（113 个工程 5.1.6 + 1 个 6.0.2） |
| [Cursor远程开发-iMX6ULL环境手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/cursor远程开发-imx6ull环境手册/) | 韦东山 i.MX6ULL Pro；VM `192.168.80.138`（book/100ask） |

---

## 2. 怎么读

1. **赶时间**：只看每篇开头的 `TL;DR`，照抄命令。
2. **第一次做**：按"环境清单 → 原理 → 操作步骤 → 验证清单"顺序读。
3. **出问题**：直接跳到"排错速查"（按现象查），再回看原理。
4. **要交接**：读结尾的"事实边界"，那里写明哪些结论是实测、哪些是转述。

---

## 3. 本文件夹的约定

| 项目 | 约定 | 示例 |
|---|---|---|
| 命名 | `<平台或工具>-<主题>-手册.md`，一篇只讲一件事 | `ESP-IDF版本切换手册.md` |
| Frontmatter | 必填 `title` / `aliases` / `tags` / `created` / `updated`；建议 `type` / `platform` / `status` / `related` | — |
| 标签 | 两段式：`域/对象`（如 `嵌入式/ESP32`、`工具/VS Code`） | — |
| 开头 | 一句话现状 + TL;DR + 适用前提 | — |
| 结尾 | `事实边界`（实测 vs 转述）+ 相关文档/工程路径 | — |
| 附件 | 图片放 `assets\<笔记名>\`，正文用相对路径引用 | `assets/ESP-IDF版本切换手册/xxx.png` |

> **为什么不直接写在工程里**
> 工程 `docs\` 里是**给工程本身用**的权威文档；DevVault 里是**整合版/阅读版**，方便跨工程检索与 Obsidian 双链。
> 两边内容冲突时，以工程 `docs\` 与脚本源码为准（例如 Routine 的 `docs\ESP-IDF-维护手册.md`、`tools\switch-idf-version.ps1`）。

---

## 4. 与 Routine 工程的对应关系（ESP-IDF 篇）

| 工程内文件 | 作用 | 与本文档的关系 |
|---|---|---|
| `docs\ESP-IDF-维护手册.md` | 原理 + 排查 + 第 17 章 SOP | 权威源；本文档的"方法 A~E"是它的浓缩与重组 |
| `docs\ESP-IDF-脚本手册.md` | 两个脚本的参数与排错 | 权威源；本文档"方法 A/B"引用其行为 |
| `docs\ESP-IDF-环境交接.md` | 环境清单与已知问题 | 权威源；本文档第 2 节的数据来源 |
| `docs\ESP-IDF-版本切换.md` | 本文档的工程内备份 | **同一内容的两份拷贝**，改一处记得同步 |
| `tools\switch-idf-version.ps1` / `idf-versions.ps1` | 切换 / 体检脚本 | 本文档所有命令的实现 |
| `templates\settings.esp-idf-*.json` | 工程配置模板 | 本文档手动切换一节的对照值 |

> **双份拷贝的维护规则**
> 改了 `ESP-IDF版本切换手册`，必须同步 `Routine\docs\ESP-IDF-版本切换.md`；反之亦然。两份的 SHA-256 应当一致：
> `Get-FileHash <文件> -Algorithm SHA256`

---

## 5. 新增一篇手册的流程

1. 新建 `<平台>-<主题>-手册.md`，文件名与 `title` 一致。
2. 套 frontmatter（见第 3 节），写清 `platform` / `status`。
3. 正文按"现状 → TL;DR → 原理 → 操作 → 验证 → 排错 → 回滚 → 事实边界"组织。
4. 在本索引第 1 节加一行（文档 / 讲什么 / 适用环境 / 最近核对）。
5. 若与其他文档相关，在双方 frontmatter 的 `related` 里互相链接。

---

## 6. 维护记录

| 日期 | 动作 |
|---|---|
| 2026-11-19 | 新建本索引；整理 `ESP-IDF版本切换手册`、`Cursor远程开发-iMX6ULL环境手册` 的 frontmatter 与互链；标注与 Routine `docs\` 的双份关系 |
| 2026-11-19 | 新增 `Windows开发环境整理手册`（Python 4 版本治理 / PATH 体检 / IDE 断链 / MinGW→MSYS2 迁移 / 环境扫描方法），在第 1 节登记 |
| 2026-11-20 | 随目录重构迁入 `06-环境手册/`；状态改为「索引」，与 环境手册总览 分工；补分区互链 |
