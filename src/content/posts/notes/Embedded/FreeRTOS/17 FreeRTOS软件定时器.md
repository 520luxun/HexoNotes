---
title: "17 FreeRTOS软件定时器"
published: 2026-07-18
description: ""
tags: []
category: "嵌入式"
draft: false
---
# FreeRTOS软件定时器

------



## 一、软件定时器的简介

### 1、定时器介绍

定时器：从指定的时刻开始，经过一个指定时间（超时时间），然后触发一个超时事件，用户可以自定义定时器周期。

硬件定时器：芯片本身自带的定时器模块，硬件定时器的精度一般很高，每次在定时时间到达之后就会自动触发一个中断，用户在中断服务函数中处理信息。

软件定时器：是指具有定时功能的软件，可设置定时周期，当指定时间到达后要调用回调函数(也称超时函数)，用户在回调函数中处理信息。



### 2、软件定时器优缺点

优点：

- 硬件定时器数量有限，而软件定时器理论上只需有足够内存，就可以创建多个；
- 使用简单、成本低。

缺点：

- 软件定时器相对硬件定时器来说，精度没有那么高(因为它以系统时钟为基准，系统时钟中断优先级又是最低，容易被打断)。对于需要高精度要求的场合，不建议使用软件定时器。



### 3、FreeRTOS软件定时器特点



1. 可裁剪：软件定时器是可裁剪可配置的功能，如果要使能软件定时器，需将configUSE_TIMERS 配置项配置成 1 。
2. 单次和周期：软件定时器支持设置成  **单次定时器**  或  **周期定时器**  。

> 注意：l软件定时器的超时回调函数是由==软件定时器服务任务==调用的，软件定时器的超时回调函数==本身不是任务，因此不能在该回调函数中使用可能会导致任务阻塞的 API 函数==。（只是一个函数，并不是任务，概括为专门放在一个任务的定时功能函数）

**软件定时器服务任务**：==在调用函数 vTaskStartScheduler()开启任务调度器的时候，会创建一个用于管理软件定时器的任务，这个任务就叫做**软件定时器服务任务（调用处理软件定时器）**。==



### 4、软件定时器服务任务作用

1. 负责软件定时器超时的逻辑判断。

   比如有3个定时器，通过逻辑判断来知道哪个超时了

2. 调用超时软件定时器的超时回调函数。

   同样的有3个定时器，那么比如定时器1超时了，那么我通过这个任务去调用这个定时器的超时回调函数。

   如果是定时器2超时了，那么，我通过这个任务去调用这个定时器的超时回调函数

3. 处理软件定时器命令队列。

   创建了3个定时器。那么这些定时器，一开始创建的时候，都是休眠的

   什么意思啊？休眠就是说，你这三个都是不工作的，那怎么工作，就通过命令队列去控制它了



### 5、软件定时器的命令队列

答：FreeRTOS 提供了许多软件定时器相关的 API 函数，这些 API 函数大多都是往定时器的队列中写入消息（发送命令），这个队列叫做软件定时器命令队列，是提供给 FreeRTOS 中的软件定时器使用的，用户是不能直接访问的。 

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/软件定时器的命令队列.png)



### 6、软件定时器的相关配置

答：

- 当FreeRTOS 的配置项 ==configUSE_TIMERS== 设置为1，在启动任务调度器时，会自动创建软件定时器的服务/守护任务prvTimerTask( )。
- 软件定时器服务任务的优先级为 ==configTIMER_TASK_PRIORITY = 31==。
- 定时器的命令队列长度为 ==configTIMER_QUEUE_LENGTH = 5==。

> 注意：软件定时器的超时回调函数是在软件定时器服务任务中被调用的，服务任务不是专为某个定时器服务的，它还要处理其他定时器（一对多）。



因此定时器的回调函数不要影响其他“人”：

1. 回调函数要**尽快实行**，不能进入阻塞状态，即不能调用那些会阻塞任务的 API 函数，如：vTaskDelay() 。
2. 访问队列或者信号量的非零阻塞时间的 API 函数也不能调用。

------





## 二、软件定时器的状态

### 1、软件定时器的状态



- 休眠态：软件定时器可以通过其句柄被引用，但因为**没有运行**，所以其定时超时回调函数不会被执行。
- 运行态：运行态的定时器，当指定时间到达之后，它的超时回调函数会被调用。

> 注意：新创建的软件定时器处于休眠状态 ，也就是未运行的！ 



问题：如何让软件定时器从休眠态转变为运行态？

答：发送命令队列。

------





## 三、单次定时器和周期定时器

### 1、单次定时器和周期定时器介绍

答：FreeRTOS提供了两种软件定时器：

- 单次定时器：单次定时器的一旦定时超时，只会执行一次其软件定时器超时回调函数，不会自动重新开启定时，不过可以被手动重新开启。
- 周期定时器：周期定时器的一旦启动以后就会在执行完回调函数以后自动的重新启动 ，从而周期地执行其软件定时器回调函数。



### 2、单次定时器和周期定时器的对比示例

答：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/单次定时器和周期定时器的对比示例.png)
Timer1：周期定时器，定时超时时间为 2 个单位时间，开启后，一直以2个时间单位间隔重复执行。

Timer2：单次定时器，定时超时时间为 1 个单位时间，开启后，则在第一个超时后就不在执行了。



### 3、软件定时器的状态转换图

答：

单次定时器状态转换图：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/单次定时器状态转换图.png)

周期定时器状态转换图：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/周期定时器状态转换图.png)

------





## 四、软件定时器结构体成员介绍

### 1、软件定时器结构体介绍

答：

```c
typedef   struct
{
       const char *                  pcTimerName              /* 软件定时器名字 */
       ListItem_t                    xTimerListItem           /* 软件定时器列表项 */
       TickType_t                    xTimerPeriodInTicks;     /* 软件定时器的周期 */
       void *                        pvTimerID                /* 软件定时器的ID */
       TimerCallbackFunction_t       pxCallbackFunction;      /* 软件定时器的回调函数 */
       #if ( configUSE_TRACE_FACILITY == 1 )
              UBaseType_t 			uxTimerNumber            /*  软件定时器的编号，调试用  */
       #endif
       uint8_t                        ucStatus;               /*  软件定时器的状态  */
} xTIMER;

```

------



## 五、FreeRTOS软件定时器相关API函数

### 1、软件定时器相关函数

答：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/软件定时器相关函数.png)



### 2、创建软件定时器函数

答：

```c
TimerHandle_t   xTimerCreate(     const char * const        pcTimerName,
                                  const TickType_t          xTimerPeriodInTicks,
                                  const UBaseType_t         uxAutoReload,
                                  void * const              pvTimerID,
                                  TimerCallbackFunction_t   pxCallbackFunction  ); 
```

函数参数：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/创建软件定时器函数参数.png)

函数返回值：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/创建软件定时器函数返回值.png)



### 3、开启软件定时器函数

答：

```C
BaseType_t     xTimerStart(   TimerHandle_t        xTimer,
                              const TickType_t     xTicksToWait  ); 
```

函数参数：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/开启软件定时器函数参数.png)

函数返回值：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/开启软件定时器函数返回值.png)



### 4、停止软件定时器函数

答：

```C
BaseType_t     xTimerStop(   TimerHandle_t      xTimer,
                             const TickType_t 	xTicksToWait   ); 
```

函数参数：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/停止软件定时器函数参数.png)

函数返回值：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/停止软件定时器函数返回值.png)



### 5、复位软件定时器函数

答：

```c
BaseType_t   xTimerReset( TimerHandle_t        xTimer,
                          const TickType_t     xTicksToWait); 
```

该函数将使软件定时器重新启动，复位后的软件定时器以复位是的时刻作为开启时刻重新定时。

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/复位软件定时器函数效果.png)

函数参数：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/复位软件定时器函数参数.png)

函数返回值：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/复位软件定时器函数返回值.png)



### 6、更改软件定时器超时时间函数

答：

```c
BaseType_t   xTimerChangePeriod( TimerHandle_t      xTimer,
                                 const TickType_t   xNewPeriod,
                                 const TickType_t   xTicksToWait );
```

函数参数：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/更改软件定时器超时时间函数参数.png)

函数返回值：

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/更改软件定时器超时时间函数返回值.png)

------



## 实验

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/QQ_1765291445373.png)

定时器有两个列表，一个是当前的定时器列表，另一个是溢出的软件定时器列表



```c
#include "stm32f4xx.h"                  // STM32F4系列微控制器头文件
#include "freertos.h"                   // FreeRTOS实时操作系统头文件
#include "task.h"                       // FreeRTOS任务管理头文件
#include "queue.h"                      // FreeRTOS队列管理头文件
#include "usart.h"                      // 串口通信头文件
#include "timer.h"                      // 定时器头文件
#include "delay_dwt.h"                  // 包含DWT延迟函数头文件
#include "semphr.h"                     // FreeRTOS信号量头文件
#include "event_groups.h"

/**
 * @brief LED初始化函数
 * 配置GPIOC的Pin13作为LED控制引脚
 */
void LED_Init(void)
{		
    // 使能GPIOC时钟（AHB1总线）
    RCC_AHB1PeriphClockCmd(RCC_AHB1Periph_GPIOC, ENABLE);

    // 配置GPIO初始化结构体
    GPIO_InitTypeDef GPIO_InitStructure;
	GPIO_StructInit(&GPIO_InitStructure);
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1 | GPIO_Pin_13 | GPIO_Pin_0;        // 选择引脚13,1
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_OUT;     // 输出模式
    GPIO_InitStructure.GPIO_OType = GPIO_OType_PP;    // 推挽输出
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz; // 输出速度50MHz
    GPIO_InitStructure.GPIO_PuPd = GPIO_PuPd_NOPULL;  // 无上拉下拉电阻
    GPIO_Init(GPIOC, &GPIO_InitStructure);            // 初始化GPIOC
}


/**
 * @brief LED初始化函数
 * 配置GPIOC的Pin13作为LED控制引脚
 */
void LED_TOGGLE13(void)
{
    GPIO_ToggleBits(GPIOC, GPIO_Pin_13);
}

/**
 * @brief LED初始化函数
 * 配置GPIOC的Pin1作为LED控制引脚
 */
void LED_TOGGLE1(void)
{
    GPIO_ToggleBits(GPIOC, GPIO_Pin_1);
}

/**
 * @brief LED初始化函数
 * 配置GPIOC的Pin0作为LED控制引脚
 */
void LED_TOGGLE0(void)
{
    GPIO_ToggleBits(GPIOC, GPIO_Pin_0);
}

/**
 * @brief 按键初始化函数
 * 配置GPIOA的Pin0和Pin1作为按键输入引脚
 */
void Key_Init(void)
{
	RCC_AHB1PeriphClockCmd(RCC_AHB1Periph_GPIOA, ENABLE);
	GPIO_InitTypeDef GPIO_InitStructure;
	GPIO_StructInit(&GPIO_InitStructure);
	GPIO_InitStructure.GPIO_Pin = GPIO_Pin_15 |  GPIO_Pin_0 | GPIO_Pin_1;
	GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN;
	GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
	GPIO_InitStructure.GPIO_PuPd = GPIO_PuPd_UP;
	GPIO_Init(GPIOA, &GPIO_InitStructure);  
}

/**
 * @brief 获取按键编号
 * 功能：根据按键状态返回按键编号
 * @return uint8_t 按键编号（1或2），如果没有按键按下则返回0
 */
uint8_t Key_GetNum(void)
{
	if (GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_0) == 0)
	{
		vTaskDelay(20);
		if(GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_0) == 0){
			return 1;
		}
	}
	else if (GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_1) == 0)
	{
		vTaskDelay(20);
		if(GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_1) == 0){
			return 2;
		}
	} 
	else if (GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_15) == 0)
	{
		vTaskDelay(20);
		if(GPIO_ReadInputDataBit(GPIOA, GPIO_Pin_15) == 0){
			return 3;
		}
    }
    return 0;
}

// 任务配置宏定义
#define START_TASK_STACK_SIZE 128       // 启动任务栈大小（字）
#define START_TASK_PRIORITY 2           // 启动任务优先级（数值越小优先级越高）
#define TASK1_STACK_SIZE 128           // 任务1栈大小（字）
#define TASK1_PRIORITY 3               // 任务1优先级（数值越大优先级越高）
// 任务句柄声明（用于引用和管理任务）
TaskHandle_t MytaskHandler1;    // 任务1句柄
TaskHandle_t StarttaskHandler;  // 启动任务句柄
#define ULONG_MAX 0xFFFFFFFF  // 定义ULONG_MAX为32位无符号整数的最大值
#define ULONG_MIN 0x00000000  // 定义ULONG_MIN为0
TimerHandle_t MyTimerHandle1 =  0; // 单次软件定时器句柄
TimerHandle_t MyTimerHandle2 =  0; // 周期软件定时器句柄

/*任务一按键扫描并控制软件定时器*/
void Task1(void * arg){
    uint8_t KeyNum =  0;
    while(1){
        KeyNum = Key_GetNum();
        if(KeyNum == 1){
            // 启动单次定时器
            if(xTimerStart(MyTimerHandle1, portMAX_DELAY) != pdPASS){
                printf("Timer1 start failed\r\n");
            } else{
                printf("Timer1 started\r\n");
            }

        } else if(KeyNum == 2){
            // 启动周期定时器
            if(xTimerStart(MyTimerHandle2, portMAX_DELAY) != pdPASS){
                printf("Timer2 start failed\r\n");
            } else{
                printf("Timer2 started\r\n");
            }
        } else if(KeyNum == 3){
            // 停止定时器
            xTimerStop(MyTimerHandle2, portMAX_DELAY);
            xTimerStop(MyTimerHandle1, portMAX_DELAY);
            printf("Both timers stopped\r\n");
        }
        vTaskDelay(1000);
    }
}

/*单次定时器回调函数*/
void timer1_Callback( TimerHandle_t pxTimer ) {
    // 记录定时器运行次数
    static uint32_t Time  = 0;
    printf("Timer1 run count: %d\r\n", ++Time);

    uint32_t ulTimerID;
    // 获取定时器ID
    ulTimerID = ( uint32_t ) pvTimerGetTimerID( pxTimer );
    if(ulTimerID == 1){
        LED_TOGGLE13();
    }
    printf("Timer1 Callback ID: %d\r\n", ulTimerID);

}


/*周期定时器回调函数*/
void timer2_Callback( TimerHandle_t pxTimer ) {
    // 记录定时器运行次数
    static uint32_t Time = 0;
    printf("Timer2 run count: %d\r\n", ++Time);

    uint32_t ulTimerID;
    // 获取定时器ID
    ulTimerID = ( uint32_t ) pvTimerGetTimerID( pxTimer );
    if(ulTimerID == 2){
        LED_TOGGLE13();
    }
    printf("Timer2 Callback ID: %d\r\n", ulTimerID);
}

/**
 * @brief 启动任务函数
 * 功能：创建其他三个任务后自行删除
 * @param arg 任务参数（未使用）
 */
void Starttask(void * arg){
    // 进入临界区保护串口输出
    taskENTER_CRITICAL();
    printf("----------------------------\r\n");
    printf("Starttask running\r\n");  // 打印启动任务运行信息
    taskEXIT_CRITICAL();
    /*单次定时器*/
    MyTimerHandle1 = xTimerCreate("timer1", 1000, pdFALSE, (void *)1, timer1_Callback); // 创建软件定时器
    /*周期定时器*/
    MyTimerHandle2 = xTimerCreate("timer2", 1000, pdTRUE, (void *)2, timer2_Callback); // 创建软件定时器
    taskENTER_CRITICAL();
    // 使用动态内存分配方式创建任务1
    xTaskCreate(Task1,                        // 任务函数指针
               "MyFirstTask",                 // 任务名称（用于调试）
               TASK1_STACK_SIZE,         // 栈大小（字）
               NULL,                          // 传递给任务的参数
               TASK1_PRIORITY,           // 任务优先级
               &MytaskHandler1);              // 任务句柄指针
    
    taskEXIT_CRITICAL();
    
    // 删除当前任务（启动任务），释放其占用的资源
    vTaskDelete(NULL);
}

/**
 * @brief 主函数
 * 程序入口点，初始化硬件并启动RTOS调度器
 */
int main(void)
{
	NVIC_PriorityGroupConfig(NVIC_PriorityGroup_4);
    LED_Init();                     // 初始化LED GPIO引脚
    Usart1_Init(115200);            // 初始化串口1，波特率115200
    Key_Init();                     // 初始化按键 GPIO引脚
    DWT_Init();                     // 初始化DWT定时器
    
    // 创建启动任务（使用动态内存分配）
    xTaskCreate(Starttask,                  // 任务函数指针
               "StartTask",                 // 任务名称
               START_TASK_STACK_SIZE,       // 栈大小
               NULL,                        // 任务参数
               START_TASK_PRIORITY,         // 任务优先级
               &StarttaskHandler);          // 任务句柄
    
    // 启动FreeRTOS调度器（程序将在此处开始运行任务）
    vTaskStartScheduler();
    
    // 正常情况下，调度器启动后不会执行到这里
    // 如果调度器启动失败，程序将在此处循环
    while (1)
    {		
        // 空循环，用于处理调度器启动失败的情况
    }	
}
```

![](assets/FreeRTOS/17 FreeRTOS软件定时器.assets/QQ_1765294868639.png)

