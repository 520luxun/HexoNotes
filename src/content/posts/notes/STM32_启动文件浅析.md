---
title: "STM32 启动文件浅析"
published: 2026-10-23
description: "相关文件： [[STM32 启动文件浅析_V1.2.pdf]] 中断向量表 一、中断向量表是什么 中断向量表（Vector Table）本质上是一张函数指针数组"
tags: []
category: "OTA-BootLoader"
draft: false
order: 30
---
相关文件：
[[STM32 启动文件浅析_V1.2.pdf]]

# 中断向量表
## 一、中断向量表是什么

中断向量表（Vector Table）本质上是**一张函数指针数组**，放在存储器最前面的固定位置。Cortex-M3 内核在发生异常/中断时，不是“跳转到某个固定地址”，而是：

1. 根据异常编号 `n`，到向量表基址 + `4 × n` 处取一个 32 位字；
2. 把这个字当作处理函数地址，装进 PC；
3. 同时硬件自动压栈、切模式、更新 `IPSR` 等。

所以向量表就是“异常编号 → 处理函数地址”的映射表。

对 Cortex-M3，异常编号 0~15 是**系统异常**，16 及以上是**外设中断（IRQ）**。STM32F10x 在此基础上把外设中断按固定顺序排进去。

文件里的关键段：

```asm
AREA    RESET, DATA, READONLY
EXPORT  __Vectors
EXPORT  __Vectors_End
EXPORT  __Vectors_Size

__Vectors  DCD  __initial_sp
           DCD  Reset_Handler
           DCD  NMI_Handler
           ...
__Vectors_End
__Vectors_Size EQU __Vectors_End - __Vectors
```

- `AREA RESET, DATA, READONLY`：新建一个只读数据段，段名 `RESET`。链接器会把它放到 Flash 起始（默认 `0x08000000`）。
- `DCD`：Define Constant Double-word，即分配一个 32 位字，内容是后面符号的地址。
- `__Vectors` 是表头标签，`__Vectors_End` 是表尾标签，两者相减就是表大小。
- 这张表在复位后通过存储器别名映射到地址 `0x00000000`，内核从那里取向量。

---

## 二、Cortex-M3 的异常编号

Cortex-M3 异常编号固定如下（负号表示固定优先级，数值越小优先级越高）：

| 编号 | 类型 | 名称 | 优先级 | 说明 |
|---|---|---|---|---|
| — | — | 初始 MSP | — | 不是异常，是复位时装入 MSP 的值 |
| 1 | 系统 | Reset | -3 固定 | 复位 |
| 2 | 系统 | NMI | -2 固定 | 不可屏蔽中断 |
| 3 | 系统 | HardFault | -1 固定 | 所有 fault 的兜底 |
| 4 | 系统 | MemManage | 可设 | MPU 访问违规 |
| 5 | 系统 | BusFault | 可设 | 总线错误 |
| 6 | 系统 | UsageFault | 可设 | 未定义指令、非法状态等 |
| 7~10 | — | 保留 | — | 架构保留 |
| 11 | 系统 | SVCall | 可设 | SVC 指令 |
| 12 | 系统 | DebugMon | 可设 | 调试监视 |
| 13 | — | 保留 | — | 架构保留 |
| 14 | 系统 | PendSV | 可设 | 可挂起系统服务（RTOS 常用） |
| 15 | 系统 | SysTick | 可设 | 系统节拍定时器 |
| 16 起 | 外设 | IRQ0, IRQ1, … | 可设 | 芯片厂商定义 |

注意两点：

1. **第 0 项不是异常**，是初始主栈指针 MSP 的值。复位时内核先读它装入 MSP，再读第 1 项装入 PC。
2. Cortex-M3 的异常编号和向量表下标是**一一对应**的：编号 `n` 的向量位于表基址 + `4n`。

---

## 三、这份文件里的向量表逐项解释

### 3.1 系统异常部分（下标 0~15）

```asm
__Vectors       DCD     __initial_sp               ; 下标 0
                DCD     Reset_Handler              ; 1
                DCD     NMI_Handler                ; 2
                DCD     HardFault_Handler          ; 3
                DCD     MemManage_Handler          ; 4
                DCD     BusFault_Handler           ; 5
                DCD     UsageFault_Handler         ; 6
                DCD     0                          ; 7 保留
                DCD     0                          ; 8 保留
                DCD     0                          ; 9 保留
                DCD     0                          ; 10 保留
                DCD     SVC_Handler                ; 11
                DCD     DebugMon_Handler           ; 12
                DCD     0                          ; 13 保留
                DCD     PendSV_Handler             ; 14
                DCD     SysTick_Handler            ; 15
```

逐项说明：

- **下标 0 `__initial_sp`**：栈顶地址。Cortex-M 栈是满递减，初始 SP 指向栈空间的高地址端。复位时硬件自动把它装入 MSP。
- **下标 1 `Reset_Handler`**：复位入口。硬件把 PC 设为它，开始执行启动代码。
- **下标 2 `NMI_Handler`**：不可屏蔽中断，优先级固定 -2，不能被屏蔽。
- **下标 3 `HardFault_Handler`**：硬件错误兜底。MemManage/BusFault/UsageFault 未使能时，相关 fault 都会升级为 HardFault。调试时最常停在这里。
- **下标 4~6**：MemManage、BusFault、UsageFault。需要使能 `SCB->SHCSR` 对应位才会单独触发，否则合并到 HardFault。
- **下标 7~10**：架构保留。Cortex-M3 没有这些异常，填 0 即可，填了也不会被调用。
- **下标 11 `SVC_Handler`**：执行 `SVC` 指令时进入，常用于 RTOS 的系统调用入口。
- **下标 12 `DebugMon_Handler`**：调试监视异常，一般不用。
- **下标 13**：保留。
- **下标 14 `PendSV_Handler`**：可挂起的系统服务，RTOS 常用它做任务切换（上下文切换）。
- **下标 15 `SysTick_Handler`**：系统节拍。RTOS 或 `HAL_Delay` 常依赖它。

### 3.2 外设中断部分（下标 16 起，即 IRQ0 起）

文件里从 `WWDG_IRQHandler` 开始。Cortex-M3 的 IRQ 编号和向量表下标关系是：

```
向量表下标 = IRQn + 16
```

例如 `WWDG_IRQn = 0`，对应下标 16；`USART1_IRQn = 37`，对应下标 53。

STM32F10x 中容量（MD）的外设中断完整列表（对应文件内容）：

| 下标    | IRQn  | 处理函数                       | 说明                     |
| ----- | ----- | -------------------------- | ---------------------- |
| 16    | 0     | WWDG_IRQHandler            | 窗口看门狗                  |
| 17    | 1     | PVD_IRQHandler             | 电源电压检测（EXTI16）         |
| 18    | 2     | TAMPER_IRQHandler          | 侵入检测                   |
| 19    | 3     | RTC_IRQHandler             | RTC 全局                 |
| 20    | 4     | FLASH_IRQHandler           | Flash 全局               |
| 21    | 5     | RCC_IRQHandler             | 时钟控制                   |
| 22    | 6     | EXTI0_IRQHandler           | 外部中断线 0                |
| 23    | 7     | EXTI1_IRQHandler           | 外部中断线 1                |
| 24    | 8     | EXTI2_IRQHandler           | 外部中断线 2                |
| 25    | 9     | EXTI3_IRQHandler           | 外部中断线 3                |
| 26    | 10    | EXTI4_IRQHandler           | 外部中断线 4                |
| 27~33 | 11~17 | DMA1_Channel1~7_IRQHandler | DMA1 通道 1~7            |
| 34    | 18    | ADC1_2_IRQHandler          | ADC1/ADC2 共享           |
| 35    | 19    | USB_HP_CAN1_TX_IRQHandler  | USB 高优先级 / CAN1 TX 共享  |
| 36    | 20    | USB_LP_CAN1_RX0_IRQHandler | USB 低优先级 / CAN1 RX0 共享 |
| 37    | 21    | CAN1_RX1_IRQHandler        | CAN1 RX1               |
| 38    | 22    | CAN1_SCE_IRQHandler        | CAN1 状态变化/错误           |
| 39    | 23    | EXTI9_5_IRQHandler         | EXTI 线 9~5 共享          |
| 40    | 24    | TIM1_BRK_IRQHandler        | TIM1 刹车                |
| 41    | 25    | TIM1_UP_IRQHandler         | TIM1 更新                |
| 42    | 26    | TIM1_TRG_COM_IRQHandler    | TIM1 触发/换相             |
| 43    | 27    | TIM1_CC_IRQHandler         | TIM1 捕获比较              |
| 44    | 28    | TIM2_IRQHandler            | TIM2                   |
| 45    | 29    | TIM3_IRQHandler            | TIM3                   |
| 46    | 30    | TIM4_IRQHandler            | TIM4                   |
| 47    | 31    | I2C1_EV_IRQHandler         | I2C1 事件                |
| 48    | 32    | I2C1_ER_IRQHandler         | I2C1 错误                |
| 49    | 33    | I2C2_EV_IRQHandler         | I2C2 事件                |
| 50    | 34    | I2C2_ER_IRQHandler         | I2C2 错误                |
| 51    | 35    | SPI1_IRQHandler            | SPI1                   |
| 52    | 36    | SPI2_IRQHandler            | SPI2                   |
| 53    | 37    | USART1_IRQHandler          | USART1                 |
| 54    | 38    | USART2_IRQHandler          | USART2                 |
| 55    | 39    | USART3_IRQHandler          | USART3                 |
| 56    | 40    | EXTI15_10_IRQHandler       | EXTI 线 15~10 共享        |
| 57    | 41    | RTCAlarm_IRQHandler        | RTC 闹钟（EXTI17）         |
| 58    | 42    | USBWakeUp_IRQHandler       | USB 唤醒（EXTI18）         |

这份表共 **59 项**（0~58），所以：

```
__Vectors_Size = 59 × 4 = 236 字节 = 0xEC
```

几个容易混的点：

- **共享向量**：`EXTI9_5` 一个向量对应 5 条线，`EXTI15_10` 对应 6 条线；`ADC1_2`、`USB_HP_CAN1_TX`、`USB_LP_CAN1_RX0` 也是共享。进入 ISR 后要自己查标志判断是哪个源。
- **TAMPER 不是 EXTI**：它是独立中断；而 RTCAlarm、USBWakeUp、PVD 分别走 EXTI17、EXTI18、EXTI16。
- **MD 没有的**：TIM5/6/7/8、DMA2、ETH、CAN2、USB OTG 等属于大容量或互联型，这份文件里不出现。用错启动文件会导致中断号错位。
- **IRQn 编号**：CMSIS 头文件里 `WWDG_IRQn = 0`、`USART1_IRQn = 37`，可用 `NVIC_EnableIRQ(USART1_IRQn)` 使能。系统异常则是负数：`SysTick_IRQn = -1`、`PendSV_IRQn = -2`、`SVC_IRQn = -5` 等。

---

## 四、复位时内核怎么用这张表

上电/复位后，Cortex-M3 硬件自动做：

1. 从地址 `0x00000000` 读第一个字 → 装入 **MSP**（即 `__initial_sp`）；
2. 从地址 `0x00000004` 读第二个字 → 装入 **PC**（即 `Reset_Handler`）；
3. 从 `Reset_Handler` 开始执行，进入 C 世界之前先跑 `SystemInit`，再跳 `__main`。

这里 `0x00000000` 是**别名地址**，实际映射到哪块存储器由 BOOT 引脚决定：

| BOOT0 | BOOT1 | 0x00000000 映射到 | 用途 |
|---|---|---|---|
| 0 | x | 主 Flash（0x08000000） | 正常运行 |
| 1 | 0 | 系统存储器（内置 Bootloader） | 串口/USB 下载 |
| 1 | 1 | 内置 SRAM | 调试/特殊用途 |

所以“向量表在 Flash 开头”和“内核从 0 地址取向量”并不矛盾：Flash 被别名映射到了 0 地址。

---

## 五、向量表的重定位（VTOR）

Cortex-M3 有一个寄存器 `SCB->VTOR`（地址 `0xE000ED08`），用来告诉内核“向量表基址在哪”。复位默认是 0。写它就能把向量表搬到别处，常见场景：

- **IAP/OTA**：Bootloader 和 App 各有一套向量表，App 运行时把 VTOR 指向自己的表；
- **向量表放 SRAM**：运行中动态改中断入口；
- **多份固件切换**。

示例：

```c
/* 假设新向量表在 0x08008000，且已 128 字节对齐 */
SCB->VTOR = 0x08008000;
__DSB();
__ISB();
```

注意：

- VTOR 的低 7 位保留为 0，所以向量表基址必须 **128 字节对齐**；
- 改 VTOR 后要跟 `DSB`/`ISB`，保证后续取向量生效；
- 搬表时要把整张表（`__Vectors_Size` 字节）一起搬，不能只搬一部分。

文件里 `__Vectors_End` 和 `__Vectors_Size` 就是为这种“搬表/校验”准备的符号。

### 向量表基址

“向量表基址”（Vector Table Base Address）指的是**中断向量表在内存中的起始地址**。CPU 在响应中断或异常时，会以这个基址为锚点，查找对应的处理函数入口。
#### 核心机制：VTOR 寄存器

在 ARM Cortex-M 等现代架构中，向量表基址并非一成不变，它主要由**向量表偏移寄存器（Vector Table Offset Register, VTOR）** 控制。

- **VTOR 的作用**：VTOR 寄存器里存放的就是向量表的基址。通过修改 VTOR 的值，你可以将向量表**重定位**到内存中的几乎任何位置，比如 Flash 或 SRAM。
- **典型地址**：以常见的 Cortex-M3/M4 为例，VTOR 寄存器本身的物理地址通常是 `0xE000ED08`。

#### 复位后的行为：固定 vs. 可重定位

系统上电复位后，向量表基址的初始位置取决于具体的 ARM 架构版本。

- **可重定位（ARMv7-M / ARMv8-M，如 Cortex-M3/M4/M7）**：复位后，VTOR 的默认值为 `0x0`，意味着 CPU 期望在地址 `0x0` 处找到向量表。但软件可以随时改写 VTOR，将向量表搬到别处。很多带 Bootloader 的 STM32 程序就是通过重设 VTOR，让应用程序的向量表指向自己的起始地址（如 `0x8000000`）。
- **固定基址（ARMv6-M，如 Cortex-M0/M0+）**：向量表的基址**固定**在 `0x0`，无法通过 VTOR 重定位。

#### 一个常见的困惑：为什么 VTOR=0，程序却在 0x8000000 运行？
这在 STM32 开发中很常见。原因在于**内存别名（Memory Aliasing）**。芯片的启动模式（由 BOOT 引脚决定）可以将主 Flash 的物理区域**映射（别名）** 到地址 `0x0`。因此，即使 VTOR 是 `0`，CPU 访问 `0x0` 时，实际读到的内容就是 Flash 起始地址 `0x8000000` 处的向量表，两者内容完全一致。

#### 扩展视角：x86 架构的对比
在 x86 架构（实模式）中，中断向量表的位置是**硬编码固定**的，通常位于内存最低端的 `00000H` 到 `003FFH` 这 1KB 空间内，不支持像 ARM 的 VTOR 那样灵活重定位。

#### 总结

**向量表基址**是中断机制的“总开关”地址。在 ARM Cortex-M 上，它既可以是**固定的**（复位默认 `0x0`，或在 M0 上永久固定），也可以是**动态可变的**（通过 VTOR 寄存器重定位）。理解它有助于你弄清启动流程、Bootloader 跳转以及 RTOS 的底层运作。

---



## 六、弱符号：为什么 C 里写同名函数就能覆盖

向量表里填的是 `WWDG_IRQHandler` 等符号。这些符号在文件后半段是这样定义的：

```asm
Default_Handler PROC
    EXPORT WWDG_IRQHandler [WEAK]
    ...
WWDG_IRQHandler
PVD_IRQHandler
...
    B .
    ENDP
```

- `[WEAK]` 表示弱符号：如果链接时别处有**强符号**同名，就用强的；没有才用这个默认的。
- 默认实现是 `B .`，即原地死循环。

所以你在 `stm32f10x_it.c` 里写：

```c
void USART1_IRQHandler(void)
{
    /* 清标志、收发数据 */
}
```

链接器会用你的函数地址替换向量表里的默认地址。**函数名必须和向量表里的符号完全一致**，拼错（如 `USART1_IRQhandler`）就会静默落到默认死循环，表现为“中断进了但程序卡死”。

同理，`Reset_Handler`、`NMI_Handler`、`HardFault_Handler` 等也都是 `[WEAK]`，可以被用户重定义。

---

## 七、和优先级的关系

向量表只决定“中断来了跳哪”，**不决定谁先执行**。优先级由 NVIC 管理：

- Cortex-M3 理论 8 位优先级，STM32F10x 只实现高 4 位，所以优先级值 0~15，数值越小越高；
- Reset/NMI/HardFault 优先级固定为 -3/-2/-1，高于所有可配置中断；
- 其余异常和外设中断通过 `NVIC_SetPriority()` 设置，并通过优先级分组决定抢占位/子优先级位；
- 抢占优先级高的可以打断低的，形成嵌套。

向量表顺序 ≠ 优先级顺序。表里排在前面的中断不一定先执行。

---

## 八、常见坑与检查点

1. **第 0 项写成函数地址**：有人误以为第 0 项是 Reset，结果 MSP 被设成代码地址，一上电就 HardFault。第 0 项必须是栈顶值。
2. **启动文件与芯片容量不匹配**：MD 的表到 USBWakeUp 为止；若芯片是 HD（大容量），后面还有 TIM5/6/7/8、DMA2、ETH 等，用 MD 文件会导致这些中断号错位。
3. **中断函数名拼错**：落到 `Default_Handler` 的 `B .`，调试时看 PC 停在 `0x08000xxx` 的死循环。
4. **忘记清中断标志**：进了 ISR 不清标志，退出后立刻又进，表现为“卡在中 interrupt”。
5. **VTOR 没对齐或没搬全表**：重定位后中断乱跳。
6. **栈溢出破坏向量表**：如果向量表被搬到 SRAM 且紧邻栈，栈溢出可能改掉表项；默认放 Flash 只读则无此问题。
7. **共享向量没判断源**：`EXTI9_5_IRQHandler` 里要读 `EXTI->PR` 判断具体是哪条线，否则可能误清或漏处理。

---

## 九、一句话总结

这份文件里的中断向量表就是一张从 `0x08000000` 开始的 59 项、每项 4 字节的只读函数指针数组：第 0 项是初始 MSP，第 1 项是 `Reset_Handler`，第 2~15 项是 Cortex-M3 系统异常，第 16 项起按 STM32F10x MD 固定顺序排列外设中断；内核靠异常编号 `n` 到 `基址 + 4n` 取入口，复位时通过 0 地址别名映射读取；所有处理函数都是 `[WEAK]`，C 里写同名强符号即可覆盖；需要搬表时用 `SCB->VTOR` 重定位，并保证 128 字节对齐、整表搬迁。




# MSP
## 一句话定义

**MSP = Main Stack Pointer，主栈指针**，是 Cortex-M 处理器里 `R13`（SP）的一个物理副本。它保存“当前主栈的栈顶地址”，是 CPU 执行 `PUSH/POP`、异常自动压栈、函数调用保存现场时实际使用的指针。

注意区分两个东西：

- **MSP 是寄存器**，在 CPU 内部，不是内存里的变量；
- **`__initial_sp` 是一个地址常量**，是启动文件算出来的“初始栈顶值”，复位时被硬件装入 MSP。两者不是一回事。

---

## 一、Cortex-M 为什么有两个栈指针

Cortex-M 的 SP（`R13`）是 **banked 寄存器**，物理上有两个：

| 名称 | 全称 | 用途 |
|---|---|---|
| **MSP** | Main Stack Pointer | 主栈指针，异常/中断处理程序使用；复位后默认使用 |
| **PSP** | Process Stack Pointer | 进程栈指针，通常给 RTOS 的任务（线程）使用 |

同一时刻 CPU 只使用其中一个，由 `CONTROL` 寄存器的 `SPSEL` 位选择：

- `SPSEL = 0`：使用 MSP
- `SPSEL = 1`：使用 PSP（只能在 Thread 模式下设置）

为什么要两套？核心是为了 **RTOS**：

- 中断/异常永远用 MSP，OS 内核和异常处理有独立、可靠的栈；
- 每个任务有自己的 PSP，任务栈互相隔离，切换任务只需换 PSP；
- 任务栈溢出不会直接破坏异常处理用的主栈，系统更稳。

如果没有 RTOS，裸机程序通常只用 MSP，PSP 根本不用。

---

## 二、MSP 和 Thread/Handler 模式的关系

Cortex-M 有两个执行模式：

| 模式 | 什么时候进入 | 用哪个 SP |
|---|---|---|
| **Thread mode** | 普通程序、任务代码 | 由 `CONTROL.SPSEL` 决定：可以是 MSP，也可以是 PSP |
| **Handler mode** | 任何异常/中断处理程序 | **永远用 MSP**，与 SPSEL 无关 |

所以：

- 复位后：Thread mode + Privileged + **MSP** + `SPSEL=0`；
- 裸机程序从头到尾都在 Thread mode 用 MSP，进中断切到 Handler mode 还用 MSP；
- RTOS 里：任务在 Thread mode 用 PSP，中断来了硬件自动切到 Handler mode 用 MSP；任务切换在 PendSV 里改 PSP。

异常发生时，硬件自动压栈用的是 **异常发生前那一刻的 SP**：

- 如果异常前在 Thread mode 用 PSP，压栈压到 PSP；
- 如果异常前在 Thread mode 用 MSP，压到 MSP；
- 如果异常前在 Handler mode（嵌套中断），永远压 MSP。

---

## 三、启动文件里 MSP 是怎么被初始化的

回到你贴的启动文件：

```asm
Stack_Size      EQU     0x00000400

                AREA    STACK, NOINIT, READWRITE, ALIGN=3
Stack_Mem       SPACE   Stack_Size
__initial_sp
```

这段在 SRAM 里预留了 1KB 栈空间：

```
低地址  Stack_Mem ──────────────┐
                               │ 栈空间 1KB（未初始化）
                               │
高地址  __initial_sp ───────────┘
```

`__initial_sp` 是**紧跟在栈空间之后**的标签，它的值等于 `Stack_Mem + Stack_Size`，即栈空间的高地址端。

然后向量表第 0 项：

```asm
__Vectors   DCD __initial_sp
```

复位时硬件自动做：

1. 从 `0x00000000` 读第 0 个字（`__initial_sp` 的值）→ **装入 MSP**；
2. 从 `0x00000004` 读第 1 个字（`Reset_Handler`）→ 装入 PC；
3. 开始执行 `Reset_Handler`。

所以复位后 MSP 就指向 `__initial_sp`，栈从高地址向低地址生长（满递减栈）。第一次函数调用压栈时，MSP 从 `__initial_sp` 向下减。

用 STM32F103 举例，假设 `Stack_Mem = 0x20000260`、`Stack_Size = 0x400`：

```
Stack_Mem   = 0x20000260   ← 栈底（低地址，栈满时到这里）
__initial_sp= 0x20000660   ← 初始 MSP（高地址，栈顶）
```

复位后 `MSP = 0x20000660`，入栈时 MSP 递减。

---

## 四、MSP 在运行时怎么变

MSP 不是固定的，它随函数调用、中断压栈动态变化：

- 函数调用：编译器生成 `PUSH {r4-r7, lr}` 等，MSP 减小；
- 函数返回：`POP`，MSP 增大；
- 异常进入：硬件自动压 8 个字（`xPSR, PC, LR, R12, R3-R0`），MSP 减 32；
- 异常返回：硬件自动弹出，MSP 恢复。

在调试器里看 MSP，能看到它当前指向栈顶；栈回溯（Call Stack）就是靠 MSP（或 PSP）加 LR/帧指针还原调用链。

---

## 五、MSP 和 PSP 的切换示例

裸机不用 PSP，保持默认即可。RTOS 启动第一个任务时大致这样做：

```c
/* 1. 为任务准备栈，算出初始 PSP 值（模拟异常压栈帧） */
/* 2. 切到 PSP 并进入 Thread mode */
__set_PSP(task_stack_top);
__set_CONTROL(__get_CONTROL() | 0x02);  /* SPSEL=1，使用 PSP */
__ISB();
```

之后任务代码用 PSP；中断来了硬件自动用 MSP；`PendSV` 里保存旧任务 PSP、装入新任务 PSP，完成上下文切换。

在 `PendSV_Handler` 里常见：

```asm
MRS R0, PSP        ; 取当前任务栈指针
...                ; 保存/恢复现场
MSR PSP, R0        ; 写回新任务栈指针
```

`MSP` 在这期间不变，始终是主栈。

---

## 六、CONTROL 寄存器

`CONTROL` 是特殊寄存器，通过 `MRS/MSR` 访问：

| 位 | 名称 | 含义 |
|---|---|---|
| bit0 | nPRIV | 0=特权，1=非特权（Thread 模式） |
| bit1 | SPSEL | 0=用 MSP，1=用 PSP |
| bit2 | FPCA | 浮点上下文活跃（有 FPU 时） |

约束：

- **Handler mode 永远是特权级、永远用 MSP**，写 `CONTROL.SPSEL=1` 在 Handler 里无效；
- 从 Handler 返回 Thread 时，硬件会根据异常栈帧里保存的 `CONTROL` 恢复 SPSEL；
- 非特权模式下不能写 `CONTROL`。

---

## 七、调试时 MSP 的意义

1. **HardFault 排查**：进入 HardFault 后，异常栈帧在 MSP 上（如果异常前用 MSP）或 PSP 上（如果异常前用 PSP）。看 `LR` 的 `EXC_RETURN` 值判断：
   - `0xFFFFFFF9`：返回 Thread，用 MSP；
   - `0xFFFFFFFD`：返回 Thread，用 PSP；
   - `0xFFFFFFF1`：返回 Handler，用 MSP。

   然后到对应 SP 指向的位置读 `R0-R3, R12, LR, PC, xPSR`，就能找到出错指令地址。

2. **栈溢出判断**：看 MSP 是否低于 `Stack_Mem`。低于就溢出了。

3. **看调用栈**：调试器的 Call Stack 窗口本质就是读 MSP/PSP 和栈内容做回溯。

4. **RTOS 任务栈**：每个任务的 PSP 在 TCB 里保存，MSP 是全局共用的。

---

## 八、常见误区

| 误区 | 纠正 |
|---|---|
| “MSP 是内存里的一个变量” | MSP 是 CPU 寄存器，不是内存变量；`__initial_sp` 才是地址常量 |
| “`__initial_sp` 就是 MSP” | `__initial_sp` 是初始栈顶的**值**，复位时被装入 MSP；之后 MSP 会变，`__initial_sp` 不变 |
| “栈从低地址往高地址长” | Cortex-M 是满递减栈，初始 MSP 在高地址，入栈向低地址 |
| “中断永远用当前 SP” | Handler mode 永远用 MSP；Thread mode 用哪个看 SPSEL |
| “PSP 必须用” | 裸机不用 RTOS 时 PSP 完全不用，只用 MSP |
| “栈越大越好” | 栈按需分配，太大会挤占其他 RAM；溢出比不够更危险 |

---

## 九、一句话总结

**MSP 是 Cortex-M 的主栈指针寄存器**，复位时由硬件从向量表第 0 项（启动文件里的 `__initial_sp`）装入，之后随函数调用和异常压栈动态变化；它服务于异常处理和默认的 Thread 执行，PSP 则是给 RTOS 任务用的另一套栈指针。裸机程序通常只用 MSP，RTOS 才把 MSP 和 PSP 分开用。




# FSMC/FMC

FSMC（灵活静态存储器控制器）与FMC（灵活存储器控制器）是STM32中用于==扩展外部存储器和并行设备的核心外设==。它们让MCU能像访问内部内存一样，通过地址映射直接读写外部芯片，从而突破片内资源限制。

**FMC是FSMC的增强超集，最核心的升级是增加了对动态存储器SDRAM的支持**。

### 📜 从FSMC到FMC：核心演进

FSMC与FMC的关系可以概括为**继承与发展**：

*   **FSMC（Flexible Static Memory Controller）**：出现较早，主要存在于**STM32F1、F2、F3**等系列。它只能控制**静态**存储器（如SRAM、NOR/NAND Flash、PSRAM），无法驱动需要周期性刷新的**动态**存储器SDRAM。
*   **FMC（Flexible Memory Controller）**：是FSMC的升级版，出现在**STM32F4（部分型号）、F7、H7**等更高性能的系列中。它**完全向下兼容FSMC**的所有功能，并**新增了专用的SDRAM控制器**，从而能连接大容量、低成本的动态内存。

### 🗺️ 内存映射：将外部世界“拉”进地址空间

FSMC/FMC最强大的特性是**内存映射**。配置好后，外部存储器会成为MCU统一寻址空间的一部分，你可以用指针直接读写，就像操作内部变量一样。

它将外部空间划分为多个固定的**Bank**，每个Bank有独立的片选信号和配置寄存器：

| Bank区域 | 典型用途 | 地址范围 (示例) | 备注 |
| :--- | :--- | :--- | :--- |
| **Bank 1** | NOR / PSRAM / SRAM | `0x6000 0000` - `0x6FFF FFFF` | 分为4个子Bank，支持LCD等并行设备 |
| **Bank 2** | NAND Flash | `0x7000 0000` - `0x7FFF FFFF` | |
| **Bank 3** | NAND Flash | `0x8000 0000` - `0x8FFF FFFF` | |
| **Bank 4** | PC Card / CF | `0x9000 0000` - `0x9FFF FFFF` | |
| **Bank 5 / 6** | **SDRAM (仅FMC支持)** | `0xC000 0000` - `0xDFFF FFFF` | 专用于动态内存 |

> **注意**：具体的Bank分配和地址范围在不同STM32型号间可能存在细微差异，需以对应型号的参考手册为准。

### ⚙️ 关键配置维度

配置FSMC/FMC主要围绕以下几个核心参数展开：

*   **存储器类型**：选择对应Bank要连接的设备类型（SRAM、PSRAM、NOR、NAND、SDRAM等）。
*   **数据总线宽度**：支持**8位、16位或32位**。宽度越大，并行传输的数据量越大，带宽越高。
*   **时序参数**：这是配置的**核心与难点**。需要根据外部芯片的数据手册，精确设置地址建立时间（ADDSET）、数据保持时间等，以确保读写时序匹配。FMC的时序配置通常比FSMC更精细。
*   **访问模式**：
    *   **异步模式**：用于SRAM、NOR等，无需时钟同步。
    *   **同步模式**：用于SDRAM等，需要一个**专用的时钟引脚（FMC_CLK）** 进行同步控制。
*   **扩展模式**：允许为**读操作和写操作分别配置不同的时序**，这在连接某些读写速度差异大的器件时非常有用。

### 💡 典型应用场景

FSMC/FMC解决了MCU片内存储资源有限的痛点，典型应用包括：

*   **大容量数据缓存**：外接**SRAM或PSRAM**，为图像处理、音频缓冲、高速数据采集等应用提供充足的临时工作空间。
*   **代码/数据存储**：外接**NOR Flash**用于存储程序代码（支持XIP，即原地执行），或外接**NAND Flash**用于存储大量非易失性数据（如日志、文件系统）。
*   **图形显示驱动**：通过FMC的NOR/PSRAM Bank，以**8080/6800并行接口**驱动TFT-LCD屏幕，相比SPI接口能获得高得多的刷新率，适合高分辨率屏幕。
*   **动态内存扩展**：这是**FMC独有的能力**。通过外接**SDRAM**，可以为STM32F4/F7/H7等高性能MCU扩展数十甚至上百MB的运行内存，满足复杂算法（如GUI、机器学习推理）的需求。

### 💎 总结

FSMC/FMC是STM32连接外部并行世界的桥梁。**FSMC**为静态存储器提供了高效的映射方案；而**FMC**通过增加SDRAM控制器，将MCU的可寻址内存空间提升了一个数量级，为高性能应用打开了大门。理解两者的核心区别（SDRAM支持）以及内存Bank映射和时序配置，是使用好这一强大外设的关键。