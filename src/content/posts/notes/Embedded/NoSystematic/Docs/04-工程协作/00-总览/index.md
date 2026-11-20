---
title: "00-总览"
published: 2026-11-18
description: "工程协作 · 分区总览 [!note] 这是什么 写代码之外的工程能力：版本控制、分支策略、代码评审、提交规范。 目前只有一篇 Git 实战经验，其余主题按「待"
tags: ["工程协作/团队协作", "索引"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/04-工程协作"
draft: false
order: 78
---

# 工程协作 · 分区总览

> **这是什么**
> 写代码之外的工程能力：**版本控制、分支策略、代码评审、提交规范**。
> 目前只有一篇 Git 实战经验，其余主题按「待扩展」列在下面，后续按需补。

## 笔记地图

| 笔记 | 一句话 | 适合谁 |
|---|---|---|
| [Git团队协作经验](../../../../../Embedded/NoSystematic/Docs/04-工程协作/git团队协作经验/) | 实习期总结的 7 条 Git 习惯：同步、分支、小提交、rebase、冲突、PR、复位 | 刚开始参与团队项目的人 |

## 核心习惯速记

| # | 习惯 | 命令 / 做法 |
|:--:|---|---|
| 1 | 动手前先同步 | `git status` → `git switch main` → `git pull --rebase origin main` |
| 2 | 一个需求一个分支 | `git switch -c feature/user-profile` |
| 3 | 提交小而清晰 | 一个完整变更一次提交，写 `feat:` / `fix:` / `refactor:` |
| 4 | 推送前整理历史 | `git rebase -i HEAD~4` |
| 5 | 冲突先理解再动手 | `git fetch` → `git rebase`，改完 `git add` → `git rebase --continue` |
| 6 | PR 是沟通工具 | 写清楚问题、方案、验证方式、兼容性影响 |
| 7 | 危险操作先确认 | `reset --hard`、强推之前先看分支；误操作先 `git reflog` |

## 待扩展

| 主题 | 想解决的事 | 状态 |
|---|---|---|
| 分支模型 | Git Flow / GitHub Flow / 主干开发怎么选 | 待写 |
| 提交规范 | Conventional Commits 与自动生成 CHANGELOG | 待写 |
| 代码评审 | Review 清单、评论话术、如何提小 PR | 待写 |
| 发布管理 | tag、版本号、回滚与热修复 | 待写 |
| 文档协作 | Obsidian + Git 的同步与冲突处理 | 待写 |

## 相邻分区

- 自动化构建与门禁：[命令行与CI构建（Keil-ARM）](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/命令行与ci构建_keil-arm/)、[测试与覆盖率（嵌入式）](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/测试与覆盖率_嵌入式/)
- 远程仓库所在环境：Linux与网络共享总览
- 开发机环境：环境手册总览
