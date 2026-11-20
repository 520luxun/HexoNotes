---
title: "00-总览"
published: 2026-11-20
description: "服务器与数据库 · 分区总览 [!note] 这是什么 嵌入式之外的第二类机器：Linux 服务器上的数据库。 目前只有 openGauss 一栈，按「原理 →"
tags: ["服务器与数据库", "服务器与数据库/数据库", "服务器与数据库/openGauss", "索引"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/07-服务器与数据库"
draft: false
order: 87
---

# 服务器与数据库 · 分区总览

> **这是什么**
> 嵌入式之外的第二类机器：**Linux 服务器上的数据库**。
> 目前只有 openGauss 一栈，按「原理 → 安装 → 使用」三篇组织；后续 MySQL / Redis / Docker 可按同一骨架扩展。

## 三篇的关系（先看这张表）

| 文档 | 回答的问题 | 性质 | 什么时候看 |
|---|---|---|---|
| [openGauss-全流程详解](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-全流程详解/) | 这到底是什么、每一步为什么这么做 | 原理 / 教学 | 第一次接触，**先读** |
| [openGauss-5.0.2-单机安装部署实录](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-5_0_2-单机安装部署实录/) | 怎么从零装出来、装挂了怎么排 | 实操 SOP / 排错 | 要复现或重装时 |
| [openGauss-用户与使用手册](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-用户与使用手册/) | 有哪些用户、谁是谁、日常怎么操作 | 参考手册 | 装好之后日常查 |

> 三篇共用同一台机器：`luxunacc` / `192.168.80.139` / openEuler 22.03 LTS SP3 / openGauss 5.0.2（单机，端口 26000）。
> 原理篇解释「为什么」，实录篇给「怎么做」，用户篇解决「谁能做、怎么用」。

## 阅读顺序

1. [openGauss-全流程详解](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-全流程详解/) —— 建立「Windows → VMware → openEuler → openGauss → 一张表」的整体图景。
2. [openGauss-5.0.2-单机安装部署实录](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-5_0_2-单机安装部署实录/) —— 按阶段零到阶段八复现；出错先查第 11 章「本次踩坑总结」。
3. [openGauss-用户与使用手册](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-用户与使用手册/) —— 先分清操作系统用户与数据库角色，再照「剧本 A–G」操作。

## 按问题查

| 问题 | 该查哪篇 |
|---|---|
| 为什么要关 SELinux / swap？ | [openGauss-全流程详解](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-全流程详解/) |
| 预安装卡在 `Successfully set OS parameters.` | [openGauss-5.0.2-单机安装部署实录](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-5_0_2-单机安装部署实录/)（缺 `paramiko`） |
| `GAUSS-50200` / `GAUSS-50201` 目录报错 | [openGauss-5.0.2-单机安装部署实录](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-5_0_2-单机安装部署实录/) 第 11 章 |
| 重装系统前要注意什么？ | [openGauss-5.0.2-单机安装部署实录](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-5_0_2-单机安装部署实录/) 2.6 |
| `omm` 为什么不用输密码？ | [openGauss-用户与使用手册](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-用户与使用手册/) 5.1 |
| 建业务账号的最小授权怎么写？ | [openGauss-用户与使用手册](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-用户与使用手册/) 剧本 C |
| Windows 连不上 26000 端口？ | [openGauss-用户与使用手册](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-用户与使用手册/) 5.2 |

## 环境基线（实测）

| 项目 | 值 |
|---|---|
| 主机名 / IP | `luxunacc` / `192.168.80.139` |
| 操作系统 | openEuler 22.03 LTS SP3 |
| 内核 | `5.10.0-182.0.0.95.oe2203sp3.x86_64` |
| 数据库 | openGauss 5.0.2（单机，端口 26000） |
| 虚拟化 | VMware（宿主 Windows 10） |
| 验收状态 | `cluster_state : Normal`，建库/建表/增查已跑通 |

## 待扩展

| 主题 | 想解决的事 | 状态 |
|---|---|---|
| 初始化调优 | `shared_buffers`、WAL、连接数 | 待写 |
| 备份与恢复演练 | `gs_dump` / `gs_basebackup` 的恢复验证 | 待写 |
| 远程访问与安全 | 26000 端口、`pg_hba.conf`、防火墙 | 待写 |
| 开机自启 | `gs_om -t start` 与服务化 | 待写 |
| 其他数据库 | MySQL / Redis / Docker 的最小可用栈 | 待写 |

## 相邻分区

- 服务器上的 Linux 基本功：Linux系统总览、Linux与网络共享总览
- 虚拟机怎么装：[WSL2与Ubuntu完全使用指南](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/wsl2与ubuntu完全使用指南/)
- 远程连接工具：[VSCode Remote-SSH 远程开发指南](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/vscode_remote-ssh_远程开发指南/)、[Cursor远程开发-iMX6ULL环境手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/cursor远程开发-imx6ull环境手册/)
