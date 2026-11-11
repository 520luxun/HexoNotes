---
title: 10 个我希望早点知道的 Linux 终端技巧
published: 2026-11-10
description: 从 Ctrl+R 历史搜索到 alias 自定义快捷方式，10 个能立刻提升命令行效率的 bash 技巧，附详细用法与示例。
tags: [Linux, Shell, 效率]
category: Linux
path: "MISC"
draft: false
lang: zh_CN
---

源自 StackMonsters 的视频《10 Linux Tricks I WISH I Knew Sooner》，以下技巧几乎适用于所有 Linux 发行版（包括 Ubuntu），默认 shell 为 bash。

<!-- more -->

## 1. Ctrl+R：搜索历史命令

别再狂按上箭头翻历史了。按下 `Ctrl+R` 进入反向搜索模式，输入关键词即可匹配最近使用过的命令：

```bash
(reverse-i-search)`docker': docker compose up -d
```

- 继续按 `Ctrl+R`：跳到更早的匹配项
- `Enter`：直接执行
- `→` 或 `→` 方向键：取出命令继续编辑，不执行
- `Ctrl+G`：取消搜索

进阶：搜索到命令后按 `Ctrl+O` 可以执行并再次进入搜索，适合连续执行一串历史命令。

## 2. `sudo !!`：修复忘记 sudo 的命令

刚敲完 `apt update` 才发现忘了 sudo？不用重新打一遍：

```bash
$ apt update
Reading package lists... Done
E: Could not open lock file ... are you root?

$ sudo !!
sudo apt update
```

`!!` 会被展开为上一条完整命令。其他常用的历史展开还有：

- `!$` —— 上一条命令的最后一个参数
- `!*` —— 上一条命令的全部参数
- `sudo !n` —— 执行历史中第 n 条命令

## 3. `Alt+.`：复用上一个参数

上一条命令的最后一个参数太长不想再敲？按 `Alt+.`（macOS 上是 `Esc+.` 或 `Option+.`）自动插入：

```bash
$ cp /var/log/nginx/access.log /tmp/
$ tar czf backup.tar.gz Alt+.
# 自动变成：
$ tar czf backup.tar.gz /tmp/
```

连续按会循环替换为更早命令的最后一个参数。比 `!$` 更直观，因为你能看到插入了什么。

## 4. `cd -`：跳回上一个目录

`cd -` 在「当前目录」和「上一次所在目录」之间来回切换：

```bash
$ cd /etc/nginx
$ cd /var/www
$ cd -    # 回到 /etc/nginx
$ cd -    # 又回到 /var/www
```

类似 `Ctrl+Z` 之于进程，`cd -` 就是目录层面的「撤销」。

## 5. Ctrl+A / Ctrl+E / Ctrl+W：快速编辑长命令

光标已经移到行尾才发现开头拼错了？不用按几十次方向键：

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl+A` | 跳到行首 |
| `Ctrl+E` | 跳到行尾 |
| `Ctrl+W` | 向前删除一个单词 |
| `Ctrl+K` | 删除光标到行尾 |
| `Ctrl+U` | 删除光标到行首（或整行） |
| `Ctrl+←/→` | 按单词左右移动 |

典型工作流：`Ctrl+A` 回行首 → `Ctrl+W` 删掉错误的第一个单词 → 重打 → `Ctrl+E` 回行尾。

## 6. `sudo tee`：向 root 权限文件写入内容

你可能试过这样写配置然后失败：

```bash
$ sudo echo "vm.swappiness=10" > /etc/sysctl.conf
# 失败：> 重定向是由当前 shell 执行的，sudo 管不到它
```

因为重定向 `>` 是**当前普通用户 shell** 完成的，sudo 只提升了 `echo` 的权限。正确做法是用 `tee`：

```bash
$ echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
```

- `tee` 把 stdin 写入文件并输出到屏幕
- 加 `-a` 是追加，不加是覆盖

## 7. 大括号扩展：批量创建/删除文件

花括号里的内容会被 shell 展开成多个参数：

```bash
# 批量创建
$ touch src/{main,utils,config}.py
# 等价于 touch src/main.py src/utils.py src/config.py

# 创建多层目录
$ mkdir -p project/{src,tests,docs}/2026

# 备份再修改
$ cp nginx.conf{,.bak}
# 等价于 cp nginx.conf nginx.conf.bak

# 连续序列
$ touch file_{1..10}.txt
$ mkdir chapter_{01..12}
```

注意：`.bak` 前面的空参数（`,` 左侧为空）展开就是原文件名本身，这是备份的惯用写法。

## 8. Ctrl+U / Ctrl+Y：暂存半截命令

命令打到一半，发现需要先做别的事？`Ctrl+U` 剪切整行（它会存进 kill ring），去执行别的命令，回来后 `Ctrl+Y` 粘贴恢复：

```bash
$ git add -A && git comm    # Ctrl+U 暂存
$ man git-commit            # 先查一下文档
$ git add -A && git commit -m "fix"   # Ctrl+Y 恢复继续输入
```

组合使用：`Ctrl+W` 删掉的单词也能用 `Ctrl+Y` 粘回来。

## 9. Ctrl+Z / fg：暂停并恢复程序

程序占着终端，但你暂时想回 shell？`Ctrl+Z` 把它挂起（suspend）：

```bash
$ vim long_file.txt
# 按 Ctrl+Z
[1]+  Stopped  vim long_file.txt

$ grep "TODO" other_file.txt   # 干点别的事
$ fg                            # 回到 vim
```

- `fg` —— 恢复到前台
- `bg` —— 让挂起的任务在后台继续运行
- `jobs` —— 查看所有挂起/后台任务
- `fg %2` —— 恢复编号为 2 的任务

注意与 `&` 的区别：`Ctrl+Z` 是「暂停」，`bg` 之后才真正在后台跑。

## 10. alias + ~/.bashrc：自定义快捷方式

把常用长命令封装成短别名：

```bash
# ~/.bashrc
alias ll='ls -alF'
alias gs='git status'
alias serve='python3 -m http.server 8000'
alias ports='ss -tulanp'
```

修改后执行 `source ~/.bashrc` 立即生效（或重开终端）。

- `alias gs` —— 查看某个别名的定义
- `unalias gs` —— 临时取消别名
- `\gs` 或 `command gs` —— 绕过别名执行原始命令
- 想带参数的逻辑就别用 alias，写函数：

```bash
# 快速进入项目目录
mkcd() { mkdir -p "$1" && cd "$1"; }
```

## 小结

| 技巧 | 记忆点 |
| --- | --- |
| `Ctrl+R` | 历史命令搜索 |
| `sudo !!` | 补 sudo 重跑 |
| `Alt+.` | 复用上一条参数 |
| `cd -` | 目录间来回跳 |
| `Ctrl+A/E/W` | 行内快速编辑 |
| `sudo tee` | 写 root 文件 |
| `{a,b,1..10}` | 批量展开 |
| `Ctrl+U/Y` | 暂存半截命令 |
| `Ctrl+Z`/`fg` | 挂起与恢复 |
| `alias` | 自定义捷径 |

这些技巧零成本、零安装，今天就可以用起来。建议先从 `Ctrl+R` 和 `sudo !!` 开始，它们的使用频率最高。

> 原视频：[10 Linux Tricks I WISH I Knew Sooner (In 9 Minutes)](https://www.youtube.com/watch?v=JjnICN3yW4E) by StackMonsters，B 站搬运：[BV1gX4V6bE8m](https://www.bilibili.com/video/BV1gX4V6bE8m/)
