---
title: "5.2.3 OS之IO设备的分配与回收（DCT-COCT-CHCT-SDT）_dct coct chct sdt全称-"
published: 2020-05-22
description: "文章浏览阅读1.1w次，点赞20次，收藏32次。本文深入探讨了设备分配的关键因素，包括设备属性、分配算法及安全性。对比静态与动态分配，详细介绍了设备控制表（DCT）、控制器控制表（COCT）、通道控制表（CHCT）和系统设备表（SDT）等数据结构，最后阐述了设备分配的步骤与改进措施。"
tags: []
category: "SchoolStudy"
draft: false
order: 114
---
## 0.思维导图

![](./assets/img-2277570d9f9f.png)

## 1.设备分配时应该考虑的因素

### 设备的固有属性

![](./assets/img-0eb37b4e264e.png)

### 设备的分配算法

![](./assets/img-852ceb24fa64.png)

### 设备分配中的安全性

![](./assets/img-5abb6edc5b45.png)

## 2.静态分配与动态分配

![](./assets/img-9b6edb043dd4.png)

## 3.设备分配管理中的数据结构

**设备、控制器、通道之间的关系：**  
![](./assets/img-f40a96dd0603.png)

### 设备控制表—DCT

![](./assets/img-99578082d1c3.png)

### 控制器控制表—COCT

![](./assets/img-c22c39d56f6d.png)

### 通道控制表—CHCT

![](./assets/img-88985f17c9fa.png)

### 系统设备表—SDT

![](./assets/img-f87905a75a2c.png)

## 4.设备分配的步骤

![](./assets/img-dfbb263f1892.png)  
  
![](./assets/img-ffe138a2e8de.png)  

### 设备分配的改进步骤

![](./assets/img-40c7004267b6.png)  
  
![](./assets/img-fb602feb9a63.png)  
参考：《王道操作系统》