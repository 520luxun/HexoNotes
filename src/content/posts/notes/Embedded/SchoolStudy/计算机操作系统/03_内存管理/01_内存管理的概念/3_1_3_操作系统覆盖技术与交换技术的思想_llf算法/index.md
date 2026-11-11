---
title: "3.1.3 操作系统覆盖技术与交换技术的思想_llf算法"
published: 2020-04-23
description: "文章浏览阅读1.7w次，点赞54次，收藏22次。本文深入探讨了进程调度中的核心概念，包括思维导图、覆盖技术和交换技术，为读者提供了全面的理解视角，助您掌握进程调度的关键技术。"
tags: []
category: "SchoolStudy"
path: "Embedded/SchoolStudy/计算机操作系统/03_内存管理/01_内存管理的概念"
draft: false
order: 82
---
## 3.1.3 操作系统覆盖技术与交换技术的思想

最新推荐文章于 2024-12-22 23:46:35 发布

原创 于 2020-04-23 18:27:57 发布 · 1.7w 阅读

· 54

· 22 · 本内容遵循CC 4.0 BY-SA版权协议

版权声明：本文为博主原创文章，遵循 [CC 4.0 BY-SA](http://creativecommons.org/licenses/by-sa/4.0/) 版权协议，转载请附上原文出处链接和本声明。

收录于

操作系统

当前文章被收录于：

[

操作系统

](https://blog.csdn.net/weixin_43914604/category_9734257.html "操作系统")

*62* 篇文章 *1144* 人学习

对操作系统的主要知识点进行梳理和图文结合的总结

订阅专栏 [查看详情](https://blog.csdn.net/weixin_43914604/category_9734257.html)

2048 AI社区

当前文章被收录于：

2048 AI社区

文章已被社区收录

本文深入探讨了进程调度中的核心概念，包括思维导图、覆盖技术和交换技术，为读者提供了全面的理解视角，助您掌握进程调度的关键技术。

标签

[#操作系统](https://so.csdn.net/so/search/s.do?q=%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F&t=all&o=vip&s=&l=&f=&viparticle=&from_tracking_code=tag_word&from_code=app_blog_art) [#覆盖技术](https://so.csdn.net/so/search/s.do?q=%E8%A6%86%E7%9B%96%E6%8A%80%E6%9C%AF&t=all&o=vip&s=&l=&f=&viparticle=&from_tracking_code=tag_word&from_code=app_blog_art) [#交换技术](https://so.csdn.net/so/search/s.do?q=%E4%BA%A4%E6%8D%A2%E6%8A%80%E6%9C%AF&t=all&o=vip&s=&l=&f=&viparticle=&from_tracking_code=tag_word&from_code=app_blog_art) [#进程](https://so.csdn.net/so/search/s.do?q=%E8%BF%9B%E7%A8%8B&t=all&o=vip&s=&l=&f=&viparticle=&from_tracking_code=tag_word&from_code=app_blog_art) [#内存管理](https://so.csdn.net/so/search/s.do?q=%E5%86%85%E5%AD%98%E7%AE%A1%E7%90%86&t=all&o=vip&s=&l=&f=&viparticle=&from_tracking_code=tag_word&from_code=app_blog_art)

- 54
	点赞
- 踩
- 22
	收藏
	觉得还不错? 一键收藏
- 0
	评论
- 分享
- 举报
	举报

专栏目录

<iframe src="https://kunpeng-sc.csdnimg.cn/?timestamp=1645783940/#/preview1/4140287?positionId=58&amp;adBlockFlag=0&amp;adId=1109070&amp;queryWord=3.1.3%20%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F%E8%A6%86%E7%9B%96%E6%8A%80%E6%9C%AF%E4%B8%8E%E4%BA%A4%E6%8D%A2%E6%8A%80%E6%9C%AF%E7%9A%84%E6%80%9D%E6%83%B3&amp;spm=1001.2101.3001.5002&amp;articleId=105713460" frameborder="0" width="100%" height="75px"></iframe>[*操作系统* *3* - *覆盖* *技术* ， *交换技术* ，虚拟存储，置换 *算法* ——lab *3*](https://blog.csdn.net/qq_37299596/article/details/104836048)[qq\_37299596的博客](https://blog.csdn.net/qq_37299596)

03-13 1984[虚拟存储：在非连续存储内存分配的基础上，可以把一部分内容放到外存的做法 需求背景： 增长迅速的存储需求：程序规模的增长速度远远大于存储器容量的增长速度 理想的存储器：更大，更快，更便宜，非易失性，实际张的存储器是目前很难达到的 要把硬盘的空间也用上，让硬盘在os的操作之下扮演内存的作用，使得常用的 *进程* 放在内存上，不常用的放在硬盘上 那么，在计算机系统中内存不够用的解决办法是： *覆盖* overl*.**.**.*](https://blog.csdn.net/qq_37299596/article/details/104836048)[最低松弛度优先 *LLF* (Least Laxity First) *算法* \_最低松弛度优先 *算法* -CSDN博*.**.**.*](https://blog.csdn.net/weixin_54010759/article/details/123875576)

8-19[*LLF* *算法* 考虑 *进程* 的松弛度,即任务必须完成的时间减去当前时间和剩余执行时间。在队列中,按照松弛度排序,最紧急的任务优先执行。当有多个 *进程* 松弛度相同时,采用最近最久未使用(LRU)策略。文中还给出了具体的 *算法* 实现,包括 *进程* 结构体、队列操作以及调度过程。通过示例展示了如何在不同时间点选择和抢占 *进程*,确保高优先级任*.**.**.*](https://blog.csdn.net/weixin_54010759/article/details/123875576)[Matlab的AIC和BIC的计算方法-关于AICBIC*.*pdf\_aicbic函数matlab*.**.**.*](https://download.csdn.net/download/qq_34764167/29028772)

8-11[\- numObs(可选):每个 *LLF* 值对应的观测样本大小,仅在计算BIC时需要。 使用\`aicbic\`函数时,可以按照以下方式调用: \`\`\`matlab \[AIC, BIC\] = aicbic(*LLF*, numParams, numObs) \`\`\` 如果所有 *LLF* 值对应相同的样本量,numObs可以是一个标量;否则,它应该是一个 *与* *LLF* 相同长度的向量,确保对每个模型都有相应的样本量*.**.**.*](https://download.csdn.net/download/qq_34764167/29028772)[*操作系统* 笔记（五） *覆盖* 和交换，虚拟内存](https://blog.csdn.net/github_36487770/article/details/54934919)[凝视深渊](https://blog.csdn.net/github_36487770)

02-09 1万+[前篇： 笔记（二） *操作系统* 的启动、中断、异常、系统调用 笔记（三）（四）内存层次、地址空间、连续/非连续内存分配Index: 5- *1* 虚拟内存：起因 5-2 *覆盖* *技术* 5- *3* *交换技术* 5-4,5 虚拟内存5- *1* 虚拟内存：起因内存越来越不够用，理想中的存储器是更大，更快，更便宜的非易失存储器。 为了有效管理物理内存，采用了分段，分页，也许在这个基础上可以达到更大更快的理想情况，](https://blog.csdn.net/github_36487770/article/details/54934919)[*3**.*4 实时调度](https://blog.csdn.net/weixin_42202174/article/details/91129032)[Log.e的博客](https://blog.csdn.net/weixin_42202174)

06-07 2233[*1**.*实现实时调度的基本条件 （ *1* ）提供必要的信息（2）系统处理能力强（ *3* ）采用抢占式调度机制（4）具有快速切换机制 2*.*实时调度 *算法* 的分类 （ *1* ）非抢占式轮转调度 *算法* （时间片轮转） （2）非抢占式优先调度 *算法* （ *3* ）基于时钟中断的抢占式优先级调度 *算法* （4）立即抢占的优先级调度 *算法* *3**.*最早截止时间优先 *算法* ：任务的截止时间越早，优先级越高，具有最早截止时间的任务排在队列的队首。 4*.**.**.*](https://blog.csdn.net/weixin_42202174/article/details/91129032)[Matlab的AIC和BIC的计算方法-关于AIC*.*doc\_aicbic函数matlab资源*.**.**.*](https://download.csdn.net/download/weixin_39841848/11530205)

8-13[\= aicbic(*llf*, numparams);\`\`\`其中,*llf* 是对数似然函数的值,numparams是模型参数的数量,aic是计算出的aic值*.*bic的计算方法bic是由gideon schwarz于 *1* 978年提出的模型选择准则*.*bic的计算公式为:bic = -2\\\* *llf* + log(numobs)\\\*numparams其中,*llf* 是对数似然函数的值,numobs是样本观测值的数量,numparams是模型*.**.**.*](https://download.csdn.net/download/weixin_39841848/11530205)[EDF *与* *LLF* 动态调度 *算法* 详解](https://blog.csdn.net/Rauber_Hotzenplotz/article/details/7244099)8-28[*LLF* 最短空闲时间优先 *算法* (*LLF*)也是一种动态调度 *算法* 。 *LLF* 指在调度时刻,任务的优先级根据任务的空闲时间动态分配。空闲时间越短,优先级越高。空闲时间=deadline-任务剩余执行时间。 *LLF* 可调度条件和EDF相同。 理论上,EDF和 *LLF* *算法* 都是单处理器下的最优调度 *算法* 。但是由于EDF和 *LLF* 在每个调度时刻都要计算任务的deadline*.**.**.*](https://blog.csdn.net/Rauber_Hotzenplotz/article/details/7244099)[*操作系统* 原理，物理内存“扩充” *技术* ，内存紧缩， *覆盖* ，交换，虚拟内存 *思想*](https://blog.csdn.net/ganfanren00001/article/details/125647523)[ganfanren00001的博客](https://blog.csdn.net/ganfanren00001)

07-06 3891[当内存空间不足以存放下 *进程* 是，需要使用到内存“扩充” *技术* ，但不是真的扩充了内存。 一、内存“扩充” *技术* *1* 、内存紧缩 *技术* ：在可变分区型的 *操作系统* 中调节 *进程* 在内存中的位置，将 *进程* 间的外碎片合成为可用的内存空间并利用。 2、 *覆盖* *技术* overlaying 2、 *交换技术* swapping 4、虚拟内存 *技术* virtual memory二、 *覆盖* *技术* （早期 *操作系统* ） *1* 、应对问题：程序大小超过了物理内存总和 2、解决方案：程序的不同部分在内存中共享一块区域并相互 *覆盖* 2*.**1* 、 *操作系统* 按照程序自身的逻*.**.**.*](https://blog.csdn.net/ganfanren00001/article/details/125647523)[【 *操作系统* 中的最低松弛度优先 *算法* （ *LLF* ）】](https://devpress.csdn.net/v1/article/detail/136269322)[武帝为此的博客](https://blog.csdn.net/qq_66726657)

02-24 2945[在 *操作系统* 领域，调度 *算法* 是至关重要的一部分。调度 *算法* 决定了系统中 *进程* 的执行顺序，直接影响到系统的性能和效率。最低松弛度优先 *算法* （ *LLF* ）是一种经典的调度 *算法* 之一，最低松弛度优先 *算法* （ *LLF* ）是一种重要的动态优先级调度 *算法* ，在实时系统中发挥着重要作用。通过选择剩余处理时间最短、截止时间最近的任务， *LLF* *算法* 能够最小化任务的响应时间，确保系统能够及时响应紧急任务。 *LLF* *算法* 的实现相对简单，但能够带来显著的性能提升，因此在实时系统设计中被广泛采用。](https://devpress.csdn.net/v1/article/detail/136269322)[第三章处理机调度 *与* 死锁--处理机调度](https://blog.csdn.net/AudienceT/article/details/83958679)8-22[详细讲解了实时调度的基本条件和 *算法* 分类,介绍了EDF和 *LLF* 两种常见实时调度 *算法* 。](https://blog.csdn.net/AudienceT/article/details/83958679)[【 *操作系统* 】处理机调度简述\_处理机调度的对象可以是 *进程* 也可以是线程*.**.**.*](https://blog.csdn.net/Helloyongwei/article/details/80178323)

8-25[短作业(*进程*)优先的调度 *算法* (short job first): 为短作业而设立, 因为 *操作系统* 中大多为短作业*.*系统在作业运行时, 选出运行时间最短的作业将其调入内存*.* SJF(不可抢占):*算法* 以作业的长短(作业需要运行的时间)来计算优先级, 作业越短, 其优先级越高*.* *.**.**.*](https://blog.csdn.net/Helloyongwei/article/details/80178323)[最低松弛度优先 *LLF* （Least Laxity First） *算法*](https://devpress.csdn.net/v1/article/detail/123875576)[weixin\_54010759的博客](https://blog.csdn.net/weixin_54010759)

03-31 6748[参考链接 最低松弛度优先调度 *算法* - 爱生活，爱编程 - 博客园 end](https://devpress.csdn.net/v1/article/detail/123875576)[最低松弛度优先 *算法* （Least Laxity First， *LLF* ）](https://devpress.csdn.net/v1/article/detail/110789060)[qq\_43992949的博客](https://blog.csdn.net/qq_43992949)

12-06 1万+[定义 *LLF* *算法* 是指根据任务的紧急（或松弛）程度来确定任务的优先级的 *算法* ，任务紧急程度愈高，其优先级就愈高。 作用对象 主要用于可抢占式调度方式中。 任务松弛度计算公式 任务的松弛度=必须完成时间-其本身的运行时间-当前时间 例题： 周期性任务A，要求每20ms执行一次，执行时间为 *1* 0ms； 周期性任务B，要求每50ms执行一次，执行时间为25ms； 计算过程 t=0s时，A *1* 的松弛度=20ms- *1* 0ms-0ms= *1* 5ms，B *1* 的松弛度=50ms-25ms-0=25ms，先执行A *1* ； A *1* 执行完后，t](https://devpress.csdn.net/v1/article/detail/110789060)[SPFA及其优化---他复活了\_spfa复活](https://blog.csdn.net/qq_29904713/article/details/88071899)9-2[本文深入讲解了SPFA *算法*,一种高效求解最短路径问题的方法,适用于带权图且不包含负权重环的情况。文章提供了 *算法* 的时间复杂度、特点及应用实例,并探讨了多种优化策略,包括SLF双端队列极值优化、 *LLF* 平均值优化和优先队列优化。 SPFA算是一种比较万能的最短路 *算法* 了 *.**.**.*](https://blog.csdn.net/qq_29904713/article/details/88071899)[最低松弛度优先调度 *算法*](https://blog.csdn.net/u010637291/article/details/9153333)

[

热门推荐

](https://blog.csdn.net/u010637291/article/details/9153333)

[化甘](https://blog.csdn.net/u010637291)

06-23 2万+[最低松弛度优先（ *LLF* ） *算法* 是根据任务紧急（或松弛）的程度，来确定任务的优先级。任务的紧急程度愈高，为该任务所赋予的优先级就愈高，使之优先执行。在实现该 *算法* 时要求系统中有一个按松弛度排序的实时任务就绪队列，松弛度最低的任务排在队列最前面，被优先调度。松弛度的计算方法如下： 任务的松弛度=必须完成的时间-其本身的运行时间-当前时间 其中其本身运行的时间指任务运行结束还需多少时间，](https://blog.csdn.net/u010637291/article/details/9153333)[【王道 *操作系统* 】 *3**.**1**.**3* *覆盖* *技术* *与* *交换技术* 的 *思想*](https://blog.csdn.net/qq_29678157/article/details/128523401)[修行的凡人的博客](https://blog.csdn.net/qq_29678157)

01-03 253[基于《王道 *操作系统* 》得出的理论知识精华](https://blog.csdn.net/qq_29678157/article/details/128523401)[*操作系统* 原理： *覆盖* *技术* 、 *交换技术* 、虚拟内存概要](https://blog.csdn.net/superSmart_Dong/article/details/116139514)[superSmart\_Dong的博客](https://blog.csdn.net/superSmart_Dong)

04-27 6133[随着时间的推移，程序不断地更新，规模不断增长，运行的时候可能会发现内存会越来越不够用。所以希望一个容量大，更快，更便宜，数据不易丢失的](https://blog.csdn.net/superSmart_Dong/article/details/116139514)[*覆盖* 和 *交换技术* 详细解释](https://blog.csdn.net/u014711890/article/details/124441110)[千淘万漉虽辛苦，吹尽狂沙始到金](https://blog.csdn.net/u014711890)

04-27 5426[转载自https://blog*.*csdn*.*net/qq\_4 *1* *3* 75 *3* *1* 8/article/details/ *1* 02646006 *覆盖* 和交换 *1**.**覆盖* *技术* （ *1* ）一个固定区 *1**.*存放最活跃的程序段 2*.*固定区中的程序段在运行过程中不会调入和调出 （2）若干个 *覆盖* 区 *1**.*不可能同时被访问程序段（处在同一级）可共享一个 *覆盖* 区 2*.**覆盖* 区中的程序段在运行过程中会根据需要调入和调出 （ *3* ）必须由程序员声名 *覆盖* 结构， *操作系统* 完成自动 *覆盖* （4）缺点：对用户不透明，增强了用户编程负担 *覆盖* *技术* 的 *思想* ：将程序分为多个段（模块](https://blog.csdn.net/u014711890/article/details/124441110)[《 *操作系统* - 清华大学》5 - *3* ： *交换技术*](https://blog.csdn.net/weixin_44399845/article/details/144008635)[weixin\_44399845的博客](https://blog.csdn.net/weixin_44399845)

11-24 1021[*覆盖* *技术*](https://blog.csdn.net/weixin_44399845/article/details/144008635)[*操作系统* *3**.**1**.**3* 内存空间扩充 *技术* （ *覆盖* *与* 交换）](https://blog.csdn.net/dyw_666666/article/details/107057255)[烟敛寒林的博客](https://blog.csdn.net/dyw_666666)

07-01 4167[本节主要讲 *覆盖* *技术* 和 *交换技术* ，虚拟存储 *技术* 在后续小节会详细展开。 实现内存空间扩充的 *技术* 一、 *覆盖* *技术* 用于解决“程序大小超过物理内存总和”的问题。 *思想* ： 将程序分为多个段，常用的段常驻在内存，不常用的段在需要时才从外存调入内存。 内存中分为一个“固定区”和若干个“ *覆盖* 区”，需要常驻内存的段放在“固定区”，调入后就不再调出（除非运行结束）。 不常用的段，放在 *覆盖* 区中，需要用的时候调入内存，用不到时调出内存。 一个固定区：存放最活跃的程序段，固定区的程序在运行过程中不会调入调出*.**.**.*](https://blog.csdn.net/dyw_666666/article/details/107057255)[内存的扩充（ *覆盖* *技术* 和 *交换技术* 的设计 *思想* ）](https://blog.csdn.net/crossroads10/article/details/108791568)[crossroads10的博客](https://blog.csdn.net/crossroads10)

09-25 1781[首先，我们要先了解清楚的问题是，为什么会出现内存扩充？这个可以思考一下 好，开始正文： *覆盖* *技术* ： 早起的计算机内存很小，比如IBM推出的第一台PC机最大只支持 *1* MB大小的内存。因此经常会出现内存大小不够的情况。 后来人们引入了 *覆盖* *技术* ，用来解决”程序大小超过物理内存总和”的问题 *覆盖* *技术* 的 *思想*:就是将程序分为多个段（多个模块）， 常用的段常驻内存，不常用的段的需要调入内存。 内存中分为一个固定区 和若干个 *覆盖* 区 常用的段呢存储在固定区，调入后就不会再调出（除非结束运行） 不常用的段放在覆](https://blog.csdn.net/crossroads10/article/details/108791568)[*3**.**1**.**3* *覆盖* *技术* *与* *交换技术*](https://blog.csdn.net/Y920036515/article/details/120266887)[ybbgrain的历程](https://blog.csdn.net/Y920036515)

09-13 1010[全知识整理目录 *操作系统* 整理的目录，包括了整理的所有 *操作系统* 的知识。 目录 概述 *覆盖* *技术* *交换技术* 概述 为什么要使用 *覆盖* *技术* 和 *交换技术* ？这些 *技术* 又是什么？ 早期的计算机，内存容量很小，其实现在也比较小，例如一个4G的内存电脑，是怎么运行 *3* 2G的游戏的呢？这就是 *覆盖* *技术* 和 *交换技术* 要做的事情。而 *覆盖* *技术* 和 *交换技术* 可用理解为一种 *算法* ，来实现这种调度的 *算法* 。 *覆盖* *技术* 将程序分为多个段，常用的段常驻内存，不常用的段需要时调入内存。 固定区：常用段存放的地方，存入进去的就不*.**.**.*](https://blog.csdn.net/Y920036515/article/details/120266887)[*操作系统* *覆盖* *技术* 和 *交换技术*](https://blog.csdn.net/yxlr_beta/article/details/51476571)[yxlr\_beta的博客](https://blog.csdn.net/yxlr_beta)

05-22 1万+[*覆盖* *技术* 为什么提出 *覆盖* *技术* ？ 倘若我有一个 *进程* 要运行，它需要 *1* 0k的内存分配，但是现在拥有的资源是内存大小只有6k,那我们该怎么办？ *覆盖* *技术* 就可以解决这样一个问题。即在较小的可用内存中运行较大的程序。 *覆盖* *技术* 又是怎么实现的呢？ 依据整个程序的逻辑结构，把不相关，不会相互调用的模块划分一组来进行内存的共享。 main()// *3* k {](https://blog.csdn.net/yxlr_beta/article/details/51476571)[内存空间扩充之 *进程* *覆盖* *技术* ， *交换技术*](https://guozhenglei.blog.csdn.net/article/details/133802699)[jungleirim的博客](https://blog.csdn.net/qq_61888137)

10-13 702[人们引入了 *覆盖* *技术* ，用来解决“程序大小超过物理内存总和”的问题。](https://guozhenglei.blog.csdn.net/article/details/133802699)[【 *操作系统* -57】 *覆盖* 和交换](https://blog.csdn.net/m0_69378371/article/details/144655043)

[

最新发布

](https://blog.csdn.net/m0_69378371/article/details/144655043)

[m0\_69378371的博客](https://blog.csdn.net/m0_69378371)

12-22 2048[（Overlay）和（Swapping）是 *操作系统* 中的两种 *内存管理* *技术* ，它们用于在内存不足时优化系统的内存使用。尽管这两种 *技术* 的目的都是解决内存不足的问题，但它们的工作原理和适用场景有所不同。](https://blog.csdn.net/m0_69378371/article/details/144655043)- [关于我们](https://www.csdn.net/company/index.html#about)
- [招贤纳士](https://www.csdn.net/company/index.html#recruit)
- [商务合作](https://fsc-p05.txscrm.com/T8PN8SFII7W)
- [寻求报道](https://marketing.csdn.net/questions/Q2202181748074189855)
- [协议专区](https://marketing.csdn.net/p/a65bad49d09e5e6d1a9c674bb41ef331?pId=3340)
- 400-660-0108
- [kefu@csdn.net](mailto:webmaster@csdn.net)
- [在线客服](https://csdn.s2.udesk.cn/im_client/?web_plugin_id=29181)
- 工作时间 8:30-22:00
- [公安备案号11010502030143](http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010502030143)
- [京ICP备19004658号](http://beian.miit.gov.cn/publish/query/indexFirst.action)
- [京网文〔2020〕1039-165号](https://csdnimg.cn/release/live_fe/culture_license.png)
- [经营性网站备案信息](https://csdnimg.cn/cdn/content-toolbar/csdn-ICP.png)
- [北京互联网违法和不良信息举报中心](http://www.bjjubao.org/)
- [家长监护](https://download.csdn.net/tutelage/home)
- [网络110报警服务](https://cyberpolice.mps.gov.cn/)
- [中国互联网举报中心](http://www.12377.cn/)
- [Chrome商店下载](https://chrome.google.com/webstore/detail/csdn%E5%BC%80%E5%8F%91%E8%80%85%E5%8A%A9%E6%89%8B/kfkdboecolemdjodhmhmcibjocfopejo?hl=zh-CN)
- [账号管理规范](https://blog.csdn.net/blogdevteam/article/details/126135357)
- [版权与免责声明](https://www.csdn.net/company/index.html#statement)
- [版权申诉](https://blog.csdn.net/blogdevteam/article/details/90369522)
- [出版物许可证](https://img-home.csdnimg.cn/images/20250103023206.png)
- [营业执照](https://img-home.csdnimg.cn/images/20250103023201.png)
- ©1999-2026北京创新乐知网络技术有限公司