---
title: "3.1.1 什么是内存？进程的基本原理，深入指令理解其过程_llf算法"
published: 2020-04-21
description: "文章浏览阅读3.1w次，点赞116次，收藏69次。本文深入探讨了内存的基本概念及其在计算机系统中的关键作用，包括存储单元、常用数量单位和内存地址的理解。同时，详细解析了进程运行的底层原理，涵盖了指令执行流程、逻辑地址与物理地址的区别、程序从编写到运行的全过程——编译、链接和装入，以及不同装入和链接方式的优劣比较。"
tags: []
category: "SchoolStudy"
draft: false
order: 80
---
---

### 0.思维导图

![](./assets/img-c1d1febdfb91.png)

### 1.什么是内存？有何作用？

![](./assets/img-f6288a5903cd.png)

#### （1）存储单元

- 关于存储单元有关内容在我写的组成原理笔记中有提到： [存储单元](https://blog.csdn.net/weixin_43914604/article/details/104099953)  
	![](./assets/img-cb467dc3567d.png)

#### （2）几个常用数量单位&内存地址

![](./assets/img-885bd6433197.png)

### 2.进程运行的基本原理

#### （1）指令的工作原理—操作码+若干参数（可能包含地址参数）

- 从X=X+1大致看一下指令的执行过程  
	![](./assets/img-9e1527f3d7b6.png)  
	  
	![](./assets/img-ea2ac2d13cd5.png)

#### （2）逻辑地址（相对地址）vs物理地址（绝对地址）

![](./assets/img-33d1d326f5ca.png)

#### （3）从写程序到程序运行—编译、 链接 、装入

![](./assets/img-51fb7502cf71.png)

#### （4）装入模块装入内存

**不修改装入模块中的指令地址就直接装入内存的话：**  
![](./assets/img-55d38a2e2966.png)  

![](./assets/img-4c1bc33742d2.png)

![](./assets/img-f1831a0ae2c3.png)  
  
![](./assets/img-565f4184e88b.png)

![](./assets/img-f324cc44b6b0.png)