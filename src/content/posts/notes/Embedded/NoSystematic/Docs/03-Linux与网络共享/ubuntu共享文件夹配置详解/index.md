---
title: "Ubuntu共享文件夹配置详解"
published: 2026-11-18
description: "Ubuntu 共享文件夹配置详解 把 Windows、macOS、手机接进 Ubuntu 的共享目录：三种方案，同一套「装包 → 建目录 → 改配置 → 重启放"
tags: ["嵌入式/系统", "开发环境/Ubuntu", "开发环境/网络共享", "开发环境/VMware"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/03-Linux与网络共享"
draft: false
order: 75
---

# Ubuntu 共享文件夹配置详解

> *把 Windows、macOS、手机接进 Ubuntu 的共享目录：三种方案，同一套「装包 → 建目录 → 改配置 → 重启放行」流程。*

> **本文定位**
> 本文依据 `assets/Ubuntu共享文件夹/Ubuntu共享文件夹图解教程.html` 整理、扩写而成，把网页中的图解、步骤与提示，展开成一份可以离线阅读、可以照着敲命令的完整文字文档。
>
> 适用系统：**Ubuntu 22.04 LTS / 24.04 LTS**（其它 Debian 系发行版基本通用）
> 适用场景：Windows 宿主机 + VMware 虚拟机、局域网多设备互传、Linux 服务器之间的数据共享

> **一页纸速览**
> | 关心的事 | 结论 |
> | --- | --- |
> | 只和本机 Windows 传文件 | VMware 共享文件夹（第 6 章），不碰网络、不设密码 |
> | 局域网里多台设备（含手机） | Samba（第 3 章），账号密码 + 跨平台 |
> | 两台 Linux 之间同步数据 | NFS（第 5 章），内核原生、性能最好 |
> | 连不上 / 不能写 / 乱码 | 第 4 章「五层排查」，按 网络 → 服务 → 防火墙 → 认证 → 权限 查 |
> | 必须记住的端口 | SMB `445`（+139/137/138）、NFS `2049`（+111） |
> | 最小放行命令 | `sudo ufw allow samba` |

**全文地图**

```text
第一部分 · 想清楚              第二部分 · 动手做                第三部分 · 收尾
1 原理 → 2 对比                3 Samba 六步 → 4 排错           7 怎么选
                               5 NFS 四步 → 6 VMware 三步
```

---

## 目录

- #🧭 0. 阅读指南
- #🔍 1. 原理：共享文件夹到底是什么
- #⚖️ 2. 三种方案对比与选型
- #🟠 3. 方案一：Samba 完整配置（重点）
- #🚑 4. Samba 排错手册
- #🟦 5. 方案二：NFS（Linux 之间高性能共享）
- #🧱 6. 方案三：VMware 共享文件夹（宿主机 ↔ 虚拟机直通）
- #🎯 7. 到底选哪个
- #📋 附录 A：命令速查表
- #🔌 附录 B：端口与协议清单
- #📄 附录 C：配置文件模板
- #✅ 附录 D：上线前检查清单
- #🔗 附录 E：参考来源
- #📎 附录 F：原教程（附件）
- #相关笔记

---

## 🧭 0. 阅读指南

很多人卡住的不是"命令不会敲"，而是**一开始就选错了方案**：明明只要 Windows 宿主机和 VMware 里的 Ubuntu 互传文件，却花了半天配 Samba 和防火墙；或者需要在手机上访问，却用了只有 Linux 才认的 NFS。

所以本文的组织顺序是：

1. **先看懂原理**（第 1 章）—— 知道数据是怎么从客户端走到 Ubuntu 目录的；
2. **再做选型**（第 2 章）—— 用一张对比表锁定方案；
3. **最后照着做**（第 3、5、6 章）—— 每个方案都是"装包 → 建目录 → 改配置 → 设账号 → 重启放行 → 客户端验证"的固定套路。

如果你时间紧，可以直接跳到第 7 章看结论，再回来对照对应章节操作。

| 你想做的事 | 直接看 |
| --- | --- |
| Windows 和 VMware 里的 Ubuntu 互传文件 | [第 6 章 Vmware 共享文件夹](#6-方案三vmware-共享文件夹宿主机--虚拟机直通) |
| 手机 / 同事的电脑也要访问 | [第 3 章 Samba](#3-方案一samba-完整配置重点) |
| 两台 Linux 服务器之间同步大数据 | [第 5 章 NFS](#5-方案二nfslinux-之间高性能共享) |
| 能连上但打不开 / 不能写 / 乱码 | [第 4 章 排错](#4-samba-排错手册) |

---

## 🔍 1. 原理：共享文件夹到底是什么

### 1.1 一句话定义

**"共享文件夹" = 把 Ubuntu 上的某个目录，通过一种网络协议开放出去，让其它设备像访问本地磁盘一样访问它。**

这里面有三个必不可少的角色：

| 角色 | 在本教程中是谁 | 职责 |
| --- | --- | --- |
| **服务端** | 运行 Samba / NFS 的那台 Ubuntu | 提供目录、校验身份、执行读写 |
| **共享目录** | 例如 `/srv/share`、`/srv/nfsshare` | 真正存文件的地方，是客户端的"统一入口" |
| **客户端** | Windows、macOS、手机、其它 Linux | 通过网络挂载并访问该目录 |

**关键认知**：共享出去的并不是"文件"，而是**一个目录 + 一套访问规则**。规则里决定了两件核心的事 ——

- **谁能进**：账号密码（Samba）或 IP 白名单（NFS）；
- **能干什么**：只读，还是可读写。

### 1.2 三种方案在协议层面有什么区别

```
┌──────────────────────────────────────────────────────────────┐
│  客户端侧                     传输层              服务端侧      │
├──────────────────────────────────────────────────────────────┤
│  Windows 资源管理器                                              │
│  macOS 访达                 ── SMB/CIFS ──┐                    │
│  Android/iOS 文件 App                      │                    │
│                                            ├─→ smbd ─→ /srv/share
│  另一台 Ubuntu（mount -t cifs）            │                    │
├────────────────────────────────────────────┼───────────────────┤
│  另一台 Linux（mount -t nfs） ── NFS ──────┤→ nfsd ─→ /srv/nfsshare
├────────────────────────────────────────────┼───────────────────┤
│  本机 Ubuntu（vmhgfs-fuse） ── HGFS ───────┴→ 宿主机的物理文件夹  │
│  （不经网卡，走 VMware 虚拟通道）                                 │
└──────────────────────────────────────────────────────────────┘
```

- **SMB/CIFS**：Windows 的原生共享协议，Linux 上由 Samba 实现。所以它对 Windows 最"母语"，macOS 和手机也普遍支持。
- **NFS**：Linux/Unix 的"亲儿子"协议，内核原生支持，没有 SMB 那层协议转换，性能更好，但基本只在 Linux 圈子内好用。
- **HGFS**：VMware 的宿主机-虚拟机共享文件系统，走的是虚拟机管理通道，**不经过网络、不需要 IP、不需要密码**，只对"这一台宿主机的这一台虚拟机"有效。

### 1.3 局域网拓扑

```
   ┌────────────┐   ┌──────────────────┐   ┌──────────────┐
   │ Windows 电脑│   │ macOS / 手机      │   │ 其它 Linux 服务器│
   │ 资源管理器   │   │ 访达 / 文件 App    │   │ mount 挂载     │
   └─────┬──────┘   └────────┬─────────┘   └──────┬───────┘
         │                   │                    │
         │   SMB / 445        │  SMB / 445          │  NFS / 2049
         ▼                   ▼                    ▼
   ┌────────────────────────────────────────────────────────┐
   │            交换机 / 路由器  ·  局域网 192.168.x.x         │
   └────────────────────────┬───────────────────────────────┘
                            ▼
                  ┌────────────────────┐
                  │   Ubuntu 服务器     │
                  │  smbd / nfsd 运行中 │
                  │  共享目录 /srv/share│
                  └────────────────────┘

   访问凭证：Samba → 账号 + SMB 密码     NFS → 客户端 IP 白名单
```

> **前提**
> 所有设备必须**在同一网段**（例如都是 `192.168.1.x`）才能互相发现与访问。跨网段需要路由器配置静态路由、端口映射，或者干脆用 VPN。

### 1.4 必须先弄清楚的：虚拟机网络模式

这一条在原文的排错部分出现过，但值得单独强调 —— **它决定了"别人能不能访问到你的 Ubuntu"**。

| VMware 网络模式 | 虚拟机的 IP 从哪来 | 宿主机能否访问 VM | 局域网其它电脑能否访问 VM |
| --- | --- | --- | --- |
| **NAT**（默认） | VMware 虚拟 DHCP（如 `192.168.109.x`） | ✅ 可以 | ❌ **不行**（VM 藏在宿主机后面） |
| **桥接（Bridged）** | 和宿主机同网段，由真实路由器分配 | ✅ 可以 | ✅ 可以 |
| **仅主机（Host-Only）** | VMware 虚拟网段 | ✅ 可以 | ❌ 不行 |

**结论**：

- 只给宿主机自己用 → NAT 就够了；
- 要让手机、同事的电脑访问 → **改成桥接模式**，让 Ubuntu 拿到和宿主机同网段的 IP。

### 1.5 三条命令先摸清自己的网络

```bash
hostname -I            # Ubuntu 的所有 IP（第一个通常是主 IP）
ip addr show           # 详细网卡 / IP / 掩码
ip route | head -3     # 默认网关
```

Windows 侧对应：

```bat
ipconfig
```

两边 IP 的**前三段相同**（例如 `192.168.1.x` 与 `192.168.1.y`），才说明在同一个网段。

---

## ⚖️ 2. 三种方案对比与选型

### 2.1 核心对比表

| 维度 | Samba (SMB) | NFS | VMware 共享文件夹 |
| --- | --- | --- | --- |
| **定位** | 局域网共享 | Linux 服务器间共享 | 宿主机 ↔ 虚拟机 |
| **适用场景** | 局域网内多设备互传、办公协作 | 服务器 / 集群 / NAS 间共享 | Windows 宿主机与 Ubuntu 虚拟机互传 |
| **可访问的客户端** | Windows / macOS / Linux / 手机 | 主要是 Linux（Windows 需额外组件） | 仅宿主机与这台虚拟机 |
| **传输性能** | 中上（TCP 445，跨平台够用） | **高**（内核原生协议，少一层转换） | 高（VM 直通，不经网卡） |
| **配置难度** | 中（装包 + 改一个配置文件） | 中（装包 + `/etc/exports`） | **低**（图形界面点几下 + 一条挂载命令） |
| **安全 / 权限** | **强**：账号 + 密码，可细化到用户 | 中：按 IP 白名单 + `root_squash` | 中：依赖虚拟机隔离，无密码 |
| **依赖** | 无额外依赖 | 客户端需 `nfs-common` | 需 `open-vm-tools` + VM 内网络无关 |
| **推荐指数** | ★★★★★（跨平台首选） | ★★★☆☆（Linux 环境首选） | ★★★★☆（本机传文件最方便） |

### 2.2 能力评分（数值化，便于横向比较）

原文用雷达图展示，这里把分值列成表（5 分最优）：

| 维度 | Samba | NFS | VMware 共享 |
| --- | --- | --- | --- |
| 配置简单度 | 3.0 | 2.5 | **4.5** |
| 跨平台性 | **5.0** | 2.5 | 1.5 |
| 传输性能 | 3.5 | **4.5** | 4.0 |
| 权限安全 | **4.5** | 3.0 | 3.0 |
| 直通便捷 | 1.5 | 2.0 | **5.0** |

> 评分为示意性打分，用来快速建立直觉：**Samba 赢在兼容与权限，NFS 赢在性能，VMware 赢在省事**。

### 2.3 一句话选型

- **只跟自己的 Windows 传文件** → VMware 共享文件夹。
- **要让手机、别人的电脑也能访问** → Samba。
- **两台 Linux 服务器之间跑数据** → NFS。
- **成年人不做选择** → VMware 共享 + Samba 可以同时开，互不冲突。

---

## 🟠 3. 方案一：Samba 完整配置（重点）

Samba 是 Linux 上实现 Windows 文件共享协议（SMB/CIFS）的服务。装好之后，Windows 资源管理器、macOS 访达、手机文件 App 都能直接访问。**下面 6 步照着做即可。**

### 3.0 先认识三个守护进程

| 进程 | 作用 | 端口 |
| --- | --- | --- |
| `smbd` | 文件与打印共享的核心，负责认证和数据传输 | TCP 445（现代）、TCP 139（旧） |
| `nmbd` | NetBIOS 名称服务，让"网络邻居"里能看到主机名 | UDP 137、138 |
| `winbind` | 接入 AD 域时才需要（本教程场景不需要） | — |

日常只需要 `smbd`。`nmbd` 一般随 samba 套件一起装上并默认运行。

---

### 第 1 步：安装 Samba

打开终端，更新软件源并安装。安装完成后 `smbd` 服务一般会自动启动。

```bash
sudo apt update
sudo apt install samba -y
```

**验证安装是否成功：**

```bash
samba --version                 # 能输出版本号即安装成功
systemctl status smbd           # 看是否 active (running)
```

预期输出类似：

```
● smbd.service - Samba SMB Daemon
     Loaded: loaded (/lib/systemd/system/smbd.service; enabled; ...)
     Active: active (running) since ...
```

> **提示**
> 如果 `samba --version` 报"找不到命令"，说明包没装上，先看 `apt` 的报错（常见原因：软件源没更新、网络不通、磁盘满）。

---

### 第 2 步：创建共享目录

建一个目录作为共享根（本教程统一用 `/srv/share`），并给它合适的权限，Samba 用户才有权限写入。

```bash
sudo mkdir -p /srv/share
sudo chmod 775 /srv/share
```

**权限数字怎么看：**

```
chmod 775  →  rwx rwx r-x
              │   │   └── 其他用户：读 + 进目录（不能写）
              │   └────── 同组用户：读 + 写 + 进目录
              └────────── 属主：读 + 写 + 进目录
```

| 权限 | 含义 | 适用 |
| --- | --- | --- |
| `775` | 属主/同组可读写，其他人只读 | **推荐**，团队共享 |
| `777` | 所有人可写 | 个人环境图省事，**安全性低** |
| `755` | 属主可写，其他人只读 | 只读资料库 |

**如果想让某个用户完全拥有这个目录**（推荐做法，避免后续写入权限扯皮）：

```bash
sudo chown -R alice:alice /srv/share
```

> **不想新建目录？** 可以直接共享家目录下的文件夹，例如配置里写 `path = /home/alice/Shared`。注意：家目录本身的权限通常是 `750`，其它用户进不去，所以要么把共享目录放进家目录并单独授权，要么直接用 `/srv` 这种系统级目录，**后者更省心**。

---

### 第 3 步：编辑 `/etc/samba/smb.conf`

**先备份，再在文件末尾追加一个共享段。**

```bash
sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.backup
sudo nano /etc/samba/smb.conf
```

在文件**最末尾**追加：

```ini
[myshare]
    path = /srv/share
    browseable = yes
    writable = yes
    valid users = alice
    create mask = 0644
    directory mask = 0755
```

**每个字段的含义：**

| 字段 | 值 | 说明 |
| --- | --- | --- |
| `[myshare]` | 共享名 | 客户端访问时用它，例如 `\\192.168.1.100\myshare`。**名字随便起，不要带空格更稳妥** |
| `path` | `/srv/share` | 服务器上真实目录的**绝对路径**，必须存在 |
| `browseable` | `yes` | 是否在网络邻居 / 列表中对所有人可见。`no` = 隐藏（知道名字仍能直接访问） |
| `writable` | `yes` | 是否允许客户端写入。`no` = 只读共享 |
| `valid users` | `alice` | 只允许这些系统用户访问（可写多个，空格分隔） |
| `create mask` | `0644` | 客户端新建**文件**的默认权限 |
| `directory mask` | `0755` | 客户端新建**文件夹**的默认权限 |

**改完必须检查语法：**

```bash
testparm
```

`testparm` 会逐行检查配置，有错误会直接提示行号。最后看到 `Loaded services file OK.` 就说明语法没问题。

> **新手最容易犯的错**
> 把共享段写到了 `[global]` 段内部。`[global]` 段在第一个方括号 `[` 出现的地方结束，之后的 `[myshare]` 才是独立的共享段 —— 只要追加在**文件末尾**基本不会出错。

**可选：让共享更安全/更好用**

```ini
[myshare]
    path = /srv/share
    browseable = yes
    writable = yes
    valid users = @smbusers        # 用 @组名 授权给一个组
    force group = smbusers         # 新建文件统一归属该组，方便多人协作
    comment = 团队共享盘            # 客户端显示的备注
```

---

### 第 4 步：设置 Samba 用户密码

**Samba 有自己的密码库，和系统登录密码相互独立。**

前提：**`alice` 必须是 Ubuntu 里已经存在的系统用户**。如果还没有：

```bash
sudo adduser alice          # 创建系统用户（会提示设置登录密码）
```

然后单独设置 SMB 密码：

```bash
sudo smbpasswd -a alice
```

交互过程：

```
New SMB password: ********
Retype new SMB password: ********
Added user alice.
```

**Samba 用户管理命令：**

| 目的 | 命令 |
| --- | --- |
| 新增 / 修改 SMB 密码 | `sudo smbpasswd -a alice` |
| 启用账号（被禁用后） | `sudo smbpasswd -e alice` |
| 禁用账号 | `sudo smbpasswd -d alice` |
| 删除 SMB 账号 | `sudo smbpasswd -x alice` |
| 列出所有 SMB 用户 | `sudo pdbedit -L` |

> **重点区分**
> `alice` 的系统密码用于 `su` / 登录桌面；`smbpasswd` 设置的密码只用于 SMB 连接。**两者不同步，改了系统密码不会自动改 SMB 密码。**
>
> 新增共享用户后如果连接不生效，执行 `sudo smbpasswd -e alice` 确保账号处于**启用**状态（`pdbedit -L` 输出里带 `[U]` 表示启用）。

---

### 第 5 步：重启服务 + 放行防火墙

重启 `smbd` 让配置生效，并设置开机自启。若启用了 UFW 防火墙，必须放行 Samba 的 139 / 445 端口。

```bash
sudo systemctl restart smbd
sudo systemctl enable smbd
sudo ufw allow samba
```

预期输出：

```
Rule added
Rule added (v6)
```

> `ufw allow samba` 会一次性放行 Samba 所需的端口（137/138/139/445），比手动一条条 `allow 445/tcp` 更省事。

**确认规则已生效：**

```bash
sudo ufw status verbose
```

应当能看到 `Samba` 一行，以及 `139/tcp`、`445/tcp`。

**如果没装 UFW（或已禁用）：**

```bash
sudo ufw status            # 输出 "Status: inactive" 表示未启用防火墙，无需放行
```

> **注意**
> `ufw disable` 的机器没有防火墙拦截问题；但**云服务器**往往还有一层安全组/云防火墙，需要在控制台单独放行 445 端口（很多时候云厂商默认封禁 445，这是"本地能通、外网不通"的最常见原因）。

---

### 第 6 步：从客户端访问并验证

先查 Ubuntu 的 IP 地址：

```bash
hostname -I
# 192.168.1.100
```

#### Windows

按 `Win + R`，输入：

```
\\192.168.1.100\myshare
```

或者在资源管理器地址栏直接粘贴同一路径。弹出登录框后，输入用户名 `alice` 和第 4 步设置的 **SMB 密码**。

**长期使用：映射网络驱动器**

> 此电脑 → 右键 → **映射网络驱动器** → 文件夹填 `\\192.168.1.100\myshare` → 勾选 **"登录时重新连接"** → 勾选"使用其他凭据连接"并输入账号密码。

**命令行方式（适合脚本化）：**

```bat
net use Z: \\192.168.1.100\myshare /user:alice
net use * /delete          :: 清除已保存的连接（凭据过期时很有用）
```

#### macOS

- 访达 → 菜单栏 **前往 → 连接服务器**（`⌘K`）
- 输入：`smb://192.168.1.100/myshare`
- 选择"注册用户"，填 `alice` + SMB 密码

#### 手机（Android / iOS）

- **iOS**：文件 App → 右上角 `···` → **连接服务器** → `smb://192.168.1.100`
- **Android**：系统文件管理器的"网络存储 / 远程存储"，或安装 Solid Explorer / ES 文件浏览器，添加 SMB 连接

#### 另一台 Linux

```bash
sudo apt install cifs-utils -y
sudo mkdir -p /mnt/myshare
sudo mount -t cifs //192.168.1.100/myshare /mnt/myshare -o username=alice,uid=$(id -u),gid=$(id -g)
```

写进 `/etc/fstab` 实现开机自动挂载（密码明文有风险，生产环境建议用凭据文件）：

```
//192.168.1.100/myshare  /mnt/myshare  cifs  username=alice,password=你的密码,uid=1000,gid=1000,_netdev  0  0
```

#### 验证是否成功

在 Windows 里拖一个文件进共享目录，回到 Ubuntu 终端执行：

```bash
ls -l /srv/share
```

能看到刚拖进去的文件 —— **双向读写都通了，配置完成**。

---

### 3.3 变体：匿名免密访问（临时传文件）

如果只是想在信任的局域网里临时丢文件，不想每次输密码：

**做法 A：给某个共享单独开匿名**

```ini
[myshare]
    path = /srv/share
    browseable = yes
    writable = yes
    guest ok = yes
    create mask = 0666
    directory mask = 0777
```

并在文件顶部的 `[global]` 段中加入：

```ini
[global]
    map to guest = bad user
```

**做法 B：设置 `security = user` 但允许访客写入（更常见）**

只要配置了 `guest ok = yes` 且 `[global]` 里有 `map to guest = bad user`，客户端不输密码就会以 `nobody` 身份进入。

> **强烈不建议长期开启**
> 任何设备无需密码即可读写。若要匿名但只读，把 `writable` 改成 `no`，并确认目录权限是 `755`。

---

### 3.4 进阶配置（按需取用）

**1）多个共享目录**

```ini
[myshare]
    path = /srv/share
    writable = yes
    valid users = alice

[public]
    path = /srv/public
    writable = no
    guest ok = yes
    browseable = yes
```

**2）只读共享**

```ini
    writable = no
    read only = yes
    guest ok = yes
```

**3）开启回收站（删除的文件进 `.recycle`，误删可救）**

```ini
    recycle:repository = .recycle
    recycle:keeptree = yes
    recycle:versions = yes
    vfs objects = recycle
```

**4）兼容老设备（SMB1）**

现代 Samba 默认支持 SMB2/3，Windows 10/11 无需开启 SMB1。**只有在连接很老的扫描仪、老 NAS、老电视盒子时**，才需要：

```ini
[global]
    server min protocol = NT1
```

> **注意**
> ⚠️ SMB1 有已知安全漏洞（WannaCry 就是利用它），仅在隔离网络、且确实必要时开启。

**5）限制访问网段（双保险）**

```ini
    hosts allow = 192.168.1. 127.
    hosts deny = 0.0.0.0/0
```

**6）日志与排错**

```ini
[global]
    log file = /var/log/samba/log.%m
    log level = 1
```

---

### 3.5 日常运维命令

```bash
systemctl status smbd          # 服务状态
systemctl restart smbd         # 改配置后重启
testparm                       # 语法检查（改配置后必做）
smbstatus                      # 当前连接与打开的文件
sudo pdbedit -L                # 列出 SMB 用户
smbclient -L localhost -U alice   # 本地列举共享，验证服务端
sudo journalctl -u smbd -n 50  # 最近日志
```

---

## 🚑 4. Samba 排错手册

### 4.1 按层排查（万能顺序）

共享连不上，99% 出在下面五层中的某一层。**从下往上查，不要跳步**：

```
① 网络层   两台机器同网段吗？ping 得通吗？
② 服务层   smbd 在跑吗？端口在监听吗？
③ 防火墙   ufw / 云安全组放行 445 了吗？
④ 认证层   系统用户存在吗？SMB 密码设了吗？账号启用了吗？
⑤ 权限层   目录权限、writable、owner/group 对得上吗？
```

**逐层验证命令：**

```bash
# ① 网络
ping -c 3 192.168.1.100
hostname -I

# ② 服务
systemctl status smbd
ss -tlnp | grep -E '139|445'      # 应看到 smbd 在监听

# ③ 防火墙
sudo ufw status verbose

# ④ 认证
sudo pdbedit -L                    # 用户是否在列表里
sudo smbpasswd -e alice            # 确保启用

# ⑤ 权限
ls -ld /srv/share                  # 看 owner / mode
testparm --suppress-prompt /etc/samba/smb.conf
```

### 4.2 六个高频问题

#### Q1：提示"找不到网络路径 / 无法访问"

按顺序检查：

1. 两台设备是否在同一网段 —— Windows 上 `ipconfig`，Ubuntu 上 `hostname -I`，**前三段应相同**；
2. 能否 `ping 192.168.1.100` 通；
3. 防火墙是否放行：`sudo ufw allow samba`；
4. IP 是否写对（`hostname -I` 有多个 IP 时，选和客户端同网段的那个）。

> **VMware 特有坑**
> 虚拟机默认是 **NAT** 网络，宿主机一般能访问，但**局域网其它电脑访问不到虚拟机** —— 需要把虚拟机网络改成**桥接模式**（见 1.4 节）。

#### Q2：一直提示"用户名或密码错误"

- **Samba 密码 ≠ 系统登录密码**。重新执行 `sudo smbpasswd -a alice` 设置；
- 确认 `valid users = alice` 里的用户名与登录名**完全一致（区分大小写）**；
- Windows 若保存了旧凭据，进 **控制面板 → 凭据管理器 → Windows 凭据**，删掉 `192.168.1.100` 的条目后重试；
- 命令行清缓存：`net use * /delete /y`。

#### Q3：能进共享目录，但无法写入 / 新建文件

**两层权限都要够**：

1. **配置层**：`writable = yes`；
2. **文件系统层**：目录对 Samba 用户可写。

```bash
sudo chmod 775 /srv/share
sudo chown -R alice:alice /srv/share     # 属主改成 alice
sudo systemctl restart smbd
```

如果多人协作，建议建组并统一归属：

```bash
sudo groupadd smbusers
sudo usermod -aG smbusers alice
sudo usermod -aG smbusers bob
sudo chgrp -R smbusers /srv/share
sudo chmod 2775 /srv/share               # 2 = SGID，新建文件自动继承组
```

配置里再用 `valid users = @smbusers`、`force group = smbusers`。

#### Q4：中文文件名显示乱码

现代 Ubuntu（22.04+）默认 UTF-8，与新版 Windows 客户端一般没问题。若仍乱码，在 `[global]` 段检查：

```ini
unix charset = UTF-8
dos charset = CP936
display charset = UTF-8
```

保存后 `sudo systemctl restart smbd`。**更省事的做法：客户端统一用 UTF-8 命名文件。**

#### Q5：重启 Ubuntu 后共享失效

- 确认 smbd 开机自启：`sudo systemctl enable smbd`；
- 检查服务状态：`sudo systemctl status smbd`；
- 服务正常但连不上 → 多半是防火墙规则没持久化，`sudo ufw status` 里确认 139/445 还在（`ufw allow samba` 会写持久规则，若被清空需重新添加）。

#### Q6：smbd 服务启动失败 / 配置文件写错

```bash
sudo testparm                                  # 逐行检查并指出错误行号
sudo journalctl -u smbd -n 30                  # 看具体报错
```

改坏了就恢复备份：

```bash
sudo cp /etc/samba/smb.conf.backup /etc/samba/smb.conf
sudo systemctl restart smbd
```

### 4.3 Windows 侧错误码对照

| 错误提示 | 常见原因 | 处理 |
| --- | --- | --- |
| 0x80070035 找不到网络路径 | IP 不对 / 445 被拦 / 不在同网段 | 走 4.1 五层排查 |
| 0x80070005 拒绝访问 | 账号无权限 / `valid users` 不含该用户 | 检查 `valid users` 与目录权限 |
| 0x8007052E 用户名或密码不正确 | SMB 密码错 / 旧凭据缓存 | `smbpasswd -a` 重设 + 清凭据 |
| 0x80004005 未指定的错误 | 协议不兼容 / 共享名错 | 临时加 `server min protocol = NT1` 验证 |
| 能列出共享但点进去报错 | `[myshare]` 段写错 / path 不存在 | `testparm` + `ls -ld /srv/share` |

---

## 🟦 5. 方案二：NFS（Linux 之间高性能共享）

NFS 是 Linux/Unix 的"亲儿子"协议，不走 SMB 那层转换，服务器集群之间共享文件性能最好。客户端用一条 `mount` 命令把远端目录挂到本地。

### 5.1 服务端四步

**第 1 步：安装并准备目录**

```bash
sudo apt install nfs-kernel-server -y
sudo mkdir -p /srv/nfsshare
sudo chmod 775 /srv/nfsshare
```

**第 2 步：编辑 `/etc/exports` 定义开放规则**

一行 = 一个共享：`目录 + 允许的客户端网段 + 权限选项`。保存后立即生效。

```bash
sudo nano /etc/exports
```

追加一行：

```ini
/srv/nfsshare 192.168.1.0/24(rw,sync,no_subtree_check)
```

**选项含义：**

| 选项 | 作用 |
| --- | --- |
| `rw` | 可读写（`ro` 为只读） |
| `sync` | 同步写入，数据更稳（`async` 更快但有丢数据风险） |
| `no_subtree_check` | 不检查子目录，提升性能、减少 inode 变更报错 |
| `root_squash` | **默认**：客户端 root 被映射为 `nobody`，防越权 |
| `no_root_squash` | 客户端 root 保留 root 权限，**慎用** |
| `all_squash` | 所有用户都映射为 `nobody`，配合匿名读写 |
| `*` | 允许任意客户端（仅限完全信任的网络） |

**第 3 步：导出并重启服务**

```bash
sudo exportfs -ra
sudo systemctl restart nfs-kernel-server
sudo ufw allow from 192.168.1.0/24 to any port nfs
```

> 要只放行给特定网段，上面的 `ufw allow from ...` 就是正确写法，**不要**直接 `ufw allow 2049` 对全网开放。

**第 4 步：验证导出**

```bash
sudo exportfs -v          # 列出当前导出及其选项
showmount -e localhost    # 列出本机对外共享的目录
```

### 5.2 客户端挂载

在**另一台 Linux** 上：

```bash
sudo apt install nfs-common -y
sudo mkdir -p /mnt/nfsshare
sudo mount -t nfs 192.168.1.100:/srv/nfsshare /mnt/nfsshare
```

**开机自动挂载** —— `/etc/fstab` 追加：

```
192.168.1.100:/srv/nfsshare  /mnt/nfsshare  nfs  defaults,_netdev  0  0
```

> `_netdev` 表示等网络就绪后再挂载，避免开机卡住。

**验证：**

```bash
df -h | grep nfsshare       # 应看到远端目录已挂载
touch /mnt/nfsshare/test    # 客户端能写入
ls /srv/nfsshare            # 服务端能看到 test 文件
```

### 5.3 注意事项

> **注意**
> ⚠️ Windows 也能访问 NFS，但需要开启系统可选功能"NFS 客户端"，且配置繁琐、体验一般。**跨平台场景请直接用 Samba**，NFS 留给 Linux 之间。

- NFS **没有账号密码**，安全边界就是 IP 白名单 + `root_squash`，**不要直接暴露到公网**；
- 客户端 UID/GID 与服务端要尽量一致（都从 1000 开始），否则会出现"能读不能写"的权限怪象；
- 内网建议固定服务端 IP（或在路由器上做 DHCP 静态绑定），否则 fstab 里的 IP 一变就挂不上。

---

## 🧱 6. 方案三：VMware 共享文件夹（宿主机 ↔ 虚拟机直通）

如果你像现在这样：**Windows 宿主机 + VMware 里的 Ubuntu 虚拟机**，那这是最快、最不用折腾网络的方案 —— 不依赖 IP、不设密码，宿主机上选个文件夹，虚拟机里挂载一下就通。

### 6.1 前提条件

| 条件 | 说明 |
| --- | --- |
| VMware Workstation Pro / Player | 两个版本都支持（Fusion 在 macOS 上同理） |
| `open-vm-tools` | Ubuntu 一般已内置；没有就装（见下） |
| 共享文件夹已在 VM 设置中启用 | 关键步骤 |
| 有权限在 `/mnt` 下建目录 | 用 `sudo` |

```bash
sudo apt update
sudo apt install open-vm-tools open-vm-tools-desktop -y
```

> `open-vm-tools-desktop` 额外提供拖拽、自适应分辨率、剪贴板共享，桌面版建议一起装。

### 6.2 第 1 步：在 VMware 里启用共享文件夹

虚拟机需处于**关机或暂停**状态（Workstation Pro / Player 均可）：

> **虚拟机 → 设置 → 选项 → 共享文件夹 → 添加**
> 选择宿主机上的一个目录（例如 `D:\Share`）
> 勾选 **"启用此共享"**（必要时勾选"只读"）
> 确定后**重启虚拟机**生效

菜单路径速记：

```
虚拟机 → 设置 → 选项 → 共享文件夹
```

> **说明**
> VMware 在虚拟机开机时也允许修改该设置，界面会提示"需要重新启用后生效"。稳妥做法是关机后配置，避免"设置了但看不到"。

**确认共享已被虚拟机识别：**

```bash
vmware-hgfsclient
```

该命令会列出所有对这台虚拟机生效的共享名。**如果它是空的，就别往下折腾了** —— 先回到 VMware 设置检查"启用"选项和 VMware Tools 状态。

### 6.3 第 2 步：在 Ubuntu 里挂载

共享内容会挂在虚拟机的 **HGFS** 虚拟文件系统上，用 `vmhgfs-fuse` 挂载到 `/mnt/hgfs`。

**挂载全部共享：**

```bash
sudo mkdir -p /mnt/hgfs
sudo vmhgfs-fuse .host:/ /mnt/hgfs -o allow_other,uid=1000,gid=1000
```

**只挂载某一个共享**（例如名为 `share` 的文件夹）：

```bash
sudo mkdir -p /mnt/hgfs/share
sudo vmhgfs-fuse .host:/share /mnt/hgfs/share -o allow_other,uid=1000,gid=1000,umask=022
```

**参数解释：**

| 参数 | 含义 |
| --- | --- |
| `.host:/` | HGFS 的"根"，即所有共享的父目录 |
| `.host:/share` | 指定单个共享 |
| `allow_other` | 允许非 root 用户访问挂载点（**必须**，否则只有 root 能进） |
| `uid=1000,gid=1000` | 把挂载内容的属主映射成当前用户（Ubuntu 第一个用户通常是 1000） |
| `umask=022` | 文件默认 644、目录 755，普通用户可读写 |

**确认自己的 UID：**

```bash
id -u          # 1000（不是 1000 就按实际值改）
id -g
```

**卸载：**

```bash
sudo umount /mnt/hgfs
```

### 6.4 第 3 步：开机自动挂载（可选）

在 `/etc/fstab` 末尾追加一行，重启后自动挂载全部共享：

```bash
sudo nano /etc/fstab
```

```ini
.host:/ /mnt/hgfs fuse.vmhgfs-fuse allow_other,uid=1000,gid=1000,umask=022 0 0
```

> **改完 fstab 务必验证**
> `sudo mount -a`，无报错再重启。fstab 写错会导致系统进入 emergency mode，修复方法是 `Ctrl+D` 后进 root 把该行注释掉。

**验证：**

```bash
ls /mnt/hgfs                     # 能看到宿主机共享目录里的文件
```

在宿主机上往该目录丢一个文件，虚拟机里立即可见 —— **双向实时同步，不需要重启、不需要密码**。

### 6.5 VMware 共享的常见问题

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| `vmhgfs-fuse: command not found` | open-vm-tools 没装 / 版本不含 fuse 组件 | `sudo apt install open-vm-tools open-vm-tools-desktop` |
| `vmware-hgfsclient` 无输出 | VM 设置里没启用共享 | 关机 → 设置 → 共享文件夹 → 勾选"启用此共享" |
| 普通用户访问 `/mnt/hgfs` 被拒 | 少了 `allow_other`，或挂载点权限 700 | 重新挂载并加 `allow_other`；`sudo chmod 755 /mnt/hgfs` |
| 能读不能写 | 共享被设为"只读" 或 `umask` 过严 | VM 设置里取消只读；`umask=022` |
| 文件时间戳不对 / 同步延迟 | HGFS 缓存 | 正常现象；重要数据落盘后 `sync` 一下 |
| 重启后 `/mnt/hgfs` 空了 | 未写 fstab | 见 6.4 |

---

## 🎯 7. 到底选哪个

没有唯一正确答案，按你的实际场景对号入座；**三种方案可以共存、互不冲突**。

### A. 只想 Windows 宿主机 ↔ Ubuntu 虚拟机互传文件

> **首选 VMware 共享文件夹**（第 6 章）。

点几下 + 一条挂载命令，不碰网络、不用密码，双向实时可见。适合日常开发时在宿主机放代码/资料、虚拟机里直接编译运行。

### B. 局域网内多台设备（含 Windows / 手机）都要访问

> **首选 Samba**（第 3 章）。

一套配置，Windows 资源管理器、macOS 访达、手机文件 App 全部通吃，还有账号密码保护。记得把虚拟机网络改成**桥接**，否则局域网里的其它设备访问不到。

### C. Linux 服务器 / 集群之间高性能共享

> **首选 NFS**（第 5 章）。

内核原生协议，性能最好，适合数据量大的服务器场景；跨平台访问仍是 Samba 的强项。

### 组合建议

> 日常开发用 **VMware 共享文件夹**最顺手；需要给同事或手机共享时再启用 **Samba**，两者互不影响。
>
> 如果 Ubuntu 是**物理机**（不是虚拟机），VMware 方案不适用，按客户端类型在 Samba / NFS 之间二选一即可。

### 三张表总结

| 你的身份 | 推荐方案 | 一句话理由 |
| --- | --- | --- |
| 学生 / 个人开发者，Windows + VMware | VMware 共享文件夹 | 不折腾网络，五分钟搞定 |
| 团队协作，多台电脑 + 手机 | Samba | 跨平台 + 账号密码 |
| 运维，多台 Linux 服务器 | NFS | 性能最好，内核原生 |
| 既要自己方便又要给别人 | VMware 共享 + Samba 并存 | 互不冲突 |

---

## 📋 附录 A：命令速查表

### Samba

```bash
# 安装
sudo apt update && sudo apt install samba -y

# 建目录
sudo mkdir -p /srv/share && sudo chmod 775 /srv/share

# 配置
sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.backup
sudo nano /etc/samba/smb.conf
testparm

# 账号
sudo adduser alice
sudo smbpasswd -a alice
sudo smbpasswd -e alice
sudo pdbedit -L

# 生效
sudo systemctl restart smbd
sudo systemctl enable smbd
sudo ufw allow samba

# 排查
systemctl status smbd
ss -tlnp | grep -E '139|445'
sudo journalctl -u smbd -n 50
smbstatus
smbclient -L localhost -U alice

# IP
hostname -I
```

### NFS

```bash
# 服务端
sudo apt install nfs-kernel-server -y
sudo mkdir -p /srv/nfsshare && sudo chmod 775 /srv/nfsshare
sudo nano /etc/exports
sudo exportfs -ra
sudo systemctl restart nfs-kernel-server
sudo ufw allow from 192.168.1.0/24 to any port nfs
sudo exportfs -v

# 客户端
sudo apt install nfs-common -y
sudo mkdir -p /mnt/nfsshare
sudo mount -t nfs 192.168.1.100:/srv/nfsshare /mnt/nfsshare
```

### VMware 共享

```bash
# 依赖
sudo apt install open-vm-tools open-vm-tools-desktop -y

# 查看共享
vmware-hgfsclient

# 挂载全部
sudo mkdir -p /mnt/hgfs
sudo vmhgfs-fuse .host:/ /mnt/hgfs -o allow_other,uid=1000,gid=1000

# 挂载单个
sudo vmhgfs-fuse .host:/share /mnt/hgfs/share -o allow_other,uid=1000,gid=1000,umask=022

# 卸载
sudo umount /mnt/hgfs
```

---

## 🔌 附录 B：端口与协议清单

| 服务 | 端口 | 协议 | 用途 |
| --- | --- | --- | --- |
| Samba | **445/tcp** | SMB over TCP | 现代 SMB 主要端口，**必须放行** |
| Samba | 139/tcp | NetBIOS Session | 旧版兼容 |
| Samba | 137/138/udp | NetBIOS Name/Datagram | 网络邻居名称解析 |
| NFS | **2049/tcp+udp** | NFS | 主服务端口 |
| NFS | 111/tcp+udp | rpcbind | RPC 端口映射 |
| NFS v3 | 动态端口 | mountd / statd | 需要时额外固定或放行 |
| VMware | 无 | HGFS | 不走网络，虚拟机内部通道 |

**放行命令汇总：**

```bash
sudo ufw allow samba                                         # Samba 全家桶
sudo ufw allow from 192.168.1.0/24 to any port nfs           # NFS（限定网段）
sudo ufw status numbered                                     # 查看带编号的规则
```

---

## 📄 附录 C：配置文件模板

### C.1 `/etc/samba/smb.conf` 末尾追加

```ini
# ===<mark> 团队共享（需要密码）</mark>===
[myshare]
    comment = Team Share
    path = /srv/share
    browseable = yes
    writable = yes
    valid users = @smbusers
    force group = smbusers
    create mask = 0664
    directory mask = 0775
    inherit permissions = yes
    vfs objects = recycle
    recycle:repository = .recycle
    recycle:keeptree = yes
    recycle:versions = yes

# ===<mark> 公开只读 </mark>===
[public]
    comment = Public Read-Only
    path = /srv/public
    browseable = yes
    writable = no
    guest ok = yes

# ===<mark> 匿名可写（临时传文件，局域网信任环境）</mark>===
[dropbox]
    comment = Temp Drop
    path = /srv/dropbox
    browseable = yes
    writable = yes
    guest ok = yes
    create mask = 0666
    directory mask = 0777
```

配套的目录与组准备（`inherit permissions = yes` 时要先把底层目录设为 SGID，新建文件才会自动继承属组）：

```bash
sudo groupadd -f smbusers
sudo usermod -aG smbusers alice
sudo mkdir -p /srv/share /srv/public /srv/dropbox
sudo chown -R alice:smbusers /srv/share
sudo chmod 2775 /srv/share
sudo chmod 755 /srv/public
sudo chmod 1777 /srv/dropbox      # 1 = sticky，防止互相删除对方文件
```

并在 `[global]` 段加：

```ini
[global]
    map to guest = bad user
    unix charset = UTF-8
```

### C.2 `/etc/exports`

```ini
# 目录                    允许网段            选项
/srv/nfsshare             192.168.1.0/24(rw,sync,no_subtree_check)
/srv/public               192.168.1.0/24(ro,sync,no_subtree_check)
```

### C.3 `/etc/fstab` 片段

```ini
# VMware 共享文件夹
.host:/ /mnt/hgfs fuse.vmhgfs-fuse allow_other,uid=1000,gid=1000,umask=022 0 0

# NFS 远端共享
192.168.1.100:/srv/nfsshare /mnt/nfsshare nfs defaults,_netdev 0 0
```

---

## ✅ 附录 D：上线前检查清单

**Samba**

- [ ] `samba --version` 有输出
- [ ] 共享目录存在，`ls -ld` 权限为 `775` 且属主正确
- [ ] `[myshare]` 段写在文件末尾，不在 `[global]` 内部
- [ ] `testparm` 显示 `Loaded services file OK.`
- [ ] `valid users` 里的用户在 `pdbedit -L` 列表内且已启用
- [ ] `systemctl status smbd` 为 `active (running)`
- [ ] `systemctl is-enabled smbd` 为 `enabled`
- [ ] `ss -tlnp | grep 445` 能看到 smbd
- [ ] `ufw status` 放行了 Samba（或云安全组放行 445）
- [ ] 客户端能读；**从客户端上传一个文件**，`ls` 能看到 → 写也通
- [ ] 重启 Ubuntu 后共享仍可用

**NFS**

- [ ] `exportfs -v` 能看到目标目录与网段
- [ ] `showmount -e localhost` 正常
- [ ] 客户端 `df -h` 能看到挂载点
- [ ] 客户端能写入，服务端能看到文件
- [ ] fstab 带 `_netdev`，重启后自动挂载

**VMware 共享**

- [ ] `open-vm-tools` 已安装且 `vmware-hgfsclient` 有输出
- [ ] VM 设置中"启用此共享"已勾选
- [ ] `/mnt/hgfs` 已挂载，普通用户可读写
- [ ] fstab 行已验证（`mount -a` 无报错）
- [ ] 宿主机放文件 → 虚拟机立即可见

---

## 🔗 附录 E：参考来源

- [Ubuntu 官方文档 · Set up Samba as a file server](https://documentation.ubuntu.com/server/how-to/samba/file-server/)
- [Ubuntu 官方教程 · Install and Configure Samba](https://www.ubuntu.com/tutorials/install-and-configure-samba)
- [VMware 官方文档 · Mounting Shared Folders in a Linux Guest](https://techdocs.broadcom.com/us/en/vmware-cis/desktop-hypervisors/workstation-pro/25H2/using-vmware-workstation-player-for-windows-17-0/setting-up-shared-folders-for-a-virtual-machine-win/mounting-shared-folders-in-a-linux-guest-win.html)
- [Ubuntu Manpage · exportfs / exports](https://manpages.ubuntu.com/manpages/focal/en/man8/exportfs.8.html)

---

## 📎 附录 F：原教程（附件）

图文来源是同库附件里的单页教程 [`Ubuntu共享文件夹图解教程.html`](Ubuntu共享文件夹图解教程.html) —— 含拓扑图、雷达图、可复制命令块与折叠 FAQ，浏览器打开即可阅读（ECharts CDN 不可达时自动降级为静态条形图）。

- 位置：`DevVault/assets/Ubuntu共享文件夹/`
- 关系：本文即由该页面的图解与步骤扩写而来，可对照浏览

---

> **文档说明**
> 本文命令基于 Ubuntu 22.04 / 24.04 验证；不同版本的服务名、默认配置略有差异（老版本可用 `service smbd restart`）。第 2 章评分为示意数据，用于快速选型参考，不是性能基准测试结果。

---

## 相关笔记

- [交叉编译与工具链](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/交叉编译与工具链/) —— 同一台开发机上的交叉编译、工具链与跨系统协作
- [SDL1.2.15 移植与编译指南](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/sdl1_2_15_移植与编译指南/) —— 第三方库在 Linux 下的编译与交叉编译
- [嵌入式系统概论](../../../../../Embedded/NoSystematic/Docs/01-嵌入式基础/硬件与体系结构知识体系/嵌入式系统概论/) —— 嵌入式系统的整体知识背景
