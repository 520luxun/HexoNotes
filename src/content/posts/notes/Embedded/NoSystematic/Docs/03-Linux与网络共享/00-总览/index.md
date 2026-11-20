---
title: "00-总览"
published: 2026-11-18
description: "Linux 与网络共享 · 分区总览 [!note] 这是什么 嵌入式开发机的三件套：装 Linux（WSL2 / VMware）→ 互通文件（Samba / "
tags: ["嵌入式/系统", "开发环境/网络共享", "索引"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/03-Linux与网络共享"
draft: false
order: 74
---

# Linux 与网络共享 · 分区总览

> **这是什么**
> 嵌入式开发机的三件套：**装 Linux（WSL2 / VMware）→ 互通文件（Samba / NFS）→ 远程开发（VSCode Remote-SSH）**。
> 三篇都是「照着做就能跑」的完整流程，附排错手册与命令速查。

## 笔记地图

| 笔记 | 一句话 | 适合什么时候看 |
|---|---|---|
| [WSL2与Ubuntu完全使用指南](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/wsl2与ubuntu完全使用指南/) | WSL2 安装、迁移、网络、WSLg 与 VMware 对比 | 第一次在 Windows 上装 Linux |
| [Ubuntu共享文件夹配置详解](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/ubuntu共享文件夹配置详解/) | Samba / NFS / VMware 共享，三种方案与排错 | Windows、手机、另一台 Linux 要访问 Ubuntu 目录 |
| [VSCode Remote-SSH 远程开发指南](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/vscode_remote-ssh_远程开发指南/) | 用 VSCode 连远程 Linux，编辑、编译、调试、Git 全在远端 | 不想在虚拟机窗口里写代码 |

## 建议顺序

1. **先有 Linux**：[WSL2与Ubuntu完全使用指南](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/wsl2与ubuntu完全使用指南/) —— 选 WSL2 还是 VMware，装完再谈其它。
2. **再打通文件**：[Ubuntu共享文件夹配置详解](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/ubuntu共享文件夹配置详解/) —— 局域网共享优先 Samba，Linux 之间用 NFS。
3. **最后换工作方式**：[VSCode Remote-SSH 远程开发指南](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/vscode_remote-ssh_远程开发指南/) —— 本机只留编辑器，编译和调试都在远端。

> **三条经验**
> - WSL2 里的代码放 `/home/`，不要放 `/mnt/c/`，编译速度差 5~10 倍。
> - 共享目录连不上时按「网络 → 服务 → 防火墙 → 认证 → 权限」五层排查。
> - Remote-SSH 的扩展要装在远端，本地装的不生效。

## 附件

- `assets/WSL2/`：WSL2 与 VMware 对比的原教程（2 份 HTML）
- `assets/Ubuntu共享文件夹/`：共享文件夹图解教程（1 份 HTML）

## 相邻分区

- Linux 命令与系统原理：Linux系统总览
- 在 Linux 主机上交叉编译：交叉编译与构建总览
- 远程仓库与协作：工程协作总览
- 本机环境治理：环境手册总览
- 数据库与服务器：服务器与数据库总览（openGauss 就装在这类 Linux 上）
