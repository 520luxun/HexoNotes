---
title: "3.1.4 操作系统之内存的分配与回收_操作系统碎片回收课件"
published: 2020-04-23
description: "文章浏览阅读2.3w次，点赞60次，收藏44次。本文深入探讨了计算机操作系统中内存管理的关键技术，包括单一连续分配、固定分区分配、动态分区分配及其数据结构记录方法，同时分析了内部碎片与外部碎片问题。"
tags: []
category: "计算机操作系统"
draft: false
order: 83
---
### 0.思维导图

![](./assets/img-3cfad29e1a6f.png)  

### 1.单一连续分配

![](./assets/img-7dbde8433978.png)

### 2.固定分区分配

![](./assets/img-425c79ba2db1.png)

#### （1）分区说明表

![](./assets/img-a177f6fdbcd5.png)

### 3.动态分区分配（可变分区分配）

![](./assets/img-0f6a7d633b5c.png)  
  
![](./assets/img-41ed76943ef2.png)  

#### （1）系统要用怎样的数据结构记录内存的使用情况呢？

![](./assets/img-52e99a24a756.png)

#### （2）当多个空闲分区都能满足要求时，应该选择哪个分区进行分配？

![](./assets/img-0d9d7ac0c250.png)

#### （3）如何进行分区的分配和回收操作？

**如何分配？**  
![](./assets/img-0b8d97ff6fbc.png)  
  
![](./assets/img-4901ecf05c59.png)  
**如何回收？**  
![](./assets/img-12460cec306e.png)  
  
![](./assets/img-42e212ee8bf4.png)  

![](./assets/img-bc9ad957e20a.png)