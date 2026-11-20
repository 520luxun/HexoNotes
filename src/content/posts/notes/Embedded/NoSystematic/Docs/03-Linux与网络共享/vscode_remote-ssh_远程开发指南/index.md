---
title: "VSCode Remote-SSH 远程开发指南"
published: 2026-11-18
description: "VSCode RemoteSSH 远程开发指南 [!abstract] 本文定位 在 Windows 上用 VSCode 通过 SSH 连接远程 Linux（虚"
tags: ["嵌入式/系统", "开发环境/远程开发", "嵌入式"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/03-Linux与网络共享"
draft: false
order: 76
---

# VSCode Remote-SSH 远程开发指南

> **本文定位**
> 在 Windows 上用 VSCode 通过 SSH 连接远程 Linux（虚拟机 / 服务器 / 开发板），把**编辑、终端、编译、调试、Git** 全部放到远程机上跑，本机只留一个界面。
> 面向嵌入式开发场景：VMware Ubuntu 虚拟机、交叉编译主机、能跑 Linux 的开发板。从零配置到免密登录、端口转发、排错，一篇走完。

> **一页纸速览**
> 最小可用流程（5 步）：
> 1. 远程机装 SSH 服务：`sudo apt install openssh-server`
> 2. 本机 VSCode 装扩展 **Remote - SSH**（微软官方）
> 3. `F1` → `Remote-SSH: Open SSH Configuration File` → 写入 Host 配置
> 4. `F1` → `Remote-SSH: Connect to Host` → 选主机 → 输密码
> 5. 连上后「打开文件夹」，终端与编译都在远程机上
>
> 免密加一步：`ssh-keygen -t ed25519` 生成密钥，把公钥追加到远程机的 `~/.ssh/authorized_keys`。

> **章节速览**
> #🧭 一、Remote-SSH 是什么：原理与心智模型 · #📋 二、准备工作清单 · #🔧 三、远程机配置：装好 SSH 服务 · #💻 四、本机配置：VSCode 与 SSH 客户端 · #🔌 五、第一次连接：逐步走 · #🔑 六、免密登录：SSH 密钥 · #🗂️ 七、连接后的日常使用 · #🌐 八、端口转发：访问远程机上的服务 · #🧩 九、进阶 SSH 配置 · #🎯 十、嵌入式开发典型场景 · #🩺 十一、常见问题排查 · #🔒 十二、安全建议 · #📑 附：命令与配置速查表

## 🧭 一、Remote-SSH 是什么：原理与心智模型

**一句话：界面在本机，干活在远程。**

普通做法（Samba 共享 + 本地 VSCode，见 [Ubuntu共享文件夹配置详解](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/ubuntu共享文件夹配置详解/)）是"把远程的文件拉到本地编辑"，编译还得另开 SSH 终端敲命令。Remote-SSH 反过来：

```text
┌─────────────────────────┐         SSH 加密隧道          ┌──────────────────────────┐
│  Windows 本机            │ ◄──────────────────────────► │  远程 Linux               │
│  VSCode 界面（渲染）      │                              │  vscode-server（后台服务） │
│  键盘鼠标输入             │                              │  文件读写 / 终端 / 编译    │
│                         │                              │  扩展宿主 / 调试器 / Git   │
└─────────────────────────┘                              └──────────────────────────┘
```

- 第一次连接时，VSCode 自动在远程机安装一个 `~/.vscode-server/` 后台服务；
- 之后所有"重活"——文件索引、C/C++ 智能提示、编译、调试、Git——都发生在远程机；
- 本机只传输按键和画面，**断网重连后工作状态还在**（远程进程不丢）；
- 终端打开就是远程机的 shell，`gcc`、`make`、`cmake` 用的都是远程机的工具链。

> **与另外两个"Remote"的区别**
> | 扩展 | 适用目标 | 说明 |
> | --- | --- | --- |
> | **Remote - SSH** | 任何能 SSH 登录的 Linux | 本文主角：虚拟机、服务器、开发板 |
> | **WSL** | 本机 WSL2 发行版 | 走本机内部通道，不需要 SSH，装 WSL 扩展即可（见 [WSL2与Ubuntu完全使用指南](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/wsl2与ubuntu完全使用指南/)） |
> | **Remote - Tunnels** | 无法直连的机器 | 靠微软中转隧道，适合没有公网 IP 又打不了洞的场景 |
>
> 目标是本机 WSL2 时**不要用 Remote-SSH 绕一圈**，直接用 WSL 扩展更快更稳。

## 📋 二、准备工作清单

动手前对照这张表，四项全齐再往下走：

| # | 项目 | 要求 | 怎么确认 |
| --- | --- | --- | --- |
| 1 | 本机 VSCode | 近几年的版本均可 | 帮助 → 关于 |
| 2 | 本机 SSH 客户端 | Windows 10 1809+ 自带 OpenSSH | PowerShell 敲 `ssh -V` 有版本号 |
| 3 | 远程机 SSH 服务 | 安装并运行 openssh-server | 远程机上 `systemctl status ssh` |
| 4 | 网络可达 | 本机能 ping 通 / TCP 连上远程机 22 端口 | `Test-NetConnection <IP> -Port 22` |

> **远程机的硬门槛**
> vscode-server 是预编译的 Node.js 程序，要求远程机 **glibc ≥ 2.28、libstdc++ ≥ 3.4.25**（约等于 Ubuntu 20.04 / Debian 10 及以上）。
> 老开发板（Ubuntu 18.04、Buildroot 精简系统、uclibc/musl 系统）装不上 server，见 #🎯 十、嵌入式开发典型场景 的替代方案。
> 另外远程机需要 **~200 MB 磁盘空间**（server + 扩展）和能访问外网（首次下载 server；离线安装见排错章节）。

## 🔧 三、远程机配置：装好 SSH 服务

以 Ubuntu / Debian 为例（VMware 虚拟机、云服务器、装 Ubuntu 的开发板通用）：

```bash
# 1. 安装 SSH 服务
sudo apt update
sudo apt install -y openssh-server

# 2. 确认服务在跑（Ubuntu 22.04+ 服务名是 ssh，老版本可能是 sshd）
sudo systemctl status ssh
sudo systemctl enable --now ssh

# 3. 查监听端口（默认 22）
sudo ss -tlnp | grep :22

# 4. 查本机 IP（记下它，本机连接要用）
ip addr show
```

如果有防火墙，放行 SSH：

```bash
sudo ufw allow ssh        # Ubuntu 的 ufw
sudo ufw status
```

> **虚拟机网络模式怎么选**
> - **NAT 模式**：虚拟机藏在宿主机后面，外部机器访问不到；只做"宿主机 → 虚拟机"开发够用，IP 一般是 `192.168.x.x`（VMware NAT 网段）。
> - **桥接模式**：虚拟机和宿主机平级接入局域网，局域网内任何设备（包括另一台电脑、手机）都能连，适合多人共用一台开发虚拟机。
> - 仅主机（Host-Only）：只有宿主机能连，最隔离。
> 详见 [WSL2与Ubuntu完全使用指南](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/wsl2与ubuntu完全使用指南/) 中 VMware 安装路线的网络部分。

CentOS / Fedora 系把命令换成：

```bash
sudo dnf install -y openssh-server
sudo systemctl enable --now sshd
sudo firewall-cmd --permanent --add-service=ssh && sudo firewall-cmd --reload
```

## 💻 四、本机配置：VSCode 与 SSH 客户端

### 4.1 确认 Windows 自带 SSH 客户端

PowerShell 里：

```powershell
ssh -V
# 输出类似 OpenSSH_for_Windows_9.x 即可
```

没有的话：设置 → 应用 → 可选功能 → 添加功能 → 搜 "OpenSSH 客户端" 安装。

### 4.2 安装 Remote - SSH 扩展

VSCode 扩展面板（`Ctrl+Shift+X`）搜 **Remote - SSH**（作者 Microsoft，ID `ms-vscode-remote.remote-ssh`）安装。
装一个就够；"Remote Development" 扩展包会连带装 WSL、Dev Containers，按需。

### 4.3 写 SSH 配置文件

`F1` → 输入 `Remote-SSH: Open SSH Configuration File` → 选 `C:\Users\<你的用户名>\.ssh\config`（没有会自动创建）。

写入（按你的实际 IP 和用户名改）：

```text
Host ubuntu-dev
    HostName 192.168.111.128
    User luxun
    Port 22
```

| 字段 | 含义 |
| --- | --- |
| `Host` | 你给这台机器起的**别名**，VSCode 列表里显示的就是它 |
| `HostName` | 真实 IP 或域名 |
| `User` | 远程机的登录用户名 |
| `Port` | SSH 端口，默认 22 可省略 |

可以配多台，一台一段：

```text
Host ubuntu-dev
    HostName 192.168.111.128
    User luxun

Host board
    HostName 192.168.1.50
    User root
    Port 22

Host server-lab
    HostName 10.20.30.40
    User luxun
    Port 2222
```

> **先手动 ssh 一次再上 VSCode**
> 在 PowerShell 里 `ssh luxun@192.168.111.128` 能登录，说明网络、服务、账号都没问题，VSCode 只是复用这条通道。手动都连不上时，先修 SSH 本身（见排错章节），别在 VSCode 里瞎试。

## 🔌 五、第一次连接：逐步走

1. `F1` → `Remote-SSH: Connect to Host...` → 选 `ubuntu-dev`；
2. 首次连接问远程平台，选 **Linux**；
3. 弹出输入框要密码（输入时不回显，正常）；
4. 右下角出现进度：`Setting up SSH host` → 下载并安装 vscode-server（几十秒到几分钟，取决于远程机网速）；
5. 左下角变成绿色 `SSH: ubuntu-dev`，说明连接成功；
6. 资源管理器 → **打开文件夹** → 选远程机上的目录（如 `/home/luxun/projects`）→ 再输一次密码（配免密后不再要）。

连上之后的标志：

- 左下角绿色角标 `SSH: ubuntu-dev`；
- 新建终端（`` Ctrl+` ``）提示符是远程机的；
- 扩展面板分成两栏："本地 - 已安装" 和 "SSH: UBUNTU-DEV - 已安装"。

> **打开文件夹 ≠ 连接成功**
> 只连接不打开文件夹时，终端和文件浏览都不可用。Remote-SSH 的完整能力以"打开远程文件夹"为前提。
> 工作区文件（`.code-workspace`）也保存在远程机上。

断开：左下角绿色角标 → `Close Remote Connection`；或直接关窗口。远程机上已启动的进程（如编译）不会因为你断开而被杀。

## 🔑 六、免密登录：SSH 密钥

每次连接输两三次密码很烦，配密钥后全程无感。原理：本机持有**私钥**，远程机登记你的**公钥**，登录时自动配对。

### 6.1 本机生成密钥对

PowerShell：

```powershell
ssh-keygen -t ed25519 -C "windows-vscode"
# 一路回车：保存路径默认 C:\Users\<你>\.ssh\id_ed25519， passphrase 留空即可
```

得到两个文件：`id_ed25519`（私钥，**绝不外传**）、`id_ed25519.pub`（公钥，随便发）。

### 6.2 把公钥送到远程机

Windows 没有 `ssh-copy-id`，用这条等价命令（PowerShell）：

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh luxun@192.168.111.128 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

输一次密码，之后就免密了。验证：

```powershell
ssh luxun@192.168.111.128   # 应直接进去，不再要密码
```

> **权限是免密失败的第一大原因**
> 远程机上必须满足：`~/.ssh` 是 `700`，`authorized_keys` 是 `600`，家目录不能是组可写。
> SSH 出于安全会**静默拒绝**权限不对的密钥文件，表现为"明明配了还是要密码"。

### 6.3 在 config 里显式指定密钥（多密钥时必做）

```text
Host ubuntu-dev
    HostName 192.168.111.128
    User luxun
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

`IdentitiesOnly yes` 防止 ssh 把本机一堆密钥挨个试一遍（试错次数多了服务器会直接拒绝）。

### 6.4 多台机器复用

公钥可以追加到任意多台远程机的 `authorized_keys`，一把私钥走天下；反过来一台远程机也能登记多个人的公钥。

## 🗂️ 七、连接后的日常使用

### 7.1 扩展要装在"远程端"

C/C++、clangd、CMake Tools、Python 这类**干活的扩展必须装到 SSH 端**才有效：

- 扩展面板里每个扩展有 `Install in SSH: ubuntu-dev` 按钮；
- 主题、图标类扩展装本地即可；
- VSCode 通常会自动把推荐扩展装到远程，认准扩展面板的分组。

嵌入式 C 开发推荐远程端装：`C/C++`（微软）或 `clangd`（二选一，同时开会打架）、`CMake Tools`。

### 7.2 终端与编译

`` Ctrl+` `` 开终端就是远程 shell，直接跑远程工具链：

```bash
arm-linux-gnueabihf-gcc -v    # 用的是远程机装的交叉工具链
make -j$(nproc)               # nproc 是远程机的核数
```

工具链安装与命名规则见 [交叉编译与工具链](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/交叉编译与工具链/)。

### 7.3 Git

Git 操作发生在远程机：远程机要装 `git`、配 `user.name/email`、配它自己的 SSH key（推 GitHub 用的是**远程机的密钥**，不是你 Windows 的）。提交历史、分支状态与本地完全一致，详见 [Git](../../../../../Embedded/NoSystematic/Docs/04-工程协作/git团队协作经验/)。

### 7.4 文件同步的误区

> **不需要任何同步工具**
> Remote-SSH 直接编辑远程文件系统，**不存在"本地副本-远程副本"两份文件**，也就不需要 Samba/rsync/网盘同步。
> 之前用 Samba 共享编辑的项目，切到 Remote-SSH 后直接打开远程目录即可，Samba 可以留着给手机/其他设备访问用。

### 7.5 调试

- **远程 gdb 调试**：C/C++ 扩展的 `cppdbg` 配置里 `"miDebuggerPath": "/usr/bin/gdb"`（或交叉 gdb），程序就在远程跑、远程调；
- 需要 gdbserver 的板级调试，用 `"miDebuggerServerAddress": "localhost:2331"` 之类配合端口转发（见下章）。

## 🌐 八、端口转发：访问远程机上的服务

远程机上跑了 Web 服务 / Jupyter / gdbserver，本机浏览器想访问？Remote-SSH 自动把端口"搬"到本机：

- **自动转发**：远程终端里启动监听端口的程序（如 `python3 -m http.server 8000`），VSCode 检测到后自动转发，本机浏览器开 `http://localhost:8000` 即可；
- **手动转发**：底部面板 **端口（PORTS）** 页 → `Forward a Port` → 填端口号；
- 转发关系在端口面板里可查看、停止、改本机端口。

原理等价于：

```bash
ssh -L 8000:localhost:8000 luxun@192.168.111.128
```

> **嵌入式常用**
> 板子上跑 `gdbserver :2331 ./app`，转发 2331 后，本机 VSCode 的调试配置连 `localhost:2331` 就能远程单步。

## 🧩 九、进阶 SSH 配置

### 9.1 跳板机（ProxyJump）

实验室服务器在内网，要先登录公网跳板机：

```text
Host jump
    HostName jump.example.com
    User luxun
    Port 22

Host lab-server
    HostName 10.20.30.40
    User luxun
    ProxyJump jump
```

VSCode 连 `lab-server` 时自动经 `jump` 中转，两台都配免密后全程无感。

### 9.2 保活与超时

长时间无操作被防火墙/路由器掐断连接，加保活：

```text
Host ubuntu-dev
    HostName 192.168.111.128
    User luxun
    ServerAliveInterval 30
    ServerAliveCountMax 4
```

每 30 秒发一个心跳包，连续 4 次无响应才断开。

### 9.3 VSCode 侧相关设置

`settings.json` 里按需加：

```json
{
  "remote.SSH.configFile": "C:\\Users\\LENOVO\\.ssh\\config",
  "remote.SSH.showLoginTerminal": true,
  "remote.SSH.connectTimeout": 60,
  "remote.SSH.remotePlatform": { "ubuntu-dev": "linux" }
}
```

| 设置 | 作用 |
| --- | --- |
| `remote.SSH.configFile` | 指定 config 路径（默认就是 `~/.ssh/config`） |
| `remote.SSH.showLoginTerminal` | 显示登录终端，**排错必开**：能看到密码提示和报错原文 |
| `remote.SSH.connectTimeout` | 连接超时秒数，慢网调大 |
| `remote.SSH.remotePlatform` | 记住主机平台，不再每次问 |

### 9.4 复用连接（可选提速）

OpenSSH 8.x+ 可在 config 加 `ControlMaster` 复用一条 TCP 连接，多窗口连同一台机时更快。Windows 自带 OpenSSH 对此支持不完整，**收益不大，默认不用配**。

## 🎯 十、嵌入式开发典型场景

### 10.1 VMware Ubuntu 虚拟机（最常见）

1. 虚拟机用 NAT 或桥接，`ip addr` 拿 IP；
2. 按第三、四、五章配好，别名 `ubuntu-dev`；
3. 交叉工具链、源码、编译全放虚拟机里，Windows 只出界面；
4. 烧录工具（如 STM32CubeProgrammer）在 Windows 侧时，编译产物用 `scp` 拉回来，或干脆共享文件夹只放产物。

### 10.2 能跑 Ubuntu 的开发板（树莓派、RK / i.MX 板）

- 系统满足 glibc ≥ 2.28 就直接按本文流程连，板子性能弱时把扩展装少一点（只装 C/C++）；
- 板子在另一网段时配 ProxyJump 或路由器端口映射。

### 10.3 资源受限 / 老系统的板子（server 装不上）

vscode-server 跑不起来的板子，三条退路：

| 方案 | 做法 | 代价 |
| --- | --- | --- |
| **交叉编译主机模式**（推荐） | Remote-SSH 连一台性能好的 Ubuntu 主机/虚拟机，代码和工具链都在它上面，只把产物 `scp` 到板子 | 板子只需 SSH + scp |
| Samba/NFS 共享编辑 | 见 [Ubuntu共享文件夹配置详解](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/ubuntu共享文件夹配置详解/)，本地 VSCode 编辑，另开终端编译 | 智能提示用的是本地环境，头文件路径要手动配 |
| 纯终端 | VSCode 本地开 `ssh` 终端 + vim/nano | 没有图形化调试 |

### 10.4 与 WSL2 的分工

- 代码放 WSL2：用 **WSL 扩展**，不走 SSH；
- 代码放 VMware 虚拟机 / 远程服务器 / 板子：用 **Remote-SSH**；
- 两者可以共存：VSCode 不同窗口分别连不同目标，互不干扰。

## 🩺 十一、常见问题排查

> **排错第一动作**
> 设置里开 `remote.SSH.showLoginTerminal: true`，再连一次，看登录终端里的原始报错；同时看 输出面板 → 下拉选 `Remote - SSH` 的日志。下面按症状对号入座。

### 症状 1：连接超时 / `Could not establish connection`

```powershell
ping 192.168.111.128
Test-NetConnection 192.168.111.128 -Port 22
```

- ping 不通：网络模式问题（NAT 网段变了、虚拟机没开机、桥接没拿到 IP）；
- ping 通但 22 端口不通：远程机 SSH 服务没起（`sudo systemctl status ssh`）或防火墙拦了（`sudo ufw allow ssh`）。

### 症状 2：`Permission denied`

- 密码错 / 用户名错：先在 PowerShell 手动 `ssh user@ip` 验证；
- 配了密钥仍要密码：99% 是远程机权限问题，执行
  `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`；
- 服务器禁用了密码登录（`PasswordAuthentication no`）：只能走密钥。

### 症状 3：卡在 `Setting up SSH host` / server 安装失败

- 远程机没外网：首次需要下载 server。离线办法——在能上网的机器下载对应 commit 的 server 包，解压到远程机 `~/.vscode-server/bin/<commit-id>/`（commit id 在 VSCode 帮助→关于里）；
- 报 `GLIBC_2.28 not found`：系统太老，见 #🎯 十、嵌入式开发典型场景 的替代方案；
- 磁盘满：`df -h ~` 看一眼。

### 症状 4：连接成功但扩展不生效 / 智能提示乱飘

- 扩展装在了本地端：扩展面板找 `Install in SSH: ...` 重装到远程；
- C/C++ 与 clangd 同时启用：禁用其中一个；
- 头文件找不到：`c_cpp_properties.json` 的 `includePath` 与 `compilerPath` 要写**远程机上的路径**（如 `/usr/bin/arm-linux-gnueabihf-gcc`）。

### 症状 5：频繁掉线

- config 加 `ServerAliveInterval 30`（见 9.2）；
- 虚拟机休眠/挂起会断：恢复后 VSCode 一般自动重连，不行就手动重连；
- Wi-Fi 漫游换网段：IP 变了，改用主机名或固定 IP。

### 症状 6：一切正常但就是连不上（玄学）

远程机上的 server 状态损坏时，核弹级重置：

```bash
# 远程机上执行：杀掉并删除 server，下次连接自动重装
pkill -f vscode-server
rm -rf ~/.vscode-server
```

本机侧也可以 `F1` → `Remote-SSH: Kill VS Code Server on Host`。

### 症状 7：`Bad owner or permissions on .ssh/config`

Windows 上 config 文件权限太开放。修复（PowerShell）：

```powershell
icacls "$env:USERPROFILE\.ssh\config" /inheritance:r /grant:r "$env:USERNAME:(R,W)"
```

## 🔒 十二、安全建议

> **三条底线**
> 1. **不要把 22 端口直接暴露到公网**。云主机用安全组限制来源 IP；家里机器用跳板/VPN，或改非标端口 + 仅密钥登录。
> 2. **私钥永不离开本机**：不上传网盘、不发聊天工具、不进 Git 仓库。
> 3. 配好密钥后关闭密码登录（远程机 `/etc/ssh/sshd_config` 设 `PasswordAuthentication no`，然后 `sudo systemctl restart ssh`），暴力破解直接失效。**改之前确认密钥已能登录**，否则把自己锁在外面。

其他好习惯：

- 不同用途用不同密钥对，泄露时可单独吊销（删对应公钥行即可）；
- `authorized_keys` 里每行一个公钥，离职/换机时按行清理；
- 开发板默认密码（root/root 之类）拿到手第一件事就改掉。

## 📑 附：命令与配置速查表

### 本机（Windows PowerShell）

```powershell
ssh -V                                   # 确认客户端存在
ssh luxun@192.168.111.128                # 手动验证连接
ssh-keygen -t ed25519                    # 生成密钥对
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh luxun@192.168.111.128 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
Test-NetConnection 192.168.111.128 -Port 22   # 测端口连通
scp app.bin luxun@192.168.111.128:~/     # 传文件到远程
scp luxun@192.168.111.128:~/app.bin .    # 从远程拉文件
```

### 远程机（Linux）

```bash
sudo apt install -y openssh-server       # 装服务
sudo systemctl enable --now ssh          # 开机自启 + 立即启动
ip addr show                             # 查 IP
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys   # 修权限
pkill -f vscode-server && rm -rf ~/.vscode-server      # 重置 server
df -h ~                                  # 查磁盘
```

### VSCode 命令（F1）

| 命令 | 作用 |
| --- | --- |
| `Remote-SSH: Connect to Host...` | 连接 |
| `Remote-SSH: Connect Current Window to Host...` | 当前窗口直接切到远程 |
| `Remote-SSH: Open SSH Configuration File...` | 编辑 config |
| `Remote-SSH: Kill VS Code Server on Host...` | 重置远程 server |
| `Remote-SSH: Show Log` | 看连接日志 |

### config 模板（直接抄）

```text
Host ubuntu-dev
    HostName 192.168.111.128
    User luxun
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 30
    ServerAliveCountMax 4
```

---

> 相关笔记：[WSL2与Ubuntu完全使用指南](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/wsl2与ubuntu完全使用指南/)（本机 Linux 环境）· [Ubuntu共享文件夹配置详解](../../../../../Embedded/NoSystematic/Docs/03-Linux与网络共享/ubuntu共享文件夹配置详解/)（文件级共享方案）· [交叉编译与工具链](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/交叉编译与工具链/)（远程机上的工具链）· [Git](../../../../../Embedded/NoSystematic/Docs/04-工程协作/git团队协作经验/)（远程机上的版本管理）
