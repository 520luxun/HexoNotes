---
title: "Git团队协作经验"
published: 2026-11-17
description: "Git 团队协作经验：七条让协作变顺的习惯 [!abstract] 本文定位 实习后真正参与团队开发才发现：Git 不只是「提交代码」的工具，而是一套帮助团队协"
tags: ["工程协作/Git", "工程协作/团队协作"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/04-工程协作"
draft: false
order: 79
---

# Git 团队协作经验：七条让协作变顺的习惯

> **本文定位**
> 实习后真正参与团队开发才发现：Git 不只是「提交代码」的工具，而是一套帮助团队**协作、追踪问题、保护成果**的工作方法。
> 下面七条经验按「每天开工 → 提交 → 合并 → 交付」的顺序排列，每条都给出可直接照抄的命令。

> **一页纸速览**
> | # | 习惯 | 关键命令 |
> |:--:|---|---|
> | 1 | 动手前先同步 | `git status` → `git switch main` → `git pull --rebase origin main` |
> | 2 | 一个需求一个分支 | `git switch -c feature/user-profile` |
> | 3 | 提交小而清晰 | `git add <file>` → `git commit -m "feat: ..."` |
> | 4 | 推送前整理历史 | `git rebase -i HEAD~4` |
> | 5 | 冲突先理解再动手 | `git fetch` → `git rebase origin/main` → 改完 `git add` → `git rebase --continue` |
> | 6 | PR 当沟通工具 | 写清问题、方案、验证方式、兼容性影响 |
> | 7 | 危险操作先确认 | `reset --hard`、强推之前先看分支；误操作先 `git reflog` |

## 1. 开始工作前先同步代码

每天开始开发前，先确认当前分支和工作区状态：

```bash
git status
git switch main
git pull --rebase origin main
```

这样可以尽早发现本地是否有未提交的修改，也能减少基于旧代码开发后产生大量冲突的情况。
如果本地还有未完成的工作，先切回自己的功能分支，再按团队约定同步主分支。

## 2. 一个需求对应一个分支

不要直接在 `main` 或 `develop` 分支上开发。接到需求后，创建名称清晰的分支：

```bash
git switch -c feature/user-profile
```

修复问题时用类似 `bugfix/login-timeout` 的命名。分支名能让其他人快速了解改动目的，也方便后续查找和维护。

## 3. 提交要小而清晰

实习初期我把一天的所有修改合并成一个「大提交」，出问题时很难定位。后来改为按一个相对完整的变更拆分提交，并使用能说明动词和目标的提交信息：

```bash
git add src/profile.ts
git commit -m "feat: add profile editing"
```

好的提交信息应该回答「改了什么」，例如：

- `feat: add email verification`
- `fix: handle empty search result`
- `refactor: simplify permission check`
- `docs: update local setup guide`

提交前检查暂存区，避免把调试代码、日志或本地配置一起提交：

```bash
git diff --cached
git status
```

## 4. 推送前先整理自己的提交

功能分支上常有一堆「修一下」「再改改」的临时提交。提 PR 前用交互式 rebase 整理历史：

```bash
git rebase -i HEAD~4
```

合并重复提交、修改提交说明，确保每个提交都能独立理解。这样审核者更容易阅读，也方便以后用 `git bisect` 或 `git revert` 定位和回退问题。

## 5. 正确处理冲突

遇到冲突时，第一步不是删掉某一方的代码，而是先理解双方修改的意图：

```bash
git fetch origin
git rebase origin/main
```

打开冲突文件，重点检查 `<<<<<<<`、`=======`、`>>>>>>>` 标记附近的代码。解决后运行测试，再执行：

```bash
git add <冲突文件>
git rebase --continue
```

如果发现方向不对，可以安全退出本次 rebase：

```bash
git rebase --abort
```

## 6. Pull Request 不是走流程，而是沟通工具

提交 PR 时写清楚四件事：

- 这次改动**解决了什么问题**；
- 主要**实现方式和影响范围**；
- **如何验证**，包括测试命令或截图；
- 是否存在需要关注的**兼容性问题**。

收到评论后逐条回复并及时更新代码。对有争议的实现，先在评论里说明取舍，比只改代码却不解释更高效。

## 7. 让我少踩坑的六个习惯

1. 用 `git diff` 检查修改，用 `git log --oneline` 快速查看历史。
2. 不提交 `.env`、密码、个人 IDE 配置等敏感或无关文件。
3. 需要临时切换任务时优先 `git stash`，但不要长期依赖，重要工作应尽快形成提交。
4. 执行 `reset --hard`、强制推送前，先确认分支和影响范围。
5. 发生误操作先别慌，`git reflog` 往往能找回之前的提交位置。
6. 遵循团队已有的分支策略、提交规范和审核要求，比个人习惯更重要。

## 附：常见症状与排查

| 症状 | 先看什么 |
|---|---|
| 不知道自己改了什么 | `git status`、`git diff` |
| 提交到一半想撤 | `git restore --staged <file>`（只撤暂存） |
| rebase 到一半卡住 | `git status` 看提示；`git rebase --abort` 可回到起点 |
| 提交信息写错 | `git commit --amend`（仅限未推送） |
| 想撤销已推送的提交 | `git revert <commit>`，不要直接强推公共分支 |
| 找不到「消失」的提交 | `git reflog` |

> **公共分支的底线**
> 已经推送到 `main` / `develop` 的提交，不用 `reset --hard` + 强推去「修正历史」；
> 用 `git revert` 产生一个反向提交，团队其他人的历史才不会断。

## 相关笔记

- [命令行与CI构建（Keil-ARM）](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/命令行与ci构建_keil-arm/) —— 把构建与静态检查接进 CI
- [测试与覆盖率（嵌入式）](../../../../../Embedded/NoSystematic/Docs/02-工具链与构建/Keil-ARM构建知识体系/测试与覆盖率_嵌入式/) —— 提交前的自动化验证
- 工程协作总览 —— 本分区入口
