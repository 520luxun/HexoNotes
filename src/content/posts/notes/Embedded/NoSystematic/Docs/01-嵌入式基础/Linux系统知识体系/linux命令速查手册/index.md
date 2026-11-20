---
title: "Linux命令速查手册"
published: 2026-11-18
description: "Linux命令速查手册 [!abstract] 本文定位 常用 Linux 命令八类速查：文件目录、文本处理、权限、系统资源、网络、压缩、用户管理、软件包，附自"
tags: ["嵌入式", "嵌入式/系统"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/01-嵌入式基础/Linux系统知识体系"
draft: false
order: 49
---

# Linux命令速查手册

> **本文定位**
> 常用 Linux 命令八类速查：文件目录、文本处理、权限、系统资源、网络、压缩、用户管理、软件包，附自制手册方法。

下面按使用场景分类整理常用命令：文件操作、文本处理、系统管理、网络等，可随时查阅或摘录到自己的速查表。

---

## 📘 常用 Linux 命令速查本

### 一、文件与目录操作

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `ls` | 列出目录内容 | `ls -l` （详细列表）、 `ls -a` （显示隐藏文件） |
| `cd` | 切换目录 | `cd /home/user` 、 `cd ..`（返回上级） |
| `pwd` | 显示当前路径 | `pwd` |
| `mkdir` | 创建目录 | `mkdir dir` 、 `mkdir -p a/b/c` （递归创建） |
| `rmdir` | 删除空目录 | `rmdir emptydir` |
| `rm` | 删除文件或目录 | `rm file` 、 `rm -r dir` （递归删除）、 `rm -f` （强制） |
| `cp` | 复制 | `cp source dest` 、 `cp -r srcdir destdir` （递归） |
| `mv` | 移动或重命名 | `mv old new` |
| `touch` | 创建空文件或更新时间戳 | `touch file.txt` |
| `find` | 查找文件 | `find / -name "*.conf"` |
| `locate` | 快速搜索文件名（依赖数据库） | `locate passwd` |
| `tree` | 以树形显示目录结构 | `tree /path` |

### 二、文本内容查看与处理

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `cat` | 连接并显示文件内容 | `cat file` 、 `cat file1 file2 > all` |
| `less` / `more` | 分页查看文件 | `less largefile.log` （可按空格翻页，q退出） |
| `head` | 显示文件开头 | `head -n 20 file` （前20行） |
| `tail` | 显示文件结尾 | `tail -f logfile` （实时跟踪日志） |
| `grep` | 搜索文本 | `grep "error" log.txt` 、 `grep -r "pattern" /etc/` （递归） |
| `cut` | 按列切割文本 | `cut -d: -f1 /etc/passwd` （以:分割取第一列） |
| `sort` | 排序 | `sort file` 、 `sort -n` （按数字） |
| `uniq` | 去重（需配合sort） | `sort file \| uniq -c` （统计重复次数） |
| `wc` | 统计行数、单词数、字符数 | `wc -l file` （行数） |
| `sed` | 流编辑器，替换文本 | `sed 's/old/new/g' file` |
| `awk` | 文本处理工具，按列操作 | `awk '{print $1}' file` （打印第一列） |

### 三、文件权限与属性

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `chmod` | 修改文件权限 | `chmod +x script.sh` 、 `chmod 755 file` |
| `chown` | 修改文件所有者 | `chown user:group file` |
| `stat` | 查看文件详细信息 | `stat file` |

### 四、系统信息与资源

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `uname` | 查看系统信息 | `uname -a` （全部信息） |
| `df` | 查看磁盘使用情况 | `df -h` （以人类可读格式） |
| `du` | 查看目录/文件大小 | `du -sh dir` |
| `free` | 查看内存使用 | `free -h` |
| `ps` | 查看进程 | `ps aux` 、 `ps -ef` |
| `top` / `htop` | 动态显示进程资源 | `top` （按q退出） |
| `kill` | 终止进程 | `kill -9 PID` |
| `jobs` | 列出后台作业 | `jobs` |
| `bg` / `fg` | 后台/前台切换 | `fg %1` （将作业1调至前台） |
| `uptime` | 系统运行时间与负载 | `uptime` |
| `date` | 显示/设置日期时间 | `date` 、 `date +%Y%m%d` |
| `cal` | 显示日历 | `cal 2025` |

### 五、网络相关

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `ifconfig` / `ip` | 查看/配置网络接口 | `ifconfig` 、 `ip addr show` |
| `ping` | 测试网络连通性 | `ping -c 4 baidu.com` |
| `netstat` | 网络状态 | `netstat -anp` （显示端口和进程） |
| `ss` | 比netstat更现代的工具 | `ss -tuln` |
| `curl` / `wget` | 下载文件或测试接口 | `curl http://example.com` 、 `wget url` |
| `ssh` | 远程登录 | `ssh user@host` |
| `scp` | 远程复制文件 | `scp file user@host:/path/` |
| `tcpdump` | 抓包分析 | `tcpdump -i eth0` |
| `nslookup` / `dig` | DNS查询 | `nslookup example.com` |

### 六、压缩与打包

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `tar` | 打包/解包 | `tar -czf archive.tar.gz dir/` （打包压缩）、 `tar -xzf archive.tar.gz` （解压） |
| `gzip` / `gunzip` | 压缩/解压.gz文件 | `gzip file` 、 `gunzip file.gz` |
| `zip` / `unzip` | ZIP格式压缩/解压 | `zip -r archive.zip dir/` 、 `unzip archive.zip` |

### 七、用户与权限管理

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `whoami` | 显示当前用户名 | `whoami` |
| `id` | 显示用户和组ID | `id` |
| `useradd` / `adduser` | 添加用户 | `sudo useradd -m newuser` |
| `passwd` | 修改密码 | `passwd username` |
| `su` | 切换用户 | `su - username` |
| `sudo` | 以root执行命令 | `sudo command` |
| `groups` | 显示用户所属组 | `groups username` |

### 八、软件包管理（以 Debian/Ubuntu 为例）

| 命令 | 作用 | 常用示例 |
| --- | --- | --- |
| `apt update` | 更新软件源列表 | `sudo apt update` |
| `apt upgrade` | 升级所有可升级的包 | `sudo apt upgrade` |
| `apt install` | 安装软件包 | `sudo apt install vim` |
| `apt remove` | 卸载软件包 | `sudo apt remove vim` |
| `apt search` | 搜索软件包 | `apt search keyword` |
| `dpkg` | 底层包管理工具 | `dpkg -l` （列出已安装包） |

---

### 如何制作自己的命令手册？

1. **按需分类** ：根据自己的工作领域（嵌入式开发、服务器运维等）整理常用命令。
2. **记录示例** ：在命令旁附上常用参数和具体例子，方便复制。
3. **善用 `man`** ：遇到不熟悉的命令，输入 `man 命令名` 查看详细手册。
4. **使用 cheat 工具** ：可以安装 `cheat` ，它提供了许多命令的速查表，直接在终端显示。
	```
	sudo apt install cheat   # 安装
	cheat tar                # 查看 tar 命令的常用用法
	```

> **继续扩展**
> 嵌入式常用的交叉编译、设备树、总线调试命令，可按同一格式继续补充到本手册。
