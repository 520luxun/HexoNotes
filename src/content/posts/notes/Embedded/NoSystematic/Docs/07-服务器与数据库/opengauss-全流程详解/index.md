---
title: "openGauss-全流程详解"
published: 2026-11-19
description: "openGauss 全流程详解（从 Windows 到一张表） 这份文档回答的是这到底是什么、每一步为什么要这么做。 想照着装 → 看 [[openGaus"
tags: ["服务器与数据库/openGauss", "服务器与数据库/openEuler"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/07-服务器与数据库"
draft: false
order: 89
---

# openGauss 全流程详解（从 Windows 到一张表）

> 这份文档回答的是"**这到底是什么、每一步为什么要这么做**"。
> 想照着装 → 看 [openGauss-5.0.2-单机安装部署实录](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-5_0_2-单机安装部署实录/)
> 想知道用户怎么用 → 看 [openGauss-用户与使用手册](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-用户与使用手册/)
> 本文 = 把上面两份的底层逻辑讲透，所有数字都是本机实测（2026-11-19）。

---

## 第一部分　先建立整体图景

### 1.1 你手上其实只有三样东西

```
① 一台真电脑        —— 你的 Windows（跑浏览器、VS Code）
② 一台虚拟电脑      —— VMware 里的 openEuler，IP 192.168.80.139
③ 一个数据库软件    —— 装在 ② 里的 openGauss 5.0.2，端口 26000
```

其他的词（预安装、软链接、pg_hba、角色、RPM、LVM……）都是这三样的**零件名**。
只要你分清"我现在说的是哪一层"，混乱感就消失一半。

### 1.2 三层结构（把这图记住）

```
┌──────────────────── Windows 宿主机 ────────────────────┐
│  VMware 窗口 │ VS Code │ 浏览器 │ ssh.exe(客户端)        │
│        │                                               │
│  VMware 虚拟交换机/网卡 VMnet8（NAT） 192.168.80.1        │
└────────┼───────────────────────────────────────────────┘
         │  虚拟机可上网；宿主机可主动连虚拟机
┌────────▼───────── openEuler 22.03（虚拟机）────────────┐
│  ens33: 192.168.80.139                                 │
│  ├─ sshd :22                ← 你/我用 SSH 登录          │
│  ├─ 文件系统 /boot / /home /opt                          │
│  ├─ 用户 root / luxun / omm / opengauss(残留)           │
│  └─ openGauss 实例 ── gaussdb 进程 :26000 / :26001      │
│         ├─ 程序：/opt/software/openGauss/install/app    │
│         ├─ 数据：/opt/.../install/data/dn （647 MB）    │
│         └─ 日志：/var/log/omm/omm/                       │
└─────────────────────────────────────────────────────────┘
```

### 1.3 一次查询的完整路径

你在终端敲：

```bash
gsql -d db_tpcc -p 26000 -r
```

背后发生的事：

1. `gsql` 是**客户端**进程，以你的 OS 用户（omm）身份启动；
2. 它按 `-p 26000` 找到 `192.168.80.139:26000`，发起 TCP 连接；
3. 服务端的 `gaussdb` 进程收到连接，先查 `pg_hba.conf`：**这个来源 IP + 这个用户，允许哪种认证**；
4. 认证通过 → 把连接绑定到某个数据库（`db_tpcc`）+ 某个角色（`omm`）；
5. 你敲的 SQL 被发给服务端，服务端读 `data/dn` 里的文件、写 WAL、返回结果集；
6. `\q` → 断开连接，客户端退出。

**理解这条链，就能自己定位问题**：连不上是第 2 步（网络/端口）、还是第 3 步（pg_hba）、还是第 4 步（用户/密码）。

### 1.4 关键数字（背下来）

| 项目 | 值 |
|---|---|
| 虚拟机 IP | `192.168.80.139` |
| 主机名 | `luxunacc` |
| 数据库端口 | `26000`（复制端口 `26001`） |
| 版本 | openGauss 5.0.2 build `48a25b11`，2024-05-14 编译 |
| 程序目录 | `/opt/software/openGauss/install/app`（软链→`app_48a25b11`，515 MB） |
| 数据目录 | `/opt/software/openGauss/install/data/dn`（647 MB） |
| 日志目录 | `/var/log/omm/omm/` |
| 实例名 | `6001`（单机 P/Primary） |
| 管理员 | OS 用户 `omm` + DB 超级用户 `omm` |

---

## 第二部分　虚拟机与操作系统层

### 2.1 虚拟机是什么

VMware 用软件**模拟了一套硬件**（CPU、内存、磁盘、网卡、显卡），让 openEuler 以为自己在真机上跑。

- 它的"磁盘"是宿主机上的一个或多个 `.vmdk` 文件（你这台 100 GiB）；
- 它"关机"= 进程停下、内存清空；文件还在，所以数据不丢；
- 它"重启"= 重新引导内核，`/tmp` 会清空，内存里的东西全没了；
- 快照 = 给 `.vmdk` 拍个时间点，可以回滚（学习环境很值得用：装库前拍一个）。

### 2.2 网络：为什么宿主机能连、别人不能

VMware 的 NAT 模式：

```
虚拟机 192.168.80.139  ──VMnet8(192.168.80.1)──  Windows 网络栈 ── 外网
```

- **出方向**：虚拟机访问外网时，VMware 帮你做地址转换（所以能 `dnf install`）；
- **进方向**：宿主机可以直接连 `192.168.80.139:任意端口`（实测 22、26000 都通）；
- **局域网其他电脑**：连不到，因为 `192.168.80.0/24` 是 VMware 内部网段。

补充：`ping` 不通但 `ssh` 通，是 ICMP 被拦/不受支持，跟业务无关，不要被它误导。

### 2.3 磁盘与分区：为什么这么分

本机实际布局（`df -h` 实测）：

| 挂载点 | 大小 | 已用 | 文件系统 | 作用 |
|---|---|---|---|---|
| `/boot` | 974 M | 20% | xfs | 内核、initramfs、grub |
| `/` | 35 G | 17%（5.4G） | xfs | 系统 + 软件 + **`/opt`（数据库在这）** |
| `/home` | 59 G | 1% | xfs | 个人数据 |
| `swap` | 0 | — | — | **已关闭** |

几个"为什么"：

- **为什么 `/` 留 35 G**：要装 dnf 包、数据库程序（515 MB）+ 初始数据。够用但不宽裕。
- **为什么 `/opt` 很关键**：数据库程序和数据都在 `/opt`，而 `/opt` 属于 `/`。**往 `/opt` 里塞大文件（比如内核源码）会撑爆根分区**，源码要放 `/home`。
- **为什么 swap 要关**：数据库需要可预测的内存行为，一旦被换出到磁盘，延迟会从微秒级涨到毫秒级，而且 openGauss 启动检查会直接拒绝（详见 8.1）。
- **LVM 是什么**：在物理分区之上加一层"卷管理"，可以动态调整大小。openEuler 默认用 LVM，你看到的 `openeuler-root`、`openeuler-home` 就是逻辑卷。

### 2.4 引导方式：biosboot 和 /boot/efi 的来历

| 组合 | 需要额外分区 | 本次是否命中 |
|---|---|---|
| UEFI + GPT | `/boot/efi`（512 MB FAT32） | 否 |
| Legacy BIOS + GPT | `biosboot`（1 MB） | 否 |
| **Legacy BIOS + MBR** | **不需要** | ✅ 本次就是这种 |

你这台是 VMware 默认的 BIOS 引导 + MBR 分区表，所以两个都不用建。哪天把虚拟机改成 UEFI，就必须补 `/boot/efi`，否则装完起不来。

### 2.5 Linux 的用户与权限（一切混乱的源头之一）

#### 三个基本要素

每个文件都有：**属主(owner)、属组(group)、其他人的权限(rwx)**。
每个用户都有：**uid、gid、主组、附加组、家目录、shell**。

```
-rwxr-x---  1 omm dbgrp  ...  gaussdb
 │└┬┘└┬┘└┬┘   │    │
 │ │  │  └── 其他人：无权限
 │ │  └───── 属组 dbgrp：读+执行
 │ └──────── 属主 omm：读+写+执行
 └────────── 类型：- 普通文件，d 目录，l 软链接
```

#### 本机的用户与组（实测）

| 用户 | uid | 主组 | 附加组 | 说明 |
|---|---|---|---|---|
| `root` | 0 | root | — | 系统管理员，权限无限 |
| `opengauss` | 1000 | opengauss | — | 旧 2.1.0 实例的残留用户 |
| `luxun` | 1001 | luxun | **wheel** | 日常用户，能 `sudo` |
| `omm` | 1002 | **dbgrp** | — | 数据库专用，**不能 sudo** |

`wheel` 组 = "可以 sudo"的名单。`luxun` 在里面，`omm` 不在 —— 这是设计：**数据库用户不应该有权改系统**。

#### `su` 和 `su -` 的区别（非常关键）

| 命令 | 行为 | 结果 |
|---|---|---|
| `su omm` | 只换身份，**不加载**目标用户的环境 | `GAUSSHOME`、`PATH` 可能没有 → `gs_om: command not found` |
| `su - omm` | 换身份 + 加载 `/home/omm/.bashrc` 等 | 环境完整，能直接跑 `gs_om`、`gsql` |

**永远用 `su - omm`**。这正是你之前踩坑的原因之一。

### 2.6 包管理：dnf 与 RPM

- `.rpm` = 软件包格式；`dnf` = 包管理器（自动解析依赖）。
- 一条命令装：`sudo dnf install -y opengauss`；一条卸：`sudo dnf remove -y opengauss`。
- **`@anaconda`**：dnf 日志里的来源标记，意思是"装系统时由安装器装的"，不是手工装的。

这就是"为什么会有两个数据库"的答案：

```
/root/anaconda-ks.cfg 里写着：
%packages
@^server-product-environment
@opengauss-server          ← 装系统时勾了这个包组
%end
```

Anaconda 顺手装了 `opengauss-2.1.0`（用户 `opengauss`，端口 7654，服务 enabled），后来你又手工装了 5.0.2（用户 `omm`，端口 26000）。现在旧的已删除。

### 2.7 systemd：服务与开机自启

`systemd` 是 Linux 的服务管理器。每个服务是一个 `.service` 文件。

```bash
systemctl status sshd        # 看状态
systemctl enable sshd        # 开机自启
systemctl disable sshd       # 取消开机自启
systemctl start/stop/restart xxx
```

**关键差异**（你踩过）：

| | 旧 2.1.0 | 你的 5.0.2 |
|---|---|---|
| 由谁管 | `opengauss.service`（systemd） | `gs_om` 脚本（无 systemd 单元） |
| 开机自启 | ✅ enabled | ❌ 不会 |
| 重启后 | 自己起来 | **要手动 `gs_om -t start`** |

所以"重启后数据库没了"是正常现象，不是坏了。

### 2.8 SELinux / firewalld / swap

| 项目 | 作用 | openGauss 要求 | 本机现状 |
|---|---|---|---|
| SELinux | 强制访问控制（给进程和文件打标签） | 关闭或 permissive | `Permissive` ✅ |
| firewalld | 防火墙 | 建议关闭（或放行 26000） | 已停用/disbale ✅ |
| swap | 虚拟内存 | **必须关闭** | 0 ✅ |

检查命令：`getenforce`、`systemctl is-active firewalld`、`swapon --show`。

### 2.9 环境变量：`GAUSSHOME` 那一套

`/home/omm/.bashrc` 里的关键行（实测）：

```bash
export GAUSSHOME=/opt/software/openGauss/install/app
export PATH=$GAUSSHOME/bin:$PATH
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export GAUSSLOG=/var/log/omm/omm
```

含义：

- `GAUSSHOME`：数据库程序目录（软链指向 `app_48a25b11`），所有工具靠它找自己；
- `PATH`：能直接敲 `gsql`、`gs_ctl` 等，是因为 `$GAUSSHOME/bin` 在 PATH 里；
- `LD_LIBRARY_PATH`：动态库路径（`gaussdb` 依赖 `lib` 里的 .so）；
- `GAUSSLOG`：日志根目录，日志会写到 `$GAUSSLOG/om/` 下。

**这就是为什么必须 `su - omm`**：不加载这些变量，工具会找不到库或路径。

---

## 第三部分　数据库层

### 3.1 openGauss 是什么

openGauss 是华为开源的关系型数据库，**内核源自 PostgreSQL 9.2.4**，做了大量改造（多线程模型、CSN 事务、MOT 内存表、列存、AI 优化器等）。

对你意味着：

- 绝大多数 **PostgreSQL 的语法、SQL、客户端用法** 通用（`\d`、`pg_catalog`、`GRANT`）；
- 但**进程模型、部分系统表、认证方式、工具链**和 PG 不同（比如用 `gsql` 而不是 `psql`，用 `gs_om` 管集群）。

### 3.2 实例 / 数据库 / schema / 表

```
openGauss 实例（一个 gaussdb 进程，端口 26000，数据目录 data/dn）
├── 数据库 db_tpcc（owner=jiang）
│    └── schema public
│         └── 表 mytable（firstcol int）
├── 数据库 postgres（默认入口，owner=omm）
├── 数据库 template0（模板，只读）
└── 数据库 template1（模板，CREATE DATABASE 的默认拷贝源）
```

- **实例**：一整套后台进程 + 数据目录，一个机器可以跑多个（本机现在只有 1 个）；
- **数据库**：实例内的逻辑隔离单位，**不能跨库查询**；连接时必须指定一个库；
- **schema**：库内的命名空间，默认 `public`；
- **表、索引、视图、序列**：最底层对象。

### 3.3 进程模型：为什么 openGauss 只有 1 个 gaussdb

PostgreSQL 是"**一连接一进程**"；openGauss 改成"**单进程多线程**"：

```
gaussdb（1 个主进程）
├── 主线程（监听、调度）
├── 连接线程（每个客户端一个线程）
├── 后台线程：checkpoint / walwriter / pagewriter / bgwriter /
│              autovacuum / 统计收集 / 日志刷写 …
└── 其他：MOT、审计、监控线程
```

所以你 `ps -ef | grep gaussdb` 只看到 **1 个进程**是正常的，不是少了。

### 3.4 内存：几个关键区（概念级）

| 区域 | 作用 |
|---|---|
| shared buffers | 数据页缓存（最大的一块，`shared_buffers`） |
| WAL buffers | 日志写缓存 |
| CSN / 事务信息 | openGauss 特有的提交序列号机制 |
| 工作内存 | 排序、哈希、连接用的临时内存（`work_mem`） |

这些由 `postgresql.conf` 控制，安装时已按机器内存（16 GB）给了一套默认值。

### 3.5 存储结构：`data/dn` 里是什么（实测目录）

```
/opt/software/openGauss/install/data/dn/
├── base/            ← 每个数据库的数据文件（文件名 = 库 OID）
├── global/          ← 全局系统表（pg_database 等）
├── pg_xlog/         ← WAL 事务日志（openGauss 沿用 PG 9.x 的命名）
├── pg_clog/ pg_csnlog/  ← 事务提交状态
├── undo/            ← undo 段（openGauss 的 MVCC 依赖它）
├── pg_replslot/     ← 复制槽
├── postgresql.conf  ← 参数（listen_addresses、port、内存…）
├── pg_hba.conf      ← 谁能连、怎么认证
├── postmaster.pid   ← 运行中的进程号锁
├── server.crt/key   ← SSL 证书
└── gaussdb.state    ← 实例状态文件
```

**记住三条**：

1. `data/dn` 是**数据的全部**，备份它 = 备份数据库（冷备）；
2. `pg_xlog` 绝对不能删 —— 删了实例起不来/数据不一致；
3. 这个目录必须属于 `omm`，因为服务端以 omm 身份写文件。

### 3.6 WAL 与崩溃恢复

每次修改数据，openGauss 先把"改了什么"写进 WAL（`pg_xlog`），再改数据页。

- 好处：崩溃后可以**重放 WAL** 恢复；
- 代价：多一次写；所以有 checkpoint 定期把脏页刷盘并清理旧 WAL；
- 你看到的 `pg_xlog` 增长属于正常，checkpoint 后会回收。

### 3.7 端口：26000 和 26001

```
192.168.80.139:26000   ← 数据库服务端口（客户端连这个）
192.168.80.139:26001   ← 复制/HA 端口（port + 1）
```

openGauss 固定用 `port` 和 `port+1` 两个。**单机也会监听 26001**，但没配主备时它只是占位，不是第二个数据库实例。

### 3.8 认证：pg_hba.conf 是"门卫名单"

连接进来的第一步不是验密码，而是**查 pg_hba**（实测 5 条）：

```
local   all   all                           trust     -- 本机 socket 免密
host    all   omm   192.168.80.139/32       trust     -- omm 从自己 IP 来，免密
host    all   all   127.0.0.1/32            trust     -- 回环免密
host    all   all   192.168.80.139/32       sha256    -- 从自己 IP 来，要密码
host    all   all   ::1/128                 trust     -- IPv6 回环
```

规则解读：

- 从上往下匹配，**命中第一条就走**；
- `trust` = 不验密码（仅限本机，安全上可接受）；
- `sha256` = 用密码认证（`password_encryption_type=2`，实测就是这个值）；
- **没有匹配的规则 = 拒绝**（报 `no pg_hba.conf entry`）。

这解释了：

- 为什么本机 `gsql` 不用输密码 → 命中 `local trust`；
- 为什么 Windows 现在连不上 → 没有 `192.168.80.0/24` 的规则。

### 3.9 角色与权限（重点，详见用户手册）

实测 `pg_roles` 里 10 个角色：

| 角色 | super | systemadmin | auditadmin | monitoradmin | operatoradmin | createdb | canlogin |
|---|---|---|---|---|---|---|---|
| `omm` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `jiang` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `gs_role_*`（8 个） | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

- `super`：超级用户，绕过所有权限检查；
- `systemadmin`：openGauss 特有，系统管理权限（建库、建用户、改参数）；
- `auditadmin` / `monitoradmin` / `operatoradmin`：审计、监控、运维三个细分管理员；
- `gs_role_*`：细粒度特权，用 `GRANT` 单独授予，避免给超级权限。

### 3.10 编码：为什么是 SQL_ASCII（隐患）

实测 4 个库全是：

```
db_tpcc   | SQL_ASCII | C | C
postgres  | SQL_ASCII | C | C
```

`SQL_ASCII` = 不校验字符集，按字节存。英文没问题，**中文容易乱码**。

正确做法：建库时显式指定

```sql
CREATE DATABASE db_xxx WITH ENCODING 'UTF8' TEMPLATE template0;
```

为什么必须 `template0`：`template1` 可能被改过（加过扩展、语言），从它复制会把脏东西带过去；`template0` 是干净的原始模板，且允许改编码。

---

## 第四部分　安装过程详解

### 4.1 为什么要两步：preinstall + install

openGauss 的安装被拆成两段，因为职责不同：

| 阶段 | 谁执行 | 做的什么 | 需要 root 吗 |
|---|---|---|---|
| `gs_preinstall` 预安装 | **root** | 检查环境、建用户、配 SSH、设内核参数、建目录、设 cgroup/CRON | 是 |
| `gs_install` 安装 | **omm** | 铺程序、初始化实例、建库、配置、启动 | 否 |

这样设计的原因：很多"危险操作"（改 `/etc/sysctl.conf`、建用户、改 ulimit）必须 root 做一次；而真正碰数据的部分应该由普通用户 omm 做，符合最小权限原则。

### 4.2 `gs_preinstall` 每一步在干什么（按本机日志）

```
Parsing the configuration file.        ← 读 clusterconfig.xml，校验参数
Installing the tools on the local node.← 把 OM 工具装到 install/om，供后续调用
Setting host ip env                    ← 把本机 IP 写进环境（hostname/IP 映射）
Are you sure you want to create the user[omm]? yes
Preparing SSH service.                 ← 给 omm 配 SSH 互信（集群多节点时要用）
Checking OS software.                  ← 检查依赖库（libaio 等）
Checking OS version.                   ← 校验 openEuler 版本，挑对应的包
Creating cluster's path.               ← 建 gaussdbAppPath / dataNode1 / corePath 等目录
Set and check OS parameter.            ← 写并生效内核参数（shmmax/shmall/semaphore/ulimit）
Preparing CRON service.                ← 配定时任务（日志清理等）
Setting user environmental variables.  ← 写 /home/omm/.bashrc（GAUSSHOME 等）
Setting the dynamic link library.      ← 配 /etc/ld.so.conf.d
Setting Core file                      ← 配 core 文件路径
Setting pssh path                      ← 配并行 ssh 工具
Setting Cgroup.                        ← 配 cgroup（资源隔离）
Set ARM Optimization.                  ← ARM 平台优化（x86 跳过）
Fixing server package owner.           ← 修正安装包属主
Setting finish flag.                   ← 打上"预安装完成"标记
Preinstallation succeeded.             ← 成功标志
```

**关键理解**：预安装只"准备环境"，**不装数据库程序**。所以预安装成功 ≠ 数据库能用。

### 4.3 目录模型：为什么 `app` 是软链接

```
/opt/software/openGauss/install/
├── app -> app_48a25b11     ← 软链接，由 gs_install 创建（= $GAUSSHOME）
├── app_48a25b11/           ← 真实程序目录（bin/ lib/ share/ ...），由 gs_preinstall 建
├── data/dn/                ← 数据目录（XML 的 dataNode1）
└── om/                     ← OM 运维工具（XML 的 gaussdbToolPath）
```

`48a25b11` 是**本机固定后缀**（同一台机器每次装都是它，来自机器/包的哈希）。

为什么要软链？

- 升级/回滚时，只需把 `app` 指向另一个 `app_xxxx`，**不用改配置、不用停机改路径**；
- 配置里永远写 `.../install/app`，对版本变化无感。

这也解释了三个报错的本质：

| 报错 | 本质 |
|---|---|
| `50202 app must be empty` | 你手工往本该由安装器铺的 `app` 里放了东西 |
| `50200 app already exists. Cannot create symbolic link` | `app` 目录占了软链该在的位置 |
| `50201 app_<hash> does not exist` | 真实目录被删 / `install` 目录 omm 无写权限 |

### 4.4 `gs_install` 做了什么（8 个 step）

```
Step1 Parsing the configuration file      ← 再次解析 XML
Step2 Check preinstall on every node      ← 校验 finish flag（预安装确实完成）
Step3 Checking cluster status             ← 检查是否有旧实例
Step4 Creating the backup directory       ← 准备备份目录（失败时回滚用）
begin deploy..
Step5 Installing the cluster
   ├─ Checking the installation environment
   ├─ Installing applications on all nodes ← 解包到 app_<hash>，建 app 软链
   ├─ init Instance                        ← initdb：建数据目录、系统表、证书
   │     └─ 提示两次输入数据库密码
   └─ Configuring                          ← 生成 postgresql.conf/pg_hba.conf
       ├─ Deleting instances from all nodes
       ├─ Initializing instances on all nodes
       ├─ Configuring pg_hba on all nodes
       └─ The cluster status is Normal
Step6 Successfully started cluster          ← 自动启动数据库
Step7 Successfully installed application
Step8 end deploy..
```

### 4.5 断点续传：`install_step.dat`

`gs_install` 把"做到第几步"写到临时文件：

```
/opt/software/openGauss/install/om/omm_mppdb/install_step/install_step.dat
（以及 /tmp 下的 installimpl_step 临时目录）
```

失败后重跑，会看到 `Last time end with Install cluster. Continue this step.`，然后**按旧状态继续** —— 如果旧路径已被你删掉，就会报 `50201`。

所以：**失败重跑前，先清状态**：

```bash
sudo rm -rf /tmp/installimpl_step /opt/software/openGauss/install/om/omm_mppdb/install_step
```

### 4.6 密码与证书

安装时要输入两次"数据库密码"，它被用来：

1. 生成 `server.key.cipher` / `server.key.rand`（数据库主密钥，用于落盘加密）；
2. 生成 `server.crt` / `cacert.pem`（SSL 证书，用于加密集群内部通信）；
3. 用 `sha256` 存成 `omm` 用户的认证口令（`password_encryption_type=2`）。

所以安装时输错/忘了密码，就只能 `ALTER USER` 重置（或者重建实例）。

---

## 第五部分　用户体系详解

### 5.1 两层模型（再强调一次）

```
操作系统层（/etc/passwd）        数据库层（pg_roles）
root  ─────────────────────────  （无）
luxun ─────────────────────────  （无）
omm   ─────────────────────────  omm（超级用户）
（无）  ────────────────────────  jiang（普通用户）
opengauss（残留）───────────────  （无）
```

- **同名不代表同密码**：`omm` 的 OS 密码和 DB 密码是两条记录，本次恰好都是 `wlovelu1@A`；
- **同名不代表同权限**：OS 上 `omm` 只是普通用户（不能 sudo），DB 里它是超级管理员。

### 5.2 OS 用户的权限边界

| 能做 | 只有 root | 只有 omm（DB） | luxun（sudo） |
|---|---|---|---|
| 改 `/etc/sysctl.conf` | ✅ | ❌ | ✅（sudo） |
| 改 `pg_hba.conf` / `postgresql.conf` | 文件属主是 omm，root 也行 | ✅ | ❌ |
| 启停服务 `systemctl` | ✅ | ❌ | ✅（sudo） |
| `gs_om -t start/stop` | ❌（会报错） | ✅ | ❌（用 su - omm） |
| `gsql` 连接 | ⚠️ 不宜：缺 `GAUSSHOME`/`LD_LIBRARY_PATH`，且默认把 OS 用户 `root` 当数据库用户（库里没有 root 角色） | ✅ | 可以（需有对应的 DB 账号） |
| `chown` 目录 | ✅ | ❌ | ✅（sudo） |

### 5.3 DB 角色的属性

`CREATE USER` 时可以附带属性：

```sql
CREATE USER app SYSADMIN;          -- 系统管理员级
CREATE USER app CREATEDB;          -- 能建库
CREATE USER app CREATEROLE;        -- 能建角色
CREATE USER app MONADMIN;          -- 监控管理员（openGauss）
CREATE USER app OPAUDITADMIN;      -- 审计管理员（openGauss）
CREATE USER app NOLOGIN;           -- 不能登录（给角色/权限组用）
```

改属性：`ALTER USER app SYSADMIN;` / `ALTER USER app NOSYSADMIN;`

### 5.4 一次连接的完整检查顺序

```
TCP 到达 26000
  ├─ 1. listen_addresses 是否包含该 IP？   （postgresql.conf）
  ├─ 2. pg_hba.conf 是否有匹配规则？        （没有 → "no pg_hba.conf entry"）
  ├─ 3. 认证方式：trust（直接过） / sha256（验密码）
  ├─ 4. 用户是否存在、能否登录？            （no login → "permission denied to log in"）
  ├─ 5. 该用户对目标库是否有 CONNECT 权限？ （PG 默认所有人可连，可 REVOKE）
  └─ 6. 连接建立，之后每条 SQL 再按对象权限检查
```

**排错按这个顺序逐层看**，比乱试快得多。

### 5.5 授权模型（GRANT 的层级）

```
数据库（CONNECT / TEMP / CREATE）
 └─ schema（USAGE / CREATE）
     └─ 表/视图（SELECT / INSERT / UPDATE / DELETE / TRUNCATE / REFERENCES）
         └─ 列（SELECT(col1), UPDATE(col2)）
     └─ 序列（USAGE / SELECT）
     └─ 函数（EXECUTE）
```

最小权限示例：

```sql
GRANT CONNECT ON DATABASE db_tpcc TO app_user;
\c db_tpcc
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_user;
```

---

## 第六部分　日常使用详解

### 6.1 gsql 是什么

`gsql` 是 openGauss 的命令行客户端（对标 PostgreSQL 的 `psql`），协议兼容 PG。

常用连接参数：

| 参数 | 含义 |
|---|---|
| `-d` | 数据库名 |
| `-p` | 端口（26000） |
| `-h` | 主机（本机可省略，默认 unix socket；远程填 IP） |
| `-U` | 数据库用户名 |
| `-W` | 密码（脚本里用，避免交互） |
| `-c` | 执行一条 SQL 就退出 |
| `-f` | 执行一个 SQL 文件 |
| `-r` | 更友好的显示（openGauss 特有） |

### 6.2 元命令（反斜杠命令）

| 命令 | 作用 |
|---|---|
| `\l` | 列出所有数据库 |
| `\c dbname` | 切换数据库 |
| `\du` | 列出用户/角色 |
| `\dn` | 列出 schema |
| `\dt` | 列出表 |
| `\d tablename` | 看表结构 |
| `\di` | 列出索引 |
| `\df` | 列出函数 |
| `\x` | 切换纵向显示（列多时好用） |
| `\timing` | 显示每条 SQL 耗时 |
| `\?` | 所有元命令帮助 |
| `\q` | 退出 |

### 6.3 一个业务从 0 到 1

```sql
-- 以 omm 登录后
CREATE USER shop WITH PASSWORD 'Shop@2026abc';
CREATE DATABASE shopdb WITH ENCODING 'UTF8' TEMPLATE template0 OWNER shop;

\c shopdb
CREATE SCHEMA sales;                      -- 可选：分 schema
CREATE TABLE sales.orders (
  id        bigserial PRIMARY KEY,
  user_id   int          NOT NULL,
  amount    numeric(10,2) NOT NULL,
  created   timestamp    DEFAULT now()
);
CREATE INDEX idx_orders_user ON sales.orders(user_id);

GRANT USAGE ON SCHEMA sales TO shop;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sales TO shop;

-- 以 shop 登录验证
INSERT INTO sales.orders(user_id, amount) VALUES (1001, 99.50);
SELECT * FROM sales.orders;
```

### 6.4 事务与 MVCC（概念）

```sql
BEGIN;
UPDATE sales.orders SET amount = amount + 1 WHERE id = 1;
ROLLBACK;      -- 或 COMMIT;
```

- openGauss 用 **MVCC**（多版本并发控制）+ **CSN**：读不阻塞写、写不阻塞读；
- 默认隔离级别 **READ COMMITTED**；
- 长时间不提交的事务会阻止 WAL 回收（`pg_xlog` 涨），要避免。

### 6.5 备份与恢复

| 方式 | 命令 | 特点 |
|---|---|---|
| 逻辑备份（按库） | `gs_dump -p 26000 db_tpcc -f db_tpcc.sql` | 可跨版本、可编辑 |
| 逻辑恢复 | `gs_restore -p 26000 -d db_new db_tpcc.sql` | 恢复到新库 |
| 物理备份（全实例） | `gs_basebackup -D /backup -p 26000` | 快、与原实例一致 |
| 冷备 | 停机后 `tar` 打包 `data/dn` | 最简单，但需停机 |

---

## 第七部分　运维与排错

### 7.1 启停与状态

```bash
su - omm
gs_om -t status --detail     # 看状态（Normal 才算好）
gs_om -t start               # 启动
gs_om -t stop                # 停止
gs_om -t restart             # 重启
gs_om -t reload              # 重载 pg_hba 等（改了配置用这个）
```

### 7.2 日志在哪

| 日志 | 路径 |
|---|---|
| 数据库运行日志 | `/var/log/omm/omm/pg_log/dn_6001/` |
| 安装日志 | `/var/log/omm/omm/om/gs_install-*.log` |
| 预安装日志 | `/var/log/omm/omm/om/gs_preinstall-*.log` |
| 本地执行日志 | `/var/log/omm/omm/om/gs_local-*.log` |

看日志的原则：**时间点最近的、关键字 ERROR/FATAL 的、最后 50 行**。

### 7.3 常用监控 SQL

```sql
-- 当前连接与会话
SELECT datname, usename, client_addr, state, query_start, query
FROM pg_stat_activity ORDER BY query_start;

-- 库大小
SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database;

-- 表大小（当前库）
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;

-- 锁等待
SELECT * FROM pg_locks WHERE NOT granted;
```

### 7.4 排错方法论（5 步）

1. **确认现象**：报错原文、时间、哪个命令、哪个用户；
2. **定位层**：网络？pg_hba？密码？权限？磁盘？进程？
3. **看日志**：`/var/log/omm/omm/om/` 和 `pg_log/`；
4. **查配置**：`postgresql.conf`、`pg_hba.conf`、`clusterconfig.xml`；
5. **验证**：用最小命令复现（比如 `gsql -h 127.0.0.1 -p 26000 -U omm`）。

### 7.5 本次六个坑的复盘

| # | 现象 | 层次 | 根因 |
|---|---|---|---|
| 1 | `systemctl` 报 `Interactive authentication required` | 系统 | 非 root 执行特权命令 |
| 2 | 预安装卡在 `Successfully set OS parameters` | 系统 | 缺 `paramiko`，脚本静默死循环 |
| 3 | `50202 app must be empty` | 安装 | 手工解压占了 app |
| 4 | `50200 app already exists` | 安装 | app 目录占了软链位置 |
| 5 | `50201 app_<hash> does not exist` | 安装 | 真实目录被删 + install 无写权限 |
| 6 | `Last time end with Install cluster` | 安装 | 断点续传状态残留 |

---

## 第八部分　十个"为什么"

**1. 为什么必须关 swap？**
数据库要求内存访问可预测；swap 换出会让延迟从微秒变毫秒，且 openGauss 安装/启动检查会直接拒绝。

**2. 为什么不能用 root 装/连？**
安全设计：数据库进程应以专用普通用户运行，避免被攻破后拿到 root。`gs_install` 和 `gsql` 都会检查并拒绝 root。

**3. 为什么重启后数据库不自启？**
openGauss 没有默认 systemd 单元，集群启停都由 `gs_om` 控制（多节点场景下 systemd 不好管）。需要自启就写 `/etc/rc.local` 或 systemd 单元。

**4. 为什么 `install/app` 是软链接？**
为了升级/回滚时只切链接、不改配置（详见 4.3）。

**5. 为什么密码要求三类字符？**
openGauss 默认密码策略（复杂度 + 长度 + 有效期），防止弱口令。`password_encryption_type=2` 表示用 sha256 存储。

**6. 为什么 Windows 连不上 26000？**
`pg_hba.conf` 没有 `192.168.80.0/24` 的规则（详见 3.8 和用户手册 5.2）。

**7. 为什么库是 SQL_ASCII？**
建库时没指定编码，跟了模板的 C locale。存中文有隐患，新建库请用 `ENCODING 'UTF8' TEMPLATE template0`。

**8. 为什么会同时有两个数据库？**
装系统时 `@opengauss-server` 包组自动装了 2.1.0（7654），你又手工装了 5.0.2（26000）。旧的已删。

**9. 为什么 `/opt` 撑爆会出问题？**
`/opt` 在 `/`（35 G）上，满了会导致数据库无法写日志/WAL，实例可能挂掉。源码和大文件放 `/home`。

**10. 为什么要先预安装？**
把需要 root 的危险操作集中做一次并做环境体检，之后以最小权限用户装库（详见 4.1）。

---

## 第九部分　命令地图

### 系统层（root / sudo）

```bash
hostnamectl                        # 主机名
ip a; ss -lntp                     # 网络与端口
df -h; free -h; swapon --show      # 磁盘/内存/swap
systemctl status|start|stop|disable <svc>
dnf install|remove|list installed
getenforce; setenforce 0           # SELinux
journalctl -u sshd -n 50           # 系统日志
```

### 数据库运维（omm）

```bash
su - omm
gs_om -t status --detail
gs_om -t start|stop|restart|reload
gs_ctl -D /opt/software/openGauss/install/data/dn status
```

### 数据库客户端（omm / 业务用户）

```bash
gsql -d postgres -p 26000 -r
gsql -d db_tpcc -p 26000 -U jiang -W 'Bigdata123' -r
gsql -d postgres -p 26000 -c "select version();"
gs_dump / gs_restore            # 备份恢复
```

### 目录速查

```
/opt/software/openGauss/               安装根目录
  ├── clusterconfig.xml                安装配置（IP/端口/路径）
  ├── script/                          gs_preinstall、gs_install
  └── install/
      ├── app -> app_48a25b11          程序（GAUSSHOME）
      ├── data/dn/                     数据
      └── om/                          OM 工具
/var/log/omm/omm/                      日志
/home/omm/.bashrc                      环境变量
```

---

## 附录　术语表

| 术语 | 一句话解释 |
|---|---|
| VMware / 虚拟机 | 用软件模拟的完整电脑 |
| NAT (VMnet8) | 虚拟机的网络模式，能上网、宿主机能反向连 |
| LVM | 逻辑卷管理，可在物理分区上动态分配空间 |
| MBR / GPT | 两种分区表格式；UEFI 需要 GPT + /boot/efi |
| RPM | Linux 软件包格式；dnf 是它的包管理器 |
| systemd | 服务管理器，管理开机启动与后台服务 |
| SELinux | 强制访问控制，可让普通程序被"标签"限制 |
| swap | 虚拟内存分区，数据库要求关闭 |
| WAL / pg_xlog | 预写日志，崩溃恢复用 |
| MVCC | 多版本并发控制，读写不互相阻塞 |
| 实例 / 数据库 / schema | 进程+数据目录 / 逻辑库 / 库内命名空间 |
| 角色 (role) | 数据库用户或权限组的统称 |
| pg_hba.conf | 谁能从哪来、用什么方式认证的白名单 |
| GAUSSHOME / GAUSSLOG | 程序目录 / 日志目录 环境变量 |
| 软链接 | 类似 Windows 快捷方式，`app -> app_48a25b11` |
| 预安装 / 安装 | 准备环境（root）/ 铺程序与初始化（omm） |

---

*本文基于 2026-11-19 本机实测（openEuler 22.03 SP3 + openGauss 5.0.2）。*
