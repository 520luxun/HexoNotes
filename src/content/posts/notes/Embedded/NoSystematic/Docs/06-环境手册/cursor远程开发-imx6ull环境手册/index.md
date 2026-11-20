---
title: "Cursor远程开发-iMX6ULL环境手册"
published: 2026-11-19
description: "Cursor 远程开发 i.MX6ULL 环境搭建与排错手册 本文记录一次真实故障的完整定位与修复：Cursor 通过 RemoteSSH 连接 Ubuntu "
tags: ["嵌入式/系统", "开发环境/远程开发", "开发环境/搭建", "文档/排错"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/06-环境手册"
draft: false
order: 83
---

# Cursor 远程开发 i.MX6ULL 环境搭建与排错手册

> 本文记录一次真实故障的完整定位与修复：Cursor 通过 Remote-SSH 连接 Ubuntu 18.04 虚拟机时，服务端下载反复失败；最终通过**离线安装 Cursor Server** 彻底解决，并整理为可复用的环境搭建流程。

---

## 0. TL;DR（三分钟版）

```bash
# 在远端（VM）执行，路径中的 40 位 commit 需与 Cursor 一致
DEST=$HOME/.cursor-server/bin/linux-legacy-x64/5f54c8173e5552412beb40702adac16275677fa0
mkdir -p "$DEST"
tar -xzf /tmp/cursor-reh.tar.gz -C "$DEST" --strip-components=1
ls "$DEST"        # 必须看到 node bin out extensions product.json
```

然后 Cursor → `Ctrl+Shift+P` → `Remote-SSH: Connect to Host...` → `book@192.168.80.138`。

```jsonc
// 收尾：禁止再次联网下载
"remote.SSH.localServerDownload": "off"
```

---

## 1. 环境清单

| 项目 | 值 |
|---|---|
| 宿主机 | Windows 10（本机），Cursor 桌面版 |
| Cursor 版本 | 3.30.14（commit `5f54c8173e5552412beb40702adac16275677fa0`） |
| Remote-SSH 扩展 | `anysphere.remote-ssh-1.1.17`（Cursor 内置） |
| 虚拟机 | Ubuntu 18.04.2 LTS，内核 `5.4.0-150-generic`，glibc **2.27** |
| VM 账号 / 主机名 | `book` / `100ask` |
| VM 网络 | `192.168.80.138`，网关 `192.168.80.1`（VMware **NAT**，VMnet8） |
| 开发板 | 韦东山（百问网）**i.MX6ULL Pro**，Cortex-A7，512MB DDR3 |
| BSP | Linux **4.9.88** + U-Boot 2016.03 + Linaro `arm-linux-gnueabihf` 交叉工具链 |
| 远端服务端路径 | `~/.cursor-server/bin/linux-legacy-x64/<commit>/` |

> **关键事实**
> Ubuntu 18.04 的 glibc 是 2.27，**低于** Cursor 常规构建与 VS Code 1.86+ 的要求（2.28）。
> 因此 Cursor 为这类系统提供了 `linux-legacy` 构建——这不是"降级凑合"，而是官方支持的运行目标。

---

## 2. 故障现象

连接时 Cursor 的 SSH 日志呈现三段式失败：

```text
1) 远端 wget 下载服务端
   Length: 109940439 (105M)
   Read error at byte 14356016/109940439 (Success). Retrying.
   failed: Connection timed out.          ← 之后所有重试全部超时

2) 退化为"本机下载再拷贝"
   Downloading server from https://downloads.cursor.com/... (本地)
   [error] Error installing server: fetch failed    ← 11 秒即放弃

3) 最终
   [error] Error resolving SSH authority fetch failed
```

同时日志里有两条**重要线索**，证明 SSH 本身是通的、问题只在"下包"：

```text
detectedPlatform==linux-legacy      ← 平台识别正确
nodeExecutable<mark>/home/book/.cursor-server/bin/linux-legacy-x64/<commit>/node</mark>
osVersion<mark>"Ubuntu 18.04.2 LTS"</mark>
```

即：**SSH 层没问题，卡在服务端安装包获取**。

---

## 3. 根因分析

| 结论 | 依据 |
|---|---|
| **① `downloads.cursor.com` 在本地网络被限速/断流** | 本机 `curl` 实测：105MB 下到 **74.7MB** 时速度归零（连接不退出）；远端 wget 下到 13.6MB 即 `Read error`。两者卡死点不同，但都是长连接被中断 |
| **② 非完全不可达** | 小范围 Range 请求稳定返回 `206`，速度约 200~260KB/s；`cursor.com` 主站正常（200） |
| **③ Cursor 自带 Node fetch 过早放弃** | 本机回退下载仅 11 秒就 `fetch failed`，不适合这种"慢速+易断"的链路 |
| **④ 与 glibc/系统无关** | 远端能进入"下载"阶段，说明平台探测与 SSH 通道均正常 |

> **判定要点**
> 只要日志里出现 `detectedPlatform==linux-legacy` 且从未报 `GLIBC`/`Exec format error`，就说明**环境兼容性没问题**，唯一工作是**把安装包离线送进去**。

---

## 4. 方案总览

```text
[分片并行下载] → [完整性校验] → [传到 VM] → [解包到指定路径] → [Cursor 连接] → [禁用自动下载]
   本机 Windows        本机           scp/HTTP         VM ~/.cursor-server      正常连接       防复发
```

核心思想：**绕过 Cursor 的下载逻辑，直接把"安装完成的目录"摆在它期望的位置**。它检测到目录存在就会跳过下载、直接启动。

---

## 5. 详细步骤

### 5.1 分片并行下载（本机 Windows）

单连接必然断流，因此按 Range 切片、每片独立断点续传：

```bash
URL="https://downloads.cursor.com/production/5f54c8173e5552412beb40702adac16275677fa0/linux-legacy/x64/cursor-reh-linux-legacy-x64.tar.gz"
TOTAL=109940439
DIR="$TEMP/cursor-reh"
PARTS=10
CH=$(( (TOTAL + PARTS - 1) / PARTS ))

fetch_part() {
  local i=$1 s=$2 e=$3
  local f="$DIR/parts/part$i.bin"
  local want=$(( e - s + 1 ))
  touch "$f"
  for attempt in $(seq 1 200); do
    local have=$(stat -c%s "$f" 2>/dev/null || echo 0)
    [ "$have" -ge "$want" ] && return 0
    curl -sS -L --connect-timeout 15 --speed-limit 20000 --speed-time 15 \
         -r $(( s + have ))-$e -o - "$URL" >> "$f" 2>/dev/null
  done
  return 1
}

mkdir -p "$DIR/parts"
for i in $(seq 0 $((PARTS-1))); do
  s=$(( i * CH )); e=$(( s + CH - 1 ))
  [ $e -ge $TOTAL ] && e=$(( TOTAL - 1 ))
  fetch_part $i $s $e &
done
wait

: > "$DIR/merged.tar.gz"
for i in $(seq 0 $((PARTS-1))); do cat "$DIR/parts/part$i.bin" >> "$DIR/merged.tar.gz"; done
```

**为什么这样有效**：`--speed-limit 20000 --speed-time 15` 让 curl 在"速度低于 20KB/s 持续 15 秒"时主动断开，避免像单连接那样**无限挂起**；断开后按已有字节数继续请求下一段（`-r start+have-end`），直到该片完整。

实测：10 片并行，**约 40 秒**下完全部 105MB。

### 5.2 完整性校验

```bash
# 大小必须与 CDN 声明一致：109940439 字节
ls -l merged.tar.gz
# sha256（本次实测值）
sha256sum merged.tar.gz
# c265442bb5bdcd2a73cf1ae60b597a6a5e7d2dce6cbdae3ebb6dab93c32dfb77

# gzip 结构完整性
tar -tzf merged.tar.gz > /dev/null && echo "gzip OK"

# 包内只有一层顶层目录，解包时需要 --strip-components=1
tar -tzf merged.tar.gz | head -3
# vscode-reh-linux-legacy-x64/
# vscode-reh-linux-legacy-x64/package.json
```

关键成员核对（用 Python tarfile 只读遍历更精确，不受 CR 影响）：

| 成员 | 期望 |
|---|---|
| `vscode-reh-linux-legacy-x64/node` | 96,932,096 B，mode 755（Node v20.18.2） |
| `…/bin/cursor-server` | 存在（启动器） |
| `…/product.json` | `commit` = Cursor 的 commit；`serverDataFolderName` = `.cursor-server` |
| 总成员数 | 6811 |
| 解包后占用 | 约 412 MB |

### 5.3 传到 VM

```powershell
# 宿主机 PowerShell / CMD（实测 69 MB/s，1 秒完成）
scp "C:\Users\LENOVO\AppData\Local\Temp\cursor-reh\merged.tar.gz" book@192.168.80.138:/tmp/cursor-reh.tar.gz
```

备选：局域网 HTTP（VM 反向拉取，避免密码交互）

```bash
# 宿主机
cd /c/Users/LENOVO/AppData/Local/Temp/cursor-reh && python -m http.server 8123 --bind 0.0.0.0
# VM
wget -c http://192.168.80.1:8123/merged.tar.gz -O /tmp/cursor-reh.tar.gz
```

> **Windows 防火墙**
> 入站 8123 可能被拦。scp 是由 Windows 主动发起连接，**不受入站规则影响**，所以更稳。

### 5.4 解包到 Cursor 期望的位置

```bash
DEST=$HOME/.cursor-server/bin/linux-legacy-x64/5f54c8173e5552412beb40702adac16275677fa0
mkdir -p "$DEST"
tar -xzf /tmp/cursor-reh.tar.gz -C "$DEST" --strip-components=1

# 验证
ls "$DEST"                 # bin cursor-files extensions node node_modules out package.json product.json resources
"$DEST/node" --version     # v20.18.2
du -sh "$DEST"             # 约 412M
grep -o '"commit": *"[a-f0-9]*"' "$DEST/product.json"
```

> **不要用 sudo 解包**
> 若文件属主变成 `root`，服务端无法写自己的 `data/`、`extensions/` 目录，连接会卡在 "Opening Remote"。
> 补救：`sudo chown -R book:book ~/.cursor-server`

路径规则（固定写死，别猜）：

```
~/.cursor-server/bin/<平台>-<架构>/<commit>/
                  └ linux-legacy-x64  └ 40 位 sha1
```

### 5.5 连接

1. `Ctrl+Shift+P` → **`Remote-SSH: Connect to Host...`**
2. 输入 `book@192.168.80.138`
3. 指纹选 **Continue** → 输入密码
4. 左下角出现 `SSH: 192.168.80.138` 即为成功
5. `Ctrl+K Ctrl+O` 打开 `/home/book/100ask_imx6ull-sdk`（**不要**打开 `/`）

成功的三个客观标志：

```bash
ps aux | grep -c "[c]ursor-server"     # ≥1（本次 7 个进程）
ls -a ~/.cursor-server                 # 出现 data/ 和 extensions/（服务端自建 = 有写权限）
# 连接日志中不再出现 "Downloading Cursor server"
```

### 5.6 防复发设置

```jsonc
{
  "remote.SSH.localServerDownload": "off",
  "remote.SSH.connectTimeout": 120
}
```

---

## 6. 编辑器选型：为什么是 Cursor，不是 VS Code / CLion

| 维度 | Cursor | VS Code | CLion（Gateway 远程） |
|---|---|---|---|
| 18.04（glibc 2.27）兼容 | ✅ `linux-legacy` 构建 | ❌ 1.86+ 需 glibc 2.28；只能停 1.85.2 | ✅ 官方要求 Ubuntu 16.04+ |
| 额外下载量 | 105MB（一次性，可离线） | 客户端 + ~130MB server | **1.5~2.5GB** IDE backend |
| 与韦东山教程匹配度 | ⭐ 教程即 VS Code，配置 100% 通用 | 原生 | ✗ 需要重学整套操作 |
| 内核/BSP（非 CMake）工程 | ✅ 终端 + clangd + cscope | ✅ | ✗ 强项用不上 |
| JTAG/OpenOCD 调试 | ✅ Cortex-Debug 等扩展 | ✅ | ❌ 不支持 |
| 费用 | 订阅 | 免费 | 商业授权（非商业可免费申请） |
| 远端资源要求 | 仅服务端进程，轻 | 轻 | 4GB+ 内存、额外端口、sftp 子系统 |

**结论**：嵌入式 Linux（内核/BSP/驱动/Yocto 这类终端驱动型工作）→ **Cursor / VS Code 系**。
CLion 仅在"大型 C++（CMake）用户态程序 + 重度图形化 GDB"场景才更值。

> **如果坚持用 VS Code**
> 只能装 **1.85.2**（最后一个支持 18.04 的版本），并关闭自动更新：
> `"update.mode": "none"`, `"extensions.autoUpdate": false`
> 更高版本在远端会直接报 `GLIBC_2.28 not found`。

---

## 7. 工作区与三份配置

工作区应打开 **内核源码目录**（如 `~/100ask_imx6ull-sdk/Linux-4.9.88`），而不是 `/`（打开根目录会让索引器扫全盘，CPU/磁盘飙升）。

### 7.1 `.vscode/tasks.json` —— `Ctrl+Shift+B` 一键编译

```jsonc
{
  "version": "2.0.0",
  "options": {
    "cwd": "${workspaceFolder}",
    "env": {
      "ARCH": "arm",
      "CROSS_COMPILE": "arm-linux-gnueabihf-",
      "PATH": "/home/book/100ask_imx6ull-sdk/ToolChain/gcc-linaro-<版本>-x86_64_arm-linux-gnueabihf/bin:${env:PATH}"
    }
  },
  "tasks": [
    { "label": "kernel: zImage + dtbs", "type": "shell", "command": "make -j8 zImage dtbs",
      "group": { "kind": "build", "isDefault": true }, "problemMatcher": [] },
    { "label": "kernel: modules", "type": "shell", "command": "make -j8 modules", "problemMatcher": [] },
    { "label": "kernel: 配置 defconfig", "type": "shell", "command": "make 100ask_imx6ull_pro_defconfig", "problemMatcher": [] },
    { "label": "kernel: 清理", "type": "shell", "command": "make mrproper", "problemMatcher": [] }
  ]
}
```

> 工具链目录名与 defconfig 名请以实际 `ls` / `arch/arm/configs/` 为准。

### 7.2 `.vscode/c_cpp_properties.json` —— 代码不再标红

```jsonc
{
  "version": 4,
  "configurations": [{
    "name": "imx6ull-arm",
    "compilerPath": "/home/book/100ask_imx6ull-sdk/ToolChain/gcc-linaro-<版本>-x86_64_arm-linux-gnueabihf/bin/arm-linux-gnueabihf-gcc",
    "intelliSenseMode": "linux-gcc-arm",
    "cStandard": "gnu11",
    "includePath": [
      "${workspaceFolder}/**",
      "${workspaceFolder}/arch/arm/include",
      "${workspaceFolder}/arch/arm/mach-imx/include"
    ],
    "defines": ["__KERNEL__", "MODULE", "CONFIG_ARM", "CONFIG_ARCH_MXC"]
  }]
}
```

### 7.3 语言服务：clangd + 编译数据库

> **4.9.88 没有官方编译数据库脚本**
> `scripts/clang-tools/gen_compile_commands.py` 是 **4.16** 之后才有的，老内核只能用 `bear` 拦截编译，或退回 `cscope`。

```bash
sudo apt install -y bear ctags cscope
cd ~/100ask_imx6ull-sdk/Linux-4.9.88

# 方案 A：clangd 精确索引（增量编译，很快）
bear -- make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- -j8

# 方案 B：传统索引（兜底，稳定）
make ARCH=arm cscope tags
cscope -d -L -1 of_property_read_u32     # -1 = 查定义
```

用 clangd 时记得关掉内置 IntelliSense，避免双引擎打架：

```jsonc
"C_Cpp.intelliSenseEngine": "disabled"
```

### 7.4 `.vscode/launch.json` —— gdbserver 调试

```jsonc
{
  "version": "0.2.0",
  "configurations": [{
    "name": "gdbserver 远程调试 (arm)",
    "type": "cppdbg",
    "request": "launch",
    "program": "${workspaceFolder}/a.out",
    "miDebuggerPath": "/usr/bin/gdb-multiarch",
    "miDebuggerServerAddress": "192.168.80.100:2345",
    "cwd": "${workspaceFolder}",
    "MIMode": "gdb",
    "stopAtEntry": true,
    "externalConsole": false
  }]
}
```

```bash
sudo apt install -y gdb-multiarch
find ~/100ask_imx6ull-sdk/ToolChain -name gdbserver   # 工具链通常自带，拷到板子上
```

板子侧：`gdbserver :2345 ./a.out`。`<板子IP>` 换成实际地址（并确保与 VM 同网段，见 §8.2）。

---

## 8. 与开发板交互

### 8.1 串口（看启动日志）

板子的 USB 转串口接在**宿主机**上，需要先在 VMware 中把该 USB 设备**连接给虚拟机**，VM 里才会出现 `/dev/ttyUSB0`：

```bash
sudo picocom -b 115200 /dev/ttyUSB0
```

> 现象：VM 里 `ls /dev/ttyUSB*` 为空 → 99% 是 USB 设备没直通给 VM。

### 8.2 网络模式（tftp / NFS 必看）

| VM 网络模式 | 板子能否访问 VM | 适用 |
|---|---|---|
| **NAT**（192.168.80.0/24，默认） | ❌ 不能 | 仅 VM 主动出网；scp 从宿主机推文件 |
| **桥接**（Bridged） | ✅ 能 | **tftp 下载内核、NFS 挂根文件系统必须用这个** |
| 仅主机（Host-only） | 视配置 | 隔离实验 |

> **典型坑**
> VM 在 NAT 下，板子 `mount -t nfs` 或 `tftp` 一定失败。改桥接前先规划好 IP 段，避免和实验网络冲突。

### 8.3 两个 SSH 客户端的分工

| 工具 | 职责 |
|---|---|
| **Cursor + Remote-SSH** | 写代码、编译（主力） |
| **MobaXterm** | SFTP 传 zImage/ko、**串口看日志**、X11 |
| **XShell** | 干净的命令行终端、长任务 |

共存规矩：① 同一 COM 口同一时间只能一个程序占用；② 本地端口转发别撞车；③ 会话命名统一。

---

## 9. 故障速查表

| 现象 | 原因 | 处理 |
|---|---|---|
| `Download failed` / `fetch failed` 反复出现 | 服务端目录不存在，或 `linux-legacy-x64` / commit 不匹配 | 按 §5.4 重新解包；`ls ~/.cursor-server/bin/*/*/` 核对 |
| 一直显示 `Opening Remote` 无进展 | 服务端进程启动失败 | 看 `~/.cursor-server/data/logs` 或 `ps aux \| grep cursor-server` |
| `GLIBC_2.28 not found` | 这是 **VS Code ≥1.86** 的错，不是 Cursor | 确认用的是 Cursor；若用 VS Code 降到 1.85.2 |
| 保存文件报 `EACCES ... permission denied` | 目标文件/目录属主是 `root` | `sudo chown -R book:book <目录>`；**别用 sudo 开编辑器** |
| 密码框反复弹 | 密码错，或账号写成 root | 账号是 `book` |
| 卡在 `Setting up SSH Host…` | Windows 端 `useLocalServer` 兼容问题 | `"remote.SSH.useLocalServer": false` |
| `Terminal sandbox is not supported on Linux kernel 5.4` | Cursor 的 AI 命令沙箱需内核 ≥6.2 | **提示非错误**，可忽略；不值得为此升级系统 |
| `Some keybindings don't go to the terminal…` | 终端快捷键被编辑器拦截 | 需要时设 `"terminal.integrated.sendKeybindingsToShell": true` |
| `F12` 跳不到定义 | 内核源码无编译数据库，语言服务无解析依据 | 先 `make cscope`；或 `bear` 生成 `compile_commands.json` |
| 左侧树显示 `bin boot dev etc` | 工作区开成了 `/` | `Ctrl+K Ctrl+O` 改开 `/home/book/...` |
| 上传/保存后看不到 | 打开的是本地目录而非远端 | 看左下角是否有 `SSH: 192.168.80.138` |

---

## 10. 维护与升级

### 10.1 Cursor 自动升级后怎么办

Cursor 升级 → **commit 变化** → 原目录失效 → 它会重新尝试联网下载并可能再次卡住。

流程：从日志里取出新的 40 位 commit（`nodeExecutable==/home/book/.cursor-server/bin/linux-legacy-x64/<新commit>/node`），把 §5.1 的 `URL` 与 §5.4 的 `DEST` 换成新 commit，重跑一次即可。

可以先留旧目录（不冲突，各 commit 独立），确认新版可用后再删。

### 10.2 目录与空间

| 目录 | 作用 | 能否删 |
|---|---|---|
| `~/.cursor-server/bin/<platform>/<commit>/` | 服务端本体（412MB） | ❌ 删了要重装 |
| `~/.cursor-server/{data,extensions}` | 日志、远端插件 | 可删（会重建，插件需重装） |
| `~/.vscode-server/` | 旧 VS Code 残留（失败的安装） | ✅ 可删（VS Code 会自行重建） |
| `~/.cursor`、`~/.vscode` | **客户端**配置（不带 `-server`） | 不建议删（丢设置） |

> **记忆法**
> 带 `-server` 的是"跑在 Linux 上、给远程连接用的服务端"；不带的是"桌面版软件自己的用户数据"。

### 10.3 建议留档

把 `cursor-reh-linux-legacy-x64.tar.gz`（105MB）+ 本文档一起存档。网络恢复后重下一次不难，但**断网/限速时它是唯一救命稻草**。校验值见 §5.2。

---

## 11. 命令速查

```bash
# —— 远端服务端 ——
DEST=$HOME/.cursor-server/bin/linux-legacy-x64/5f54c8173e5552412beb40702adac16275677fa0
ls "$DEST" && "$DEST/node" --version
ps aux | grep -c "[c]ursor-server"
du -sh ~/.cursor-server

# —— 内核编译 ——
cd ~/100ask_imx6ull-sdk/Linux-4.9.88
make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- 100ask_imx6ull_pro_defconfig
make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- -j$(nproc) zImage dtbs
make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- -j$(nproc) modules

# —— 索引 ——
make ARCH=arm cscope tags
bear -- make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- -j8

# —— 串口 ——
sudo picocom -b 115200 /dev/ttyUSB0

# —— 调试 ——
gdbserver :2345 ./a.out                     # 板子上
gdb-multiarch -ex "target remote <板子IP>:2345"   # 调试端
```

---

## 12. 附录：本次实测数据

| 指标 | 数值 |
|---|---|
| 安装包大小 / sha256 | 109,940,439 B / `c265442bb5bdcd2a73cf1ae60b597a6a5e7d2dce6cbdae3ebb6dab93c32dfb77` |
| 单连接下载 | 卡死于 74.7MB（远端 13.6MB 处 `Read error`） |
| 分片并行（10 片） | 约 40 秒完成，各片独立续传 |
| scp 到 VM | 69.2 MB/s，1 秒 |
| 解包后占用 | 412 MB（远端 home 剩余 203 GB） |
| 服务端进程数 | 7 |
| Node 版本 | v20.18.2 |

参考：
- Cursor 服务端 CDN：`https://downloads.cursor.com/production/<commit>/linux-legacy/x64/cursor-reh-linux-legacy-x64.tar.gz`
- VS Code 1.86 起要求 glibc ≥ 2.28（18.04 报 `GLIBC_2.28 not found`）
- CLion 远程开发对 Linux 的要求（Ubuntu 16.04+，glibc 系发行版）

---

**相关笔记：** [DevVault 索引](../../../../../Embedded/NoSystematic/Docs/06-环境手册/devvault_索引/) · [ESP-IDF版本切换手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/esp-idf版本切换手册/)
