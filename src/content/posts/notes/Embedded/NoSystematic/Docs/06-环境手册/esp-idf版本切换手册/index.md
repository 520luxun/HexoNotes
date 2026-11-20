---
title: "ESP-IDF版本切换手册"
published: 2026-11-19
description: "ESPIDF 版本切换手册（ESP32S3 · Routine 工程集） 本机现状：D:Espressif5.1.6 与 D:Espressif6.0.2 "
tags: ["嵌入式/ESP32", "开发环境/远程开发", "开发环境/搭建", "开发环境/版本管理"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/06-环境手册"
draft: false
order: 85
---

# ESP-IDF 版本切换手册（ESP32-S3 · Routine 工程集）

> 本机现状：`D:\Espressif-5.1.6` 与 `D:\Espressif-6.0.2` **两套完整环境同时存在**，114 个工程里 113 个用 5.1.6、1 个（`hello_world_6.0.2`）用 6.0.2，全局默认仍是 5.1.6。
> 本文只讲一件事：**怎么把"某个工程"或"整台机器"切到另一个 ESP-IDF 版本，以及切完怎么验证、出问题怎么退回**。原理与安装/删除的完整 SOP 见工程内的 `docs\ESP-IDF-维护手册.md`（第 10、11、12、17 章）。

---

## 0. TL;DR（三分钟照做）

```powershell
# ① 进 Routine 根目录（脚本默认路径都是绝对路径，但文档统一在这里执行）
cd D:\Code\VSCodeCode\ESP32S3\Routine

# ② 只把某个工程切到 6.0.2，全局默认保持 5.1.6（最常用）
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-6.0.2 `
  -Project 'D:\Code\VSCodeCode\ESP32S3\Routine\basic_routines\02_key' -KeepEnv

# ③ 删该工程的 build（不同版本的构建产物不通用）
Remove-Item 'D:\Code\VSCodeCode\ESP32S3\Routine\basic_routines\02_key\build' -Recurse -Force

# ④ 完全退出 VS Code（File → Exit）再打开，然后 Ctrl+Shift+B 编译验证
```

**命令行临时用 6.0.2（不影响 VS Code、不影响别的终端）：**

```powershell
cd D:\Espressif-6.0.2\v6.0.2\esp-idf
.\export.ps1        # 只对"当前这个 PowerShell 窗口"生效
```

**切换前后各做一次体检：**

```powershell
.\tools\idf-versions.ps1 -SkipSize
```

> **一句话记住**
> **切换 ≠ 卸载重装。** 两个版本一直躺在硬盘上，切换只是改"这个工程用谁"的指针。改完删 `build` + 完全重启 VS Code，就是全部动作。

---

## 1. 先搞懂：到底是谁在决定"用哪个版本"

ESP-IDF 工程编译时，扩展 / CMake 会按下面的优先级找版本，**上面一层存在，下面就被忽略**：

```text
① 工程 .vscode\settings.json 里的 idf.* 键          ← 优先级最高（本机 114 个工程全部钉死）
        ↓ 没有这些键时
② VS Code 用户设置 / 用户级环境变量三件套            ← 只对"没写死配置"的工程和命令行起作用
   IDF_PATH / IDF_TOOLS_PATH / IDF_PYTHON_ENV_PATH
        ↓ 都没有时
③ 扩展自己缓存的上一次配置 / 报错                     ← 这时最容易"看起来切了其实没切"
```

四个"开关"各自管什么：

| # | 开关 | 位置 | 管什么 | 什么时候要改 |
|---|---|---|---|---|
| ① | **工程级配置** | `<工程>\.vscode\settings.json` 的 `idf.espIdfPathWin` 等 | **这个工程**在 VS Code 里编译/烧录用哪个版本 | 切某个工程（最常用） |
| ② | **全局默认** | 用户级环境变量 `IDF_PATH` / `IDF_TOOLS_PATH` / `IDF_PYTHON_ENV_PATH` | 新开的命令行、没写死配置的工程 | 想让"命令行默认"也换 |
| ③ | **进程缓存** | 正在运行的 VS Code 进程 | ② 改完后必须**完全重启**才读到新值 | 每次切完都要做 |
| ④ | **版本登记表** | `D:\Espressif\eim-default\tools\eim_idf.json` | 只决定**插件 UI / EIM 列表里能看到哪些版本**，**不决定编译用哪个** | 装/删版本后 |

> **第 ④ 项最容易误解**
> 登记表（`eim_idf.json`）里有 5.1.6 和 6.0.2，只代表"界面里能选"。工程真正用哪个，看的是它自己的 `settings.json`；命令行真正用哪个，看的是当前终端的环境变量。**三者是独立的。**

补充两条本机事实：

- VS Code 用户设置里**没有**全局 `idf.espIdfPath`，只有 `idf.eimIdfJsonPath`（指向上面那份登记表）和 `idf.gitPathWin`（5.1.6 自带的 git）。所以本机实际上是"**工程级绝对路径说了算**"，改环境变量不会意外影响已配置的工程。
- 6.0.2 没有自带 `idf-git`，扩展会用系统 Git：`D:\Git\Git\cmd\git.exe`。

---

## 2. 本机两套环境对照（2026-11-19 实测）

| 项目 | ESP-IDF 5.1.6（主力） | ESP-IDF 6.0.2（新工程） |
|---|---|---|
| 安装根（`IDF_TOOLS_PATH`） | `D:\Espressif-5.1.6` | `D:\Espressif-6.0.2` |
| 框架源码（`IDF_PATH`） | `D:\Espressif-5.1.6\frameworks\esp-idf-v5.1.6` | `D:\Espressif-6.0.2\v6.0.2\esp-idf` ← **不是** `frameworks\...` |
| Python 虚拟环境 | `...\python_env\idf5.1_py3.11_env`（Python 3.11.2） | `...\python_env\idf6.0_py3.14_env`（Python 3.14.7） |
| CMake | `tools\cmake\3.30.2\bin\cmake.exe` | `tools\cmake\4.0.3\bin\cmake.exe` |
| Ninja | `tools\ninja\1.12.1\ninja.exe` | `tools\ninja\1.12.1\ninja.exe` |
| 交叉编译器 | `xtensa-esp32s3-elf-gcc` 12.2.0 | `xtensa-esp-elf-gcc` 15.2.0（6.x 改用统一命名） |
| OpenOCD | `v0.12.0-esp32-20241016` | `v0.12.0-esp32-20260424` |
| Git | 自带 `tools\idf-git\2.44.0` | 用系统 `D:\Git\Git\cmd\git.exe` |
| 导出脚本 | `<源码>\export.ps1` | `<源码>\export.ps1` |

**工程归属（`idf-versions.ps1` 实测）：**

| 版本 | 引用工程数 | 典型工程 |
|---|---|---|
| 6.0.2 | **1** | `hello_world_6.0.2`（6.0.2 基准工程，已编译验证） |
| 5.1.6 | **113** | `basic_routines\*`、`freertos_routines\*`、`lvgl\*` |

> `basic_routines` 目录本身也有一份 `settings.json`，所以统计里会看到"`basic_routines` + 112 个子工程"这种条目，不是错误。

**全局默认：** 用户级 `IDF_PATH` / `IDF_TOOLS_PATH` / `IDF_PYTHON_ENV_PATH` 三者都指向 **5.1.6**（一致性检查通过）。`eim_idf.json` 的 `idfSelectedId` 也是 5.1.6。

---

## 3. 切换前：30 秒体检（只读，不改任何东西）

```powershell
cd D:\Code\VSCodeCode\ESP32S3\Routine
Set-ExecutionPolicy -Scope Process Bypass -ErrorAction SilentlyContinue
.\tools\idf-versions.ps1 -SkipSize
```

输出分 6 段，这样看：

| 段落 | 正常长什么样 | 不正常说明什么 |
|---|---|---|
| 已安装的 ESP-IDF | 两个版本，各显示 `[ OK ] 组件完整性: 通过` | 出现"缺失组件"→ 该版本工具链没装全，先修再切 |
| 工程归属 | 6.0.2 → 1 个，5.1.6 → 113 个 | 数字突然变化，说明有工程被改过 |
| 引用失效路径的工程 | `[ OK ] 无：所有工程的路径都真实存在` | **必须为 0**；不为 0 说明有版本被删过而工程没跟着切 |
| 用户级环境变量 | 三行指向同一版本，`[ OK ] 三者一致` | 不一致时 VS Code 会弹 `IDF_PYTHON_ENV_PATH is not set` 一类错误 |
| 结论 | 已装 2 个 / 失效引用 0 / 环境变量 OK | 删版本前就看这一段 |
| 提示 | 一行操作提醒 | — |

> **红线**
> 只要"失效引用工程数"不为 0，**先修再切**——否则切完会出现"一部分工程能编、一部分工程报路径不存在"的混合故障。

常用变体：

```powershell
.\tools\idf-versions.ps1 -SkipSize -Json      # 给脚本/工具消费
.\tools\idf-versions.ps1 -InstallRoot 'D:\' -ProjectRoot 'D:\Code'   # 换扫描范围
```

---

## 4. 方法 A（推荐）：只切一个工程

**适用：** 工程 A 用 5.1.6、工程 B 用 6.0.2 混着用；不想动全局默认。

### 4.1 先预览（不写任何文件）

```powershell
cd D:\Code\VSCodeCode\ESP32S3\Routine
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-6.0.2 `
  -Project 'D:\Code\VSCodeCode\ESP32S3\Routine\basic_routines\02_key' -DryRun
```

会打印：目标源码目录、Python、工具 PATH 条目数、cmake/git 路径，以及**将要写入的完整 JSON**，最后提示 `DryRun 模式：未更新用户环境变量`。看清路径无误再正式执行。

### 4.2 正式切换

```powershell
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-6.0.2 `
  -Project 'D:\Code\VSCodeCode\ESP32S3\Routine\basic_routines\02_key' -KeepEnv
```

成功时依次出现：

```text
[STEP] 检查安装根目录 D:\Espressif-6.0.2
[ OK ] ESP-IDF 源码: D:\Espressif-6.0.2\v6.0.2\esp-idf
[ OK ] Python: ...\idf6.0_py3.14_env\Scripts\python.exe
[STEP] 获取该版本权威工具路径 (idf_tools.py export)
[ OK ] 工具 PATH 条目数: 12
[ OK ] espIdfPathWin / pythonBinPathWin / toolsPathWin / cmake / git
[ OK ] 已备份旧配置: ...\.vscode\settings.json.bak-20261119-xxxxxx
[ OK ] 已更新: ...\.vscode\settings.json
[WARN] KeepEnv 模式：只切工程，未更新用户环境变量（全局默认保持原样）
```

### 4.3 它到底改了什么、没改什么

**会写（工程 `settings.json`）：**

| 键 | 值 |
|---|---|
| `idf.espIdfPathWin` | 目标版本源码目录 |
| `idf.pythonBinPathWin` | 目标版本的 `python.exe` |
| `idf.toolsPathWin` | 目标版本的安装根 |
| `idf.customExtraPaths` | `idf_tools.py export` 输出的工具 PATH（cmake / ninja / 交叉编译器 / openocd / ccache …） |
| `idf.customExtraVars` | `IDF_PYTHON_ENV_PATH`、`OPENOCD_SCRIPTS`、`ESP_ROM_ELF_DIR`、`IDF_CCACHE_ENABLE=1`、`PYTHONUTF8=1` |
| `idf.gitPathWin` | 若该安装根下有 `idf-git`（5.1.6 有，6.0.2 没有 → 不写这项） |
| `cmake.cmakePath` / `cmake.generator` | 该版本的 cmake；`Ninja` |
| `cmake.configureEnvironment` | `IDF_PATH` / `IDF_TOOLS_PATH` |

**不会碰（工程个性化配置全部保留）：** `idf.portWin`（串口）、`idf.adapterTargetName`、`idf.flashType`、`idf.openOcdConfigs`、`C_Cpp.*`（IntelliSense）、`files.*`。

**也不会做的事：** 不安装/卸载版本；不改 `sdkconfig` 和 `main/`；**不删 `build`**（要你手动删）；不加 `-KeepEnv` 时不改环境变量之外，其它一律不动。

> **为什么 `customExtraPaths` 不能手抄**
> 两版本的工具版本、目录名、条目数都不同（5.1.6 共 16 条，6.0.2 共 12 条，且 6.x 编译器改名为 `xtensa-esp-elf`）。脚本每次都实时问 `idf_tools.py export`，所以永远是对的；手抄旧模板会踩"找不到编译器"。

### 4.4 切换后必做三步（漏一步就可能白切）

```powershell
# 1) 删旧 build —— 不同版本的 CMakeCache/编译产物不通用
Remove-Item 'D:\Code\VSCodeCode\ESP32S3\Routine\basic_routines\02_key\build' -Recurse -Force

# 2) 完全退出 VS Code：File → Exit（不是 Reload Window！），再重新打开
#    扩展进程的环境变量/配置是启动时固化的，Reload 不会重新读取

# 3) 编译验证：Ctrl+Shift+B，或命令面板 ESP-IDF: Build your project
```

> **为什么必须"完全退出"**
> `Reload Window` 只重建渲染进程，扩展宿主进程可能还活着，仍拿着旧版本路径。本机历史上多次出现"改了配置、Reload 后仍按旧版本编译"，全部靠 `File → Exit` 解决。

### 4.5 怎么确认真的切成功了

| 检查 | 做法 | 期望 |
|---|---|---|
| 配置值 | 打开工程 `.vscode\settings.json` | `idf.espIdfPathWin` 指向 `D:\Espressif-6.0.2\v6.0.2\esp-idf` |
| 归属统计 | `.\tools\idf-versions.ps1 -SkipSize` | 6.0.2 引用数 +1、5.1.6 −1，失效引用仍为 0 |
| 构建日志 | 编译输出开头 | 出现的 `IDF_PATH` / 编译器路径是 6.0.2 的 |
| 版本号 | 命令面板 `ESP-IDF: Build your project` 后看日志，或终端里 `idf.py --version` | `ESP-IDF v6.0.2`（需先 `export.ps1`） |

> **别用 `idf.py --version` 单独判断**
> PATH 里的 `idf.py` 可能是 `idf-exe` 启动器（`tools\idf-exe\1.0.3\idf.py.exe`），它会打印 `v1.0.3`。命令行请用显式 Python 调用：`& "$env:IDF_PYTHON_ENV_PATH\Scripts\python.exe" "$env:IDF_PATH\tools\idf.py" --version`。

### 4.6 真实案例（本机已验证）

- `02_key`：切到 6.0.2 再切回 5.1.6，两次都成功；工程配置除新增 `IDF_PYTHON_ENV_PATH` 外与原状逐项一致，`idf.portWin`（COM6）等个性化项保留；归属统计同步 1→2→1。
- `hello_world_6.0.2`：6.0.2 基准工程，可用来验证 6.0.2 环境本身是否可用。

---

## 5. 方法 B：工程 + 全局默认一起切

**适用：** 以后大概率都用新版本，希望**命令行**默认也换过去。

```powershell
cd D:\Code\VSCodeCode\ESP32S3\Routine

# 切工程（默认工程是 basic_routines\30_music）+ 全局三件套
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-6.0.2

# 只切全局默认、指定别的工程，等价写法：
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-6.0.2 `
  -Project 'D:\Code\VSCodeCode\ESP32S3\Routine\hello_world_6.0.2'
```

不加 `-KeepEnv` 时，脚本会额外写用户级环境变量：

```text
IDF_PATH            = D:\Espressif-6.0.2\v6.0.2\esp-idf
IDF_TOOLS_PATH      = D:\Espressif-6.0.2
IDF_PYTHON_ENV_PATH = D:\Espressif-6.0.2\python_env\idf6.0_py3.14_env
```

**影响面：**

| 会变 | 不会变 |
|---|---|
| 默认工程（或 `-Project` 指定工程）的 `settings.json` | 其余 113 个工程的 `settings.json`（各自钉死 5.1.6） |
| **新开的**命令行 / PowerShell 的默认环境 | 已经开着的终端（要重开或 `export.ps1`） |
| 没有写死 `idf.*` 配置的工程（本机没有这种） | 已写死配置的工程（不受全局影响） |

> **两个坑**
> 1. 默认工程是 `30_music`，它用的是**旧 I2S API**，6.0 已移除 `driver/i2s.h`——配置能切，但**编译不过**（需要迁移到 `i2s_std.h`）。想验证 6.0.2 请用 `hello_world_6.0.2`。
> 2. 改全局后，**当前 VS Code 不会自动跟随**：它读的是各工程自己的 `settings.json`，所以还是要删 `build` + 完全重启。

**切回 5.1.6：**

```powershell
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-5.1.6 `
  -Project 'D:\Code\VSCodeCode\ESP32S3\Routine\basic_routines\30_music' -KeepEnv
```

---

## 6. 方法 C：用 VS Code 扩展界面切

| 想做的事 | 入口（`Ctrl+Shift+P` 输入 `ESP-IDF:`） | 注意 |
|---|---|---|
| 切换当前工程版本 | **`Select current ESP-IDF version`**，或点状态栏的版本项 | 列表来自登记表 `eim_idf.json`（现有 5.1.6 / 6.0.2 两项） |
| 装新版本 | `Install Manager` | 向导里三处路径都选 D 盘 |
| 新建工程 | `New Project` / `Create New Empty Project` | 工程放 D 盘，建完补版本配置 |
| 编译 / 烧录 / 监视 | `Ctrl+Shift+B`、`Build`、`Flash`、`Monitor` | **不要**用 CMake Tools 的 Configure/Build |

> **UI 切换在本机可能"看起来没反应"**
> 本机每个工程的 `settings.json` 都写死了绝对路径，优先级高于 UI/用户设置。用 UI 选完版本后，**先看工程 `.vscode\settings.json` 里的 `idf.espIdfPathWin` 有没有变**：
> - 变了 → 删 `build` + 完全退出 VS Code，正常。
> - 没变 → UI 只改了别处的设置，本工程仍按旧路径编译，请改用方法 A 的脚本或方法 D 手动改。
>
> 一句话：**本机推荐做法是"脚本管工程、UI 只看列表"**，不要让两套机制同时改同一个工程。

---

## 7. 方法 D：手动改（脚本不可用时）

> 只在脚本报错、或要理解细节时用。手改容易漏键，改完务必按第 9 节检查清单核对。

### 7.1 改全局三件套（用户级，持久）

```powershell
[Environment]::SetEnvironmentVariable('IDF_PATH',            'D:\Espressif-6.0.2\v6.0.2\esp-idf', 'User')
[Environment]::SetEnvironmentVariable('IDF_TOOLS_PATH',      'D:\Espressif-6.0.2', 'User')
[Environment]::SetEnvironmentVariable('IDF_PYTHON_ENV_PATH', 'D:\Espressif-6.0.2\python_env\idf6.0_py3.14_env', 'User')

# 回滚到 5.1.6：
# IDF_PATH            = D:\Espressif-5.1.6\frameworks\esp-idf-v5.1.6
# IDF_TOOLS_PATH      = D:\Espressif-5.1.6
# IDF_PYTHON_ENV_PATH = D:\Espressif-5.1.6\python_env\idf5.1_py3.11_env
```

三者**必须同版本**；改完新开终端才生效。

### 7.2 改工程 `settings.json`

要动的键（两版本对照，可直接照抄本机真实值）：

| 键 | 5.1.6 | 6.0.2 |
|---|---|---|
| `idf.espIdfPathWin` | `D:\Espressif-5.1.6\frameworks\esp-idf-v5.1.6` | `D:\Espressif-6.0.2\v6.0.2\esp-idf` |
| `idf.pythonBinPathWin` | `...\idf5.1_py3.11_env\Scripts\python.exe` | `...\idf6.0_py3.14_env\Scripts\python.exe` |
| `idf.toolsPathWin` | `D:\Espressif-5.1.6` | `D:\Espressif-6.0.2` |
| `idf.customExtraPaths` | 16 条（见 `templates\settings.esp-idf-5.1.6.json`） | 12 条（见 `templates\settings.esp-idf-6.0.2.json`） |
| `idf.customExtraVars.IDF_PYTHON_ENV_PATH` | `...\idf5.1_py3.11_env` | `...\idf6.0_py3.14_env` |
| `idf.customExtraVars.OPENOCD_SCRIPTS` | `...\openocd-esp32\v0.12.0-esp32-20241016\...` | `...\v0.12.0-esp32-20260424\...` |
| `idf.customExtraVars.ESP_ROM_ELF_DIR` | `...\esp-rom-elfs\20230320\` | `...\esp-rom-elfs\20241011\` |
| `idf.gitPathWin` | `...\idf-git\2.44.0\cmd\git.exe` | 删掉/留系统 Git |
| `cmake.cmakePath` | `...\cmake\3.30.2\bin\cmake.exe` | `...\cmake\4.0.3\bin\cmake.exe` |
| `cmake.configureEnvironment` | `IDF_PATH` + `IDF_TOOLS_PATH` 指向 5.1.6 | 指向 6.0.2 |

**`idf.customExtraPaths` 不要手写**，用该版本自己的导出命令生成：

```powershell
$env:IDF_PATH = 'D:\Espressif-6.0.2\v6.0.2\esp-idf'
$env:IDF_TOOLS_PATH = 'D:\Espressif-6.0.2'
$env:PYTHONUTF8 = '1'
& 'D:\Espressif-6.0.2\python_env\idf6.0_py3.14_env\Scripts\python.exe' `
  'D:\Espressif-6.0.2\v6.0.2\esp-idf\tools\idf_tools.py' export --format key-value
```

把输出的 `PATH=` 去掉结尾 `;%PATH%` 就是 `idf.customExtraPaths`；`OPENOCD_SCRIPTS` / `ESP_ROM_ELF_DIR` / `IDF_PYTHON_ENV_PATH` 也在输出里。省事的话直接复制 `templates\settings.esp-idf-<版本>.json`（模板就是脚本用同样方法生成的静态快照）：

```powershell
Copy-Item 'D:\Code\VSCodeCode\ESP32S3\Routine\templates\settings.esp-idf-6.0.2.json' `
  'D:\工程路径\.vscode\settings.json' -Force
```

> **不要两种方法混用**
> 模板是"生成那一刻的路径快照"。工具升级/换安装位置后模板就过期，此时优先用脚本（实时 `idf_tools.py export`），或重新生成模板：
> `.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-6.0.2 -TemplateOut .\templates\settings.esp-idf-6.0.2.json`

### 7.3 收尾

删 `build` → 完全退出 VS Code → 重开 → 编译。若 CMake 报 Kconfig / 缓存不兼容，再删 `sdkconfig`（会丢 menuconfig 配置，先备份）。

---

## 8. 方法 E：命令行 / 终端里临时用某个版本

**适用：** 只想在 PowerShell 里编译/烧录，不动 VS Code。

### 8.1 标准姿势：进目录执行 `export.ps1`

```powershell
Set-ExecutionPolicy -Scope Process Bypass -ErrorAction SilentlyContinue
cd 'D:\Espressif-6.0.2\v6.0.2\esp-idf'
.\export.ps1                      # 设置本终端的 IDF_PATH / PATH / ESP_IDF_VERSION 等

cd 'D:\Code\VSCodeCode\ESP32S3\Routine\hello_world_6.0.2'
& "$env:IDF_PYTHON_ENV_PATH\Scripts\python.exe" "$env:IDF_PATH\tools\idf.py" build
```

想少打字，在当前终端定义函数：

```powershell
function idfpy { & "$env:IDF_PYTHON_ENV_PATH\Scripts\python.exe" "$env:IDF_PATH\tools\idf.py" @args }
idfpy build
idfpy -p COM5 flash monitor
```

**特性：** `export.ps1` 只影响**当前进程**。关掉窗口、或新开一个终端，又回到用户级默认（目前 5.1.6）。它不改变 VS Code，也不影响别的窗口。

### 8.2 用 EIM 起一个已激活版本的终端

```powershell
$eim = 'D:\Espressif\eim\eim-gui-windows-x64.exe'
& $eim list                       # 列出已装版本（v5.1.6 / v6.0.2）
& $eim shell v6.0.2               # 开一个环境已激活的终端
& $eim run 'idf.py --version' v6.0.2
```

### 8.3 6.0.x 的专属坑：`TypeError ... got 'NoneType'`

没执行 `export.ps1` 就直接调 6.0.2 的 `idf.py`，`idf-component-manager` 会读到未设置的 `ESP_IDF_VERSION`：

```text
TypeError: expected string or bytes-like object, got 'NoneType'
```

解决：先 `export.ps1`（它会自动设 `ESP_IDF_VERSION=6.0.2`），或手动补 `$env:ESP_IDF_VERSION = '6.0.2'`。**这不是安装坏了。**

---

## 9. 切换后检查清单（打印出来照着勾）

| # | 动作 | 命令 / 入口 | 不做会怎样 |
|---|---|---|---|
| 1 | 删工程 `build` | `Remove-Item '<工程>\build' -Recurse -Force` | CMake 复用旧缓存，编译仍按旧版本，或报路径错 |
| 2 | 完全退出 VS Code | `File → Exit` 后重开 | 扩展仍持旧配置，看起来"切了没生效" |
| 3 | 编译验证 | `Ctrl+Shift+B` / `ESP-IDF: Build your project` | 不知道到底成没成 |
| 4 | 版本断言 | 看构建日志路径；或 `export.ps1` 后 `idf.py --version` | — |
| 5 | 归属复核 | `.\tools\idf-versions.ps1 -SkipSize` | 引用数/失效引用异常无人发现 |
| 6 | （按需）删 `sdkconfig` | 仅当 CMake 报 Kconfig 不兼容时 | 主版本跨度大时偶发配置不兼容 |

> **`build` 和 `sdkconfig` 的取舍**
> `build\` 里是 CMakeCache + 编译产物，**跨版本必删**；`sdkconfig` 是工程配置（menuconfig 结果），**只在报不兼容时删**，删前备份（`sdkconfig.old` 不一定存在）。

---

## 10. 排错速查（按现象查）

| 现象 | 原因 | 处理 |
|---|---|---|
| 切完编译还是用旧版本 | `build` 没删 / VS Code 没完全退出 / 改错了工程 | 删 `build` → `File → Exit` → 重开；`idf-versions.ps1` 看归属 |
| `xtensa-esp32s3-elf-gcc is not a full path and was not found in the PATH` | 命令行没先 `export.ps1` | `cd <该版本源码>; .\export.ps1` 再编译（`idf.py --version` 不需要，别拿它推断） |
| 扩展弹 `IDF_PYTHON_ENV_PATH is not set` | 三件套缺失或不同版本 | `idf-versions.ps1` 看一致性；或不带 `-KeepEnv` 跑一次脚本 |
| 6.0 报 `TypeError ... got 'NoneType'` | 没设 `ESP_IDF_VERSION` | 执行 6.0.2 的 `export.ps1`，或手工设该变量 |
| 6.0 编译报找不到 `driver/i2s.h`、`i2s_*` 旧 API | 6.0 已移除旧 I2S 驱动 | 迁移到 `driver/i2s_std.h`（`i2s_new_channel` 等）；**老工程留 5.1.6** |
| CMake 找到 STM32CubeCLT 或其他 CMake | `cmake.cmakePath` 被覆盖/没写 | 用脚本重写，确认 `cmake.cmakePath` 指向该版本 `tools\cmake\...`；别用 CMake Tools 构建 |
| 插件看不到已装版本 | 登记表带 BOM 或路径不对 | 登记表必须**无 BOM**；检查用户设置 `idf.eimIdfJsonPath` 指向 `D:\Espressif\eim-default\tools\eim_idf.json` |
| `idf.py --version` 显示 `v1.0.3` | 命中了 PATH 里的 `idf-exe` 启动器 | 用显式 Python：`& "$env:IDF_PYTHON_ENV_PATH\Scripts\python.exe" "$env:IDF_PATH\tools\idf.py" --version` |
| 报 Kconfig / CMake 缓存不兼容 | 跨版本残留 | 删 `build`，必要时删 `sdkconfig` |
| 脚本报 `未找到 Python 虚拟环境` | 该版本只克隆了源码、没装工具链 | 先 `cd <源码>; .\install.ps1` 或官方安装器装全 |
| 脚本报 `目录不存在: D:\Espressif-x.y.z` | `-EspressifRoot` 写错 | `.\tools\idf-versions.ps1` 确认真实安装根 |
| 切换后中文乱码 / 脚本语法错 | `.ps1`/`.md` 丢了 UTF-8 BOM（PS 5.1 按 GBK 解析） | 重存为 **UTF-8 with BOM**；给程序解析的 JSON 反而要**无 BOM** |
| 串口打不开 / 烧录失败 | 不是版本问题 | 改 `idf.portWin`（如 COM5/COM6），关掉占用串口的监视器 |

---

## 11. 回滚

切换是"改指针"，所以回滚也是改指针，**不用重装**：

```powershell
# ① 切回 5.1.6（工程级）
cd D:\Code\VSCodeCode\ESP32S3\Routine
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-5.1.6 `
  -Project 'D:\Code\VSCodeCode\ESP32S3\Routine\basic_routines\02_key' -KeepEnv

# ② 删 build + 完全退出 VS Code + 重新编译

# ③ 若全局也被改了，切回全局默认（不带 -KeepEnv 再跑一次 5.1.6）
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-5.1.6 `
  -Project 'D:\Code\VSCodeCode\ESP32S3\Routine\hello_world_6.0.2'
```

**用备份恢复（脚本每次写入前都会留 `.bak-时间戳`）：**

```powershell
Get-ChildItem 'D:\...\工程\.vscode\settings.json.bak-*' | Sort-Object LastWriteTime -Descending
Copy-Item '<选中的 .bak 文件>' 'D:\...\工程\.vscode\settings.json' -Force
```

> **回滚后仍有怪问题**
> 先删 `build`。`CMakeCache.txt` 里记着上一次的 `IDF_PATH`，不清掉会继续"引用旧版本"。

---

## 12. 增 / 删版本（简版）

> 完整 SOP 见 `docs\ESP-IDF-维护手册.md` 第 17 章。

**新增一个版本（例如 5.4）：**

1. 装到独立目录 `D:\Espressif-5.4`（**不要覆盖旧目录**，venv 里是绝对路径）。
2. 进源码目录执行 `export.ps1`，确认 `idf.py --version`（5.x 布局是 `D:\Espressif-5.4\frameworks\esp-idf-v5.4`，6.x 是 `D:\Espressif-6.0.2\v6.x\esp-idf`，先 `Get-ChildItem` 看清目录名）。
3. 生成模板：`.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-5.4 -TemplateOut .\templates\settings.esp-idf-5.4.json`
4. 用方法 A 把工程切过去 → `idf-versions.ps1` 复核。
5. 让 UI 也能看到：用 EIM 安装会自动登记；离线安装则需手工写 `eim_idf.json`（**无 BOM**）或 `eim import`。

**删除一个版本：**

```powershell
.\tools\idf-versions.ps1                      # ① 查引用
# ② 把仍引用它的工程切走，并删这些工程的 build
# ③ 若全局三件套指向它，先切走
Remove-Item 'D:\Espressif-5.4' -Recurse -Force   # ④ 确认路径无误后删
.\tools\idf-versions.ps1                      # ⑤ 复核：引用 0、失效 0
```

**四条铁律：**

1. 裸跑 `idf.py build` 前先 `export.ps1`。
2. 含中文的 `.ps1` / `.md` 用 **UTF-8 with BOM**；给程序解析的 `.json`（登记表）**无 BOM**。
3. 删 `C:\Espressif` 只能用 `cmd /c rmdir "C:\Espressif"`；**不要** `Remove-Item -Recurse`（会跟随目录联接删掉 D 盘真实数据）。
4. 删版本前必须先体检、切走引用、删 `build`。

---

## 13. 速查卡

```powershell
# ===<mark> 体检 </mark>===
cd D:\Code\VSCodeCode\ESP32S3\Routine
.\tools\idf-versions.ps1 -SkipSize

# ===<mark> 切工程（推荐）</mark>===
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-6.0.2 -Project '<工程>' -KeepEnv
Remove-Item '<工程>\build' -Recurse -Force
# → File → Exit → 重开 → Ctrl+Shift+B

# ===<mark> 切工程 + 全局默认 </mark>===
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-6.0.2 -Project '<工程>'

# ===<mark> 只看不改 </mark>===
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-6.0.2 -Project '<工程>' -DryRun

# ===<mark> 命令行临时用 6.0.2 </mark>===
cd D:\Espressif-6.0.2\v6.0.2\esp-idf; .\export.ps1
& "$env:IDF_PYTHON_ENV_PATH\Scripts\python.exe" "$env:IDF_PATH\tools\idf.py" build

# ===<mark> 回滚 5.1.6 </mark>===
.\tools\switch-idf-version.ps1 -EspressifRoot D:\Espressif-5.1.6 -Project '<工程>' -KeepEnv
```

---

## 14. FAQ

**Q1：切到 6.0.2 后，5.1.6 会被删或坏掉吗？**
不会。两套安装完全独立，切换只改配置指针。想回去随时切。

**Q2：切换要重新安装、要联网吗？**
不要。秒级完成，只写 `settings.json`（可选的全局环境变量），不下载任何东西。

**Q3：同一个 VS Code 窗口开两个不同版本的工程行吗？**
技术上可以（每个工程看自己的 `settings.json`），但扩展的版本状态是**按窗口/工作区**维护的，混开容易互相串。稳妥做法：一个工程一个窗口，或一次只编译一个。

**Q4：为什么我改了 `settings.json`，编译还是旧版本？**
按顺序查：① `build` 删了吗 ② VS Code 完全退出了吗 ③ 改的是不是这个工程的 `.vscode\settings.json` ④ `idf-versions.ps1` 的归属对不对 ⑤ 是不是 `CMakeCache.txt` 残留。

**Q5：UI 里选版本和脚本切，哪个优先？**
工程 `settings.json` 里写死的绝对路径优先。UI 一般改用户/全局设置，所以本机建议"脚本切工程、UI 只看"。

**Q6：`30_music` 能切到 6.0.2 吗？**
配置能切，**编译不行**：它用旧 I2S API，6.0 已移除 `driver/i2s.h`。要上 6.0 必须先迁移到 `i2s_std.h`。验证 6.0.2 请用 `hello_world_6.0.2`。

**Q7：只切命令行会影响 VS Code 吗？**
不会。`export.ps1` 只改当前终端进程；VS Code 按工程配置走，二者互不干扰。

**Q8：怎么知道某版本还能不能删？**
`idf-versions.ps1` 的"结论"段：引用数 = 0 且无失效引用，才可删。删前仍要把工程切走、删 `build`。

**Q9：脚本的备份在哪、会不会越积越多？**
在 `settings.json` 同目录，命名 `settings.json.bak-yyyyMMdd-HHmmss`。确认稳定后可清理。

---

## 15. 事实边界与出处

- 本文路径、版本号、工程归属、环境变量一致性，均由 **2026-11-19** 在本机运行 `tools\idf-versions.ps1 -SkipSize` 实测得到；两套模板内容读取自 `templates\settings.esp-idf-{5.1.6,6.0.2}.json`。
- 脚本行为读取自 `tools\switch-idf-version.ps1` 源码（含 `-KeepEnv` / `-DryRun` / `-TemplateOut` 三个开关与写入键清单），未做推测。
- VS Code 用户设置（`%APPDATA%\Code\User\settings.json`）实测只有 `idf.eimIdfJsonPath` 与 `idf.gitPathWin`，**没有**全局 `idf.espIdfPath`。
- 未在本机验证、仅据工程文档转述的内容：EIM `fix` 对手工登记版本的能力、扩展 2.3.0 的具体 UI 文案、`eim list-tools` 的可靠性。涉及这些操作前请以实际界面/输出为准。
- 相关文档（工程内，权威细节以它们为准）：
  - `D:\Code\VSCodeCode\ESP32S3\Routine\README.md`（总入口）
  - `D:\Code\VSCodeCode\ESP32S3\Routine\docs\ESP-IDF-维护手册.md`（第 10–12 章版本切换、第 17 章 SOP）
  - `D:\Code\VSCodeCode\ESP32S3\Routine\docs\ESP-IDF-脚本手册.md`（两个脚本的参数与排错）
  - `D:\Code\VSCodeCode\ESP32S3\Routine\docs\ESP-IDF-环境交接.md`（环境清单与已知问题）
  - `D:\Code\VSCodeCode\ESP32S3\Routine\templates\settings.esp-idf-5.1.6.json`、`settings.esp-idf-6.0.2.json`

---

**相关笔记：** [DevVault 索引](../../../../../Embedded/NoSystematic/Docs/06-环境手册/devvault_索引/) · [Cursor远程开发-iMX6ULL环境手册](../../../../../Embedded/NoSystematic/Docs/06-环境手册/cursor远程开发-imx6ull环境手册/)
