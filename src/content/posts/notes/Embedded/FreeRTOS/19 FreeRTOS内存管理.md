---
title: "19 FreeRTOS内存管理"
published: 2026-07-18
description: ""
tags: []
category: "嵌入式"
draft: false
---
# FreeRTOS 内存管理

------



## 一、FreeRTOS 内存管理简介

### 1、FreeRTOS 内存管理介绍

答：在使用 FreeRTOS 创建任务、队列、信号量等对象的时，一般都提供了两种方法：

- **动态方法创建**：自动地从 FreeRTOS 管理的内存堆中申请创建对象所需的内存，并且在对象删除后，可将这块内存释放回 FreeRTOS 管理的内存堆 
- **静态方法创建**：需用户提供各种内存空间，并且使用静态方式占用的内存空间一般固定下来了，即使任务、队列等被删除后，这些被占用的内存空间一般没有其他用途。

> 总结：**动态方式管理内存** 相比与静态方式，更加灵活。



### 2、为什么不用标准的 C 库自带的内存管理算法

答：因为标准 C 库的动态内存管理方法有如下几个缺点：

- 占用大量的代码空间 不适合用在资源紧缺的嵌入式系统中。
- 没有线程安全的相关机制。
- 运行有不确定性，每次调用这些函数时花费的时间可能都不相同。
- 内存碎片化。

因此，FreeRTOS 提供了多种动态内存管理的算法，可针对不同的嵌入式系统！

------





## 二、FreeRTOS 内存管理算法

### 1、FreeRTOS 内存管理算法种类

答：FreeRTOS 提供了 5 种动态内存管理算法，分别为： heap_1、heap_2、heap_3、heap_4、heap_5 。

如图所示：

![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/内存管理算法种类.png)

在我们 FreeRTOS 例程中，使用的均为 heap_4 内存管理算法。



### 2、heap_1 内存管理算法

答：

##### heap_1 的特点：

heap_1 只实现了 pvPortMalloc，没有实现 vPortFree；也就是说，它只能申请内存，无法释放内存！如果你的工程，创建好的任务、队列、信号量等都不需要被删除，那么可以使用 heap_1 内存管理算法。

heap_1 的实现最为简单，管理的内存堆是一个数组，在申请内存的时候， heap_1 内存管理算法只是简单地从数组中分出合适大小的内存，内存堆数组的定义如下所示 ：

```c
/* 定义一个大数组作为 FreeRTOS 管理的内存堆 */
static uint8_t ucHeap[ configTOTAL_HEAP_SIZE ];
```

##### heap_1 内存管理算法的分配过程如下图所示：

![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/heap_1算法过程.png)

注意： heap_1 内存管理算法，只能申请无法释放！



### 3、heap_2 内存管理算法

答：

##### heap_2 的特点：

- 相比于 heap_1 内存管理算法， heap_2 内存管理算法使用最适应算法，并且支持释放内存；
- heap_2 内存管理算法并不能将相邻的空闲内存块合并成一个大的空闲内存块；因此 heap_2 内存管理算法不可避免地会产生内存碎片；

##### 最适应算法：

假设 heap 有 3 块空闲内存（按内存块大小由小到大排序）：5 字节、25 字节、50 字节。

现在新创建一个任务需要申请 20 字节的内存。

第一步：找出最小的、能满足 pvPortMalloc 的内存：25 字节。

第二步：把它划分为 20 字节、5 字节；返回这 20 字节的地址，剩下的 5 字节仍然是空闲状态，留给后续的 pvPortMalloc 使用。

##### heap_2 内存管理算法的分配过程：

内存碎片是由于多次申请和释放内存，但释放的内存无法与相邻的空闲内存合并而产生的。

![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/heap_2算法过程.png)

##### 适用场景：

频繁的创建和删除任务，且所创建的任务堆栈都相同，这类场景下 Heap_2 没有碎片化的问题。



### 4、heap_4 内存管理算法

答：

##### heap_4 的特点：

heap_4 内存管理算法使用了首次适应算法，也支持内存的申请与释放，并且能够将空闲且相邻的内存进行合并，从而减少内存碎片的现象。

##### 首次适应算法：

- 假设 heap 有 3 块空闲内存（按内存块地址由低到高排序）：5 字节、50 字节、25 字节。
- 现在新创建一个任务需要申请 20 字节的内存。
- 第一步：找出第一个能满足 pvPortMalloc 的内存：50 字节。
- 第二步：把它划分为 20 字节、30 字节；返回这 20 字节的地址，剩下 30 字节仍然是空闲状态，留给后续的 pvPortMalloc 使用。

##### heap_4 内存管理算法的分配过程：

heap_4 内存管理算法会把相邻的空闲内存合并为一个更大的空闲内存，这有助于减少内存的碎片问题。

![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/heap_4算法过程.png)

##### 适用于这种场景：

频繁地分配、释放不同大小的内存。



### 5、heap_5 内存管理算法

答：

##### heap_5 的特点：

heap_5 内存管理算法是==在 heap_4 内存管理算法的基础上实现的==，但是 heap_5 内存管理算法在 heap_4 内存管理算法的基础上实现了==管理多个非连续内存区域的能力。==

heap_5 内存管理算法默认并没有定义内存堆 ， 需要用户手动指定内存区域的信息，对其进行初始化。

#### 怎么指定一块内存？

使用如下结构体：

```c
typedef struct HeapRegion
{   
     uint8_t *     pucStartAddress;          /* 内存区域的起始地址 */
     size_t        xSizeInBytes;             /* 内存区域的大小，单位：字节 */
} HeapRegion_t; 
```

#### 怎么指定多块且不连续的内存？

```c
Const  HeapRegion_t  xHeapRegions[] = 
{
    {(uint8_t *)0x80000000, 0x10000 }, 	    /* 内存区域 1 */
    { (uint8_t *)0x90000000, 0xA0000 }, 	/* 内存区域 2 */
    { NULL, 0 }                             /* 数组终止标志 */
};

vPortDefineHeapRegions(xHeapRegions); 
```

##### 适用场景：

在嵌入式系统中，那些内存的地址并不连续的场景。

------





## 三、FreeRTOS 内存管理相关 API 函数

### 1、FreeRTOS 内存管理相关函数

答：

![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/内存管理相关函数.png)

```C
void * pvPortMalloc( size_t xWantedSize );
```

![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/pvPortMalloc参数与返回值.png)

```C
void vPortFree( void * pv );
```

![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/vPortFree函数参数.png)

```C
size_t xPortGetFreeHeapSize( void );
```

![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/xPortGetFreeHeapSize函数返回值.png)

------



## 实验

![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/QQ_1765387850675.png)

```c
#include "stm32f4xx.h"
#include "freertos.h"
#include "task.h"
#include "queue.h"
#include "usart.h"
#include "timer.h"
#include "delay_dwt.h"
#include "semphr.h"
#include "event_groups.h"

/**
 * @brief LED initialization
 * Configure GPIOC pins for LED control
 */
void LED_Init(void)
{		
    // 使能GPIOC时钟（AHB1总线）
    RCC_AHB1PeriphClockCmd(RCC_AHB1Periph_GPIOC, ENABLE);

    // Configure GPIO init structure
    GPIO_InitTypeDef GPIO_InitStructure;
	GPIO_StructInit(&GPIO_InitStructure);
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1 | GPIO_Pin_13 | GPIO_Pin_0;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_OUT;
    GPIO_InitStructure.GPIO_OType = GPIO_OType_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_InitStructure.GPIO_PuPd = GPIO_PuPd_NOPULL;
    GPIO_Init(GPIOC, &GPIO_InitStructure);
}


/**
 * @brief Toggle LED on PC13
 */
void LED_TOGGLE13(void)
{
    GPIO_ToggleBits(GPIOC, GPIO_Pin_13);
}

/**
 * @brief Toggle LED on PC1
 */
void LED_TOGGLE1(void)
{
    GPIO_ToggleBits(GPIOC, GPIO_Pin_1);
}

/**
 * @brief Toggle LED on PC0
 */
void LED_TOGGLE0(void)
{
    GPIO_ToggleBits(GPIOC, GPIO_Pin_0);
}

/**
 * @brief Key (button) initialization
 * Configure GPIOA pins for button inputs
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
 * @brief Get pressed key number
 * Return 1, 2, or 3 for respective keys, 0 if none
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

// Task configuration macros
#define START_TASK_STACK_SIZE 128
#define START_TASK_PRIORITY 2
#define TASK1_STACK_SIZE 128
#define TASK1_PRIORITY 3
// Task handles
TaskHandle_t MytaskHandler1;
TaskHandle_t StarttaskHandler;
#define ULONG_MAX 0xFFFFFFFF
#define ULONG_MIN 0x00000000


/* Allocate and free memory, and display free heap size */
void Task1(void * arg){
    uint8_t key_num = 0;
    uint8_t t = 0;
    uint8_t *buff = NULL;
    while(1){
        key_num = Key_GetNum();
        if(key_num == 1) { /*申请内存*/
            buff = pvPortMalloc(30); // 申请10KB内存
            if(buff != NULL){
                printf("Memory allocated at address: %p\r\n", buff);
            } else {
                printf("Memory allocation failed!\r\n");
            }
        } else if(key_num  == 2) { /*释放内存*/
            if(buff != NULL){
                vPortFree(buff); // 释放内存
                printf("Memory freed at address: %p\r\n", buff);
                buff = NULL; // 避免悬挂指针
            } else {
                printf("No memory to free!\r\n");
            }
        }

        if(t++ >= 50) {
            t = 0;
            taskENTER_CRITICAL();
            printf("Free heap size: %d bytes, min ever free: %d bytes\r\n",
                   (unsigned long)xPortGetFreeHeapSize(),
                   (unsigned long)xPortGetMinimumEverFreeHeapSize());
            taskEXIT_CRITICAL();
        }

        vTaskDelay(100); // 延时100ms
        
    }
}


/**
 * @brief 启动任务函数
 * 功能：创建其他三个任务后自行删除
 * @param arg 任务参数（未使用）
 */
void Starttask(void * arg){
    // Enter critical section for serial output
    taskENTER_CRITICAL();
    printf("----------------------------\r\n");
    printf("Starttask running\r\n");  // 打印启动任务运行信息
    taskEXIT_CRITICAL();
    

    // 使用动态内存分配方式创建任务1
    xTaskCreate(Task1,                        // 任务函数指针
               "MyFirstTask",                 // 任务名称（用于调试）
               TASK1_STACK_SIZE,         // 栈大小（字）
               NULL,                          // 传递给任务的参数
               TASK1_PRIORITY,           // 任务优先级
               &MytaskHandler1);              // 任务句柄指针
    
    // Delete this startup task after creating other tasks
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
    
    // Start FreeRTOS scheduler (tasks will run after this)
    vTaskStartScheduler();
    
    // Normally execution should never reach here if scheduler starts
    // If scheduler fails, stay in this loop
    while (1)
    {		
        // 空循环，用于处理调度器启动失败的情况
    }	
}
```







![](assets/FreeRTOS/19 FreeRTOS内存管理.assets/QQ_1765379346671.png)



