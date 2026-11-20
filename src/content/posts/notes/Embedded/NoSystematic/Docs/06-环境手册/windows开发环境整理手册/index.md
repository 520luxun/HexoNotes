---
title: "Windows开发环境整理手册"
published: 2026-11-19
description: "Windows 开发环境整理手册 现状：本机装过 4 个 Python、2 套 C++ 工具链、84 条 PATH 条目，其中混有失效项、重复项与指向已删目录的"
tags: ["开发环境/Windows", "开发环境/Python", "开发环境/工具链"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/06-环境手册"
draft: false
order: 86
---

# Windows 开发环境整理手册

**现状**：本机装过 4 个 Python、2 套 C++ 工具链、84 条 PATH 条目，其中混有失效项、重复项与指向已删目录的 IDE 配置；C 盘还意外多出一个 Python 3.15.2。
**本次结果**：4 个 Python 全部归位 D 盘、PATH 84 → 59、3 处 IDE 断链修复、2018 年的 MinGW 8.1.0（436.6 MB）由 MSYS2 GCC 16.1.0 替代。

## TL;DR

```powershell
py -0p                                  # 4 个版本，全部在 D 盘
python --version                         # 3.15.2 ← D:\Python315
gcc / gdb --version                     # 16.1.0 / 18.1 ← D:\MSYS2\ucrt64\bin
Get-ChildItem Env:Path                  # 机器 54 + 用户 5
```

| 遇到什么 | 看第几节 |
|---|---|
| C 盘为什么冒出 Python、怎么搬回 D 盘 | §1、§2.1 |
| 卸载 Python 后 IDE/venv 报 `No Python at ...` | §2.2、§2.3 |
| PATH 太长、命令版本对不上、同名程序打架 | §3 |
| IDE 里打开旧项目报路径不存在 | §4 |
| 想把 MinGW 老工具链换成 MSYS2 | §5 |
| `ucrt64` / `mingw64` / `usr` 到底什么区别 | §6 |
| 为什么不能只留一个 Python | §7 |
| 怎么给整台机器做一次"谁在用"体检 | §8 |

**适用前提**：Windows 10 及以上；采用"所有开发工具放 D 盘"的布局；使用 CLion / VSCode / PyCharm / WebStorm 中的若干。

---

## 0. 变更总览

| # | 项目 | 变更前 | 变更后 | 净收益 |
|---|---|---|---|---|
| 1 | Python 3.15.2 位置 | `C:\Python315` | `D:\Python315` | C 盘 −174.7 MB |
| 2 | Python 3.9.13 | `D:\Python39`（94.6 MB 完整版） | 卸载后以 51.8 MB 精简版回装 | −42.8 MB，且仅供 DevEco 使用 |
| 3 | DevEco venv | 指向已删除的 `C:\...\Python39`，完全不可用 | 指向 `D:\Python39`，105 MB 依赖全部可用 | 修复 |
| 4 | PATH | 机器 57 + 用户 27 = 84 条 | 机器 54 + 用户 5 = 59 条 | −25 条，消除失效/重复 |
| 5 | IDE 断链 | 3 处配置指向不存在的路径 | 全部修正 | IDE 不再报错 |
| 6 | C++ 工具链 | `D:\DevEnv\mingw64`（GCC 8.1.0，2018 年） | MSYS2 ucrt64（GCC 16.1.0 + gdb 18.1） | −436.6 MB |

**所有改动前的原件备份**：`D:\DevEnv\_audit\backup-20261119\`

---

## 1. 起点：C 盘为什么又有 Python

### 现象

`python --version` → 3.15.2，而 `py -0p` 显示：

```
-V:3.15 *  C:\Python315\python.exe
-V:3.14    D:\Python314\python.exe
-V:3.12    D:\Python\python.exe
-V:3.9     D:\Python39\python.exe
```

### 根因（有证据的结论）

这不是"搬回来"，而是**第 4 个全新安装**：

| 证据来源 | 内容 |
|---|---|
| 注册表 `HKLM\SOFTWARE\Python\PythonCore\3.15\InstallPath` | `C:\Python315\`，`InstalledFeatures` 完整 |
| 目录创建时间 | `2026-11-09 08:57:51`（其它三个是 `2026-10-08`） |
| Windows Installer 事件日志 | 08:58:41 完成 `Python 3.15.2 Add to Path (64-bit)`，发布者 Python Software Foundation |
| 体积 | 174.7 MB（含 Doc / Test Suite / tcl-tk / dev） |
| site-packages | 安装目录只有 `pip`；用户级 `%APPDATA%\Roaming\Python\Python315` 有 12 个包 |

关键点：安装时勾选了 **"为所有用户安装" + "Add to Path"**，于是 `C:\Python315` 被写入**机器级 PATH** 且排在 `D:\Python314` 之前——这就是为什么一开终端 `python` 就变成了它。

那天 09:09 还装了 Node.js 26.13.0（`D:\BaiduNetdiskDownload\node-v26.13.0-x64.msi`），推测是一次集中的环境搭建。

---

## 2. Python 迁移与治理

### 2.1 3.15.2：C 盘 → D 盘

问题在于**卸载 ≠ 干净**：python.org 的 bundle 安装器卸载后会残留空目录，且 PATH 里的两条 `C:\Python315` 需要单独清。

操作步骤（全部通过提权脚本完成，一次 UAC）：

```powershell
# 1) 卸载（用安装器自身的 uninstall，而非手删目录）
& "python-3.15.2-amd64.exe" /uninstall /quiet /norestart     # exit=0

# 2) 残留：C:\Python315 下剩 Doc / Lib\site-packages 三个空目录 → 递归删除

# 3) 静默重装到 D 盘、所有用户、加入 PATH
& "python-3.15.2-amd64.exe" /quiet /norestart `
    InstallAllUsers=1 TargetDir=D:\Python315 PrependPath=1 `
    Include_launcher=1 InstallLauncherAllUsers=1 `
    Include_pip=1 Include_tcltk=1 Include_test=1 Include_doc=1 Include_dev=1

# 4) 从机器 PATH 中剔除残留的 C:\Python315\ 与 C:\Python315\Scripts\
```

验证结果：

```
python       → D:\Python315\python.exe     Python 3.15.2
pip          → D:\Python315\Scripts\pip.exe  26.2.2
py -0p       → -V:3.15 *  D:\Python315\python.exe
C:\Python*   → 无
```

> **用户级包不用重装**
> `%APPDATA%\Roaming\Python\Python315\site-packages` 是**按版本号**存的，与安装位置无关。
> 重装后 `python-docx / python-pptx / lxml / Pillow / XlsxWriter / typing_extensions`
> 实测全部可直接导入。

### 2.2 3.9.13：为什么卸了又装

检查发现 `D:\Python39` 是当时**唯一没有任何依赖**的版本（详见第 6 节扫描方法）：

- `site-packages` 里只有自带的 `pip 22.0.4` + `setuptools 58.1.0`，从未 `pip install` 过第三方包
- 不在 PATH 里（当初没勾 Add to Path）
- 没有 `%APPDATA%\Python\Python39` 用户级目录
- 全盘 `pyvenv.cfg` 中没有任何虚拟环境指向它

于是卸载。但随后发现 `D:\DevEcoTool\...\deveco-venv` 的 `pyvenv.cfg` 写着：

```ini
home = C:\Users\LENOVO\AppData\Local\Programs\Python\Python39
```

——它依赖的正是 3.9，而且是**已经不存在的 C 盘路径**。

### 2.3 Windows venv 的真相：不用重建

排查后发现：venv 里的 `Scripts\python.exe`（599 KB）不是真正的解释器，而是 **venv 启动器 stub**，它只做一件事——读 `pyvenv.cfg` 的 `home`，然后转交给那个目录下的 `python.exe`。所以报错非常直白：

```
No Python at 'C:\Users\LENOVO\AppData\Local\Programs\Python\Python39\python.exe'
```

**结论：不需要重建 venv，也不需要重装那 105 MB 依赖**——只要有一个 3.9.13 解释器，再把 `home` 指过去。

实施：

1. 安装**精简版** 3.9.13 到 `D:\Python39`（51.8 MB，不含文档/测试套件/tcl-tk，`PrependPath=0` 不进 PATH）
2. 改写 `pyvenv.cfg`：

```ini
home = D:\Python39
include-system-site-packages = false
version = 3.9.13
```

3. 验证（venv 里的 105 MB 包原封不动）：

```
venv python  → 3.9.13 (tags/v3.9.13:6de2ca5 ...) 
venv pip     → 23.0.1
imports      → hb_adapter / hpm_adapter / SCons 4.4.0 / pyserial / aiohttp /
               PyYAML / pycryptodome / pywin32 / click / bottle  → 全部 OK
```

> **为什么不能用 3.14 重建这个 venv**
> 该 venv 里有 `_cffi_backend.cp39-win_amd64.pyd` 等 **cp39 二进制扩展**，
> 且固定了 `PyNaCl 1.5.0`、`aiohttp 3.8.5`、`cffi 1.15.1`、`SCons 4.4.0` 等老版本——
> 这些在 PyPI 上**没有 cp314 轮子**，换 3.14 重建必然失败。

---

## 3. PATH 治理

### 3.1 问题分布

| 类型 | 数量 | 实例 |
|---|---|---|
| 失效（路径不存在） | 4 | `D:\Qt\6.9.2\mingw_64\bin`、`C:\Users\LENOVO\.dotnet\tools`（机器+用户各一条）、`...\systemprofile\...\WindowsApps` |
| 完全重复（机器级已有，用户级又写一遍） | 21 | MSYS2 三份、openocd 两份、DevEco、CLion、VSCode、Java 25、MiKTeX、Bun、Obsidian、npm…… |
| 空目录占位 | 6 | `D:\MSYS2\mingw64\bin`、`D:\BaiduNetdiskDownload`、`AppData\Roaming\npm` 等 |

### 3.2 清理原则

```
机器级：删除不存在的；同一路径只保留第一次出现
用户级：删除不存在的；凡是机器级已存在的，一律删除（Windows 先读机器 PATH）
```

### 3.3 结果

```
机器 57 → 54         用户 27 → 5
```

用户级最终只剩 5 条（都是机器级没有的）：
`CodeBuddy`、`Tomcat`、`Cursor\app\bin`、`WinGet\fnm`、`DockerDesktop`。

清理后逐条验证解析：

```
python       → D:\Python315\python.exe
gcc / g++    → D:\MSYS2\ucrt64\bin\
gdb          → D:\MSYS2\ucrt64\bin\gdb.exe
openocd      → D:\MSYS2\ucrt64\bin\openocd.exe
code         → D:\VSCode\Microsoft VS Code\bin\code.cmd
java         → C:\Program Files\Common Files\Oracle\Java\javapath\java.exe
node / npm   → D:\Node\Node26\
dotnet       → C:\Program Files\dotnet\dotnet.exe
bun          → C:\Users\LENOVO\.bun\bin\bun.exe
```

> **名称遮蔽（shadowing）**
> PATH 里同名命令先到先得。清理前的实际命中关系是：
> `gcc/g++` 被机器级第 4 位的 MSYS2 抢走，`gdb`/`mingw32-make` 因 MSYS2 没有同名文件而落到第 27 位的 `D:\DevEnv\mingw64\bin`（GCC 8.1.0）。
> 这种"半新半旧"的组合最容易出怪问题。

---

## 4. IDE 断链修复（3 处）

### 4.1 PyCharm — 最近项目列表

**文件**：`C:\Users\LENOVO\AppData\Roaming\JetBrains\PyCharm2024.1\options\recentProjects.xml`

| 死条目 | 原项目 |
|---|---|
| `D:/Codex/Game/python_solutions` | 算法练习（kruskal / 背包） |
| `D:/Math/A/src` | 数学建模 `drying_model.py` |
| `D:/Math/code` | `models.py` / `solver.py` |

`D:\Codex` 和 `D:\Math` 都已不存在（注意 `D:\Code` 是存在的，别混）。

**改动**：删除 3 个 `<entry>` 块，条目 15 → 12。

> **必须在 PyCharm 关闭时修改**
> 否则它退出时会用内存数据覆盖回去。

**故意未动**：`workspace\*.xml`、`options\trusted-paths.xml` 里仍有历史痕迹——那是会话恢复数据，删了无收益且可能损坏会话状态。

### 4.2 WebStorm — Node 解释器登记表

**文件**：`C:\Users\LENOVO\AppData\Roaming\JetBrains\WebStorm2026.3\options\nodejs.xml`

```xml
<!-- 删除前 -->
<local-interpreter path="D:/Node/node.exe">        <!-- D:\Node 下只有 Node26 子目录 -->
<local-interpreter path="D:/Node26/node.exe">      <!-- 不存在 -->
<local-interpreter path="D:/Node/Node26/node.exe"> <!-- 有效：26.13.0 -->
```

**改动**：删掉前两条，只留有效的。

### 4.3 VSCode — STM32 调试配置

**文件**：`D:\Code\VSCodeCode\STM32F407ZGT6\CMake_Ninja_clangd_arm-gcc\led_blink\.vscode\launch.json`

这是从教程/别人机器复制来的模板，两个路径属于模板作者：

```diff
- "executable": "C:/Users/Admin/Desktop/led_blink/build/led_blink.elf",
+ "executable": "${workspaceRoot}/build/led_blink.elf",

- "armToolchainPath": "C:/Toolchain/arm-gnu-toolchain-14.2.rel1-mingw-w64-i686-arm-none-eabi/bin"
+ "armToolchainPath": "D:/STM32CubeCLT/STM32CubeCLT_1.22.0/GNU-tools-for-STM32/bin"
```

依据：`build/led_blink.elf` 确实存在（1,028,716 字节）；CubeCLT 的 `GNU-tools-for-STM32\bin` 里有配对的 `arm-none-eabi-gdb.exe` / `arm-none-eabi-gcc.exe`，是本机唯一的 ARM 工具链（CLion 的 STM32 工具链也用它）。

> **未验证部分**
> `servertype: openocd` + `interface/cmsis-dap.cfg` 需要 OpenOCD 的 scripts 目录能被 cortex-debug 找到（本机在 `D:\MSYS2\ucrt64\share\openocd\scripts`）。
> 需插上 CMSIS-DAP 探针实际 F5 才能确认，可能还要加 `openocdPath`。

---

## 5. MinGW 迁移：8.1.0 → 16.1.0

### 5.1 被替代的是什么

`D:\DevEnv\mingw64` —— **MinGW-W64-builds 4.3.5**，GCC **8.1.0**，构建日期 **2018-12-05**（见 `build-info.txt`），436.6 MB。它是某套 STM32 教学包的附带品（同目录还有 `install.bat`、`openocd-v0.12.0`、`stm32f1_stlink.cfg` 等）。

硬编码引用它的只有 VSCode 的 C++ 练习工程 4 个文件：

```
D:\Code\VSCodeCode\C++\.vscode\tasks.json             (gcc/g++ 命令)
                     c_cpp_properties.json            (compilerPath ×2)
                     launch.json                      (miDebuggerPath)
                     settings.json                     (C_Cpp_Runner 三个路径)
```

### 5.2 迁移步骤

```powershell
# 1) 装 MSYS2 的 gdb（替代 8.1.0 的 gdb）
pacman -S --noconfirm mingw-w64-ucrt-x86_64-gdb      # gdb 18.1
#    首次装完起不来（0xC0000135 = 缺 DLL），实测缺 libz-1.dll：
pacman -S --noconfirm mingw-w64-ucrt-x86_64-zlib     # libz-1.dll 来源
```

> **gdb 为什么这么大**
> `mingw-w64-ucrt-x86_64-python 3.14.10`（**218 MB**）是 gdb 的 Python 脚本依赖，被自动拉入。
> 它**不在 PATH 里**，不影响系统的 `python`（仍是 `D:\Python315`）。
> 若嫌大可 `pacman -R mingw-w64-ucrt-x86_64-python`，代价是 gdb 失去 Python 脚本能力。

```powershell
# 2) 四个 VSCode 配置统一替换（9 处）
D:\DevEnv\mingw64\bin  →  D:\MSYS2\ucrt64\bin

# 3) 验证编译
gcc -g test1.c -o test1_new.exe   &&  ./test1_new.exe   → Hello World!
g++ -g test.cpp -o test_new.exe   &&  ./test_new.exe     → 运行 OK

# 4) 验证调试
gdb -batch -nx -ex "file test.exe" -ex "info functions main"
→ GNU gdb (GDB) 18.1 ... 4: int main();

# 5) 从机器 PATH 摘除 D:\DevEnv\mingw64\bin，然后删除目录（436.6 MB）
```

### 5.3 迁移后工具链

```
gcc / g++ / gdb / openocd  → D:\MSYS2\ucrt64\bin        GCC 16.1.0 / gdb 18.1
mingw32-make               → D:\MSYS2\ucrt64\bin        GNU Make 4.4.1（补装）
make                       → D:\STM32CubeCLT\...\Make\bin
python                     → D:\Python315
node                       → D:\Node\Node26
```

---

## 6. MSYS2 结构说明：ucrt64 / mingw64 / usr

MSYS2 本质是**多个互不兼容的"环境前缀"共存**：

| 前缀 | 性质 | CRT | 核心运行库 |
|---|---|---|---|
| `usr/` | MSYS 的 POSIX 模拟层（bash、pacman、coreutils） | msys | `msys-2.0.dll` |
| `ucrt64/` | 原生 Windows + GCC | **UCRT**（`ucrtbase.dll`，Win10+） | `libstdc++-6.dll` 等 |
| `mingw64/` | 原生 Windows + GCC | **MSVCRT**（`msvcrt.dll`，极老） | 同名 DLL，但**另一份二进制** |
| `clang64/` | 原生 Windows + Clang | UCRT | 另一份 |

**为什么不能混用**：`libstdc++-6.dll`、`libgcc_s_seh-1.dll`、`libwinpthread-1.dll` 在两套环境里同名而不同内容。若 PATH 同时含两套 `bin` 且顺序不当，进程会加载错 ABI 的 DLL → 崩溃或诡异乱码。MSYS2 的规矩是**一个进程只用一套前缀**，包名也区分：

```
mingw-w64-ucrt-x86_64-*   →  装进 ucrt64/   （本机采用）
mingw-w64-x86_64-*        →  装进 mingw64/  （本机为空）
```

**本机实测**：

```
ucrt64:  50 个包      ← 全部工具链
mingw64:  0 个包      ← 空骨架目录
clang64:  0 个包      ← 空骨架目录
msys:   110 个包      ← bash / pacman / coreutils
合计 160 个包，占用 2,524 MB（ucrt64 1,628 MB + usr 419 MB + 其余）
```

补充：`D:\MSYS2\mingw64\bin` 仍留在 PATH（机器级第 44 位，空目录）。建议移除，避免今后误装 `mingw-w64-x86_64-*` 时埋下 DLL 冲突。

---

## 7. 为什么要保留 4 个 Python

这是本次最容易被误解的部分——不是"没整理干净"，而是**四个版本各自被锁死**：

| 版本 | 路径 | 谁在依赖 | 不可替换的原因 |
|---|---|---|---|
| 3.15.2 | `D:\Python315` | 终端默认、用户级 12 包（docx/pptx/lxml/PIL/XlsxWriter） | 最新版，日常入口 |
| 3.14.8 | `D:\Python314` | 用户级 64 包（numpy/scipy/pandas/matplotlib/pymupdf/openpyxl/pulp/yt_dlp） | 数据处理 + PDF 工具链 |
| 3.12.10 | `D:\Python` | 安装目录 174 包 / 1.5 GB（**nncase / K210 / K510**、cv2、onnxruntime） | `_nncase.cp312-win_amd64.pyd` 只能 3.12 加载 |
| 3.9.13 | `D:\Python39` | DevEco `deveco-venv` | 项目固定 cp39 二进制（PyNaCl 1.5.0 / aiohttp 3.8.5 / cffi 1.15.1） |

四条硬约束：

1. **二进制 ABI**：`.pyd` 为特定 CPython ABI 编译，换版本即 `ImportError`。
2. **上游支持窗口**：nncase（嘉楠 K210/K510）只到 3.12；ESP-IDF 自带 3.11 环境且由 EIM 精确管理。
3. **厂商工具链自治**：DevEco、ESP-IDF 都不接受你替换它们的解释器。
4. **全局包冲突**：1.5 GB / 174 个包（含 numpy/pandas/scipy）若与另一套版本混装，必然打架。

> **正确的"统一"是统一入口，不是统一解释器**
> 一个 base（3.15）+ 每个项目一个 venv，才是可持续方案。

### 7.1 关于 PyMuPDF 的一次误判（值得记住）

最初查 PyPI 时我按"文件名含 `cp315`"判断兼容性，得出"PyMuPDF 没有 3.15 轮子"的错误结论。实际上 PyMuPDF 发的是 **abi3 轮子**：

```
pymupdf-2.1-cp311-abi3-win_amd64.whl
```

`abi3` 表示稳定 ABI，**向下兼容所有 ≥ cp311 的 CPython**。实测：

```
D:\Python315\python.exe -m pip install --dry-run pymupdf
→ Downloading pymupdf-2.1-cp311-abi3-win_amd64.whl
→ Would install pymupdf-2.1
```

**因此 3.14 的 64 个包全部可以搬到 3.15**，合并方案是可行的（尚未执行）。

---

## 8. 环境扫描：方法、口径与局限

### 8.1 方法

自写 Python 扫描器（`D:\DevEnv\_audit\scan.py` + `analyze*.py`）：

1. 遍历 `D:\` 全盘 + 用户配置目录（AppData/JetBrains/VSCode/Cursor/Documents/Desktop）
2. 筛出配置类文件：`.json/.xml/.iml/.cmake/.bat/.ps1/.toml/.ini/.cfg/CMakeCache.txt/CMakePresets.json` 等
3. 正则抽取所有绝对路径（`[A-Z]:\\...`），归一化去重
4. 逐条 `os.path.exists()` 判定 + 记录引用它的文件与最新时间
5. 另做一轮"活跃度扫描"：每个顶层目录近 30/180 天被修改的文件数
6. 合并 PATH 全量、已安装软件（374 条）、运行进程、服务

### 8.2 规模

```
扫描文件      474,196
配置/脚本      56,828
绝对路径        1,257（严格清洗后 284 条可信）
D 盘顶层目录        90
PATH 条目      57 + 27
已装软件          374
耗时          ~70 秒 + 36 秒（活动扫描）
```

完整报告：`D:\DevEnv\_audit\环境资产扫描报告.md`

### 8.3 局限性（必须知道）

- **"配置里零引用" ≠ 没用**：通过 PATH、环境变量、图形界面启动的程序不会被扫到（VMware、Keil、DevEcoStudio 都属于此类，只能靠活跃度判断）。
- **日志/笔记里的历史路径是噪声**：原始抽出 1,257 条，其中 `E:\=`、`p:\module`、`C:\dir1` 之类来自 CMake 模块模板、插件 README、构建日志，已剔除。
- **未覆盖**：注册表内部配置、数据库内部配置。

---

## 9. 备份与回滚

所有原件在 `D:\DevEnv\_audit\backup-20261119\`：

| 文件 | 内容 |
|---|---|
| `path-machine.before.txt` / `path-user.before.txt` | 改动前的完整 PATH（每行一条） |
| `path-cleanup.log` / `remove-mingw64.log` | 操作日志（含删除/保留清单） |
| `recentProjects.xml.102018.bak` | PyCharm 最近项目 |
| `nodejs.xml.102018.bak` | WebStorm Node 解释器 |
| `launch.json.102018.bak` | led_blink 调试配置 |
| `vscode_tasks.json / c_cpp_properties.json / launch.json / settings.json .102843.bak` | C++ 练习工程（迁 MSYS2 前） |

**回滚单个配置文件**：把 `.bak` 复制回去覆盖（对应 IDE 需处于关闭状态）。

**回滚 PATH**：把 `path-*.before.txt` 的行用 `;` 拼回，写回对应注册表位置（机器级需管理员）。

**回滚 MinGW**：删除的 `D:\DevEnv\mingw64` 无备份，需要重新下载 MinGW-W64 4.3.5 解压；C++ 工程的 4 个配置按备份还原即可。

---

## 10. 待办与可选清理

| 优先级 | 事项 | 收益 | 风险 |
|---|---|---|---|
| 中 | 3.14 → 3.15 合并（64 个包，已确认 pymupdf abi3 可用） | 311 MB，少一个版本 | 需逐个验证导入 |
| 中 | 清理 `D:\MSYS2\var\cache\pacman\pkg`（423 MB / 133 个包）`pacman -Sc` | 约 300 MB | 重装需重新下载 |
| 低 | 从 PATH 摘掉空的 `D:\MSYS2\mingw64\bin` | 消除未来 DLL 冲突隐患 | 无 |
| 低 | 复核闲置目录：`Drivers`(2.4GB)、`Navicate`(478MB)、`MySQL Workbench`(166MB)、`BongoCat`(474MB) | 约 3.5 GB | 需人工确认 |
| 低 | `D:\DevEnv\install.bat`（指向不存在的 `GNU-tools-for-STM32\bin`）+ 4 个 `stm32f*.cfg` 残骸 | 整洁 | 无（按用户要求**已保留**） |

---

## 11. 常见问题速查

| 报错 / 现象 | 原因 | 处理 |
|---|---|---|
| `No Python at '...\python.exe'`（venv） | venv 的 `pyvenv.cfg` 里 `home` 指向的解释器被删/移动 | 改 `home` 指向现存同版本解释器目录 |
| gdb 启动即退出，退出码 `-1073741515`（0xC0000135） | 缺 DLL（本次是 `libz-1.dll`） | `ldd xxx.exe \| grep "not found"` 定位，`pacman -S` 补包 |
| `python` 变成了意外版本 | 新装解释器把自己写进了 PATH 前列 | 查 `py -0p` 与注册表 `PythonCore\*`，调整 PATH 顺序 |
| 同一个命令行为诡异（如 gcc 版本不对） | PATH 中存在多套同名工具，先到先得 | 用 `Get-Command xxx \| Select Source` 看实际命中 |
| 程序闪退 / 乱码（MSYS2 编译产物） | PATH 里 ucrt64 与 mingw64 两套 DLL 混用 | 一个进程只用一套前缀，从 PATH 移除另一套 |
| `pip install` 报 `no matching distribution` | 该包无对应 CPython 版本的轮子（可能被 abi3 混淆） | 查 PyPI 文件名的 abi3 标签；`pip install --dry-run` 实测 |
| 卸载 Python 后 PATH 里还有残留条目 | bundle 安装器只删自己写入的那两条，手工加的不会删 | `where python` 逐条核对后手动清 |

---

## 12. 关键路径速记

```
Python 3.15   D:\Python315          ← 默认 python/pip
Python 3.14   D:\Python314
Python 3.12   D:\Python             ← nncase，勿动
Python 3.9    D:\Python39           ← 仅 DevEco 底座，不在 PATH
MSYS2         D:\MSYS2\ucrt64       ← gcc 16.1.0 / gdb 18.1 / openocd / make
STM32 工具链  D:\STM32CubeCLT\STM32CubeCLT_1.22.0
CubeMX        D:\STM32CubeMX\STM32CubeMX.exe   (6.18.1-RC2)
DevEco venv   D:\DevEcoTool\DevEco-Device-Tool\core\deveco-venv
ESP-IDF       D:\Espressif / D:\Espressif-5.1.6 / D:\Espressif-6.0.2（各自带 py3.11 环境）
扫描/报告     D:\DevEnv\_audit\
备份          D:\DevEnv\_audit\backup-20261119\
```

---

## 13. 事实边界

| 内容 | 性质 |
|---|---|
| Python 路径/版本/体积、PATH 条目数与顺序、`py -0p` 输出 | **实测**（本文所有命令输出） |
| `C:\Python315` 的安装时间与来源（Installer 事件日志 + 目录创建时间） | **实测** |
| DevEco venv 修复后的导入测试（hb_adapter / SCons / pywin32 等） | **实测** |
| GCC 16.1.0 编译运行、gdb 18.1 加载符号 | **实测** |
| `led_blink` 能否直接按 F5 调试（OpenOCD + CMSIS-DAP） | **未实测**，需硬件探针 |
| 3.14 的 64 个包能否全部装到 3.15 | **部分实测**（pymupdf 已 dry-run 通过，其余未逐个验证） |
| 环境扫描的"零引用"判定 | **统计意义**，不等于"没用"（见 §8.3） |
| "谁调用谁"的结论 | **实测**（配置硬编码路径 + PATH 顺序 + 进程） |

## 14. 相关

| 文档 / 路径 | 关系 |
|---|---|
| [DevVault 索引](../../../../../Embedded/NoSystematic/Docs/06-环境手册/devvault_索引/) | 本目录的约定与文档清单 |
| [ESP-IDF版本切换手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/esp-idf版本切换手册/) | ESP-IDF 自带 py3.11 环境，与本手册的 Python 治理互不干扰 |
| [Cursor远程开发-iMX6ULL环境手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/cursor远程开发-imx6ull环境手册/) | 同一台主机的另一项环境工作 |
| `D:\DevEnv\_audit\环境资产扫描报告.md` | 扫描原始报告（90 个目录 × PATH × 断链全表） |
| `D:\DevEnv\_audit\backup-20261119\` | 本次全部改动前的原件备份 |

