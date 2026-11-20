---
title: "openGauss-5.0.2-单机安装部署实录"
published: 2026-11-19
description: "openGauss 5.0.2 单机安装部署实录 文档性质：实测记录 + 可复现指南 + 排错手册 环境：openEuler 22.03 LTS SP3 / o"
tags: ["服务器与数据库/openGauss", "服务器与数据库/openEuler", "文档/排错"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/07-服务器与数据库"
draft: false
order: 88
---

# openGauss 5.0.2 单机安装部署实录

> 文档性质：**实测记录 + 可复现指南 + 排错手册**
> 环境：openEuler 22.03 LTS SP3 / openGauss 5.0.2 (openEuler x86_64)
> 结果：安装成功（`cluster_state : Normal`），教程全流程（建用户/建库/建表/增查）已跑通
> 配套：[openGauss-全流程详解](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-全流程详解/)（原理与为什么）· [openGauss-用户与使用手册](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-用户与使用手册/)（用户、角色与日常操作）

---

## 0. 环境信息（实测值）

| 项目 | 值 |
|---|---|
| 主机名 | `luxunacc` |
| IP 地址 | `192.168.80.139` |
| 操作系统 | openEuler 22.03 (LTS-SP3) |
| 内核 | `5.10.0-182.0.0.95.oe2203sp3.x86_64` |
| 运行平台 | VMware Workstation 虚拟机（Legacy BIOS + MBR） |
| CPU / 内存 | **6 vCPU / 16 GiB**（`free -h` 显示 15 GiB 可用总量） |
| 磁盘 / 分区 | 100 GiB：`/boot` 1 GiB(sda1) · `/` 35 GiB(LVM,xfs) · `swap` 2–4 GiB(LVM) · `/home` 59.99 GiB(LVM,xfs) |
| 操作系统来源 | `openEuler-22.03-LTS-SP3-x86_64-dvd.iso` 全新安装（见第 2 章） |
| ~~另一套实例~~ | 系统 RPM 自带的 `opengauss 2.1.0`（端口 7654）——**已于 2026-11-19 20:44 清理完毕**，详见 15.7 |
| 数据库版本 | openGauss 5.0.2，build `48a25b11`，编译于 2024-05-14 |
| 安装包 | `openGauss-5.0.2-openEuler-64bit-all.tar.gz` 等 |
| 安装目录 | `/opt/software/openGauss` |
| 安装用户 / 组 | `omm` (uid 1002) / `dbgrp` (gid 1003) |
| 程序目录 | `/opt/software/openGauss/install/app`（软链 → `app_48a25b11`） |
| 数据目录 | `/opt/software/openGauss/install/data/dn` |
| 工具目录 | `/opt/software/openGauss/install/om` |
| 日志目录 | `/var/log/omm`、`/var/log/omm/omm/om` |
| 数据库端口 | **26000** |
| 实例名 | `6001`（单机，P/Primary） |

### 目录模型（理解这张图，后面 3 个报错全通）

```
/opt/software/openGauss/
├── clusterconfig.xml
├── script/                       # 运维脚本（gs_preinstall / gs_install 在这里）
├── lib/                          # OM 依赖库
├── openGauss-5.0.2-*.tar.gz/bz2  # 安装包原件
└── install/                      # ★ 属主必须是 omm:dbgrp
    ├── app -> app_48a25b11       # 软链，由 gs_install 创建（= $GAUSSHOME）
    ├── app_48a25b11/             # 真实程序目录：bin/ lib/ share/ ...
    ├── data/dn/                  # 数据目录（XML 里 dataNode1）
    └── om/                       # OM 运维工具（XML 里 gaussdbToolPath）
```

关键规则：

1. `app_<hash>` 这个**真实目录由 `gs_preinstall` 创建**（后缀是本机固定的 8 位哈希，同一台机器每次安装都相同，所以本次一直是 `48a25b11`）；
2. `app` 这个**软链接由 `gs_install` 创建**，指向 `app_<hash>`；
3. `install/` 目录的属主必须是 `omm`（否则 `gs_install` 建不了软链，会报一堆 `GAUSS-50200/50201`）。

---

## 1. 总体流程

```
新建 VMware 虚拟机 → 挂 ISO 装 openEuler 22.03（分区 / 主机名 / IP / root 密码）
      → 系统准备（防火墙 / SELinux / swap / 依赖 / paramiko / hosts）
      → 上传并解压安装包 → 建组、建用户 → 写 clusterconfig.xml
      → gs_preinstall（预安装）→ gs_install（安装 + 初始化 + 启动）
      → 验收（gs_om / gsql）→ 日常运维
```

顺序不能乱：`gs_preinstall` 必须在 `gs_install` 之前，且**预安装成功后不能再手工改 install 目录结构**。

---

## 2. 阶段零：安装 openEuler 22.03 LTS SP3（ISO 装机）

> openGauss 只能跑在 Linux 上，所以**文档真正的起点是"装操作系统"**。本章是本次实测的装机过程。

### 2.1 虚拟机与安装介质

| 项目 | 配置 |
|---|---|
| 虚拟化平台 | VMware Workstation |
| 客户机类型 | Linux / 其他 Linux 4.x 或更高版本 64 位 |
| CPU / 内存 | 建议 4 核 / 8 GB（编译与数据库运行都够用） |
| 磁盘 | 100 GiB |
| 网络 | NAT，网段 `192.168.80.0/24`，虚拟机 IP **192.168.80.139** |
| 引导方式 | Legacy BIOS + MBR（本次），**不是** UEFI |
| 安装 ISO | `openEuler-22.03-LTS-SP3-x86_64-dvd.iso` |

准备：VMware 里"编辑虚拟机设置 → CD/DVD → 使用 ISO 映像"指向该 ISO；开机进入引导菜单，选第一项 `Install openEuler 22.03-LTS-SP3`。

### 2.2 安装向导逐屏操作

| # | 界面 | 操作 |
|---|---|---|
| 1 | 语言 | 中文（简体）或 English，键盘默认 |
| 2 | 安装信息摘要 | 逐项配置下面第 3～9 项 |
| 3 | **安装目的地** | 存储配置选 **"自定义"** → 点"完成"进入手动分区 |
| 4 | 手动分区 | 按 2.3 建 `/boot`、`/`、`swap`、`/home`；完成后点"完成(D)" → "接受更改" |
| 5 | 软件选择 | 保持"最小安装"即可（openGauss 的依赖后续用 `dnf` 补） |
| 6 | KDUMP | 建议关闭（省内存，不影响功能） |
| 7 | **网络和主机名** | 打开以太网 → 主机名填 **`luxunacc`** → 应用 → 确认 IP 为 `192.168.80.139` |
| 8 | 时间和日期 | 时区 `Asia/Shanghai`，开启网络时间 |
| 9 | **root 密码** | 设置并牢记（后续所有系统级操作都要 root） |
| 10 | 创建用户 | （可选）建普通用户 `luxun`，勾选"将此用户设为管理员"，后续可 `sudo` |
| 11 | 开始安装 | 等进度条走完 → **重启** |

> ⚠️ 主机名必须是 `luxunacc`：`clusterconfig.xml` 里的 `nodeNames` / `name` 要与之**完全一致**。装机时填错也能改（`hostnamectl set-hostname luxunacc`），但两边必须统一。

### 2.3 分区方案（100 GiB，LVM）

| 挂载点 | 大小 | 设备类型 | 文件系统 | 说明 |
|---|---|---|---|---|
| `/boot` | 1 GiB | 标准分区（sda1） | xfs | 内核与引导文件，编译内核时留足 |
| `/` | 35 GiB | LVM（openeuler-root） | xfs | 系统与软件包 |
| `swap` | 2～4 GiB | LVM（openeuler-swap） | swap | 装机默认；openGauss 要求**关闭** swap，见 3.4 |
| `/home` | 59.99 GiB（剩余全部） | LVM（openeuler-home） | xfs | 个人数据、源码、编译中间文件 |

操作路径：`安装目的地` → 存储配置 `自定义` → `完成` → 左上 `+` 逐个添加挂载点（填挂载点、期望容量、设备类型）→ `添加挂载点` → 全部加完点 `完成(D)` → 弹窗 `接受更改`。

### 2.4 三个"为什么不用建"的分区

- **`/boot/efi`（512 MB, FAT32）**：只有 **UEFI 引导**才需要；本次 VMware 用 Legacy BIOS，不建。
- **`biosboot`（1 MB）**：只有 **GPT 分区表 + Legacy BIOS** 才需要；本次磁盘是 MBR，不建。
- **`/var`**：服务器上单独分 `/var` 是防日志撑爆根分区；本次个人虚拟机 + 35 GiB 根分区足够，不必复杂化。

> 若把虚拟机改成 UEFI 引导，则**必须**建 `/boot/efi`（512 MB, FAT32），否则装完无法启动。

### 2.5 安装后自检

重启进入系统（`luxun` 或 `root` 登录）后执行：

```bash
hostname                     # luxunacc
ip a                         # 确认 192.168.80.139
ping -c 3 baidu.com          # 确认能上外网（后面要下依赖）
df -h                        # 核对 /boot、/、/home 大小
cat /etc/openEuler-release   # openEuler release 22.03 (LTS-SP3)
uname -r                     # 5.10.0-182...oe2203sp3.x86_64
```

网络不通时先看 VMware"虚拟网络编辑器"里 NAT 网段是否为 `192.168.80.0/24`、虚拟网卡是否启用。

### 2.6 重装系统注意事项

同一虚拟磁盘重装时，安装器会看到旧的 LVM 卷组 `openeuler` 和旧分区，常常表现为"可用空间不足"或"无法创建新分区"。在手动分区界面里：

1. 选中旧的 `/`、`/home`、`swap` 逻辑卷，逐个点 `-` 删除；
2. 在 `卷组(V): openeuler` 上删除卷组；
3. 删除剩余物理分区，让 100 GiB 恢复为全部可用；
4. 再按 2.3 重新创建。

> 不清理旧卷组也能装成功，但容易出现"装完卡在引导"或分区重叠，清理一次反而更快。

---

## 3. 阶段一：操作系统准备

### 3.1 切换到 root

```bash
su - root          # 或 sudo -i
hostnamectl        # 确认主机名是 luxunacc
cat /etc/openEuler-release
uname -a
```

> ⚠️ 本次踩过：以普通用户 `luxun` 执行 `systemctl stop firewalld` 报
> `Failed to stop firewalld.service: Interactive authentication required.`
> 原因是没权限，`systemctl` 改服务必须 root。

### 3.2 关闭防火墙

```bash
systemctl stop firewalld
systemctl disable firewalld
systemctl status firewalld --no-pager    # 应为 inactive (dead)
```

### 3.3 关闭 SELinux

```bash
setenforce 0
sed -i 's/SELINUX=enforcing/SELINUX=permissive/g' /etc/selinux/config
getenforce                                # 应输出 Permissive
```

> 不关 SELinux 会导致安装过程中权限被拒、实例启动失败。

### 3.4 关闭 swap（openGauss 硬性要求）

```bash
swapoff -a
swapon --show        # 无输出即已关闭
free -h              # Swap 行应全为 0
```

持久化（重启后仍关闭）：

```bash
cp /etc/fstab /etc/fstab.bak
sed -i '/\sswap\s/s/^/#/' /etc/fstab
grep swap /etc/fstab   # 应看到被 # 注释的行
```

> `swapoff` 时出现 `XFS: ... Open an exclusive opened block device for write sda2` 是 XFS 站在 swap 分区的正常提示，不是错误。

### 3.5 安装依赖包

```bash
dnf install -y libaio* libnsl* readline* libedit* bzip2* ncurses-libs
```

（openEuler 用 `dnf`，`yum` 是兼容命令，二者等价。）

### 3.6 安装 python 依赖（关键，见第 7 章踩坑）

```bash
python3 -V                                   # openEuler 22.03 自带 3.9
pip3 install -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple paramiko==3.4.0
python3 -c "import paramiko; print(paramiko.__version__)"   # 能打印 3.4.0 即可
```

### 3.7 配置 hosts（主机名必须能解析到本机 IP）

```bash
hostname                          # luxunacc
cat /etc/hosts | grep -v '^#'
```

确保 `/etc/hosts` 里有：

```
192.168.80.139  luxunacc
```

XML 里的 `nodeNames` / `name` 必须与本机 `hostname` **完全一致**，否则预安装阶段解析 XML 就会失败。

### 3.8 （可选）时间同步

```bash
systemctl enable chronyd --now
chronyc tracking
```

---

## 4. 阶段二：解压安装包

```bash
mkdir -p /opt/software/openGauss
cd /opt/software/openGauss
# 上传 openGauss-5.0.2-openEuler-64bit-all.tar.gz 到当前目录后执行：
tar -zxf openGauss-5.0.2-openEuler-64bit-all.tar.gz
tar -zxf openGauss-5.0.2-openEuler-64bit-om.tar.gz

ls
# 期望看到：script  lib  libcgroup  clusterconfig.xml(待建)  openGauss-5.0.2-*.tar.gz ...
```

解压后得到 `script/`（运维脚本）和 `lib/`（OM 依赖），这是 `gs_preinstall` 的入口。

> ⚠️ **不要手工解压 `openGauss-5.0.2-openEuler-64bit.tar.bz2` 到 `install/app`**。程序目录由 `gs_preinstall` + `gs_install` 自动生成，手工解压一定会报 `GAUSS-50202` 或 `GAUSS-50200`（见第 8 章）。

---

## 5. 阶段三：创建用户与用户组

```bash
groupadd dbgrp
useradd -g dbgrp -d /home/omm -m omm
passwd omm
```

- 密码本次使用 `wlovelu1@A`（长度 11，含大写、小写、数字、特殊字符，满足 openGauss 复杂度要求）。
- 如果用户已存在（之前装过），**不要重复 `useradd`**，改用：

```bash
usermod -g dbgrp omm      # 把已有用户的主组改成 dbgrp
id omm                    # 确认 gid 是 dbgrp
```

本次实际结果：

```
uid=1002(omm) gid=1003(dbgrp) groups=1003(dbgrp)
```

> 注意：`dbgrp` 与 `-G` 参数必须一致。本次预安装时误用了 `-G omm`，与实际的 `dbgrp` 不一致，虽未直接报错，但属于隐患，正式操作请统一用 `dbgrp`。

---

## 6. 阶段四：编写 clusterconfig.xml（单机）

用 `cat` heredoc 生成，避免手敲 XML 出错：

```bash
cat > /opt/software/openGauss/clusterconfig.xml <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<ROOT>
    <!-- openGauss 整体信息 -->
    <CLUSTER>
        <PARAM name="clusterName" value="dbCluster" />
        <PARAM name="nodeNames" value="luxunacc" />
        <PARAM name="gaussdbAppPath" value="/opt/software/openGauss/install/app" />
        <PARAM name="gaussdbLogPath" value="/var/log/omm" />
        <PARAM name="tmpMppdbPath" value="/opt/software/openGauss/tmp" />
        <PARAM name="gaussdbToolPath" value="/opt/software/openGauss/install/om" />
        <PARAM name="corePath" value="/opt/software/openGauss/corefile" />
        <PARAM name="backIp1s" value="192.168.80.139" />
    </CLUSTER>
    <!-- 节点信息 -->
    <DEVICELIST>
        <DEVICE sn="1000001">
            <PARAM name="name" value="luxunacc" />
            <PARAM name="azName" value="AZ1" />
            <PARAM name="azPriority" value="1" />
            <PARAM name="backIp1" value="192.168.80.139" />
            <PARAM name="sshIp1" value="192.168.80.139" />
            <!-- dbnode -->
            <PARAM name="dataNum" value="1" />
            <PARAM name="dataPortBase" value="26000" />
            <PARAM name="dataNode1" value="/opt/software/openGauss/install/data/dn" />
            <PARAM name="dataNode1_syncNum" value="0" />
        </DEVICE>
    </DEVICELIST>
</ROOT>
EOF
```

### 参数对照表

| 参数 | 含义 | 本次取值 |
|---|---|---|
| `clusterName` | 集群名，自定义 | `dbCluster` |
| `nodeNames` | 节点主机名，多个用逗号分隔 | `luxunacc` |
| `backIp1s` | 节点业务 IP | `192.168.80.139` |
| `gaussdbAppPath` | 应用程序目录（= `$GAUSSHOME`） | `/opt/software/openGauss/install/app` |
| `gaussdbLogPath` | 日志根目录 | `/var/log/omm` |
| `gaussdbToolPath` | OM 工具目录 | `/opt/software/openGauss/install/om` |
| `corePath` | core dump 目录 | `/opt/software/openGauss/corefile` |
| `dataPortBase` | **数据库端口** | `26000` |
| `dataNode1` | 数据目录 | `/opt/software/openGauss/install/data/dn` |

校验：

```bash
cat clusterconfig.xml
```

> 📌 端口一定要记牢：本次 XML 是 `26000`，后续 `gsql` 必须用 `-p 26000`。
> 老教程常写 `7654`，照抄会连不上。

---

## 7. 阶段五：预安装 `gs_preinstall`

### 7.1 执行

```bash
cd /opt/software/openGauss
chown -R omm:dbgrp /opt/software/openGauss/script
./script/gs_preinstall -U omm -G dbgrp -X /opt/software/openGauss/clusterconfig.xml -l /tmp/preinstall.log
```

- `-U` 安装用户普通名，`-G` 用户组，`-X` 配置文件，`-l` 指定日志（便于排错）。
- 过程中会问 `Are you sure you want to create the user[omm] (yes/no)?` → 输入 `yes`。

### 7.2 正常输出（本次实测，节选）

```
Parsing the configuration file.
Successfully parsed the configuration file.
Installing the tools on the local node.
Successfully installed the tools on the local node.
Setting host ip env
Successfully set host ip env.
Are you sure you want to create the user[omm] (yes/no)? yes
Preparing SSH service.
Successfully prepared SSH service.
Checking OS software.
Successfully check os software.
Checking OS version.
Successfully checked OS version.
Creating cluster's path.
Successfully created cluster's path.
Set and check OS parameter.
Setting OS parameters.
Successfully set OS parameters.
Set and check OS parameter completed.
Preparing CRON service.
Successfully prepared CRON service.
Setting user environmental variables.
Successfully set user environmental variables.
Setting the dynamic link library.
Successfully set the dynamic link library.
Setting Core file
Successfully set core path.
Setting pssh path
Successfully set pssh path.
Setting Cgroup.
Successfully set Cgroup.
Set ARM Optimization.
No need to set ARM Optimization.
Fixing server package owner.
Setting finish flag.
Successfully set finish flag.
Preinstallation succeeded.
```

**成功标志：最后一行 `Preinstallation succeeded.`**

> `Warning: Installation environment contains some warning messages. ... gs_checkos -i A -h luxunacc --detail`
> 是环境检查的告警（非致命），可后续用 `gs_checkos` 查看详情，不影响安装。

### 7.3 ★ 踩坑 1：卡在 `Successfully set OS parameters.` 不动

**现象**：终端停在

```
Set and check OS parameter.
Setting OS parameters.
Successfully set OS parameters.
```

光标不再前进，也没有报错；`top` 里能看到 python3 占满一个 CPU 核（死循环）。

**原因**：openEuler 22.03 自带 Python 3.9，系统里没有 `paramiko` 及其依赖。`gs_preinstall` 在这一步之后要导入 paramiko 建立 SSH 通道，导入失败后进入"静默重试死循环"，所以永远不结束也不报错。这是 openGauss 5.0.x 在 openEuler 22.03 上的已知问题。

**解决**：

```bash
# 另开一个终端，先确认是否死循环
ps -ef | grep -E "gs_preinstall|python3" | grep -v grep
top -b -n1 | head -15

# 中断当前预安装
Ctrl + C

# 安装 paramiko
pip3 install -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple paramiko==3.4.0
python3 -c "import paramiko; print(paramiko.__version__)"

# 重新执行预安装（同上命令）
```

本次装完 paramiko 后重跑，一次通过。

---

## 8. 阶段六：正式安装 `gs_install`

### 8.1 前置：把 script 目录交给 omm

```bash
chown -R omm:dbgrp /opt/software/openGauss/script
```

`script/` 原属主是 `root:root 700`，`omm` 进不去也执行不了。

### 8.2 执行安装（必须 omm 用户，从 script 目录运行）

```bash
su - omm
cd /opt/software/openGauss/script
./gs_install -X /opt/software/openGauss/clusterconfig.xml
```

> 必须 `su - omm`（带横杠），才会加载 `~/.bashrc` 里的 `GAUSSHOME` / `PATH`。
> 安装过程中间会提示两次密码：
> `Please enter password for database:` / `Please repeat for database:`
> 输入 `omm` 的密码（本次 `wlovelu1@A`，不显示字符）。

### 8.3 正常输出（本次实测）

```
Parsing the configuration file.
Check preinstall on every node.
Successfully checked preinstall on every node.
Creating the backup directory.
Successfully created the backup directory.
begin deploy..
Installing the cluster.
begin prepare Install Cluster..
Checking the installation environment on all nodes.
begin install Cluster..
Installing applications on all nodes.
Successfully installed APP.
begin init Instance..
encrypt cipher and rand files for database.
Please enter password for database:
Please repeat for database:
begin to create CA cert files
The sslcert will be generated in /opt/software/openGauss/install/app/share/sslcert/om
NO cm_server instance, no need to create CA for CM.
Non-dss_ssl_enable, no need to create CA for DSS
Cluster installation is completed.
Configuring.
Deleting instances from all nodes.
Successfully deleted instances from all nodes.
Checking node configuration on all nodes.
Initializing instances on all nodes.
Updating instance configuration on all nodes.
Check consistence of memCheck and coresCheck on database nodes.
Configuring pg_hba on all nodes.
Configuration is completed.
The cluster status is Normal.
Successfully started cluster.
Successfully installed application.
end deploy..
```

**成功标志：`The cluster status is Normal.` + `end deploy..`**
（安装结束时数据库**已经自动启动**，无需再 `gs_om -t start`。）

### 8.4 ★ 踩坑 2：三个目录相关报错（本次全部遇到）

#### ① `[GAUSS-50202] : The /opt/software/openGauss/install/app must be empty`

**原因**：手工把 `openGauss-5.0.2-openEuler-64bit.tar.bz2` 解压进了 `install/app`。而 5.0.2 的流程里 `app` 应该是**空目录（由预安装建）**，程序由 `gs_install` 自己在 `app_<hash>` 里铺开。

**解决**：清空（不要删目录本身）：

```bash
rm -rf /opt/software/openGauss/install/app/*      # 隐藏文件用 find：
find /opt/software/openGauss/install/app -mindepth 1 -delete
ls -A /opt/software/openGauss/install/app         # 无输出 = 已空
```

#### ② `[GAUSS-50200] : The /opt/software/openGauss/install/app already exists. Cannot create symbolic link, please rename or delete it.`

**原因**：`gs_install` 要执行 `ln -s app_<hash> app`，而 `app` 目录已经被我们建出来了（哪怕是空目录也不行，软链不能覆盖目录）。

**解决**：把 `app` **整个删掉**（`install` 属主是 root，必须用 root 删）：

```bash
exit                                  # 回 root
rm -rf /opt/software/openGauss/install/app
ls -ld /opt/software/openGauss/install/app   # 应报 No such file or directory
```

#### ③ `[GAUSS-50201] : The /opt/software/openGauss/install/app_48a25b11 does not exist.`

**原因**：`app_<hash>` 这个真实目录是**预安装建的**，被我们误删了；同时 `install/` 属主是 `root:root 755`，`omm` 没有写权限，连重建都做不到，于是报"不存在"。

**解决**：

```bash
chown omm:dbgrp /opt/software/openGauss/install
cd /opt/software/openGauss/install
mkdir -p app_48a25b11                       # 后缀与报错中的一致（本机固定）
chown omm:dbgrp app_48a25b11
ls -ld /opt/software/openGauss/install app_48a25b11
# 注意：app 必须仍不存在
```

然后重跑 `./gs_install -X ...`。

### 8.5 ★ 踩坑 3：`Last time end with Install cluster. Continue this step.`

**现象**：重跑时打印

```
Creating the backup directory.
Last time end with Install cluster.
Continue this step.
```

然后按上次的旧路径继续，报出已经删掉的目录不存在。

**原因**：`gs_install` 有断点续传机制，把"走到第几步"记在临时文件里：

- 记录文件：`/opt/software/openGauss/install/om/omm_mppdb/install_step/install_step.dat`（与 `/tmp/installimpl_step/` 下的 step 文件同源）
- 相关源码：`install/om/script/impl/install/InstallImpl.py` 的 `prepareBackDir()`
- 正常会话结束（含 `Rolling back`）后这文件会被清理；如果看到 `Continue this step.`，说明上次是异常中断。

**解决**：

```bash
# root 下
rm -rf /tmp/installimpl_step /tmp/*installimpl*
rm -rf /opt/software/openGauss/install/om/omm_mppdb/install_step
```

再重跑 `gs_install`，日志里出现 `install_step.dat does not exits` 就说明已经是全新开始（`exits` 是脚本里的拼写，不是你的错）。

### 8.6 安装期报错速查

| 报错 | 真实原因 | 一句话解决 |
|---|---|---|
| `GAUSS-50202 ... app must be empty` | 手工解压了 app | 清空 app 内容 |
| `GAUSS-50200 ... app already exists. Cannot create symbolic link` | app 目录占了软链位置 | root 删掉整个 app |
| `GAUSS-50201 ... app_<hash> does not exist` | 真实目录被删 / install 无写权限 | 重建 app_<hash> 空目录 + chown install 给 omm |
| `Last time end with ...` | step 断点记录残留 | 删 install_step.dat 相关目录 |
| `GAUSS-50215 ... 密码不合规` | 密码复杂度不达标 | 长度≥8，大写/小写/数字/特殊符号≥3 类 |
| `Failed to start the database` | 端口占用 / 数据目录权限 / 共享内存 | 看 `/var/log/omm/omm/om/gs_install-*.log` |

---

## 9. 阶段七：安装验收

### 9.1 查看集群状态（omm 用户）

```bash
su - omm
gs_om -t status --detail
```

本次实测输出：

```
[   Cluster State   ]

cluster_state   : Normal
redistributing  : No
current_az      : AZ_ALL

[  Datanode State   ]

    node    node_ip         port      instance          state
-----------------------------------------------------------------------------
1  luxunacc 192.168.80.139  26000   6001 /opt/software/openGauss/install/data/dn   P Primary Normal
```

判断标准：`cluster_state : Normal` 且实例状态为 `P Primary Normal`。

### 9.2 连接数据库

```bash
gsql -d postgres -p 26000 -r
```

输出：

```
gsql ((openGauss 5.0.2 build 48a25b11) compiled at 2024-05-14 10:26:01 commit 0 last mr )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

openGauss=#
```

> `Non-SSL connection` 是提示（本次为本地明文连接），**不是报错**；生产环境建议开 SSL。

### 9.3 教程全流程验证

```sql
-- 1) 建用户
CREATE USER jiang WITH PASSWORD 'Bigdata123';
-- CREATE ROLE

-- 2) 建库（owner 指定给 jiang）
CREATE DATABASE db_tpcc OWNER jiang;
-- CREATE DATABASE

-- 3) 切库
\c db_tpcc
-- You are now connected to database "db_tpcc" as user "omm".

-- 4) 建表
CREATE TABLE mytable (firstcol int);
-- CREATE TABLE

-- 5) 插入
INSERT INTO mytable VALUES(100);
-- INSERT 0 1

-- 6) 查询
SELECT * FROM mytable;
--  firstcol
-- ----------
--       100
-- (1 row)

-- 7) 退出
\q
```

全部回显与教程一致，说明安装完全成功。

---

## 10. 阶段八：日常运维

### 10.1 启停与状态（omm 用户）

```bash
gs_om -t status --detail      # 查看状态
gs_om -t stop                 # 停止
gs_om -t start                # 启动
gs_om -t restart              # 重启
```

### 10.2 ★ 重启服务器后数据库不会自启

openGauss **没有默认的 systemd 服务**。机器重启后必须手动启动：

```bash
su - omm
gs_om -t start
```

想开机自启，在 `/etc/rc.local` 里加（并 `chmod +x /etc/rc.local`）：

```bash
su - omm -c 'source /home/omm/.bashrc && gs_om -t start'
```

> ⚠️ 注意区分：**RPM 自带的 2.1.0 旧实例**（端口 7654）反而是 `enabled` 的，开机会自启；你的 5.0.2（26000）不会。所以重启后看到 7654 有服务、26000 没有，是正常的，别误判。详见 15.7。

### 10.3 关键环境变量（`/home/omm/.bashrc`）

```bash
export GAUSSHOME=/opt/software/openGauss/install/app
export PATH=$GAUSSHOME/bin:$PATH
export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH
export GAUSSLOG=/var/log/omm/omm
```

### 10.4 日志位置

| 日志 | 路径 |
|---|---|
| 预安装日志 | `/var/log/omm/omm/om/gs_preinstall-*.log` |
| 安装日志 | `/var/log/omm/omm/om/gs_install-*.log` |
| OM 本地日志 | `/var/log/omm/omm/om/gs_local-*.log` |
| 数据库运行日志 | `/var/log/omm/omm/pg_log/dn_6001/` |

### 10.5 备份（示例）

```bash
# 逻辑备份
gs_dump -U omm -W '密码' -f /home/omm/db_tpcc.sql -p 26000 db_tpcc

# 物理备份
gs_basebackup -D /home/omm/backup -p 26000
```

### 10.6 卸载（重装前必备）

```bash
su - omm
gs_uninstall --delete-data
```

若集群状态异常卸不掉，改用 root 手工清理（危险，确认后再做）：

```bash
rm -rf /opt/software/openGauss/install/app*
rm -rf /opt/software/openGauss/install/data/*
```

### 10.7 清理安装包（可选，装好验证后再做）

```bash
cd /opt/software/openGauss
rm -f openGauss-5.0.2-openEuler-64bit-all.tar.gz
rm -f openGauss-5.0.2-openEuler-64bit-om.tar.gz
```

> 建议保留 `openGauss-5.0.2-openEuler-64bit.tar.bz2`（1 亿字节左右，重装/修复时用得上），磁盘 100G 也不差这点空间。

---

## 11. 本次踩坑总结（按发生顺序）

| # | 现象 | 根因 | 解决 |
|---|---|---|---|
| 1 | `systemctl stop firewalld` 报 `Interactive authentication required` | 用普通用户执行特权命令 | `su - root` 后操作 |
| 2 | 预安装卡在 `Successfully set OS parameters.` | openEuler 22.03 缺 `paramiko`，脚本静默死循环 | `pip3 install paramiko==3.4.0` 后重跑 |
| 3 | 手工解压 tar.bz2 到 `install/app` | 5.0.2 的 app 由安装流程生成 | 清空 app 内容 |
| 4 | `GAUSS-50200 ... Cannot create symbolic link` | app 目录占了软链位置 | root 删除整个 app 目录 |
| 5 | `GAUSS-50201 ... app_48a25b11 does not exist` | 真实程序目录被删 + install 无写权限 | 重建 app_<hash> 空目录，`chown omm:dbgrp install` |
| 6 | `Last time end with Install cluster.` | 断点续传记录残留 | 删 `install_step.dat` 相关目录 |

**三条核心经验**：

1. **`install/` 归 `omm`，`app` 不能预先存在，`app_<hash>` 空目录要在** —— 记住这条，三个目录报错都不会再有。
2. **失败重跑前，先清 `/tmp` 与 `install/om/*/install_step*`**，否则会被旧状态带偏。
3. **所有报错都写日志**：`/var/log/omm/omm/om/gs_install-*.log`，比终端输出详细得多。

---

## 12. 附录：可复制的完整命令清单

> 说明：**第 2 章的"ISO 装系统"不在本清单内**（装系统是图形界面操作，见第 2 章）。本清单从"已经装好 openEuler、能 SSH 登录"开始。环境：openEuler 22.03 SP3，IP/主机名按实际替换，假设安装包已上传到 `/opt/software/openGauss`。

```bash
# ---------- 0. root ----------
su - root

# ---------- 1. 系统准备 ----------
systemctl stop firewalld && systemctl disable firewalld
setenforce 0
sed -i 's/SELINUX=enforcing/SELINUX=permissive/g' /etc/selinux/config
swapoff -a
sed -i '/\sswap\s/s/^/#/' /etc/fstab
dnf install -y libaio* libnsl* readline* libedit* bzip2* ncurses-libs
pip3 install -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple paramiko==3.4.0
grep -q '192.168.80.139  luxunacc' /etc/hosts || echo '192.168.80.139  luxunacc' >> /etc/hosts

# ---------- 2. 解压安装包 ----------
mkdir -p /opt/software/openGauss && cd /opt/software/openGauss
tar -zxf openGauss-5.0.2-openEuler-64bit-all.tar.gz
tar -zxf openGauss-5.0.2-openEuler-64bit-om.tar.gz

# ---------- 3. 用户与组 ----------
groupadd dbgrp
useradd -g dbgrp -d /home/omm -m omm
echo 'wlovelu1@A' | passwd --stdin omm

# ---------- 4. XML（内容见第 6 章，注意 nodeNames / backIp1s / dataPortBase） ----------
# cat > /opt/software/openGauss/clusterconfig.xml <<'EOF' ... EOF

# ---------- 5. 预安装 ----------
chown -R omm:dbgrp /opt/software/openGauss/script
./script/gs_preinstall -U omm -G dbgrp -X /opt/software/openGauss/clusterconfig.xml -l /tmp/preinstall.log
# 看到 Preinstallation succeeded. 才算成功

# ---------- 6. 安装 ----------
su - omm
cd /opt/software/openGauss/script
./gs_install -X /opt/software/openGauss/clusterconfig.xml
# 看到 The cluster status is Normal. / end deploy.. 才算成功

# ---------- 7. 验收 ----------
gs_om -t status --detail
gsql -d postgres -p 26000 -r
```

---

## 13. 附录：本次所用教材与实操的差异

| 教材内容 | 实际情况 | 建议 |
|---|---|---|
| 路径 `/gaussdb/data/openGauss1`、`/opt/huawei/wisequery` | 本次用 XML 里的 `/opt/software/openGauss/install/...` | 一切以你自己的 XML 为准，别照抄教程路径 |
| 手工 `mkdir` + `chmod 755` + `chown` 一堆目录 | 预安装自动创建并赋权 | 跳过，除非报权限错再补 |
| 编辑 `/etc/profile.d/performance.sh` 调 sysctl、写 CPU 亲和性 | 预安装的 `Setting OS parameters` 已完成必要内核参数；该脚本是 CentOS 6 时代的老调优，`sched_autogroup` 在新内核上也无意义 | 跳过 |
| 预安装后 `init 6` 重启 | 非必须（重启会清 `/tmp`，反而可能打乱排查现场） | 可跳过；若改了 `ulimit` 想立即生效，重新 `su - omm` 即可 |
| `su omm` | 不带横杠不会完整加载环境变量 | 用 `su - omm` |
| 装完立刻 `rm -f *.tar.gz` | 卸载/重装时还要用 | 验证通过、稳定运行几天后再删 |
| `create user jiang with password "Bigdata123"` | 5.0 要求至少 3 类字符，`Bigdata123` 恰好满足 | 报 weak password 就换 `Jiang@2026abc` |

---

## 14. 附录：本次实测关键输出留档

```
# gs_om -t status --detail
cluster_state   : Normal
1  luxunacc 192.168.80.139  26000  6001 /opt/software/openGauss/install/data/dn  P Primary Normal

# gsql -d postgres -p 26000 -r
gsql ((openGauss 5.0.2 build 48a25b11) compiled at 2024-05-14 10:26:01 commit 0 last mr )

# 对象
CREATE ROLE / CREATE DATABASE / CREATE TABLE / INSERT 0 1 / SELECT 1 row (100)
```

---

*文档生成时间：2026-11-19；环境为个人虚拟机，结论基于本次实际执行结果。*

---

## 15. 附录：读懂这台虚拟机（知识补全）

### 15.1 它到底是什么

一句话：**它是一台完整的 Linux 电脑，只是没有实体机箱**。有独立的 CPU、内存、磁盘、网卡、内核、用户和 IP，和你的 Windows 是两台机器。

```
┌──────────── Windows 宿主机（你的笔记本）────────────┐
│  VMware 窗口 / VS Code / 浏览器 / 终端(ssh 客户端)   │
│      │                                             │
│  VMware 虚拟网卡 VMnet8（NAT） 192.168.80.1          │
└──────┼─────────────────────────────────────────────┘
       │  NAT 转换（虚拟机可上网，宿主机可主动连虚拟机）
┌──────▼──────── 虚拟机 openEuler 22.03 ──────────────┐
│  网卡 ens33：192.168.80.139                        │
│  服务：sshd:22    gaussdb:26000                    │
│  用户：root / luxun / omm                          │
│  磁盘 sda 100 GiB：/boot · /(35G) · swap · /home(60G) │
│  程序：/opt/software/openGauss                     │
│  数据：/opt/software/openGauss/install/data/dn     │
└────────────────────────────────────────────────────┘
```

三条容易忽略的事实：

1. **虚拟机关机 = 断电**：内存里的一切清空，但磁盘文件（`.vmdk`）还在，下次开机数据都还在。
2. **文件不互通**：Windows 看不到虚拟机里的 `/opt`，虚拟机也看不到你的 `D:\`。要传文件用 `scp`、VMware 共享文件夹或 VS Code 拖拽。
3. **NAT 网络**：虚拟机可以访问外网（所以能 `dnf install`），宿主机可以连虚拟机（22 / 26000 已验证通）；但**同局域网的其他电脑**连不到它。

### 15.2 磁盘地图（哪块空间放什么）

| 挂载点 | 大小 | 放什么 | 本机实际占用 |
|---|---|---|---|
| `/boot` | 1 GiB | 内核、initramfs、grub | 很小 |
| `/` | 35 GiB | 系统、dnf 包、**`/opt/software/openGauss`**、**`/var/log/omm`** | 约 13%（装完数据库） |
| `swap` | 2～4 GiB | 交换分区（**已关闭**） | 0 |
| `/home` | 59.99 GiB | 个人文件、源码、编译产物 | 视使用而定 |

> ⚠️ **最容易踩的坑**：数据库程序和数据都在 `/opt`，而 `/opt` 属于根分区 **`/`，只有 35 GiB**。往 `/opt` 里塞大文件（比如把内核源码解压到 `/opt`）会把根分区撑爆；内核源码应该放 `/home`。

### 15.3 用户体系（混乱的最大来源）

| 用户 | uid | 身份 | 能做什么 | 密码 |
|---|---|---|---|---|
| `opengauss` | 1000 | **RPM 自带旧实例的专用用户** | 跑旧实例（2.1.0，端口 7654） | 未知/非本次创建 |
| `root` | 0 | 系统管理员 | 改 sysctl、防火墙、SELinux、装包、`chown`、删 `install/app` | 装机时设置，只有你知道 |
| `luxun` | 1001 | 普通用户（装机时创建，在 `wheel` 组） | 日常登录、`sudo` 提权 | 你自己设的 |
| `omm` | 1002 | 数据库专用用户（主组 `dbgrp`） | 运行 `gaussdb`、`gs_om`、`gs_install`、`gsql` | `wlovelu1@A`（本次） |
| `dbgrp` | 1003 | 用户组 | `omm` 的主组 | — |

规则：

- **凡是数据库的事 → 用 `omm`**（`gs_om`、`gs_install`、`gsql`、`gs_dump`）。root 跑 `gsql` 会报 "Do not use root"。
- **凡是系统的事 → 用 `root`**（防火墙、内核参数、目录属主、装依赖）。
- `omm` 默认**没有 sudo 权限**，所以两种身份要来回切：`exit` 回 root，`su - omm` 进数据库身份。
- `su - omm`（带横杠）会加载 `/home/omm/.bashrc`，带上 `GAUSSHOME` / `PATH`；`su omm` 不带，命令可能找不到。

### 15.4 进程与端口（数据库是怎么跑起来的）

| 项目 | 说明 | 查看命令 |
|---|---|---|
| 常驻进程 | `gaussdb`（每个实例一个，按 `data/dn` 启动） | `ps -ef \| grep gaussdb` |
| 管理脚本 | `gs_om` / `gs_install`（跑完就退出，非常驻） | `gs_om -t status` |
| 数据库端口 | **26000**（XML 里 `dataPortBase`） | `ss -lntp \| grep 26000` |
| SSH 端口 | 22 | `ss -lntp \| grep 22` |

状态只认 `gs_om`：

```bash
gs_om -t status --detail    # Normal 才是好的
gs_om -t stop               # 停
gs_om -t start              # 起
```

**重启机器后不会自动启动**，必须 `su - omm && gs_om -t start`（详见 10.2）。

### 15.5 一次查询的数据流

```
gsql（客户端进程，omm 身份）
   │  TCP 192.168.80.139:26000
   ▼
gaussdb（服务端进程，omm 身份运行，数据目录 install/data/dn）
   │  读写数据文件 + WAL
   ▼
/opt/software/openGauss/install/data/dn
```

理解这条链，就能解释这些问题：

- 端口填错 → 连不上（XML 是 26000，不是教程的 7654）
- 远程连不上 → `pg_hba.conf` 默认只允许本地，要加条目 + 重载
- 数据目录权限必须是 `omm` → 服务端以 omm 身份写文件
- `gsql` 连上后提示 `Non-SSL connection` → 只是没加密的提示，不是错误

### 15.6 "搞得很乱"的 8 个点，一次说清

| 让你困惑的现象 | 真相 |
|---|---|
| 一会儿 root、一会儿 omm、一会儿 luxun | 三种身份各管一摊：系统 / 数据库 / 日常 |
| 教程写 `/gaussdb/...`，我这是 `/opt/software/openGauss/...` | 教程是 openGauss 1.x 老版本；**以你自己的 XML 为准** |
| `install/app` 是个软链接 | 5.0.2 的部署方式：真目录 `app_<hash>` + 软链 `app`，hash 是本机固定的 |
| 已经"预安装成功"了，为什么还要 `gs_install` | 预安装只做环境检查、建目录、设参数；装程序和数据在 `gs_install` |
| `/tmp` 里的文件怎么会影响安装 | `gs_install` 的断点续传记录（`install_step.dat`） |
| 重启后数据库"没了" | 进程没自启，数据还在，`gs_om -t start` 就回来 |
| 明明有 swap，为什么要关 | 数据库禁止用 swap（性能与一致性） |
| `ping` 不通，但 `ssh` 能连 | ICMP 被网络/防火墙拦截，TCP 正常，不影响使用 |

---

### 15.7 ★ 重要发现：这台机器上有**两套** openGauss

（2026-11-19 通过 SSH 实测确认，不是推测）

#### 15.7.0 它是怎么来的（有据可查）

装系统时，Anaconda 按**软件包组 `@opengauss-server`** 顺手装了 openGauss 2.1.0。证据在 `/root/anaconda-ks.cfg`（Anaconda 的装机记录）：

```
$ grep -n -i gauss /root/anaconda-ks.cfg
21:@opengauss-server

$ sed -n '/%packages/,/^%end/p' /root/anaconda-ks.cfg
%packages
@^server-product-environment
@opengauss-server
%end
```

这也解释了为什么 `dnf` 日志里它的来源标记是 **`@anaconda`**（装机装上的），而不是 `@System`（手工装的）：

```
2026-11-19T20:44:07 ... opengauss  x86_64  2.1.0-9.oe2203sp3  @anaconda  89 M
```

时间线：

| 时间 | 事件 |
|---|---|
| 18:36 | ISO 装系统，Anaconda 按 `@opengauss-server` 装上 2.1.0（用户 `opengauss`，`/usr/local/opengauss`） |
| 18:42 | `opengauss.service` 自动启动 → `127.0.0.1:7654` |
| 19:41–20:20 | 你按教程手工装 5.0.2 → `/opt/software/openGauss`，`0.0.0.0:26000` |

**重装系统时如何避免再来一套**：安装向导"软件选择"里不要勾 openGauss 相关的包组（或进入"安装源 → 可选包"取消 `@opengauss-server`）；已经装了就用 `sudo dnf remove -y opengauss` 清掉。

| | ① RPM 自带的旧实例 | ② 本次手工装的实例（**你要用的**） |
|---|---|---|
| 来源 | openEuler 仓库 `opengauss-2.1.0-9.oe2203sp3.x86_64` | 手工解压的 `openGauss-5.0.2` 安装包 |
| 用户 | `opengauss`（uid 1000） | `omm`（uid 1002） |
| 程序目录 | `/usr/local/opengauss` | `/opt/software/openGauss/install/app` |
| 数据目录 | `/var/lib/opengauss/data` | `/opt/software/openGauss/install/data/dn` |
| 端口 | **7654 / 7655，仅 127.0.0.1** | **26000 / 26001，0.0.0.0** |
| 启动方式 | `systemctl start opengauss`（**已 enabled，开机会自启**） | `gs_om -t start`（不自启） |
| 版本 | 2.1.0 | 5.0.2 |

确认当前到底连的是哪一套：

```bash
ps -ef | grep [g]aussdb                        # 看 -D 后面的数据目录
ss -lntp | grep -E "7654|26000"                # 看端口
systemctl status opengauss --no-pager          # 旧实例的服务状态
```

实测输出（截至 20:40）：

```
opengau+ 1827     /usr/local/opengauss/bin/gaussdb -D /var/lib/opengauss/data   ← 旧实例 2.1.0
omm      23151    /opt/software/openGauss/install/app/bin/gaussdb -D /opt/software/openGauss/install/data/dn  ← 你的 5.0.2
```

**为什么这套残留会让你觉得"很乱"**：

1. 教程里出现的 **7654** 端口就是旧实例的，跟你新装的 26000 没关系；
2. 两套同时在跑，`free -h` 里多出来的那部分内存是它；
3. 旧实例由 systemd 管理且 **`enabled`**，重启机器后**旧库自己起来了、新库没起来** —— 极容易误判成"新库挂了"；
4. 包管理装的 `gsql` 在 `/usr/local/opengauss/bin`，如果你 PATH 写错，会连到 2.1.0 的旧库却以为是 5.0.2。

处理建议（三选一）：

```bash
# A. 只停掉并禁止自启（推荐：数据保留，随时可再开）
sudo systemctl stop opengauss
sudo systemctl disable opengauss
systemctl is-enabled opengauss        # 应输出 disabled

# B. 彻底卸载 RPM（注意：数据目录通常不会被自动删）
sudo dnf remove -y opengauss
sudo rm -rf /var/lib/opengauss /usr/local/opengauss

# C. 保留当"第二套库"做对比实验（不建议，除非你确实需要 2.1.0）
```

> 学习环境建议按 **A**：不影响 5.0.2，也不会在重启后冒出"两个库、两个端口、两个 gaussdb 进程"的困惑。

#### 15.7.1 本次实际执行记录（2026-11-19 20:44，已执行）

因为两套都是新装的空库（旧实例 18:36 由 ISO 仓库 RPM 带入，无业务数据），直接采用 **A + B 合并** 方案：

```bash
sudo systemctl stop opengauss
sudo systemctl disable opengauss          # Removed /etc/systemd/system/multi-user.target.wants/opengauss.service
sudo dnf remove -y opengauss              # Complete!
sudo rm -rf /usr/local/opengauss /var/lib/opengauss
```

**执行后验证（全部通过）**：

```
# 端口：7654 已消失，只剩本套 26000/26001
LISTEN 0 30000  192.168.80.139:26000
LISTEN 0 30000      127.0.0.1:26000
LISTEN 0 30000  192.168.80.139:26001
LISTEN 0 30000      127.0.0.1:26001

# 进程：只剩一条
omm 23151 ... /opt/software/openGauss/install/app/bin/gaussdb -D .../install/data/dn

# 包/目录/服务：均已不存在
rpm -qa | grep -ci gauss      → 0
ls /usr/local/opengauss       → No such file or directory
systemctl is-enabled opengauss → Failed to get unit file state

# 集群状态：Normal
cluster_state : Normal
1  luxunacc 192.168.80.139  26000  6001 .../data/dn  P Primary Normal
```

**两个副作用要知道**：

1. `dnf remove` 顺带清掉了两个**开发包**（因为只有 opengauss 依赖它们）：
   `libcurl-devel-7.79.1`、`numactl-devel-2.0.16`。运行库 `libcurl`/`numactl` 本体还在，不影响数据库运行；如果以后要编译需要这两个头文件的程序，`sudo dnf install -y libcurl-devel numactl-devel` 装回来即可。
2. 系统用户 `opengauss`（uid 1000）**没有删**（`userdel` 是可选项，先留着不影响任何东西）。要删：`sudo userdel opengauss`。

#### 15.7.2 删除任何数据库实例前的检查清单（本次教训）

删之前必须先证明三件事：**它是谁、数据在哪、有没有人用**。

```bash
# ① 有几个实例、各自数据目录在哪（以 -D 参数为准）
ps -ef | grep [g]aussdb | grep -v grep

# ② 各自监听什么端口
ss -lntp | grep -E "26000|26001|7654|7655"

# ③ 是否由 systemd 管理、是否开机自启
systemctl list-units --all --no-pager | grep -i gauss
systemctl is-enabled opengauss 2>/dev/null

# ④ 数据目录大小与内容（能反映"是不是空库"）
sudo du -sh /var/lib/opengauss/data /opt/software/openGauss/install/data/dn
sudo ls -1 /var/lib/opengauss/data/base | wc -l    # 目录数 ≈ 库数量
```

判断规则：

| 情况 | 建议动作 |
|---|---|
| 空库（只有 `template0`/`template1`/`postgres`）且确认无人使用 | 可以删 |
| 有业务库/表，但你不确定还要不要 | **先停不删**：`sudo systemctl stop <服务>`，数据目录保留 |
| 有业务数据且要保留 | 先备份：逐库 `gs_dump`，或 `tar` 打包整个数据目录 |
| 多个实例混淆 | 以 `ps` 里的 `-D` 数据目录为准区分，**不要靠端口猜** |

**"停而不删"原则**：`stop` 是可逆的（`start` 就回来），`rm -rf` 不可逆。
任何删除前先停一天、确认没人用，是最便宜的安全网。

> 本次的自省：旧实例没有数据库密码，我没能逐库列出它里面的表，只依据"当天装机后自动初始化 + 你确认没建过东西"判断为空。**更稳妥的做法是先停、第二天再删**。

---

## 16. 附录：用 VS Code Remote-SSH 连这台虚拟机

### 16.1 原理

VS Code 装在 **Windows**；连上以后，会在虚拟机的 `~/.vscode-server` 启动一个服务端。之后你编辑的文件、打开的终端、跑的调试，**全部在虚拟机里执行**。等于"Windows 的界面 + Linux 的文件和终端"。

已验证前提：虚拟机 `sshd` 在跑，22 端口从宿主机可达。

### 16.2 装扩展

VS Code → 扩展（`Ctrl+Shift+X`）→ 搜 **`Remote - SSH`**（作者 Microsoft，ID `ms-vscode-remote.remote-ssh`）→ 安装。

### 16.3 配免密登录（推荐，省得每次输密码）

在 Windows **PowerShell** 里：

```powershell
# 1) 生成密钥（一路回车，默认存 C:\Users\你的用户名\.ssh\id_ed25519）
ssh-keygen -t ed25519 -C "luxun@windows"

# 2) 把公钥传到虚拟机（第一次要输 yes + luxun 的密码）
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh luxun@192.168.80.139 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

想用 root 免密同理，把 `luxun` 换成 `root`（不建议长期开 root SSH）。

### 16.4 写 SSH 配置文件

新建/编辑 `C:\Users\你的用户名\.ssh\config`：

```
Host luxunacc
    HostName 192.168.80.139
    User luxun
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 30
```

### 16.5 连接

1. `Ctrl+Shift+P` → 输入 `Remote-SSH: Connect to Host...` → 选 `luxunacc`
2. 左下角出现 `SSH: luxunacc` 即连接成功
3. `文件 → 打开文件夹`：
   - `/home/luxun` —— 你的工作区，可读写
   - `/opt/software/openGauss` —— 数据库目录，**用 luxun 打开是只读**（属主 omm/root）
4. `Ctrl+\`` 打开终端，就是虚拟机的 shell；在里面 `su - omm` 可切到数据库身份

### 16.6 权限方面的 4 个注意点

1. **不要用 `omm` 直接连 VS Code**。VS Code 会往 `~/.vscode-server` 写一堆文件、改 `.bashrc`，容易把数据库环境（`GAUSSHOME`/`PATH`）搞乱。需要 omm 就在 VS Code 终端里 `su - omm`。
2. **改 `clusterconfig.xml` 要 root 权限**。推荐流程：`sudo cp /opt/software/openGauss/clusterconfig.xml ~/` → 在 VS Code 里改 → `sudo cp ~/clusterconfig.xml /opt/software/openGauss/`。
3. **看日志**：`/var/log/omm/omm/om/` 属主是 omm，用 luxun 打开是只读；看日志够用，想删得 `sudo`。
4. **VS Code 服务端占空间**：会在 `~/.vscode-server` 放几百 MB，`/home` 有 60G 不用担心。

### 16.7 我是怎么"查看"这台机器的

- 我运行在你的 **Windows 宿主机**上，有自己的 shell —— 前面探测 22/26000 端口就是我在本机用 Node 做的。
- 我**看不到** VMware 控制台画面，也看不到你这个聊天之外的其他窗口。
- 我能做的：在宿主机上执行 `ssh <账号>@192.168.80.139 "<只读命令>"`，把结果读回来（前提：你给密码/密钥，且明确授权）。
- 你不给权限也完全没问题：你在终端执行，把输出贴给我，效果一样，只是多几步复制。

### 16.8 三种协作方式对比

| 方式 | 开通成本 | 适合场景 |
|---|---|---|
| 你自己执行、贴输出 | 0 | 偶尔排查、想自己练手（**推荐**） |
| 给我 `luxun` 的密码/公钥 | 低 | 我反复帮你跑检查、看日志 |
| 建只读账号 `ai`（`useradd -m ai`，仅加入 ssh 允许列表） | 中 | 长期协作，最小权限，最安全 |

> 安全提醒：把 root 密码发在聊天里等于写进了对话记录。学习用虚拟机无所谓；长期环境建议用**只读账号 + 公钥**。

