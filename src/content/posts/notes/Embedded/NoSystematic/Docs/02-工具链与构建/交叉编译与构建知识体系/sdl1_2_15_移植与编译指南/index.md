---
title: "SDL1.2.15 移植与编译指南"
published: 2026-07-20
description: "Linux 下 SDL 1.2.15 移植 / 编译完整指南 [!abstract] 本文定位 从依赖安装到交叉编译、上板部署，一份可照抄的 SDL 1.2.1"
tags: ["嵌入式/系统", "工具链/编译链接", "工具链/交叉编译"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系"
draft: false
order: 58
---

# Linux 下 SDL 1.2.15 移植 / 编译完整指南

> **本文定位**
> 从依赖安装到交叉编译、上板部署，一份可照抄的 SDL 1.2.15 构建手册。
> 以 **Debian/Ubuntu** 为主，兼顾 RHEL 系与 Arch；交叉编译以 **ARM Cortex-A7 + arm-linux-gnueabihf** 为例。

> **一页纸速览**
> | 阶段 | 关键命令 | 产物 |
> |---|---|---|
> | 原生编译 | `./configure --prefix=/usr/local && make -j4 && sudo make install` | `/usr/local/lib/libSDL*` |
> | 交叉编译 | `./configure --host=arm-linux-gnueabihf --prefix=/opt/sdl_arm` | `/opt/sdl_arm/lib/libSDL*` |
> | 验证 | `sdl-config --version` / 编译 2 秒窗口测试 | 能弹窗即成功 |

> **兼容性补丁**
> 新版 GCC 下必须先修 `_XData32` 的 `register` 问题（第 2.2 节），否则编译直接失败。

> **章节速览**
> #一、编译前准备：安装依赖 · #二、原生编译（PC 本地安装） · #三、交叉编译（移植到 ARM 等嵌入式平台） · #四、常见编译问题与解决 · #五、使用 SDL 1.2.15 编译程序

## 一、编译前准备：安装依赖

SDL 1.2.15 依赖 X11、音频、编译工具等基础库，不同发行版安装命令如下：

### 1. Debian/Ubuntu 系列

```bash
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

```bash
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

```bash
sudo pacman -S base-devel pkg-config libx11 libxext libxrandr libxcursor libxinerama libxi alsa-lib pulseaudio glu
```

## 二、原生编译（PC 本地安装）

### 1. 下载源码

官方下载地址（稳定版 1.2.15）：

```bash
wget https://www.libsdl.org/release/SDL-1.2.15.tar.gz
# 解压
tar -zxvf SDL-1.2.15.tar.gz
cd SDL-1.2.15
```

### 2. 修复兼容性补丁（新版系统必做）

新版 Linux 系统（如 Ubuntu 20.04+、Fedora 30+）编译时会出现 `_XData32` 类型错误，需打补丁：

```bash
# 修复 X11 常量定义问题
sed -e '/_XData32/s:register long:register _Xconst long:' -i src/video/x11/SDL_x11sym.h
```

### 3. 配置编译参数

```bash
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

```bash
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

```bash
# 添加路径到配置文件
echo "/usr/local/lib" | sudo tee -a /etc/ld.so.conf.d/sdl.conf

# 刷新缓存
sudo ldconfig
```

### 6. 验证安装

```bash
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

```bash
# Debian/Ubuntu 直接安装
sudo apt install gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf

# 或下载第三方工具链（如全志、海思 SDK 自带）
# 解压后添加到环境变量：export PATH=/path/to/toolchain/bin:$PATH
```

### 2. 交叉编译配置

```bash
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

```bash
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
```bash
    echo "/opt/sdl_arm/lib" >> /etc/ld.so.conf
    ldconfig
```

## 四、常见编译问题与解决

### 1. 错误：`undefined reference to '_XData32'`

**原因**：新版 X11 库修改了类型定义，与旧版 SDL 不兼容

**解决**：执行前文补丁命令：

```bash
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

```bash
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

```bash
# 单文件编译
gcc main.c -o my_app `sdl-config --cflags --libs`
```

```makefile
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

## 小结

以上覆盖了 SDL 1.2.15 在 Linux 下**原生编译**与**嵌入式交叉编译**的全流程：依赖、配置、兼容性补丁、部署与排错，适配 PC 与 ARM 等主流平台。

## 相关笔记

- [Windows构建环境（MSYS2与Cygwin）](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/windows构建环境_msys2与cygwin/) —— 在 Windows 上先装好 MSYS2 / Cygwin
- [交叉编译与工具链](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/交叉编译与工具链/) —— 工具链命名、sysroot 与常见问题
- [Makefile与CMake](../../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系/makefile与cmake/) —— 把 `sdl-config` 接进自己的工程
