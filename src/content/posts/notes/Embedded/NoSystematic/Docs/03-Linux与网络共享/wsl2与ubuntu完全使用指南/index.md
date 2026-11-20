---
title: "WSL2与Ubuntu完全使用指南"
published: 2026-11-18
description: "WSL2 与 Ubuntu 完全使用指南 Windows 上跑 Linux 的两条路线：一条命令的 WSL2，或一台完整的 VMware 虚拟机。 [!abst"
tags: ["开发环境/Windows", "开发环境/WSL2", "开发环境/Ubuntu", "嵌入式/系统", "开发环境/VMware", "嵌入式"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/03-Linux与网络共享"
draft: false
order: 77
---

# WSL2 与 Ubuntu 完全使用指南

> *Windows 上跑 Linux 的两条路线：一条命令的 WSL2，或一台完整的 VMware 虚拟机。*

> **本文定位**
> 把 Windows 上跑 Linux 的两条主流路线讲透：**WSL2**（微软原生，一条命令装好，秒开）与 **VMware 虚拟机**（完整独立系统，USB/内核实验不可替代）。
> 主线是 WSL2 的完整落地流程 —— 从 BIOS 开虚拟化到迁移到 D 盘；副线是 VMware 的安装与 14 维对比，最后给选型结论和排错手册。

> **一页纸速览**
> | 关心的事 | 结论 |
> | --- | --- |
> | 装什么 | Windows 11 / 10 2004+，管理员一条 `wsl --install -d Ubuntu` |
> | 前置条件 | BIOS 开 SVM / VT-x + 两个 Windows 组件（子系统 + 虚拟机平台） |
> | 必开项 | `/etc/wsl.conf` 写 `systemd=true`，否则 `systemctl` 全部报错 |
> | 代码放哪 | Linux 侧 `/home/用户/`；放 `/mnt` 编译慢 5~10 倍 |
> | C 盘告急 | `export → unregister → import` 迁到 D 盘（第 11 章） |
> | 要接硬件 | USB 用 usbipd（第 9 章），要稳定就上 VMware（第 12 章） |
> | 出问题 | 先查 `0x80370114`（虚拟化没开），再翻第 16 章 |

**全文地图**

```text
第一部分 · 装起来            第二部分 · 用起来                第三部分 · 长期用
1 概念 → 2 准备 → 3 安装     4 配置 → 5 命令 → 6 文件互通       11 迁到 D 盘
                              7 图形 → 8 网络 → 9 USB → 10 开发环境

第四部分 · 换条路            第五部分 · 查问题
12 VMware 路线 → 13 对比      16 排错 → 17 误区
→ 14 WSL1/2 → 15 扩展
```

---

## 目录

- #🧭 0. 阅读指南
- #🧠 1. 概念：WSL 到底是什么
- #🧰 2. 安装前的准备
- #📦 3. 安装 Ubuntu
- #⚙️ 4. 基础配置
- #🎛️ 5. 日常管理命令
- #🔄 6. 文件互通
- #🖥️ 7. WSLg 图形界面
- #🌐 8. 网络模式
- #🔌 9. USB 设备直通
- #🛠️ 10. 开发环境搭建
- #💾 11. 把 Ubuntu 迁移到 D 盘
- #🧱 12. 路线 B：VMware 完整安装 Ubuntu
- #⚖️ 13. VMware vs WSL2：14 维对比
- #🕰️ 14. WSL1 vs WSL2 深度对比
- #🚀 15. 扩展知识
- #🚑 16. 故障排查
- #⚠️ 17. 常见误区
- #📋 附录 A：命令速查表
- #🔗 附录 B：参考来源
- #📎 附录 C：原教程（附件）
- #相关笔记

---

## 🧭 0. 阅读指南

### 0.1 两分钟判断你该看哪条路线

| 你的需求 | 走哪条 | 看哪章 |
| --- | --- | --- |
| 日常写代码、编译固件、跑 Linux 命令 | **WSL2** | 1–11 章 |
| 想在 Windows 里无缝用 Linux 工具链，又不想开虚拟机 | **WSL2** | 2–10 章 |
| 接 ST-Link / 串口 / 烧录器做硬件调试 | **VMware**（或 WSL2 + usbipd） | 9 或 12 章 |
| 学 Linux 驱动、要 insmod 自定义内核模块 | **VMware** | 12 章 |
| 想做实验怕搞崩，需要快照回滚 | **VMware** | 12.6 |
| 做嵌入式 + 日常开发 | **两个都装** | 13 章 |

### 0.2 本文的组织逻辑

1. **概念**（第 1 章）：先分清 WSL1 / WSL2 / VMware 三者的原理差异，后面的"为什么要这样配置"就都能理解；
2. **准备与安装**（第 2–3 章）：WSL2 装不上，90% 卡在 BIOS 虚拟化和两个 Windows 组件，这两步单独写细；
3. **用起来**（第 4–10 章）：systemd、文件互通、图形界面、网络、USB、开发环境；
4. **长期维护**（第 11 章）：C 盘爆了怎么办 —— 完整迁移流程；
5. **对比与扩展**（第 12–15 章）：VMware 路线、14 维对比、WSL1 历史、Docker/ROCm/QEMU 等；
6. **排错**（第 16–17 章）：按报错码查表。

> **阅读建议**
> 第一次装 WSL2，按 2 → 3 → 4 → 6 章顺序做一遍即可，大约 30 分钟。第 5、7–10 章可以装完再回来看。

---

## 🧠 1. 概念：WSL 到底是什么

### 1.1 一句话定义

**WSL（Windows Subsystem for Linux，适用于 Linux 的 Windows 子系统）= Windows 内置的一台"轻量 Linux 引擎"。**

你在 Windows 里直接打开一个真正的 Ubuntu 终端，用 `apt`、`gcc`、`python3`、`git`，不需要装虚拟机软件，也不需要重启进双系统。

**它能做的事：**

- 在 Windows 里打开真正的 Ubuntu 终端，跑 Linux 工具链；
- 编译 Linux 下的项目（C/C++、OpenHarmony、STM32 交叉编译、嵌入式工具链）；
- 跑 Docker（配合 Docker Desktop 的 WSL2 后端）；
- 运行 Linux 图形程序（WSLg，窗口直接显示在 Windows 桌面上）；
- 与 Windows 文件系统双向访问，代码放哪边都能读写。

### 1.2 WSL1 与 WSL2：两代完全不同的方案

| | WSL1 | WSL2 |
| --- | --- | --- |
| 原理 | 系统调用**翻译层**（lxss 驱动） | **轻量虚拟机 + 真正的 Linux 内核** |
| 内核 | 没有独立内核 | 微软定制 Linux 内核（5.15 / 6.6 LTS） |
| 兼容性 | 部分系统调用不支持（Docker 等跑不了） | 完整兼容 |
| 文件系统 | 直接读写 NTFS，跨盘 IO 快 | ext4 虚拟磁盘，跨盘走 9P（慢） |
| 启动 | 极快 | 快（秒级） |
| 现状 | 已淘汰 | **当前默认** |

> **记住结论**
> 新装系统默认就是 WSL2。`wsl -l -v` 里 VERSION 列必须是 `2` —— 如果是 `1`，编译速度、Docker、兼容性都会打折。

### 1.3 架构原理（两张图看懂）

```
【WSL1 · 系统调用翻译层】

  用户程序（bash / gcc / python …）
            │  Linux 系统调用
            ▼
  WSL 翻译层（lxss 驱动）── 把 Linux syscall 翻译成 Windows API
            │
            ▼
  Windows 内核（NTFS / 进程调度 / 网络）

  特点：无独立内核 · 启动飞快 · 兼容性有限
```

```
【WSL2 · 轻量虚拟机】

  用户程序（bash / gcc / python …）
            │  完整的 Linux 系统调用，无需翻译
            ▼
  真正的 Linux 内核（微软定制版）
      文件系统 ext4 · 内存管理 · 进程调度
            │
            ▼
  Windows 虚拟机平台（Hyper-V 技术）── 硬件虚拟化隔离

  特点：完整内核 · 兼容性高 · 性能接近原生
```

WSL2 本质是一台轻量虚拟机，但和你平时用的 VMware 不同：

- **共享内核**：所有 WSL2 发行版共用同一个微软定制内核，不会每装一个发行版就起一套系统；
- **按需启动**：打开终端才启动，关掉后自动释放资源，闲置时几乎不占内存；
- **深度集成**：文件系统、网络、图形界面都通过微软的特殊机制与 Windows 打通，不是孤立的虚拟机。

> **每个 WSL2 用户都会遇到的前提**
> WSL2 需要 **CPU 虚拟化（Intel VT-x / AMD-V）+「虚拟机平台」组件**。这就是第 2 章要做的事；报错 `0x80370114` 基本都是这两项没做好。

### 1.4 三种"在 Windows 上跑 Linux"的方式

| 方式 | 本质 | 启动 | 硬件访问 | 适合 |
| --- | --- | --- | --- | --- |
| **WSL2** | 轻量虚拟机 + 深度集成 | 1~2 秒 | 受限（需 usbipd） | 日常开发、编译、服务 |
| **VMware** | 完整独立虚拟机 | 30 秒 ~ 数分钟 | 较好（一键 USB 直通） | 驱动实验、硬件调试 |
| **双系统** | 真机原生安装 | 需重启切换 | 完全原生 | 重度 Linux 用户 |

---

## 🧰 2. 安装前的准备

准备工作只有三件事：**硬件达标、BIOS 开虚拟化、Windows 开两个组件**。做扎实了，安装就是一条命令。

### 2.1 硬件与系统要求

| 项目 | 要求 | 说明 |
| --- | --- | --- |
| CPU | 支持虚拟化（Intel VT-x / AMD-V，即 SVM） | 近十年的 CPU 基本都支持 |
| 内存 | 4 GB 起，建议 8 GB+ | WSL2 默认最多用 50% 物理内存 |
| 系统 | Windows 10 版本 2004+（内部版本 19041+）或 Windows 11 | `winver` 可查 |
| Windows 功能 | 「适用于 Linux 的 Windows 子系统」+「虚拟机平台」 | 见 2.3 |
| BIOS | SVM Mode（AMD）/ VT-x（Intel）= Enabled | 见 2.2 |

> **Windows 家庭版也行**
> WSL2 **不需要**专业版，也不需要启用 Hyper-V 功能。「虚拟机平台」是独立组件，家庭版同样具备。

### 2.2 BIOS 开启虚拟化（SVM / VT-x）

1. **重启电脑，开机时按进 BIOS 的键**
   常见：联想/小新 `F2`（或 `Fn+F2`）、戴尔 `F2`、惠普 `F10`、微星 `Del`、华硕 `F2/Del`。开机 LOGO 出现时连续敲击。

2. **找到虚拟化选项**
   通常在 `Advanced` / `Configuration` / `CPU Configuration` 下：
   - AMD 平台叫 **SVM Mode**（Secure Virtual Machine）；
   - Intel 平台叫 **VT-x** / **Virtualization Technology**；
   - 中文 BIOS 里叫「虚拟化技术」或「AMD 虚拟化」；
   - 部分机型藏在「安全 / Security」菜单里。

3. **设为 Enabled**，用 `F5/F6` 或方向键调整。

4. **保存退出**：`F10` → `Save & Exit` → 回车，电脑自动重启。

> **最常见的一类失败**
> Windows 组件全开了还是报 `0x80370114`，几乎都是 **BIOS 里的 SVM 没开**。先按 2.4 验证，别急着重装系统。

### 2.3 开启两个 Windows 功能组件

**方法 A：图形界面（直观）**

1. `Win` → 输入「启用或关闭 Windows 功能」→ 回车；
2. 勾选两项：
   - **适用于 Linux 的 Windows 子系统**
   - **虚拟机平台**
3. 其余保持默认，**不要勾 Hyper-V**（WSL2 不需要）；
4. 确定 → 等待安装完成 → 按提示重启。

**方法 B：管理员 PowerShell（命令行）**

```powershell
# 开启「适用于 Linux 的 Windows 子系统」
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 开启「虚拟机平台」（WSL2 必需）
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

执行完同样需要**重启电脑**。

### 2.4 验证虚拟化是否就绪

**① 任务管理器**

`Ctrl + Shift + Esc` → 「性能」→ 左侧「CPU」→ 右下角看「虚拟化」：

- 显示「**已启用**」→ BIOS 和系统都就绪；
- 显示「**已禁用**」→ SVM/VT-x 没开或没生效。

**② 核对组件状态（管理员 PowerShell）**

```powershell
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform
```

`State : Enabled` 即成功。

**检查流程：**

```
开始
 │
 ├─ BIOS 开启 SVM？ ──── 否 → 重启进 BIOS 设置（2.2）
 ├─ 两个组件已勾选？ ── 否 → 回到 2.3
 ├─ 任务管理器：虚拟化 = 已启用？ ── 否 → 回去检查 BIOS
 ├─ PowerShell：State = Enabled？ ── 否 → 重新启用组件并重启
 └─ 全部就绪 → 进入第 3 章安装
```

### 2.5 Windows 10 的额外一步

Windows 11 自带 WSL2 内核，**Windows 10 还需要装一次内核更新包**：

1. 下载并安装 [WSL2 Linux 内核更新包](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi)（`wsl_update_x64.msi`）；
2. 安装完成后执行：

```powershell
wsl --set-default-version 2
```

> **更省事的做法**
> Win10 21H2+ 可以在 Microsoft Store 安装「Windows Subsystem for Linux」应用，之后 `wsl --install`、`wsl --update` 都能用，内核会随应用自动更新。

---

## 📦 3. 安装 Ubuntu

### 3.1 一键安装

管理员 PowerShell：

```powershell
wsl --install -d Ubuntu
```

这条命令会依次完成：**下载并安装 Ubuntu（默认最新 LTS）→ 把 WSL 版本设为 2 → 提示重启完成组件安装**。

**常用变体：**

| 命令 | 作用 |
| --- | --- |
| `wsl --install` | 安装默认发行版（Ubuntu）+ 默认注册 WSL2 |
| `wsl --install -d Ubuntu` | 指定发行版名 |
| `wsl --install -d Ubuntu-22.04` | 指定版本（发行版名以 `wsl --list --online` 为准） |
| `wsl --install --no-launch` | 只安装不自动启动 |
| `wsl --install --web-download` | 绕过 Store，直接从网络下载 |
| `wsl --list --online` | 查看可安装的发行版清单 |
| `wsl --update` | 更新 WSL 本体与内核 |

> **安装慢或卡住**
> 进度条长时间不动，多半是网络问题（微软 CDN）。可换网络后重试，或先 `wsl --update` 更新 WSL 本体再装。**不要中途关窗口**，会把发行版装成半残。

### 3.2 首次初始化

1. 重启后从开始菜单打开 **Ubuntu**，或在 PowerShell 执行 `wsl`；
2. 首次启动提示 `Installing, this may take a few minutes...`，等待；
3. 提示 `Enter new UNIX username:` 时输入用户名 —— **必须小写字母**，不要用 `root`，例如 `jack`；
4. 设置密码并二次确认。**输入时屏幕不显示任何字符是正常的**，不是键盘坏了；
5. 看到 `jack@你的电脑名:~$` 提示符，初始化完成。

### 3.3 验证与更新

```bash
# 更新软件源与系统（第一次比较慢，务必跑完）
sudo apt update
sudo apt upgrade -y
```

```bash
uname -a          # 内核版本，出现 microsoft-standard 字样即 WSL2 内核
lsb_release -a    # Ubuntu 版本
cat /etc/os-release
pwd               # 默认在 /home/你的用户名
```

> **先跑一次 `wsl --update`**
> 装完发行版后，在 PowerShell 执行 `wsl --update`，把 WSL 本体升到最新版 —— 很多新特性（mirrored 网络、autoMemoryReclaim、sparseVhd）都在新版本里，老版本 `.wslconfig` 写了也不生效。

### 3.4 安装流程总览

```
wsl --install
   │ 下载安装 + 设置 WSL2
   ▼
重启电脑（组件安装完成）
   │
   ▼
首次启动 → 创建用户名 + 密码
   │
   ▼
sudo apt update && sudo apt upgrade -y
   │
   ▼
验证：uname -a / lsb_release -a / pwd
   │
   ▼
开始使用（下一步建议：开启 systemd，见第 4 章）
```

---

## ⚙️ 4. 基础配置

### 4.1 开启 systemd

现代 Ubuntu 用 systemd 管理服务（`systemctl` 命令）。**WSL 默认不启动 systemd**，不开启的话 `systemctl start xxx` 会报错。

```bash
sudo nano /etc/wsl.conf
```

写入（文件不存在会自动新建）：

```ini
[boot]
systemd=true
```

保存：`Ctrl + O` 回车，再 `Ctrl + X` 退出。回到 PowerShell：

```powershell
wsl --shutdown
```

等几秒重新打开 Ubuntu，验证：

```bash
systemctl list-units --type=service
```

能看到服务列表即成功。

> **什么时候必须开 systemd**
> 用 `apt` 装 MySQL、Redis、nginx、Docker（非 Desktop 版）等服务时需要；只写代码编译可以有可无，但**建议一开始就开**，一劳永逸。
> 需要 WSL 版本 ≥ 0.67.6，老版本请先 `wsl --update`。

### 4.2 `/etc/wsl.conf` 全解（Linux 侧配置）

```ini
[boot]
systemd=true                 # 启用 systemd

[automount]
enabled=true                 # 自动挂载 Windows 盘到 /mnt
root=/mnt/                   # 挂载根
options="metadata,umask=22,fmask=11"   # metadata 让 chmod/chown 生效

[network]
hostname=devbox              # 自定义主机名
generateHosts=true           # 自动生成 /etc/hosts
generateResolvConf=true      # 自动生成 /etc/resolv.conf

[interop]
enabled=true                 # 允许在 Ubuntu 里调用 .exe
appendWindowsPath=true       # 把 Windows PATH 追加进 Linux PATH

[user]
default=jack                 # 默认登录用户
```

| 段 | 常用项 | 说明 |
| --- | --- | --- |
| `[boot]` | `systemd` | 是否启动 systemd |
| `[automount]` | `options=metadata` | 让 `/mnt/c` 支持 Linux 权限位（Windows 文件需要） |
| `[network]` | `hostname`、`generateResolvConf` | 主机名、DNS 生成 |
| `[interop]` | `appendWindowsPath` | 关掉可避免 PATH 里混入 Windows 程序 |
| `[user]` | `default` | 默认用户（`wsl --import` 后必配） |

> **改配置的通用套路**
> 改 `/etc/wsl.conf` 后必须 **`wsl --shutdown` 再进**才生效；改 `.wslconfig` 同理。两者一个在 Linux 侧、一个在 Windows 侧，别搞混（见 4.3）。

### 4.3 `.wslconfig` 全解（Windows 侧配置）

位置：`C:\Users\你的用户名\.wslconfig`（用记事本创建）。

```ini
[wsl2]
memory=16GB                  # WSL 最多用 16GB 内存
processors=8                 # 最多用 8 个核心
swap=4GB                     # 交换分区大小
swapFile=D:\\WSL\\swap.vhdx   # 交换文件位置（可选）
localhostForwarding=true     # Windows 可通过 localhost 访问 WSL 服务
networkingMode=mirrored      # 镜像网络（Win11 22H2+）
dnsTunneling=true            # DNS 隧道，改善域名解析
autoMemoryReclaim=gradual    # 空闲内存自动回收
sparseVhd=true               # 虚拟磁盘稀疏化，自动回收空间
guiApplications=true         # 允许图形程序（WSLg）
```

| 配置项 | 作用 |
| --- | --- |
| `memory` | 内存上限，如 `8GB`、`16GB`。**不要分给全部内存**，Windows 自己也要用 |
| `processors` | 可用 CPU 核心数 |
| `swap` / `swapFile` | 交换分区大小与位置，编译大工程时有用 |
| `localhostForwarding` | 端口转发，让 Windows 用 `localhost:端口` 访问 WSL 服务 |
| `networkingMode=mirrored` | 镜像网络模式，见第 8 章 |
| `dnsTunneling` | DNS 走 Windows 隧道，解决"能 ping IP 不能 ping 域名" |
| `autoMemoryReclaim` | `gradual` / `dropcache` / `disabled`，回收闲置内存 |
| `sparseVhd` | 虚拟磁盘稀疏化，`wsl --manage <发行版> --set-sparse true` 也可单独设 |
| `kernel` | 自定义内核路径（一般用不到） |

> **两个必须记住的点**
> 1. 改完 `.wslconfig` **必须 `wsl --shutdown`** 才生效；
> 2. WSL2 默认最多占物理内存的 50%（旧版本上限 8GB），内存小又常编译的机器，把 `memory` 调大、同时开 `autoMemoryReclaim`。

### 4.4 用户与密码

**忘记 sudo 密码：**

```powershell
wsl -d Ubuntu -u root      # 以 root 身份进入
```

```bash
passwd 你的用户名           # 重设密码
exit
```

**切换默认用户**（编辑 `/etc/wsl.conf` 的 `[user] default=`），或临时：

```powershell
wsl -d Ubuntu -u root
```

---

## 🎛️ 5. 日常管理命令

这些命令都在 **PowerShell** 里执行，管理所有 Linux 发行版。

| 命令 | 作用 | 备注 |
| --- | --- | --- |
| `wsl --status` | 查看 WSL 默认版本与状态 | 确认是 WSL2 |
| `wsl -l -v` | 列出所有发行版及版本、状态 | 缩写 `wsl --list --verbose` |
| `wsl --set-version Ubuntu 2` | 把某发行版切换为 WSL2 | 转换需要几分钟 |
| `wsl --set-default-version 2` | 今后默认都装 WSL2 | 建议执行一次 |
| `wsl --shutdown` | 关闭全部 WSL 虚拟机 | **改配置后用它生效** |
| `wsl --terminate Ubuntu` | 单独关闭某个发行版 | 释放内存 |
| `wsl --update` | 更新 WSL 本体与内核 | 建议定期执行 |
| `wsl --unregister Ubuntu` | 删除发行版（**含全部数据**） | 不可恢复，慎用 |
| `wsl -d Ubuntu -u root` | 以 root 进入 | 重置密码用 |
| `wsl --export Ubuntu D:\backup\ubuntu.tar` | 导出完整镜像 | 备份 / 迁移 |
| `wsl --import Ubuntu D:\WSL D:\backup\ubuntu.tar --version 2` | 从镜像导入 | 恢复 / 迁移 |
| `wsl --version` | 查看 WSL 版本（新版支持） | 判断特性可用性 |
| `wsl --manage Ubuntu --set-sparse true` | 开启磁盘稀疏化 | 回收未使用空间 |

> **版本决定特性**
> `networkingMode=mirrored`、`dnsTunneling`、`autoMemoryReclaim`、`sparseVhd` 都要较新的 WSL（2.0+）。用 `wsl --version` 确认，老版本先 `wsl --update`。

---

## 🔄 6. 文件互通

WSL 最大的便利之一：两边文件系统互相可见，不用来回拷贝。

### 6.1 Ubuntu 里访问 Windows 磁盘

Windows 的每个盘符自动挂载到 `/mnt/` 下：

```bash
ls /mnt/c        # C 盘
ls /mnt/d        # D 盘
cd /mnt/d/course/embedded
```

### 6.2 Windows 里访问 Ubuntu 文件系统

资源管理器地址栏输入：

```
\\wsl$\Ubuntu
```

或：

```
\\wsl.localhost\Ubuntu
```

回车即可像普通文件夹一样浏览、读写 Ubuntu 的整个文件系统。

```
Windows 文件系统            Ubuntu 文件系统（ext4）
 C: / D: / F:                /home/用户名
      │                            │
      │  /mnt/c /mnt/d             │
      ▼                            ▼
   Linux 程序 / 终端  ←────────→  Windows 程序 / 资源管理器
        （读写 Windows 盘）        （\\wsl$ 读写 ext4）
```

### 6.3 性能与安全红线（嵌入式开发尤其注意）

> **两条硬规则**
> **① 项目代码放 Linux 侧。** 在 WSL 里编译项目（内核模块、OpenHarmony、大型 C 工程）时，代码应放在 `/home/用户名/` 下。跨盘（`/mnt/f`）读写走 9P 协议，**大量小文件 IO 会慢 5～10 倍**，编译大型工程尤其明显。
> **② 不要在 Windows 里直接编辑 Linux 侧文件。** 用资源管理器 `\\wsl$` 直接改 ext4 里的文件，容易搞乱权限位（还可能混进行尾差异），导致编译报错。**Linux 代码在 Ubuntu 内编辑，Windows 文件放 `/mnt/`**。

**权限问题的补救办法**：如果确实需要在 `/mnt/c` 上执行 `chmod`/`chown`，给 `/etc/wsl.conf` 的 `[automount]` 加 `options="metadata"`，然后 `wsl --shutdown` 重启。

### 6.4 编辑器怎么选

| 方式 | 做法 | 评价 |
| --- | --- | --- |
| **VS Code + Remote WSL**（推荐） | Windows 装 VS Code，Ubuntu 里 `code .` | 编辑在 Windows 侧、编译在 Linux 侧，官方推荐，体验最佳 |
| 终端编辑器 | `vim` / `nano` | 轻量，改配置够用 |
| 资源管理器直改 | `\\wsl$\Ubuntu\...` | 不推荐（见 6.3 红线） |

```bash
# VS Code 连接 WSL（在 Ubuntu 终端里执行）
code .
```

---

## 🖥️ 7. WSLg 图形界面

WSLg（Windows Subsystem for Linux GUI）让 Ubuntu 里的图形程序**直接把窗口显示到 Windows 桌面上**，不用装 VcXsrv 之类的 X 服务器。

### 7.1 前提与验证

| 条件 | 说明 |
| --- | --- |
| Windows 11 | 自带 WSLg |
| Windows 10 | 官方未提供 WSLg，需升级系统，或退而用第三方 X 服务器（不保证体验） |
| WSL 版本 | 较新版本，`wsl --update` 保持最新 |
| `.wslconfig` | `guiApplications=true`（默认开） |

```bash
sudo apt install gedit -y
gedit
```

稍等，Windows 桌面上会弹出 gedit 窗口 —— WSLg 正常。

### 7.2 常用图形程序

```bash
sudo apt install nautilus firefox -y     # 文件管理器、浏览器
```

WSLg 还支持：**剪贴板互通**、声音输出（Wayland）、多窗口。

### 7.3 与 Windows 侧工具配合（以 AMD Privacy View 为例）

WSLg 的图形窗口本质上是 Windows 桌面上的普通窗口，因此**所有作用于 Windows 窗口的工具都对它生效**：

- **眼动防窥（AMD Privacy View）**：Windows 侧开启并完成校准后，Ubuntu 的图形窗口同样会被模糊/清晰化，视线聚焦处清晰、其余模糊；
- **注意**：这类工具会占用 GPU 资源，跑大型编译或 GPU 计算时建议先关掉。

> **提示**
> 这条对任何"屏幕级"工具都成立（录屏、护眼滤镜、防窥）。反之，纯 Linux 侧的窗口管理行为（如某个 GTK 主题）不会影响 Windows 的其他窗口。

---

## 🌐 8. 网络模式

### 8.1 默认 NAT 模式

WSL2 默认使用 NAT：Ubuntu 有自己独立的虚拟网卡和 IP。

**特点：**

- Ubuntu 里启动 Web 服务（如 `python3 -m http.server`），Windows 浏览器直接访问 `localhost:端口` 即可（靠 `localhostForwarding`）；
- Windows 与 Ubuntu 互相访问用 `localhost`，**不用记 IP**；
- Ubuntu 的 IP 每次重启可能变化（`ip addr` 查看）。

### 8.2 镜像网络模式（mirrored）

Win11 22H2+ 支持 `networkingMode=mirrored`：WSL 与 Windows **共享网络栈**，IPv6、防火墙规则一致，**局域网设备可以直接访问 WSL 里的服务**。

```ini
[wsl2]
networkingMode=mirrored
```

适合：需要把 WSL 里的服务暴露给手机/同事电脑，或 IPv6 环境。

### 8.3 DNS 与代理排错

**症状：** `ping 8.8.8.8` 通，但 `ping baidu.com` 不通。

**排查顺序：**

1. 看 `/etc/resolv.conf` 内容是否正常（可能是空的或被改坏）；
2. 试 `dnsTunneling=true`（Win11 + 新版 WSL）后 `wsl --shutdown`；
3. 临时改 DNS：

   ```bash
   sudo sh -c 'echo "nameserver 223.5.5.5" > /etc/resolv.conf'
   ```

   注意：重启 WSL 后会被重新生成覆盖，持久方案是 `.wslconfig` 里加：

   ```ini
   [wsl2]
   dnsTunneling=true
   ```

4. 公司/校园网需要代理时，在 `~/.bashrc` 里配置 `http_proxy` / `https_proxy`，指向 Windows 侧代理软件的地址（NAT 模式下通常是 Windows 的网关 IP）。

### 8.4 让局域网访问 WSL 里的服务

| 方式 | 做法 |
| --- | --- |
| 镜像模式（推荐） | `.wslconfig` 设 `networkingMode=mirrored`，服务直接可被局域网访问 |
| 端口转发（NAT 下） | 管理员 PowerShell：`netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<WSL IP>`，配合防火墙放行 |

> **注意防火墙**
> Windows Defender 防火墙默认拦截入站连接。`netsh portproxy` 之后还要在「高级安全 Windows Defender 防火墙」里为对应端口建入站规则。

---

## 🔌 9. USB 设备直通

WSL2 **默认不能直接访问 USB 设备**。接 ST-Link、fireDAP、USB 转 TTL 串口时，用微软官方的 **usbipd-win** 方案。

### 9.1 安装

**Windows 侧（管理员 PowerShell）：**

```powershell
winget install --interactive --exact dorssel.usbipd-win
```

或从 GitHub（`dorssel/usbipd-win`）下载安装包。

**Ubuntu 侧：**

```bash
sudo apt install linux-tools-generic hwdata -y
sudo update-alternatives --install /usr/local/bin/usbip usbip /usr/lib/linux-tools/*-generic/usbip 20
```

### 9.2 绑定、附加、卸载

**① 列出设备与 BUSID（管理员 PowerShell）**

```powershell
usbipd list
```

**② 绑定目标设备**（先插好设备；`bind` 需要管理员权限，且**只需做一次**）

```powershell
usbipd bind --busid 2-4
```

**③ 附加到 WSL**（每次插拔/重启后都要重新做）

```powershell
usbipd attach --wsl --busid 2-4
```

**④ 在 Ubuntu 里验证**

```bash
lsusb
ls /dev/ttyUSB*
```

串口设备通常需要权限：

```bash
sudo usermod -aG dialout $USER     # 重新登录生效
```

**⑤ 用完释放**

```powershell
usbipd detach --busid 2-4
```

> **三个高频坑**
> 1. **每次重新插拔都要重新 `attach`**，这不是故障；
> 2. 不 `detach` 的话，Windows 侧程序无法使用该设备；
> 3. 某些设备（复合设备、带厂商驱动的仿真器）直通后不稳定 —— 这类情况直接上 VMware。

### 9.3 什么时候别折腾 usbipd

如果出现下列情况，**建议改用 VMware 虚拟机**（第 12.5 节）：

- 要同时接多个 USB 设备（仿真器 + 多个串口）；
- 设备在 WSL 里反复掉线、识别不稳定；
- 需要做 USB 协议层面调试。

VMware 的「虚拟机 → 可移动设备 → 连接」是一键式原生直通，稳定性高一个档次。

---

## 🛠️ 10. 开发环境搭建

装好 Ubuntu 后，按需安装工具链。下面是一套嵌入式 / 通用开发常用组合：

```bash
# 基础开发工具
sudo apt install build-essential git vim curl wget -y

# 交叉编译与调试（ARM 嵌入式）
sudo apt install gcc-arm-none-eabi gdb-multiarch -y

# 串口与烧录工具
sudo apt install minicom picocom -y

# 网络与远程
sudo apt install net-tools openssh-server -y
```

### 10.1 验证工具链

```bash
gcc --version                # 本机 gcc
arm-none-eabi-gcc --version  # ARM 交叉编译器
git --version
```

### 10.2 首次配置 git

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### 10.3 WSL2 适合做什么、不适合做什么

| 任务 | WSL2 | 说明 |
| --- | --- | --- |
| C/C++ 编译、Makefile / CMake | ✅ | 接近原生性能（代码放 ext4） |
| 交叉编译 ARM 固件 | ✅ | 工具链齐全 |
| Python / Node / 脚本 | ✅ | |
| Docker（Desktop 后端） | ✅ | 见 15.1 |
| 跑 Linux 服务（nginx/redis/mysql） | ✅ | 需先开 systemd |
| **insmod 自定义内核模块** | ❌ | 定制内核没有对应 headers，**用 VMware** |
| **设备树 / 平台驱动实验** | ❌ | 用 VMware 或 QEMU（见 15.6） |
| **USB 硬件调试** | ⚠️ | 能通但折腾，稳定性不如 VMware |

---

## 💾 11. 把 Ubuntu 迁移到 D 盘

WSL 默认把发行版装在 C 盘（`C:\Users\用户名\AppData\Local\Packages\...`）。C 盘紧张时，用「**导出镜像 → 卸载 → 导入到 D 盘**」三步把整个系统搬走，**配置和已装软件全部保留**。

### 11.1 迁移原理

```
① 系统装在 C 盘
   wsl --install（默认位置，占 C 盘几个 GB 起）
        │
        ▼
② 导出镜像
   wsl --export Ubuntu D:\WSL\Ubuntu.tar
        │
        ▼
③ 卸载 C 盘上的发行版
   wsl --unregister Ubuntu     ← 释放 C 盘空间（不可逆！）
        │
        ▼
④ 导入到 D 盘
   wsl --import Ubuntu D:\WSL D:\WSL\Ubuntu.tar --version 2
        │
        ▼
⑤ 配置默认用户（导入后默认 root）
   /etc/wsl.conf 写 [user] default=你的用户名
```

> **顺序不可颠倒**
> **必须先 export 成功，再 unregister。** `unregister` 会删除 C 盘里的全部数据，且不可恢复。导出后先确认 `.tar` 文件存在且大小正常（几个 GB），再执行下一步。

### 11.2 完整操作（管理员 PowerShell）

**Step 1 · 准备目录、确认发行版名**

```powershell
mkdir D:\WSL
wsl -l -v
```

记下 NAME 列的名字（通常就是 `Ubuntu`），后面命令用它替换。

**Step 2 · 关闭正在运行的发行版**

```powershell
wsl --terminate Ubuntu
```

不终止的话，导出时文件被占用，会失败或得到损坏镜像。

**Step 3 · 导出镜像**

```powershell
wsl --export Ubuntu D:\WSL\Ubuntu.tar
```

等待完成，`D:\WSL\Ubuntu.tar` 会有几个 GB。**确认文件大小正常**再做下一步。

**Step 4 · 卸载 C 盘上的临时安装**

```powershell
wsl --unregister Ubuntu
```

这一步释放 C 盘空间，`Ubuntu` 从 WSL 列表消失。

**Step 5 · 导入到 D 盘**

```powershell
wsl --import Ubuntu D:\WSL D:\WSL\Ubuntu.tar --version 2
```

参数依次是：**发行版名 + 存放目录 + 镜像文件 + WSL 版本**。`D:\WSL` 下会生成 `ext4.vhdx` 虚拟磁盘，Ubuntu 从此不占 C 盘。

**Step 6 · 配置默认用户（导入后默认是 root）**

```powershell
wsl -d Ubuntu        # 此时以 root 进入
```

```bash
adduser 你的用户名
usermod -aG sudo 你的用户名

# 重要：用 >> 追加，保留已有的 [boot] systemd=true
echo -e "[user]\ndefault=你的用户名" >> /etc/wsl.conf

cat /etc/wsl.conf    # 确认 [boot] 和 [user] 两段都在
exit
```

```powershell
wsl --shutdown
wsl -l -v            # 确认 VERSION=2，位置在 D 盘
```

之后从开始菜单或 `wsl` 进入，默认登录你的普通用户，**之前装的软件、配置、家目录文件都还在**。

### 11.3 注意事项

| 注意事项 | 说明 |
| --- | --- |
| export 前必须 terminate | 不终止进程，导出会因占用失败或镜像损坏 |
| 先确认 export 成功再 unregister | 检查 `.tar` 大小（几个 GB 为正常），卸载不可逆 |
| 路径避免中文与空格 | `D:\WSL` 这类纯英文路径最稳 |
| `wsl.conf` 用追加而非覆盖 | 用 `>>`，别用 `>`，否则会覆盖 `[boot] systemd=true` |
| 导入后默认 root 登录 | 必须创建普通用户并写 `[user] default=` |
| 迁移后路径不变 | `\\wsl$\Ubuntu`、`/mnt/c` 等访问方式照旧 |
| 镜像体积 | 装得越多 tar 越大；迁移验证无误后可删掉 tar |

### 11.4 通用备份 / 恢复

迁移用的是同一套命令，日常也可以当备份用：

```powershell
# 备份
wsl --export Ubuntu D:\backup\ubuntu-2026-11-18.tar

# 恢复（新机器或装坏了）
wsl --import Ubuntu D:\WSL D:\backup\ubuntu-2026-11-18.tar --version 2
```

> **这是 WSL 的"快照"**
> WSL 没有 VMware 那种快照功能，`export`/`import` 就是它的等价物：做危险操作前导出一份，出事直接导入回来。

---

## 🧱 12. 路线 B：VMware 完整安装 Ubuntu

需要完整 Linux 环境做驱动实验、USB 硬件调试时，这是标准路线。以 VMware Workstation 17.x + Ubuntu 22.04 LTS 为例。

### 12.1 下载 ISO

1. 访问 <https://ubuntu.com/download/desktop>（桌面版，带图形界面）或 <https://ubuntu.com/download/server>（服务器版，省资源）；
2. 选 **LTS 长期支持版**（22.04 / 24.04，5 年安全更新），不要选 6 个月一版的临时版本；
3. 下载 `.iso`（约 2.5~5 GB）。国内可用镜像站加速：`mirrors.tuna.tsinghua.edu.cn`、`mirrors.ustc.edu.cn`、`mirrors.aliyun.com`（路径 `/ubuntu-releases/22.04/`）；
4. 装 VMware Workstation（Player 个人免费）。

> **桌面版 vs 服务器版**
> 要图形界面（浏览器、gedit、桌面环境）选 **Desktop**；只做命令行开发/编译/服务端实验选 **Server**（内存占用低一半）。学驱动建议 Desktop，体验完整。

### 12.2 创建虚拟机

1. **新建虚拟机** → 「典型（推荐）」→ 下一步；
2. **安装来源** → 「安装程序光盘映像文件（iso）」→ 选刚下载的 ISO → 下一步；
3. **配置账号** → 填全名、用户名（小写）、密码（这个账号会自动带 sudo 权限）；
4. **分配资源**（以 32 GB 内存机器为例）：

   | 资源 | 建议值 | 说明 |
   | --- | --- | --- |
   | 内存 | 8 GB（大工程编译可 16 GB） | 不要给满 |
   | 处理器 | 4 核 | 不超过物理核数一半 |
   | 磁盘 | 60 GB | 选「存储为单个文件」性能更好 |

5. 「自定义硬件」里可再调：内存、处理器、显示（3D 加速）、USB 控制器等；
6. 点「完成」。

### 12.3 安装系统

1. 「开启此虚拟机」→ GRUB 菜单选第一项；
2. 语言建议**英文**（终端兼容性最好），输入法后期装；
3. 选「Minimal installation（最小安装）」+ 勾选「Install third-party software」；
4. 分区选 **Erase disk and install Ubuntu** —— 这是虚拟磁盘，不会动 Windows 真实分区，放心选；
5. 等待安装完成 → 重启 → 提示 `Please remove the installation medium` 时回车 → 进入桌面。

### 12.4 open-vm-tools

VMware Tools 提供：窗口自适应、剪贴板互通、拖拽文件、显卡优化。新版会自动装 `open-vm-tools`，检查一下：

```bash
systemctl status open-vm-tools        # 已安装并运行即正常
sudo apt install open-vm-tools open-vm-tools-desktop -y   # 未装则补装
```

### 12.5 USB 直通（嵌入式调试核心）

1. **插入设备**：ST-Link / fireDAP / USB 转串口，Windows 会先识别；
2. **挂载到虚拟机**：VMware 菜单栏 **虚拟机 → 可移动设备 → 选择设备 → 连接**；
3. **验证**：

   ```bash
   lsusb
   ls /dev/ttyUSB*
   ```

4. **用完断开**：同一菜单选「断开连接」，设备回到 Windows。

### 12.6 快照（强烈建议）

**虚拟机 → 快照 → 拍摄快照**。做驱动实验前先拍一张，内核 panic 或系统搞崩后一键还原 —— 这是 WSL2 和裸机都给不了的"安全感"。

---

## ⚖️ 13. VMware vs WSL2：14 维对比

### 13.1 对比表

| 维度 | WSL2 | VMware 虚拟机 |
| --- | --- | --- |
| 本质 | Windows 子系统，轻量虚拟机 + 定制内核 | 完整独立虚拟机，模拟整套硬件 |
| 启动速度 | 1~2 秒进终端 | 30 秒 ~ 数分钟完整开机 |
| 内存占用 | 按需分配、可回收，闲置接近 0 | 固定占用（如 8 GB），开机即占 |
| 磁盘性能 | ext4 接近原生；跨盘（`/mnt`）慢 | 虚拟磁盘稳定；快照占额外空间 |
| 文件互通 | 原生双向（`/mnt`、`\\wsl$`） | 需配共享文件夹 / 拖拽 |
| 图形界面 | WSLg 可选，窗口浮在 Windows 桌面 | 完整 Ubuntu 桌面环境 |
| Linux 内核 | 微软定制内核，不能加载自定义模块 | Ubuntu 官方内核，可编译加载模块 |
| USB 直通 | usbipd 附加，步骤多、插拔需重连 | 菜单一键直通，原生稳定 |
| 快照 / 回滚 | 不支持（用 export/import 备份） | 原生快照，崩溃一键还原 |
| 显卡加速 | WSLg 走 Windows GPU；可配 ROCm 计算 | 3D 加速有限，GPU 计算支持差 |
| 剪贴板 | 原生互通 | 装 VMware Tools 后互通 |
| 网络 | NAT / mirrored，`localhost` 直接访问 | NAT / 桥接，需记 IP |
| 适合场景 | 日常开发、编译、跑服务、Docker、脚本 | 完整 Linux 环境、驱动实验、USB 调试 |
| 安装复杂度 | 一条命令 | 下载 ISO + 建虚拟机 + 完整安装 |

### 13.2 选型决策树

```
我要在 Windows 上用 Linux
   │
   ├─ 主要写代码 / 编译 / 跑服务 / 用 Docker？ → 日常开发为主
   │        └─→ WSL2（秒开、省资源、文件互通）
   │
   ├─ 要接仿真器 / 串口 / 烧录器？ → 嵌入式硬件调试
   │        └─→ VMware（一键 USB）或 WSL2 + usbipd（折腾但可用）
   │
   ├─ 要 insmod / 编内核模块 / 学驱动？ → 学习 Linux 内核
   │        └─→ VMware（完整内核 + 快照）
   │
   └─ 全都想要 → 两个都装
            ├─ 路线 A：WSL2 当主力开发环境
            └─ 路线 B：VMware 当实验环境（驱动 / USB / 快照）
```

### 13.3 一句话选型

- **日常写代码、编译固件、跑 Linux 命令** → **WSL2**。秒开、省资源、文件互通，Windows 与 Linux 无缝切换。
- **做内核驱动实验、接仿真器/串口/烧录器、要快照保命** → **VMware**。完整内核 + 原生 USB + 快照，嵌入式硬件调试不可替代。
- **成年人** → 两个都装，互不冲突（新版都基于虚拟化平台，可共存，仅性能略有折损）。

---

## 🕰️ 14. WSL1 vs WSL2 深度对比

### 14.1 演进时间轴

| 时间 | 事件 | 说明 |
| --- | --- | --- |
| 2016 | WSL 初代（后称 WSL1） | 随 Win10 周年更新推出，目标是"让 Linux 二进制直接跑在 Windows 上"，采用系统调用翻译层 |
| 2019 | WSL2 发布 | 重构为真正的 Linux 内核 + 轻量虚拟机，兼容性/性能大幅提升，成为默认 |
| 2021 | WSLg 与 `wsl --install` | Win11 带来 Linux 图形界面支持，一条命令装好 WSL |
| 2022+ | 持续进化 | systemd 支持、镜像网络、内存回收、稀疏 VHD、GUI 加速…… |

### 14.2 关键差异表

| 维度 | WSL1 | WSL2 |
| --- | --- | --- |
| 架构 | 系统调用翻译层（lxss 驱动） | 轻量虚拟机 + 真正 Linux 内核 |
| 内核 | 无独立内核 | 微软定制内核（5.15 / 6.6 LTS） |
| 系统调用兼容性 | 部分不支持（Docker 等依赖完整内核的功能跑不了） | 完整兼容，Docker 直接跑 |
| 文件系统 | 直接读写 NTFS，跨盘 IO 快 | ext4 虚拟磁盘（Linux 侧快），跨盘走 9P（慢） |
| 启动速度 | 极快（无虚拟机） | 快（秒级） |
| 内存管理 | 与 Windows 共享 | 独立内存空间（可设上限） |
| 网络 | 与 Windows 共享网络栈 | 独立虚拟网卡（NAT / mirrored） |
| IO 密集型任务（编译） | 表现差 | Linux 侧接近原生，编译显著提升 |
| 现状 | 几乎淘汰 | **当前默认，微软主推** |

> **为什么 WSL2 编译更快**
> WSL1 的文件操作要翻译成 Windows 调用，还要走完整 NTFS 权限检查；WSL2 直接操作 ext4，配合完整内核，编译大型工程（Linux、OpenHarmony）性能接近物理机 —— 这是嵌入式开发者首选 WSL2 的核心原因。

> **WSL2 的代价**
> 需要 CPU 虚拟化 + 虚拟机平台；跨 Windows 盘（`/mnt/c`）读文件反而比 WSL1 慢。所以：**代码放 Linux 侧，别放 `/mnt`**。

---

## 🚀 15. 扩展知识

### 15.1 Docker Desktop 与 WSL2

Docker Desktop 的 Windows 版默认**基于 WSL2 后端**运行：Docker 引擎跑在 WSL2 的 Linux 内核里，不再需要 Hyper-V 虚拟机。安装时勾选「Use the WSL 2 based engine」即可。

```bash
# 装好 Docker Desktop 后，在 Ubuntu 里验证
docker --version
docker run hello-world
```

好处：Windows 与 WSL 共享同一个 Docker 引擎，`docker` 命令在 Ubuntu 终端里直接可用。

### 15.2 多发行版管理

WSL 支持同时装多个发行版（Ubuntu、Debian、Kali、openSUSE……），互不干扰：

```powershell
wsl --list --online          # 查看可安装的发行版
wsl --install -d Debian      # 安装 Debian
wsl -d Debian                # 进入指定发行版
wsl -d Ubuntu
wsl --unregister Debian      # 删除某个发行版（含数据）
```

### 15.3 内核更新与自定义

- 普通用户：内核由 Windows Update / `wsl --update` 自动更新；
- 高级用户：可从 GitHub（`microsoft/WSL2-Linux-Kernel`）取源码自己编译，在 `.wslconfig` 里用 `kernel=D:\WSL\vmlinux` 指定 —— **一般开发者用不到**，了解即可。

### 15.4 双系统 vs 虚拟机 vs WSL2

| 维度 | WSL2 | VMware 虚拟机 | Ubuntu 双系统 |
| --- | --- | --- | --- |
| 性能 | 接近原生（Linux 侧） | 中等（虚拟化开销） | 原生满血 |
| 同时用 Windows + Linux | 无缝切换 | 可同时 | 需重启切换 |
| 硬件访问 | 受限 | 较好（USB 直通） | 完全原生 |
| 安全性 / 可回滚 | 一般 | 快照保护，很安全 | 改坏系统难恢复 |
| 适合 | 日常开发 | 完整环境 + 硬件调试 | 长期重度 Linux 用户 |

### 15.5 WSL 里的 AMD GPU（ROCm）

WSL2 支持 AMD GPU 计算（ROCm），可在 Ubuntu 里跑 PyTorch 等 GPU 加速任务：

```bash
# 在 WSL Ubuntu 里安装 ROCm（支持部分 AMD 显卡）
amdgpu-install -y --usecase=wsl,rocm --no-dkms
```

> **别混淆**
> ROCm 是"用 GPU 做通用计算"；AMD Privacy View 是"屏幕眼动防窥"，纯 Windows 功能，两者无关。
> 另外，ROCm 对核显（如 Radeon 780M 这类）支持有限，跑 GPU 计算建议独显平台。

### 15.6 QEMU：虚拟机里再模拟 ARM 开发板

学嵌入式 Linux 驱动没有开发板？可以在 Ubuntu（WSL 或 VMware 里都行）用 QEMU 模拟 ARM 板卡：

```bash
sudo apt install qemu-system-arm -y
qemu-system-arm -M vexpress-a9 -m 512M \
  -kernel zImage -dtb vexpress-v2p-ca9.dtb -nographic
```

这样能在纯软件环境里练设备树、平台驱动、中断，基础扎实了再买板子 —— "不花钱练驱动"的经典路径。

---

## 🚑 16. 故障排查

| 报错 / 现象 | 原因 | 解决办法 |
| --- | --- | --- |
| `0x80370114` | CPU 虚拟化未开启（BIOS SVM/VT-x 关闭） | 进 BIOS 开 SVM Mode / VT-x，重启 |
| `0x80070003` / `0x80070002` | WSL 安装未完成 / 组件缺失 | 重跑 `wsl --install`，确认组件已勾选 |
| 一直提示 WSL1 | 默认版本仍是 1 | `wsl --set-default-version 2` |
| Ubuntu 打不开、白屏闪退 | 发行版损坏 / 注册表残留 | `wsl --unregister Ubuntu` 后重装（先备份） |
| `systemctl` 报错 | 未开启 systemd | 按 4.1 配 `wsl.conf` + `wsl --shutdown` |
| 编译很慢 | 代码放在 `/mnt/*` 跨盘编译 | 移到 `/home/用户名` 下 |
| 内存不释放 | 空闲内存未回收 | `.wslconfig` 加 `autoMemoryReclaim=gradual`，或 `wsl --shutdown` |
| 磁盘越来越大不回收 | vhdx 不自动缩容 | `.wslconfig` 加 `sparseVhd=true`，或 `wsl --manage Ubuntu --set-sparse true` |
| 找不到 USB 设备 | 未 bind / attach，或未 detach 占用 | 按第 9 章流程，`usbipd list` 看状态 |
| 串口权限不足 | 用户不在 `dialout` 组 | `sudo usermod -aG dialout $USER` 后重登 |
| WSLg 图形打不开 | Win10 缺 WSLg / WSL 版本旧 | 升级 Win11，或 `wsl --update` |
| DNS 解析失败（能 ping IP 不能 ping 域名） | DNS 配置问题 | `.wslconfig` 加 `dnsTunneling=true`，或改 `/etc/resolv.conf` |
| 改了 `.wslconfig` 不生效 | 没重启 WSL | `wsl --shutdown` 后重进 |
| 时间与 Windows 不一致 | 休眠后时钟漂移 | Linux 里 `sudo hwclock -s`，或重开 WSL |
| 端口转发不生效 | 防火墙拦截 | 检查 Windows 防火墙入站规则 |

**终极修复手段（不丢数据）：**

```powershell
wsl --export Ubuntu D:\backup\Ubuntu.tar     # ① 先备份
wsl --unregister Ubuntu                      # ② 卸载坏掉的发行版
wsl --import Ubuntu D:\WSL D:\backup\Ubuntu.tar --version 2   # ③ 重建
```

> **永远先备份**
> `unregister` 不可逆。任何"重装发行版"的操作，先 `export` 一份 tar。

---

## ⚠️ 17. 常见误区

| 误区 | 事实 |
| --- | --- |
| "WSL 就是个虚拟机" | 是轻量虚拟机 + 深度集成（文件/网络/图形/剪贴板），不是传统隔离虚拟机 |
| "WSL1 比 WSL2 快" | 只对跨盘文件 IO 成立；编译、Docker、整体兼容性 WSL2 完胜 |
| "WSL 里能直接插 U 盘" | 不能，要 usbipd 附加；要稳定 USB 用 VMware |
| "WSL 能编译加载内核模块" | 不能 `insmod` 自定义模块（定制内核无 headers）；用 VMware / QEMU |
| "装了 VMware 就不能用 WSL" | 新版可共存（都基于虚拟化平台），仅性能略有折损 |
| "WSL2 需要 Hyper-V" | 只需要「虚拟机平台」组件，**不需要勾选 Hyper-V** |
| "家庭版不能装 WSL" | Win10/11 家庭版完全支持 WSL2（前提是 BIOS 虚拟化已开） |
| "代码放 Windows 盘编译没问题" | 跨盘编译大型工程慢 5~10 倍，代码要放 Linux 侧 |
| "改完 `.wslconfig` 立刻生效" | 必须 `wsl --shutdown` |
| "`wsl --unregister` 只是删除快捷方式" | 它会**删除全部数据**，不可恢复 |

---

## 📋 附录 A：命令速查表

### WSL 管理（PowerShell）

| 场景 | 命令 |
| --- | --- |
| 安装 Ubuntu | `wsl --install -d Ubuntu`（管理员） |
| 进入 Ubuntu | `wsl` 或开始菜单点 Ubuntu |
| 查看所有发行版 | `wsl -l -v` |
| 查看 WSL 版本 | `wsl --version` |
| 更新 WSL | `wsl --update`（管理员） |
| 设为 WSL2 | `wsl --set-default-version 2` |
| 关闭 WSL 释放资源 | `wsl --shutdown` |
| 关闭单个发行版 | `wsl --terminate Ubuntu` |
| 重置密码 | `wsl -d Ubuntu -u root` → `passwd 用户名` |
| 备份发行版 | `wsl --export Ubuntu D:\backup\ubuntu.tar` |
| 恢复发行版 | `wsl --import Ubuntu D:\WSL D:\backup\ubuntu.tar --version 2` |
| 删除发行版 | `wsl --unregister Ubuntu`（不可恢复） |
| 磁盘稀疏化 | `wsl --manage Ubuntu --set-sparse true` |

### Ubuntu 内常用

| 场景 | 命令 |
| --- | --- |
| 查看内核 | `uname -a`（含 microsoft-standard 即 WSL2） |
| 查看版本 | `lsb_release -a` |
| 查看 IP | `ip addr` |
| 进入 Windows 目录 | `cd /mnt/d/...` |
| 查看 USB 设备 | `lsusb` / `ls /dev/ttyUSB*` |
| 服务管理（需 systemd） | `systemctl status smbd` |
| 图形程序 | 直接运行，如 `gedit`、`code .` |

### usbipd（管理员 PowerShell）

```powershell
usbipd list                     # 列出设备与 BUSID
usbipd bind --busid 2-4         # 绑定（只需一次）
usbipd attach --wsl --busid 2-4 # 附加到 WSL（每次插拔后）
usbipd detach --busid 2-4       # 释放
```

---

## 🔗 附录 B：参考来源

- [Microsoft Learn · WSL 文档](https://learn.microsoft.com/zh-cn/windows/wsl/)
- [Microsoft Learn · WSL 高级设置（.wslconfig / wsl.conf）](https://learn.microsoft.com/zh-cn/windows/wsl/wsl-config)
- [Microsoft Learn · 连接 USB 设备（usbipd-win）](https://learn.microsoft.com/zh-cn/windows/wsl/connect-usb)
- [usbipd-win 项目主页](https://github.com/dorssel/usbipd-win)
- [Ubuntu 官方下载](https://ubuntu.com/download/desktop)
- [VMware Workstation 官方文档](https://techdocs.broadcom.com/)

---

## 📎 附录 C：原教程（附件）

图文来源是同库附件里的两份单页教程，浏览器打开即可阅读：

- [`../assets/WSL2/WSL2与Ubuntu完全使用指南.html`](WSL2与Ubuntu完全使用指南.html) —— 安装、配置、迁移主线
- [`../assets/WSL2/VMware与WSL2深度对比与扩展知识.html`](VMware与WSL2深度对比与扩展知识.html) —— 14 维对比、扩展知识与选型

- 位置：`DevVault/assets/WSL2/`
- 关系：本文按"概念 → 准备 → 安装 → 使用 → 迁移 → 对比"重排并补充了大量表格与排错细节，可对照原文看配图

## 相关笔记

- [Ubuntu共享文件夹配置详解](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/ubuntu共享文件夹配置详解/) —— 虚拟机装好 Ubuntu 之后，如何让 Windows / 手机访问它的目录
- Linux系统总览 —— Linux 命令与系统基础
- [Keil构建全链路详解（AC5-AC6）](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/keil构建全链路详解_ac5-ac6/) —— 编译链路的底层原理
