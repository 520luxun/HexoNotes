---
title: "Makefile与CMake"
published: 2026-11-18
description: "Makefile与CMake [!abstract] 本文定位 Makefile 基本结构与示例、CMake 跨平台构建与交叉编译配置、两者关系与嵌入式项目选型"
tags: ["嵌入式", "工具链/交叉编译"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/02-工具链与构建/交叉编译与构建知识体系"
draft: false
order: 57
---

# Makefile与CMake

> **本文定位**
> Makefile 基本结构与示例、CMake 跨平台构建与交叉编译配置、两者关系与嵌入式项目选型，附完整 CMake 工程示例。

在嵌入式开发（以及所有 C/C++ 项目）中，**构建工具**是必不可少的一环。它们帮助我们自动化编译、链接、打包等过程，避免手动敲击长长的编译器命令。最经典的构建工具是 **Make**，而 **CMake** 则是一个更现代的“元构建工具”，用于生成 Makefile 或其他构建系统的配置文件。

---

## 一、Makefile：最基础的构建脚本

### 1. 为什么需要 Makefile？
当项目包含多个源文件时，手动编译会非常繁琐：
```bash
gcc -c main.c -o main.o
gcc -c foo.c -o foo.o
gcc main.o foo.o -o program
```
每次修改一个文件，都要重新编译所有文件，效率低下。Makefile 可以：
- **只重新编译修改过的文件**（通过文件时间戳判断）
- **定义编译规则**，简化命令行
- **支持变量和函数**，提高复用性

### 2. Makefile 的基本结构
```makefile
target: dependencies
	command
```
- **target**：要生成的文件（可执行文件、目标文件等）
- **dependencies**：生成 target 所需的文件
- **command**：生成 target 的具体命令（前面必须有一个 **Tab** 键）

### 3. 简单示例
```makefile
# 变量
CC = gcc
CFLAGS = -Wall -g
TARGET = program
OBJS = main.o foo.o

# 默认目标
$(TARGET): $(OBJS)
	$(CC) -o $@ $^

# 模式规则：如何生成 .o 文件
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# 清理
clean:
	rm -f $(TARGET) $(OBJS)
```
- `$@` 代表目标名，`$^` 代表所有依赖，`$<` 代表第一个依赖。
- 执行 `make` 就会编译，执行 `make clean` 清理。

### 4. 在嵌入式中的使用
交叉编译时，只需修改 `CC` 变量：
```makefile
CC = arm-linux-gnueabihf-gcc
```
其他规则不变，即可生成 ARM 平台的可执行文件。

---

## 二、CMake：跨平台的构建系统生成器

### 1. 为什么需要 CMake？
Makefile 本身有两大痛点：
- **平台差异**：不同操作系统、编译器的命令和参数不同（如 Windows 下可能用 MSVC，Linux 下用 GCC）。
- **大型项目**：手写 Makefile 维护复杂，尤其是处理依赖关系、库搜索等。

CMake 通过一个高层描述文件（`CMakeLists.txt`），自动生成适用于当前平台的构建文件（如 Unix Makefile、Ninja、Visual Studio 工程等）。开发者只需编写一次 CMake 脚本，就能在任何平台上构建。

### 2. CMakeLists.txt 基本结构
```cmake
# 指定最低 CMake 版本
cmake_minimum_required(VERSION 3.10)

# 项目名称
project(MyProject VERSION 1.0 LANGUAGES C CXX)

# 添加可执行文件
add_executable(program main.c foo.c)

# 添加头文件路径（可选）
target_include_directories(program PRIVATE include)

# 添加链接库（例如 pthread）
target_link_libraries(program pthread)
```

### 3. 常用命令与变量
- `add_executable`：定义可执行文件
- `add_library`：定义静态/动态库
- `target_link_libraries`：指定链接库
- `include_directories` / `target_include_directories`：头文件搜索路径
- `find_package`：查找外部包（如 OpenCV、SDL）
- 变量如 `CMAKE_C_FLAGS`、`CMAKE_CXX_FLAGS` 用于设置编译选项

### 4. 交叉编译配置
CMake 支持通过工具链文件进行交叉编译。例如 `toolchain.cmake`：
```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR arm)
set(CMAKE_C_COMPILER arm-linux-gnueabihf-gcc)
set(CMAKE_CXX_COMPILER arm-linux-gnueabihf-g++)
set(CMAKE_FIND_ROOT_PATH /usr/arm-linux-gnueabihf)
```
然后执行：
```bash
mkdir build && cd build
cmake -DCMAKE_TOOLCHAIN_FILE=toolchain.cmake ..
make
```

---

## 三、Makefile 与 CMake 的关系

| 对比项 | Makefile | CMake |
|--------|----------|-------|
| **本质** | 构建规则文件，由 make 直接解析执行 | 元构建脚本，用于生成 Makefile 等 |
| **平台支持** | 需要为不同平台编写不同 Makefile | 一次编写，生成各平台原生构建文件 |
| **复杂度** | 适合中小型项目，大型项目维护困难 | 适合大型、跨平台项目 |
| **依赖处理** | 需要手动编写依赖规则（或借助 gcc -MM） | 自动处理头文件依赖 |
| **学习曲线** | 中等（语法简洁但陷阱多） | 较陡（概念多，但功能强大） |
| **典型使用** | 嵌入式裸机、简单 Linux 程序 | 大型软件、跨平台库（如 OpenCV） |

**简单来说**：Makefile 是“手动挡”，CMake 是“自动挡”。CMake 生成 Makefile 后，底层还是调用 make 来执行构建。

---

## 四、在嵌入式开发中的选择

- **裸机 / RTOS 项目**：通常直接使用 Makefile，因为项目规模不大，且需要精细控制编译选项和链接脚本。很多 SDK（如 STM32 CubeMX）默认生成 Makefile。
- **嵌入式 Linux 项目**：当项目涉及多个库、需要交叉编译、或者需要在不同板卡间移植时，CMake 更合适。例如，Yocto 和 Buildroot 都支持 CMake。
- **通用原则**：如果只是编译一两个文件，Makefile 足够；如果项目需要跨平台、依赖复杂，选 CMake。

---

## 五、示例：一个简单嵌入式项目的 CMake 配置

假设项目结构：
```
project/
├── CMakeLists.txt
├── src/
│   ├── main.c
│   └── uart.c
├── include/
│   └── uart.h
└── libs/
    └── libdriver.a
```

`CMakeLists.txt`：
```cmake
cmake_minimum_required(VERSION 3.10)
project(EmbeddedDemo LANGUAGES C)

# 设置交叉编译器（示例）
set(CMAKE_C_COMPILER arm-none-eabi-gcc)
set(CMAKE_C_FLAGS "-mcpu=cortex-m4 -mthumb -O2")

# 添加源文件
add_executable(demo src/main.c src/uart.c)

# 添加头文件路径
target_include_directories(demo PRIVATE include)

# 链接静态库
target_link_libraries(demo ${CMAKE_SOURCE_DIR}/libs/libdriver.a)

# 添加链接脚本（可选）
target_link_options(demo PRIVATE -T ${CMAKE_SOURCE_DIR}/stm32.ld)
```

构建：
```bash
mkdir build && cd build
cmake ..
make
```

---

## 六、总结

- **Makefile** 是直接给 make 用的构建脚本，语法简洁，适合中小型项目，但跨平台能力弱。
- **CMake** 是跨平台的构建系统生成器，编写 CMakeLists.txt 后自动生成 Makefile 或其他构建文件，适合大型、复杂、跨平台项目。
- 在嵌入式开发中，两者都常用：裸机项目多用 Makefile，Linux 项目或需要跨平台的库多用 CMake。
- 无论哪种，核心目标都是 **自动化构建**，减少重复劳动，保证构建过程可复现。
