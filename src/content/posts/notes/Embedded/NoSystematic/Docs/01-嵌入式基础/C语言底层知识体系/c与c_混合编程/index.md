---
title: "C与C++混合编程"
published: 2026-11-18
description: "C与C++混合编程 [!abstract] 本文定位 C 与 C++ 互调全解：函数名修饰与链接不兼容的根源、extern C 的用法、C 调 C++ / "
tags: ["嵌入式", "嵌入式/C语言"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/01-嵌入式基础/C语言底层知识体系"
draft: false
order: 45
---

# C与C++混合编程

> **本文定位**
> C 与 C++ 互调全解：函数名修饰与链接不兼容的根源、extern "C" 的用法、C 调 C++ / C++ 调 C 的完整示例、静态库与动态库。

> **章节速览**
> #C++编译库，C语言是否能调用？ · #为什么C++与C不兼容？ · #C 与 C++ 不兼容（链接）问题 · #C 调用 C++函数不兼容？ · #分别给出C调用C++，C++调用C的例子

## C++编译库，C语言是否能调用？

如果你用 C++ 开发了一套 class，并编译成了**静态库（.a / .lib）**或**动态库（.so / .dll）**，**当然可以被调用**，但具体怎么调用、能否被 C 语言调用，取决于调用者的语言和库的接口设计。

下面分场景详细说明。

---

### 1. 调用者是 C++ 代码

这是最简单的情况。调用方只需要：

- **包含头文件**（声明 class 及其方法）
- **链接生成的库文件**
- **确保使用相同的编译器和标准库版本**（否则可能出现 ABI 不兼容，导致链接错误或运行时异常）

```cpp
// myclass.h
class MyClass {
public:
    void doSomething();
};

// main.cpp
#include "myclass.h"

int main() {
    MyClass obj;
    obj.doSomething();
    return 0;
}
```

编译（静态库为例）：
```bash
# 编译库
g++ -c myclass.cpp -o myclass.o
ar rcs libmyclass.a myclass.o

# 编译主程序并链接静态库
g++ main.cpp -L. -lmyclass -o main
```

**注意**：C++ 编译器会对函数名进行 **名称修饰（name mangling）**，所以只要双方都用 C++ 编译器，就能正确匹配符号。

---

### 2. 调用者是 C 语言代码

C 语言无法直接理解 C++ 的名称修饰、类成员函数、`this` 指针等。因此，要提供 **C 语言接口（wrapper）**，通常使用 `extern "C"` 将 C++ 功能包装成普通的 C 函数。

#### 静态/动态库中的 C++ 类保持不变，额外提供一组 C 函数：

```cpp
// myclass.h
class MyClass {
public:
    void doSomething();
};

// 为了给 C 调用，提供 C 包装函数
#ifdef __cplusplus
extern "C" {
#endif

// 不透明指针：C 程序只看到 void*，实际指向 MyClass 对象
void* MyClass_create();
void MyClass_doSomething(void* obj);
void MyClass_destroy(void* obj);

#ifdef __cplusplus
}
#endif
```

```cpp
// myclass_wrapper.cpp
#include "myclass.h"

extern "C" {
    void* MyClass_create() {
        return new MyClass();
    }

    void MyClass_doSomething(void* obj) {
        static_cast<MyClass*>(obj)->doSomething();
    }

    void MyClass_destroy(void* obj) {
        delete static_cast<MyClass*>(obj);
    }
}
```

现在，C 程序可以这样调用：

```c
#include <stdio.h>

// 声明 C 接口
void* MyClass_create();
void MyClass_doSomething(void* obj);
void MyClass_destroy(void* obj);

int main() {
    void* obj = MyClass_create();
    MyClass_doSomething(obj);
    MyClass_destroy(obj);
    return 0;
}
```

编译：
```bash
# 先编译 C++ 库（静态库为例）
g++ -c myclass.cpp myclass_wrapper.cpp -o myclass.o myclass_wrapper.o
ar rcs libmyclass.a myclass.o myclass_wrapper.o

# 编译 C 程序并链接该库
gcc main.c -L. -lmyclass -lstdc++   # 需要链接 C++ 标准库
```

**注意**：C 程序链接时必须加上 C++ 标准库（`-lstdc++`），否则会出现未定义的符号。

---

#### 3. 静态库 vs 动态库的区别

##### 静态库（.a / .lib）
- 在链接时，库中的代码被直接复制到最终可执行文件中。
- 优点：部署简单，没有运行时依赖。
- 缺点：多个程序使用同一静态库会重复占用磁盘/Flash 空间；更新库需要重新链接程序。
- **嵌入式场景**：裸机或 RTOS 开发常用静态库，因为最终生成一个固件镜像，无需处理动态加载。

##### 动态库（.so / .dll）
- 在链接时只记录符号引用，运行时由系统动态加载。
- 优点：节省存储（多程序共享一份库）；便于更新库而不重新编译程序。
- 缺点：运行时必须能找到库文件（设置 `LD_LIBRARY_PATH` 或在 Windows 下与 exe 同目录）；加载开销。
- **嵌入式场景**：如果运行 Linux 或其他支持动态链接的操作系统，可以像桌面 Linux 一样使用动态库。

---

#### 4. 在嵌入式环境下的注意事项

- **交叉编译**：必须使用对应的交叉工具链（如 `arm-none-eabi-g++`）来编译库和主程序。
- **C++ 标准库依赖**：如果你的类使用了 STL、异常、RTTI 等，库和主程序必须链接相同的 C++ 运行时（比如 `libstdc++.a`）。在裸机环境下，可能需要使用精简版 C++ 库（如 `newlib-nano`）或避免使用某些特性。
- **内存管理**：如果库分配了内存（如 `new`），调用者释放（`delete`）时必须使用同一堆（heap）。通常建议谁分配谁释放，或提供库内专门的释放函数。
- **异常跨边界**：如果一个库抛出异常，而主程序没有捕获，可能导致程序崩溃。在嵌入式混合语言调用中，通常禁止异常跨库边界，或者统一使用 `noexcept` 接口。
- **名称修饰**：如果希望库被多种语言调用，统一用 C 接口包装是最稳妥的方式。

---

#### 5. 总结

| 调用者语言 | 调用方式 | 注意事项 |
|-----------|---------|---------|
| C++ | 直接包含头文件 + 链接库 | 保证编译器/标准库版本一致 |
| C | 通过 `extern "C"` 包装的 C 接口 | 使用不透明指针管理对象；链接时加上 C++ 标准库 |
| 其他语言（如 Python、Java） | 通过 C 接口 + FFI | 原理同上，利用语言的外部函数接口 |

无论静态库还是动态库，核心都是**解决符号解析和接口兼容**。如果你打算在嵌入式项目中使用 C++ 类库，推荐先用 C 接口封装，这样未来可以被 C、C++ 甚至其他语言调用，同时降低 ABI 兼容性风险。

## 为什么C++与C不兼容？

```
为什么C++与C不兼容。
1. C++函数名+参数共同构成这样，它就会产生什么多态或者重载。C只有函数名。它就会出问题，就是C它的编码编出的地址，对于C++而言，它生成的二进制函数的编制是这样，是add加参数，因此当你用g++去编main点add中这个文件的时候，它也又引入了add这个C语言函数，它会编辑为这个函数到这个库里去找，结果他俩地址永远不一样，他就找不到
```

### 为什么 C++ 与 C 不兼容？函数名修饰与链接问题

这个现象的核心原因，就是 **C++ 的“函数名修饰（name mangling）”** 与 C 的“原始符号名”不匹配，导致链接器找不到对应的函数。下面我们一步步拆解。

---

#### 1. 函数名修饰：C++ 支持重载的秘密

C++ 允许**函数重载**，即多个函数可以同名，只要参数列表不同（类型、个数、顺序）。例如：

```cpp
int add(int a, int b);
double add(double a, double b);
```

编译器如何区分这两个函数？它在生成目标文件（.o）时，会将**函数名与参数信息编码**成一个唯一的符号名。这个过程就叫 **name mangling**。比如在 GCC 下，上述两个函数可能被修饰为：

- `_Z3addii`（int add(int, int)）
- `_Z3adddd`（double add(double, double)）

修饰后的符号包含了函数名、参数类型、命名空间等信息，确保每个重载版本都有独一无二的符号名。

---

#### 2. C 语言没有重载，符号名就是函数名

C 语言不支持重载，因此编译器在生成目标文件时，直接使用函数名作为符号。比如：

```c
int add(int a, int b);
```

在目标文件中，这个函数对应的符号名就是 `add`（可能加一个下划线前缀，取决于平台，但基本保持原名）。

---

#### 3. 链接时的符号不匹配

现在假设我们有一个 C 库，里面提供了 `add` 函数（C 编译的）。我们想在 C++ 程序中使用它：

```cpp
// main.cpp
extern int add(int a, int b);   // 声明这个 C 函数

int main() {
    return add(2, 3);
}
```

当我们用 `g++`（C++ 编译器）编译 `main.cpp` 并链接 C 库时，会发生什么？

- C++ 编译器看到 `add` 声明，认为它是 C++ 函数，因此对 `add` 这个名字进行 name mangling，生成符号（例如 `_Z3addii`）。
- 链接器在库中查找符号 `_Z3addii`，但 C 库中的符号是 `add`（或 `_add`）。
- 结果：**链接错误**，提示 undefined reference。

这就是你描述的“它就会编辑为这个函数到这个库里去找，结果他俩地址永远不一样，他就找不到”。

---

#### 4. 解决方法：`extern "C"`

`extern "C"` 告诉 C++ 编译器：这部分代码使用 **C 的链接约定**，即不对函数名进行修饰，按 C 的方式生成符号。

修改后的代码：

```cpp
// main.cpp
extern "C" {
    int add(int a, int b);   // 告诉编译器，按 C 方式处理 add
}

int main() {
    return add(2, 3);
}
```

现在，`add` 在目标文件中的符号就是 `add`（或 `_add`），与 C 库中的符号一致，链接成功。

**更常见的做法**是在头文件中使用条件编译，让同一个头文件既可以被 C 包含，也可以被 C++ 包含：

```c
// add.h
#ifdef __cplusplus
extern "C" {
#endif

int add(int a, int b);

#ifdef __cplusplus
}
#endif
```

这样，在 C++ 文件中包含 `add.h` 时，`add` 会被包裹在 `extern "C"` 中；在 C 文件中包含时，直接声明。

---

#### 5. 更深层的影响

- **不能直接调用 C++ 类成员函数**：因为类成员函数有更复杂的修饰，C 无法理解。
- **跨语言传递结构体/指针**：虽然可以，但要小心内存布局、对齐方式的一致性（通常没问题，因为 C 和 C++ 在结构体布局上兼容）。
- **异常**：C++ 异常不能跨越 `extern "C"` 边界抛出。

---

#### 6. 总结

| 语言 | 函数符号生成 | 是否支持重载 | 链接时符号 |
|------|--------------|--------------|------------|
| C | 直接使用函数名（可能加前缀） | 否 | 原始名称，如 `add` |
| C++ | 名称修饰（mangling），包含参数信息 | 是 | 修饰后名称，如 `_Z3addii` |

因此，C 和 C++ 在二进制层面**不直接兼容**。要混合编程，必须通过 `extern "C"` 告诉 C++ 编译器使用 C 的符号命名规则，从而让链接器正确找到 C 函数。

你提到的“地址永远不一样”，正是符号名不同导致的。理解了 name mangling 和 `extern "C"`，就能轻松解决这类混合编程问题。

## C 与 C++ 不兼容（链接）问题

**上面是 C++ 调用 C 函数**
```
#ifndef __ADD_H
#define __ADD_H

#ifdef __cplusplus
extern "C" {
#endif

int add(int a, int b);   // 注意：参数之间要用英文逗号

#ifdef __cplusplus
}
#endif

#endif /* __ADD_H */


#include "add.h"

int add(int a, int b) {
    return a + b;
}

```

这段代码正是解决 **C 与 C++ 不兼容（链接）问题** 的标准写法。下面解释它的作用：

---

### 1. 头文件 `add.h` 的作用

```c
#ifndef __ADD_H
#define __ADD_H

#ifdef __cplusplus
extern "C" {
#endif

int add(int a, int b);

#ifdef __cplusplus
}
#endif

#endif /* __ADD_H */
```

- **条件编译**：`#ifdef __cplusplus` 判断当前是否在 C++ 环境下编译。  
  - 如果是 C++，编译器会看到 `extern "C" { ... }`，告诉 C++ 编译器：里面的函数按 **C 的链接约定** 处理，即**不进行名称修饰（name mangling）**。  
  - 如果是 C 编译器，`__cplusplus` 未定义，那么头文件就只是一个普通的函数声明。

- **作用**：同一个头文件可以被 C 和 C++ 共同使用，并且保证在 C++ 中调用 `add` 时，链接器能找到 C 编译的 `add` 符号（而不是被修饰成 `_Z3addii`）。

---

### 2. 源文件 `add.c` 的实现

```c
#include "add.h"

int add(int a, int b) {
    return a + b;
}
```

这里按 C 的方式实现了 `add` 函数。无论这个文件是用 C 编译器（如 `gcc`）还是 C++ 编译器（如 `g++`）编译，由于源文件是 `.c`（通常视为 C 代码），编译器会按 C 的规则生成符号名（如 `add`）。  
如果用了 `g++` 编译 `.c` 文件，C++ 编译器仍会按 C++ 规则，但 `add.h` 中的 `extern "C"` 会强制该函数使用 C 链接，因此生成的符号仍是 `add`。

---

### 3. 最终效果

- 用 **gcc** 编译 `add.c`，得到 `add.o`，其中符号为 `add`。  
- 在 C++ 程序中包含 `add.h`，然后调用 `add(2,3)`。  
- C++ 编译器看到 `extern "C"`，生成对符号 `add` 的引用（而不是 `_Z3addii`）。  
- 链接时，`add.o` 中的 `add` 符号被找到，链接成功。

这样就实现了 **C 函数在 C++ 中的安全调用**，避免了因名称修饰导致的“找不到符号”错误。

---

### 4. 常见的使用场景

- 嵌入式项目中，很多底层驱动库是用 C 写的，而上层应用可能用 C++（如 GUI、业务逻辑）。通过这种封装，C++ 可以直接调用 C 库，无需修改库源码。
- 同样，如果你用 C++ 写了一个库，但希望提供 C 接口供其他语言（如 C、Python、Swift）调用，也可以反过来在头文件中用 `extern "C"` 暴露 C 风格的 API。

---

你贴的代码是解决 C/C++ 混合编程中链接问题的“最佳实践”。如果你在具体项目中遇到链接错误，检查是否漏了 `extern "C"` 即可。

## C 调用 C++函数不兼容？

### C 调用 C++ 函数的方法

与 C++ 调用 C 函数类似，C 调用 C++ 函数也需要解决 **符号命名** 和 **调用约定** 的差异。核心做法是：**在 C++ 一侧使用 `extern "C"` 将目标函数暴露为 C 链接**。

---

#### 1. 基本原理

- **C 编译器** 生成的目标文件中，函数符号就是函数名本身（如 `add`）。
- **C++ 编译器** 默认会对函数名进行**名称修饰（name mangling）**，生成类似 `_Z3addii` 的符号。
- 若要让 C 程序能调用 C++ 函数，必须让 C++ 函数在编译时使用 **C 的符号命名规则**，即通过 `extern "C"` 修饰。

---

#### 2. 示例：C 调用 C++ 函数

##### C++ 侧（实现函数并用 `extern "C"` 暴露）

```cpp
// cpp_function.cpp
#include <iostream>

// 被 C 调用的函数，必须用 extern "C" 包裹
extern "C" {
    int add(int a, int b) {
        return a + b;
    }

    // 如果需要调用 C++ 类或复杂功能，提供 C 风格的包装函数
    void* create_my_class();
    void my_class_do_something(void* obj);
    void destroy_my_class(void* obj);
}

// 假设有一个 C++ 类
class MyClass {
public:
    void doSomething() {
        std::cout << "MyClass::doSomething() called" << std::endl;
    }
};

// 包装函数实现
void* create_my_class() {
    return new MyClass();
}

void my_class_do_something(void* obj) {
    static_cast<MyClass*>(obj)->doSomething();
}

void destroy_my_class(void* obj) {
    delete static_cast<MyClass*>(obj);
}
```

##### C 侧（调用 C++ 函数）

```c
// main.c
#include <stdio.h>

// 声明这些 C++ 提供的 C 接口函数
int add(int a, int b);
void* create_my_class();
void my_class_do_something(void* obj);
void destroy_my_class(void* obj);

int main() {
    // 调用普通函数
    int result = add(3, 4);
    printf("add(3,4) = %d\n", result);

    // 调用 C++ 类方法（通过包装）
    void* obj = create_my_class();
    my_class_do_something(obj);
    destroy_my_class(obj);

    return 0;
}
```

##### 编译与链接

```bash
# 编译 C++ 源文件，生成目标文件（或静态库）
g++ -c cpp_function.cpp -o cpp_function.o

# 编译 C 源文件
gcc -c main.c -o main.o

# 链接：必须使用 g++ 或者 gcc 加上 C++ 标准库
g++ main.o cpp_function.o -o program
# 或
gcc main.o cpp_function.o -lstdc++ -o program
```

**关键点**：
- C++ 文件编译时，`extern "C"` 内部的函数名不会被修饰，生成的目标文件中符号就是 `add`、`create_my_class` 等，与 C 的命名一致。
- 链接时必须包含 C++ 标准库（`-lstdc++`），因为 C++ 代码（如 `new`/`delete`、`iostream`）依赖它。

---

#### 3. 处理 C++ 类和重载

C 语言无法直接理解 C++ 的类、成员函数、重载、命名空间等。因此，当需要将 C++ 的类暴露给 C 时，通常采用 **不透明指针（opaque pointer）** 的方式：

- 在 C++ 侧提供 `create`、`destroy` 和一系列成员函数包装，每个包装函数接受一个 `void*` 作为对象句柄。
- C 侧只能看到 `void*`，无法访问类内部细节，但可以通过包装函数操作对象。

这种模式在嵌入式系统、操作系统 API（如 Win32、POSIX）中非常常见。

---

#### 4. 常见陷阱

- **忘记 `extern "C"`**：C++ 函数符号被修饰，C 程序链接时找不到符号。
- **异常跨边界**：如果 C++ 包装函数抛出异常，而 C 调用者没有捕获，程序会崩溃。因此在包装函数内部应捕获所有异常，返回错误码。
- **内存管理**：谁分配谁释放。如果 C++ 侧用 `new` 创建对象，应提供对应的 `destroy` 函数由 C 调用，不能直接在 C 中用 `free` 释放。
- **重载函数**：C 不支持重载，因此对于重载的 C++ 函数，必须为每个版本提供不同的 C 接口名称（例如 `add_int`、`add_double`）。

---

#### 5. 总结

| 方向 | 方法 |
|------|------|
| C++ 调用 C | C 函数无需修改；C++ 中声明时加 `extern "C"`（通常在头文件中用 `#ifdef __cplusplus` 包裹） |
| C 调用 C++ | C++ 函数实现时用 `extern "C"` 包裹；若涉及类，提供 C 风格的包装函数；链接时添加 C++ 标准库 |

通过 `extern "C"`，两种语言可以在链接层面达成一致，实现混合编程。

## 分别给出C调用C++，C++调用C的例子

### C 与 C++ 互相调用的完整示例

#### 一、C++ 调用 C 函数

##### 文件结构
- `add.h`：C 函数声明（兼容 C++）
- `add.c`：C 函数实现
- `main.cpp`：C++ 程序调用 C 函数

##### 1. 头文件 `add.h`（同时兼容 C 和 C++）
```c
#ifndef ADD_H
#define ADD_H

#ifdef __cplusplus
extern "C" {
#endif

int add(int a, int b);

#ifdef __cplusplus
}
#endif

#endif
```

##### 2. C 函数实现 `add.c`
```c
#include "add.h"

int add(int a, int b) {
    return a + b;
}
```

##### 3. C++ 程序 `main.cpp`
```cpp
#include <iostream>
#include "add.h"

int main() {
    int result = add(3, 4);
    std::cout << "3 + 4 = " << result << std::endl;
    return 0;
}
```

##### 4. 编译与链接
```bash
# 编译 C 源文件为目标文件
gcc -c add.c -o add.o

# 编译 C++ 源文件为目标文件
g++ -c main.cpp -o main.o

# 链接（使用 g++ 自动链接 C++ 标准库）
g++ main.o add.o -o cpp_call_c

# 运行
./cpp_call_c
```

---

#### 二、C 调用 C++ 函数

##### 文件结构
- `cpp_func.h`：C++ 函数声明（C 接口）
- `cpp_func.cpp`：C++ 函数实现（用 `extern "C"` 暴露）
- `main.c`：C 程序调用 C++ 函数

##### 1. C++ 侧头文件 `cpp_func.h`（C 可调用）
```c
#ifndef CPP_FUNC_H
#define CPP_FUNC_H

#ifdef __cplusplus
extern "C" {
#endif

int add(int a, int b);

#ifdef __cplusplus
}
#endif

#endif
```

##### 2. C++ 函数实现 `cpp_func.cpp`
```cpp
#include "cpp_func.h"
#include <iostream>

// 普通 C++ 函数（可能使用 C++ 特性）
int add(int a, int b) {
    return a + b;
}

// 也可以包装 C++ 类（演示）
class MyClass {
public:
    void greet() {
        std::cout << "Hello from C++ class!" << std::endl;
    }
};

// 对外暴露的 C 接口
extern "C" {
    void* create_my_class() {
        return new MyClass();
    }

    void my_class_greet(void* obj) {
        static_cast<MyClass*>(obj)->greet();
    }

    void destroy_my_class(void* obj) {
        delete static_cast<MyClass*>(obj);
    }
}
```

##### 3. C 程序 `main.c`
```c
#include <stdio.h>
#include "cpp_func.h"

// 声明额外提供的 C 接口（也可以放在头文件中）
void* create_my_class();
void my_class_greet(void* obj);
void destroy_my_class(void* obj);

int main() {
    // 调用普通 C++ 函数
    int result = add(5, 7);
    printf("5 + 7 = %d\n", result);

    // 调用 C++ 类（通过不透明指针）
    void* obj = create_my_class();
    my_class_greet(obj);
    destroy_my_class(obj);

    return 0;
}
```

##### 4. 编译与链接
```bash
# 编译 C++ 源文件
g++ -c cpp_func.cpp -o cpp_func.o

# 编译 C 源文件
gcc -c main.c -o main.o

# 链接：必须使用 g++ 或 gcc 加上 C++ 标准库
g++ main.o cpp_func.o -o c_call_cpp
# 或
gcc main.o cpp_func.o -lstdc++ -o c_call_cpp

# 运行
./c_call_cpp
```

---

#### 三、关键点总结

| 调用方向 | 核心方法 |
|----------|----------|
| **C++ 调用 C** | C 头文件使用 `#ifdef __cplusplus` 包裹 `extern "C"`，使 C++ 编译器按 C 方式查找符号；C 函数无需修改。 |
| **C 调用 C++** | C++ 函数用 `extern "C"` 修饰，强制使用 C 符号命名；若涉及类，提供 C 风格包装函数（不透明指针）。 |

编译链接时，C 文件用 `gcc` 编译，C++ 文件用 `g++` 编译，链接阶段需包含 C++ 标准库（`-lstdc++`）或直接用 `g++` 完成链接。
