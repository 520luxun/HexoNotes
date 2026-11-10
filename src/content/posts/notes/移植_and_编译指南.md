---
title: "移植 and 编译指南"
published: 2026-07-20
description: "Linux 下 SDL 1.2.15 移植 / 编译完整指南 SDL 1.2.15 是经典的跨平台多媒体开发库，常用于旧版游戏、模拟器、FFmpeg 等项目。以"
tags: []
category: "知识点"
draft: false
---

# Linux 下 SDL 1.2.15 移植 / 编译完整指南

SDL 1.2.15 是经典的跨平台多媒体开发库，常用于旧版游戏、模拟器、FFmpeg 等项目。以下从**依赖安装、源码编译、交叉编译移植、常见问题解决**四个方面，提供完整的编译与移植指南。

## 一、编译前准备：安装依赖

SDL 1.2.15 依赖 X11、音频、编译工具等基础库，不同发行版安装命令如下：

### 1. Debian/Ubuntu 系列


```
# 基础编译工具
sudo apt update
sudo apt install build-essential autoconf automake libtool pkg-config

# X11 图形依赖（必选，否则无视频输出）
sudo apt install libx11-dev libxext-dev libxrandr-dev libxcursor-dev libxinerama-dev libxi-dev

# 音频依赖（ALSA/PulseAudio 二选一即可）
sudo apt install libasound2-dev  # ALSA 音频
sudo apt install libpulse-dev    # PulseAudio 音频（可选）

# 可选依赖（OpenGL、输入设备等）
sudo apt install libglu1-mesa-dev libdbus-1-dev
```

### 2. RHEL/CentOS/Fedora 系列


```
# 基础编译工具
sudo dnf install gcc make autoconf automake libtool pkgconfig

# X11 图形依赖
sudo dnf install libX11-devel libXext-devel libXrandr-devel libXcursor-devel libXinerama-devel libXi-devel

# 音频依赖
sudo dnf install alsa-lib-devel pulseaudio-libs-devel

# 可选依赖
sudo dnf install glu-devel dbus-devel
```

### 3. Arch Linux 系列


```
sudo pacman -S base-devel pkg-config libx11 libxext libxrandr libxcursor libxinerama libxi alsa-lib pulseaudio glu
```

## 二、原生编译（PC 本地安装）

### 1. 下载源码

官方下载地址（稳定版 1.2.15）：


```
wget https://www.libsdl.org/release/SDL-1.2.15.tar.gz
# 解压
tar -zxvf SDL-1.2.15.tar.gz
cd SDL-1.2.15
```

### 2. 修复兼容性补丁（新版系统必做）

新版 Linux 系统（如 Ubuntu 20.04+、Fedora 30+）编译时会出现 `_XData32` 类型错误，需打补丁：


```
# 修复 X11 常量定义问题
sed -e '/_XData32/s:register long:register _Xconst long:' -i src/video/x11/SDL_x11sym.h
```

### 3. 配置编译参数


```
# 基础配置（安装到 /usr/local，禁用静态库）
./configure --prefix=/usr/local --disable-static

# 可选配置参数（按需添加）
# --enable-alsa：启用 ALSA 音频（默认开启）
# --enable-pulseaudio：启用 PulseAudio
# --disable-video：禁用视频（仅音频场景）
# --host=arm-linux-gnueabihf：交叉编译时指定架构（见下文）

# 查看完整配置参数
./configure --help
```

### 4. 编译与安装


```
# 编译（-j4 为多线程，根据 CPU 核心数调整）
make -j4

# 安装（需 root 权限）
sudo make install

# 安装文档（可选）
sudo install -v -m755 -d /usr/share/doc/SDL-1.2.15/html
sudo install -v -m644 docs/html/*.html /usr/share/doc/SDL-1.2.15/html
```

### 5. 配置库路径（解决 “找不到库” 问题）

默认安装到 `/usr/local/lib`，部分系统未识别该路径，需更新动态链接库缓存：


```
# 添加路径到配置文件
echo "/usr/local/lib" | sudo tee -a /etc/ld.so.conf.d/sdl.conf

# 刷新缓存
sudo ldconfig
```

### 6. 验证安装


```
# 查看版本
sdl-config --version  # 输出 1.2.15 即成功

# 编译测试程序
cat > test_sdl.c << EOF
#include <SDL/SDL.h>
int main() {
    SDL_Init(SDL_INIT_VIDEO);
    SDL_SetVideoMode(640, 480, 32, SDL_SWSURFACE);
    SDL_Delay(2000);
    SDL_Quit();
    return 0;
}
EOF

# 编译运行（弹出 2 秒窗口即成功）
gcc test_sdl.c -o test_sdl `sdl-config --cflags --libs`
./test_sdl
```

## 三、交叉编译（移植到 ARM 等嵌入式平台）

以 **ARM Cortex-A7 嵌入式 Linux** 为例（工具链：`arm-linux-gnueabihf-gcc`），步骤如下：

### 1. 安装交叉编译工具链


```
# Debian/Ubuntu 直接安装
sudo apt install gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf

# 或下载第三方工具链（如全志、海思 SDK 自带）
# 解压后添加到环境变量：export PATH=/path/to/toolchain/bin:$PATH
```

### 2. 交叉编译配置


```
# 回到源码目录
cd SDL-1.2.15

# 清理之前的编译残留
make distclean

# 交叉配置（指定架构、工具链、安装路径）
./configure \
    --prefix=/home/xxx/sdl_arm  # 交叉编译输出路径（自定义）
    --host=arm-linux-gnueabihf  # 目标架构
    --disable-static \
    --enable-alsa \
    --disable-pulseaudio \      # 嵌入式常用 ALSA
    --disable-video-x11 \       # 无 X11 环境（如帧缓冲 fbdev）
    --enable-video-fbdev        # 启用 Linux 帧缓冲（嵌入式必备）
```

### 3. 交叉编译与打包


```
# 编译
make -j4

# 安装到指定路径
make install

# 打包库文件（用于部署到嵌入式板卡）
tar -zcvf sdl-1.2.15-arm.tar.gz /home/xxx/sdl_arm
```

### 4. 嵌入式板卡部署

1. 将 `sdl-1.2.15-arm.tar.gz` 传到板卡（如 `/opt` 目录）
2. 解压：`tar -zxvf sdl-1.2.15-arm.tar.gz -C /opt`
3. 配置板卡库路径：
```
    echo "/opt/sdl_arm/lib" >> /etc/ld.so.conf
    ldconfig
```


## 四、常见编译问题与解决

### 1. 错误：`undefined reference to '_XData32'`

**原因**：新版 X11 库修改了类型定义，与旧版 SDL 不兼容

**解决**：执行前文补丁命令：

```
sed -e '/_XData32/s:register long:register _Xconst long:' -i src/video/x11/SDL_x11sym.h
```

### 2. 错误：`No available video device`

**原因**：未安装 X11 依赖，或编译时未启用视频后端

**解决**：

- 原生编译：安装 `libx11-dev` 等 X11 库，重新 `configure`
- 嵌入式：添加 `--enable-video-fbdev` 配置，确保内核支持帧缓冲

### 3. 错误：`couldn't find SDL library` 或 `sdl-config: command not found`

**原因**：库路径未加载，或未安装到系统路径

**解决**：

```
# 刷新动态链接库
sudo ldconfig

# 或添加环境变量
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
```

### 4. 交叉编译错误：`cannot run C compiled program`

**原因**：`configure` 未正确指定 `--host`，尝试运行交叉编译的程序

**解决**：确认 `--host` 参数与工具链前缀一致（如 `arm-linux-gnueabihf`）

### 5. 嵌入式无声音

**原因**：未启用 ALSA，或板卡内核未配置音频驱动

**解决**：

- 编译时添加 `--enable-alsa`
- 检查内核：`make menuconfig` → `Device Drivers` → `Sound card support` 启用音频驱动

## 五、使用 SDL 1.2.15 编译程序

编写程序时，通过 `sdl-config` 自动获取编译参数：

```
# 单文件编译
gcc main.c -o my_app `sdl-config --cflags --libs`

# Makefile 示例
CC = gcc
CFLAGS = `sdl-config --cflags` -Wall -O2
LDFLAGS = `sdl-config --libs`
TARGET = my_app
SRC = main.c

$(TARGET): $(SRC)
    $(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

clean:
    rm -f $(TARGET)
```

---

以上覆盖了 SDL 1.2.15 在 Linux 下**原生编译**与**嵌入式交叉编译**的全流程，包含依赖、配置、补丁、部署及问题排查，适配 PC 与 ARM 等主流平台。



# Windows 安装 MSYS2 完整指南

MSYS2 是 Windows 下强大的类 Unix 开发环境，集成 **pacman 包管理器**、MinGW 工具链与 GNU 工具，能轻松编译 Linux / Unix 软件、搭建 C/C++ 开发环境。

### 一、系统要求

- **Windows 10 1809+ / Windows 11**（64 位）
- **NTFS 分区**、至少 **2GB 空闲空间**
- 安装路径**无中文、无空格、无特殊字符**（推荐 `C:\msys64`）

---

### 二、下载 MSYS2

**官方下载（推荐）**

- 官网：[https://www.msys2.org/](https://link.wtturl.cn/?target=https%3A%2F%2Fwww.msys2.org%2F&scene=im&aid=497858&lang=zh "autolink")
- 最新安装包：**msys2-x86_64-latest.exe**MSYS2

**国内镜像（下载更快）**

- 中科大：[https://mirrors.ustc.edu.cn/msys2/distrib/msys2-x86_64-latest.exe](https://link.wtturl.cn/?target=https%3A%2F%2Fmirrors.ustc.edu.cn%2Fmsys2%2Fdistrib%2Fmsys2-x86_64-latest.exe&scene=im&aid=497858&lang=zh "autolink")
- 清华：[https://mirrors.tuna.tsinghua.edu.cn/msys2/distrib/msys2-x86_64-latest.exe](https://link.wtturl.cn/?target=https%3A%2F%2Fmirrors.tuna.tsinghua.edu.cn%2Fmsys2%2Fdistrib%2Fmsys2-x86_64-latest.exe&scene=im&aid=497858&lang=zh "autolink")

---

### 三、安装步骤

1. **运行安装程序**
    
    双击下载的 `.exe` 文件，点击 **Next**。
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
2. **选择安装路径**
    
    **强烈建议默认路径 `C:\msys64`**（纯英文、无空格），避免编译报错。
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
3. **选择开始菜单文件夹**
    
    默认即可，点击 **Next** → **Install** 开始安装。
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
4. **完成安装**
    
    勾选 **Run MSYS2 now**（启动终端），点击 **Finish**。
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    

---

### 四、首次启动与系统更新（关键）

安装完成会自动打开 **MSYS2 UCRT64** 终端（黑色窗口）。

![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)

#### 1. 第一次更新（核心组件）


```
pacman -Syu
```

- 执行后提示 **`==> Please close the terminal`**
- **直接关闭当前终端窗口**

#### 2. 第二次更新（剩余包）

从开始菜单重新打开 **MSYS2 UCRT64**，执行：


```
pacman -Su  # 完成全部更新
```

更新后环境就绪。

---

### 五、配置国内镜像（提速）

默认源慢，替换为清华镜像。

#### 1. 编辑镜像配置文件

```
# 编辑 msys 源
vim /etc/pacman.d/mirrorlist.msys
```

注释原有 `Server`，添加：

```
Server = https://mirrors.tuna.tsinghua.edu.cn/msys2/msys/$arch
```

```
# 编辑 mingw64 源
vim /etc/pacman.d/mirrorlist.mingw64
```

添加：

```
Server = https://mirrors.tuna.tsinghua.edu.cn/msys2/mingw/x86_64
```

#### 2. 刷新缓存

```
pacman -Sy  # 刷新软件源
```

---

### 六、环境说明（常用终端）

开始菜单有多个入口，**开发优先用 UCRT64 / MINGW64**：

- **MSYS2 UCRT64**：现代 C 运行时，兼容性好、性能强（**推荐**）
- **MSYS2 MINGW64**：经典 64 位 MinGW 环境
- **MSYS2 MSYS**：类 Unix 环境（编译 Linux 工具）

---

### 七、安装常用工具（C/C++ 开发）

打开 **MSYS2 UCRT64** 执行：

#### 1. 安装完整工具链

```
pacman -S mingw-w64-ucrt-x86_64-toolchain
```

包含：**gcc/g++/gdb/make/binutils** 等。

#### 2. 安装构建工具

```
pacman -S mingw-w64-ucrt-x86_64-cmake
pacman -S mingw-w64-ucrt-x86_64-ninja
pacman -S git vim
```

#### 3. 验证安装

```
gcc --version   # 查看 GCC 版本
g++ --version
make --version
cmake --version
```

输出版本信息即成功。

---

### 八、添加到系统 PATH（可选）

让 Windows CMD/PowerShell 直接使用 MSYS2 工具：

1. 此电脑 → 属性 → 高级系统设置 → 环境变量
2. 系统变量 → **Path** → 编辑
3. 新增（按顺序）：
```
    C:\msys64\ucrt64\bin
    C:\msys64\usr\bin
```
1. 确定保存，**重启终端**生效。

---

### 九、常见问题

1. **`pacman` 下载慢 / 失败**
    
    → 按步骤**配置清华 / 中科大镜像**
2. **编译报错：路径含中文 / 空格**
    
    → 重装到 `C:\msys64`
3. **命令找不到（如 gcc）**
    
    → 打开 **UCRT64/MINGW64** 终端（不是 MSYS）
    
    → 检查 PATH 是否包含 `...\ucrt64\bin`
4. **更新时提示关闭终端**
    
    → 直接关闭，重开再执行 `pacman -Su`

---

### 十、测试（编译 SDL 1.2.15）

安装依赖后即可编译：

```
# 安装 X11、OpenGL 依赖
pacman -S mingw-w64-ucrt-x86_64-libX11 mingw-w64-ucrt-x86_64-mesa

# 下载、解压、编译 SDL 1.2.15
wget https://www.libsdl.org/release/SDL-1.2.15.tar.gz
tar -zxvf SDL-1.2.15.tar.gz
cd SDL-1.2.15
./configure --prefix=/ucrt64
make -j8
make install
```

---

需要我给你一份 **MSYS2 常用 pacman 命令清单**（安装 / 卸载 / 更新 / 搜索）吗？



# Windows 安装 Cygwin 完整指南

**Cygwin** 是一款在 Windows 上提供**类 Unix/Linux 环境**的开源兼容层工具，核心通过 `cygwin1.dll` 模拟 POSIX 接口，让你直接运行 GNU 工具、Shell 脚本与 Linux 软件Cygwin。

### 一、Cygwin vs MSYS2：核心区别（你该选哪个）

先帮你理清和刚装的 **MSYS2** 的差异：

|特性|**Cygwin**|**MSYS2**|
|:--|:--|:--|
|**核心定位**|**完整 POSIX 兼容层**|**轻量编译环境**（Cygwin 精简版）|
|**运行依赖**|必须带 `cygwin1.dll`|命令依赖 `msys-2.0.dll`，编译用 MinGW 原生|
|**编译产物**|程序依赖 Cygwin DLL，**不能独立分发**|编译出**原生 Windows EXE/DLL**，无依赖|
|**包管理器**|`setup.exe`（图形 / 命令）|`pacman`（Arch 系，速度快、功能强）MSYS2|
|**软件库**|极全（超 10000 包，含 X11、服务）|够用（侧重开发工具、库、编译器）|
|**适合场景**|**跑 Linux 脚本、服务、完整环境**|**编译 Windows 程序、交叉编译**|

**一句话建议**：

- 要**完整 Linux 体验、跑服务 / 脚本** → 选 **Cygwin**
- 要**编译原生 Windows 程序、轻量环境** → 选 **MSYS2**（你已装）

---

### 二、Windows 安装 Cygwin 完整步骤

#### 1. 下载安装器

官网（64 位）：[https://cygwin.com/setup-x86_64.exe](https://link.wtturl.cn/?target=https%3A%2F%2Fcygwin.com%2Fsetup-x86_64.exe&scene=im&aid=497858&lang=zh "autolink")

国内镜像（更快）：

- 清华：[https://mirrors.tuna.tsinghua.edu.cn/cygwin/setup-x86_64.exe](https://link.wtturl.cn/?target=https%3A%2F%2Fmirrors.tuna.tsinghua.edu.cn%2Fcygwin%2Fsetup-x86_64.exe&scene=im&aid=497858&lang=zh "autolink")
- 中科大：[https://mirrors.ustc.edu.cn/cygwin/setup-x86_64.exe](https://link.wtturl.cn/?target=https%3A%2F%2Fmirrors.ustc.edu.cn%2Fcygwin%2Fsetup-x86_64.exe&scene=im&aid=497858&lang=zh "autolink")

#### 2. 运行安装（图形向导）

1. **运行 `setup-x86_64.exe`** → **Next**
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
2. **Choose Installation Type**：选 **Install from Internet**（在线安装）→ **Next**
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
3. **Root Directory**（安装路径）：
    
    - 默认 `C:\cygwin64`（**无中文、无空格**）
    - 建议默认，All Users → **Next**
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
4. **Local Package Directory**（缓存目录）：默认即可 → **Next**
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
5. **Connection**：选 **Direct Connection**（直连）→ **Next**
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
6. **Choose Download Site**（镜像）：
    
    - 国内选：`https://mirrors.tuna.tsinghua.edu.cn/cygwin/`
    - 或 `https://mirrors.ustc.edu.cn/cygwin/` → **Next**
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
7. **Select Packages**（关键：选软件）
    
    - 默认只装最小系统，**必须手动勾选常用工具**
    - 搜索框输入，点 **Skip** 切换为版本号（绿色勾选）：
        ```
        # 基础命令
        bash, coreutils, grep, sed, awk, vim, nano, wget, curl, git
        # 开发工具
        gcc, g++, make, gdb, cmake
        # 网络
        openssh, inetutils
        ```
        
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
8. **Next** → 同意安装依赖 → 等待下载完成
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    
9. **Finish**，可勾选创建桌面图标
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    

#### 3. 首次使用

- 双击 **Cygwin64 Terminal**
- 首次启动自动创建用户目录 `/home/你的Windows用户名`
- 出现 `用户名@主机名 ~ $` 即成功
    
    ![](data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27256%27%20height=%27192%27/%3e)
    

---

### 三、Cygwin 基础使用

#### 1. 文件系统路径

- Windows 盘在 Cygwin 下映射为：
    
    - `C:\` → `/cygdrive/c/`
    - `D:\` → `/cygdrive/d/`
    
- 示例：访问 `D:\project`
    ```
    cd /cygdrive/d/project
    ```


#### 2. 包管理（增删软件）

再次运行 **`setup-x86_64.exe`**，重复步骤到 **Select Packages**：

- 安装：搜索 → **Skip → 选版本**
- 卸载：搜索 → **版本 → 选 Uninstall**
- 命令行静默安装（示例）：

```
setup-x86_64.exe -q -P git,vim,gcc,make
```

#### 3. 编译测试（C 程序）

```
# 写测试代码
vim hello.c
```

```
#include <stdio.h>
int main() {
    printf("Hello, Cygwin!\n");
    return 0;
}
```

```
# 编译（依赖 cygwin1.dll）
gcc hello.c -o hello

# 运行
./hello

# 查看依赖（必须带 cygwin1.dll）
ldd hello.exe
```

---

### 四、常见问题

1. **下载慢 / 失败**
    
    → 换**清华 / 中科大镜像**
2. **命令找不到（如 gcc）**
    
    → 重新运行 `setup-x86_64`，**安装对应包**
3. **Windows 程序与 Cygwin 互操作**
    
    - 直接在 Cygwin 运行 `.exe`：`notepad.exe`
    - Windows 访问 Cygwin 目录：`C:\cygwin64\home\用户名`
    
4. **编译的程序不能在其他电脑运行**
    
    → Cygwin 程序**必须附带 `cygwin1.dll`**（在 `C:\cygwin64\bin`）

---

### 五、要不要装 Cygwin？（结合你之前的 SDL 需求）

你之前在 **Windows + MSYS2** 编译 SDL 1.2.15：

- **MSYS2 更适合**：编译出**原生 Windows 程序**，**不依赖任何 DLL**，可直接分发
- **Cygwin 适合**：如果你要**移植复杂 Linux 程序、跑完整 Shell 服务、需要完整 POSIX 环境**

简单说：**编译 Windows 程序用 MSYS2，跑 Linux 环境用 Cygwin**。

需要我给你一份 **Cygwin 常用命令与环境变量配置清单** 吗？