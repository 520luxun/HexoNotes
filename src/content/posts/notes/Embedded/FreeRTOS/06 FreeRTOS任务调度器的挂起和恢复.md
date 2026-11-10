---
title: "06 FreeRTOS任务调度器的挂起和恢复"
published: 2026-07-18
description: ""
tags: []
category: "嵌入式"
draft: false
---
# 任务调度器的挂起和恢复

------

## 概念

### 1、任务调度器挂起和恢复函数

答：

挂起任务调度器，调用此函数是不需要关闭中断的

![](assets/FreeRTOS/06 FreeRTOS任务调度器的挂起和恢复.assets/任务调度器挂起和恢复函数.png)

使用格式示范：

![](assets/FreeRTOS/06 FreeRTOS任务调度器的挂起和恢复.assets/任务调度器挂起和恢复格式.png)



### 2、任务调度器挂起和恢复的特点

答：

1. 与临界区不一样的是，==挂起任务调度器，未关闭中断==。
2. 它==仅仅是防止任务之间的资源争夺==，中断照样可以直接响应。
3. 挂起任务调度器的方式，==适用于临界区位于任务与任务之间==；既==不用去延时中断响应，又可以做到临界区的安全==。



### 3、挂起任务调度器：vTaskSuspendAll()

答：调用一次挂起调度器，该变量uxSchedulerSuspended就加一 ，变量uxSchedulerSuspended的值，将会影响Systick触发PendSV中断（在xTaskIncrementTick函数中 uxSchedulerSuspended的值与pdFALSE进行比较，pdFALSE值为0，不相等，那么返回的值是pdFALSE；在xPortSysTickHandler函数中返回值与pdFALSE进行比较，相等，挂起不了pendSV寄存器，中断触发不了），即SpendSV中断执行不了，相当于被挂起，即影响任务调度。



支持嵌套



### 4、恢复任务调度器：xTaskResumeAll()  

答：调用一次恢复调度器，该变量uxSchedulerSuspended就减一 ，如果uxSchedulerSuspended等于0，则允许调度 。

1. 当任务数量大于0时，恢复调度器才有意义，如果没有一个已创建的任务就无意义。
2. 判断等待就绪列表是否有任务，没有，那么全部给移除掉（任务调度器挂起了，把任务放置在等待就绪列表中）
3. 有，移除等待就绪列表中的列表项,恢复至就绪列表,直到xPendingReadyList列表为空。
4. 如果恢复的任务优先级比当前正在执行任务优先级更高，则将xYieldPending赋值为pdTRUE,表示需要进行一次任务切换，更新等待的时间。
5. 在调度器被挂起的期间内,是否有丢失未处理的滴答数。 xPendedCounts是丢失的滴答数，有则调用xTasklncrementTickf() 补齐弄失的滴答数（挂起的时候，Tick记录的是被挂起了多少时间，等恢复的时间加回去）。
6. 判断是否允许任务切换。
7. 返回任务是否已经切换；已经切换返回pdTRUE；反之返回pdFALSE。







![](assets/FreeRTOS/06 FreeRTOS任务调度器的挂起和恢复.assets/07-临界区保护及调度器的挂起和恢复（课堂总结）_01.png)

