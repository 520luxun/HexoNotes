---
title: "openGauss-用户与使用手册"
published: 2026-11-19
description: "openGauss 用户与使用手册 配套文档：[[openGauss5.0.2单机安装部署实录]]（安装与排错）· [[openGauss全流程详解]]（原理）"
tags: ["服务器与数据库/openGauss", "服务器与数据库/openEuler"]
category: "NoSystematic"
path: "Embedded/NoSystematic/Docs/07-服务器与数据库"
draft: false
order: 90
---

# openGauss 用户与使用手册

> 配套文档：[openGauss-5.0.2-单机安装部署实录](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-5_0_2-单机安装部署实录/)（安装与排错）· [openGauss-全流程详解](../../../../../Embedded/NoSystematic/Docs/07-服务器与数据库/opengauss-全流程详解/)（原理）
> 本文只讲一件事：**这台机器上有哪些"用户"，他们分别是谁、能干什么、怎么用。**
> 数据来源：2026-11-19 在本机（`luxunacc` / 192.168.80.139）实测查询结果。

---

## 0. 一句话现状

```
1 个数据库实例（openGauss 5.0.2，端口 26000）
├── 4 个数据库：postgres / db_tpcc / template0 / template1
├── 2 个可登录的数据库用户：omm（超级）/ jiang（普通）
└── 8 个系统预定义角色：gs_role_*（不可登录，按需授权）
系统层面 3 个与你有关的用户：root（管理员）/ luxun（日常）/ omm（数据库）
```

---

## 1. 最重要的概念：两类"用户"完全不是一回事

这是所有混乱的根源。**"用户"在两个不同的层里各有一份，互不相通。**

| 层 | 存在哪里 | 谁 | 用来干什么 |
|---|---|---|---|
| **操作系统用户** | `/etc/passwd` | `root`、`luxun`、`omm`、`opengauss` | 登录服务器、启动进程、控制文件权限 |
| **数据库用户（角色 role）** | 数据库内部 `pg_roles` | `omm`、`jiang`、`gs_role_*` | 连接数据库、执行 SQL、访问对象 |

几个必须记住的结论：

- **`omm` 两层都有**：既是 Linux 用户，又是数据库超级用户。名字一样，但是**两条独立记录**，密码也可以不同（本次恰好都是 `wlovelu1@A`）。
- **`jiang` 只在数据库里**：操作系统里没有 `jiang` 这个用户，所以你**不能** `su - jiang`。
- **`root` / `luxun` 只在操作系统里**：数据库里没有这两个角色，不能 `gsql -U root`。
- 数据库里"我是谁"由连库时的 `-U` 决定，跟当前 shell 的 OS 用户无关（默认取同名 OS 用户）。

---

## 2. 操作系统用户（uid ≥ 1000 实测清单）

| 用户 | uid | 主组 | 家目录 | 能做什么 | 建议 |
|---|---|---|---|---|---|
| `nobody` | 65534 | nobody | `/` | 系统占位，`/sbin/nologin` | 别碰 |
| `opengauss` | 1000 | opengauss | `/var/lib/opengauss` | 原 RPM 版 2.1.0 实例的用户 | **软件已卸载，这是残留用户，可删** |
| `luxun` | 1001 | luxun | `/home/luxun` | 普通用户，**在 `wheel` 组 = 可 `sudo`** | 你 SSH 登录用的就是它 |
| `omm` | 1002 | **dbgrp** | `/home/omm` | 数据库专用：跑 `gaussdb`、`gs_om`、`gs_install`、`gsql` | 不要拿它做系统管理 |
| `root` | 0 | root | `/root` | 系统管理员 | 只在必要时用 |

相关组：

```
wheel   : luxun          ← 决定 luxun 能不能 sudo
dbgrp   : （omm 的主组） ← 安装数据库时指定的 -G 组
opengauss:（无成员）      ← 旧实例遗留
```

### 身份切换对照

| 从 → 到 | 命令 | 说明 |
|---|---|---|
| root → omm | `su - omm` | **必须带横杠**，否则不加载 `GAUSSHOME`/`PATH` |
| omm → root | `exit` | 回到上一层 |
| luxun → root | `sudo -i` 或 `sudo <命令>` | luxun 在 wheel 组，有 sudo |
| Windows → 服务器 | `ssh luxun@192.168.80.139` | 已配好密钥登录 |
| 任何用户 → 数据库 | `gsql ...` | 连库身份看 `-U` 参数 |

> `omm` **不在 wheel 组**，默认没有 sudo —— 这是有意的设计：数据库用户不应该能改系统。

---

## 3. 数据库用户（角色）

实测 `pg_roles` 输出（10 行）：

| 角色 | 超级用户 | 建库 | 建角色 | 可登录 | 说明 |
|---|---|---|---|---|---|
| `omm` | ✅ | ✅ | ✅ | ✅ | 初始化时创建的超级用户，管理员 |
| `jiang` | ❌ | ❌ | ❌ | ✅ | 你建的普通用户，只是 `db_tpcc` 的 owner |
| `gs_role_account_lock` | ❌ | ❌ | ❌ | ❌ | 锁定/解锁账户 |
| `gs_role_copy_files` | ❌ | ❌ | ❌ | ❌ | 服务端文件操作（备份用） |
| `gs_role_directory_create` | ❌ | ❌ | ❌ | ❌ | 创建目录对象 |
| `gs_role_directory_drop` | ❌ | ❌ | ❌ | ❌ | 删除目录对象 |
| `gs_role_pldebugger` | ❌ | ❌ | ❌ | ❌ | PL/pgSQL 调试 |
| `gs_role_replication` | ❌ | ❌ | ❌ | ❌ | 复制槽/逻辑复制 |
| `gs_role_signal_backend` | ❌ | ❌ | ❌ | ❌ | 杀会话（`pg_terminate_backend`） |
| `gs_role_tablespace` | ❌ | ❌ | ❌ | ❌ | 建表空间 |

### `gs_role_*` 是什么

openGauss 的**预定义特权角色**。作用是：不想给业务账号 `sysadmin`（超级权限）时，可以只授予某一项能力。当前**没有任何用户被授予**这些角色。

典型用法：

```sql
-- 让某个用户能杀掉别人的会话
GRANT gs_role_signal_backend TO dba_user;

-- 让备份账号能读写服务端文件
GRANT gs_role_copy_files TO backup_user;
```

---

## 4. 两层的对应关系（一张表看懂）

| 名字 | 操作系统用户 | 数据库用户 | 密码 | 用途 |
|---|---|---|---|---|
| `root` | ✅ | ❌ | 只有你知道 | 装系统、改 sysctl、防火墙 |
| `luxun` | ✅ | ❌ | 你自己设的 | SSH 登录、sudo |
| `omm` | ✅ | ✅（超级） | `wlovelu1@A` | 数据库启停/管理/连接 |
| `jiang` | ❌ | ✅（普通） | `Bigdata123` | 业务账号（lesson 里建的） |
| `opengauss` | ✅（残留） | ❌ | — | 旧 2.1.0 实例，已卸载 |

> 所以：`whoami` 显示 `omm`，但 `SELECT current_user;` 可能显示 `jiang`（如果你用了 `gsql -U jiang`）。**两个问题要分开问。**

---

## 5. 连接方式速查（本机实测可用）

| 场景 | 命令 |
|---|---|
| 本机 omm 进默认库 | `gsql -d postgres -p 26000` |
| 本机 omm 带密码（脚本里用） | `gsql -d postgres -p 26000 -W 'wlovelu1@A'` |
| 本机 jiang 进业务库 | `gsql -d db_tpcc -p 26000 -U jiang -W 'Bigdata123'` |
| 执行单条 SQL 就退出 | `gsql -d db_tpcc -p 26000 -W 'xxx' -c "SELECT * FROM mytable;"` |
| 从 Windows 远程 | **暂不可用**，见 5.2 |

### 5.1 为什么本机 `omm` 不用输密码

`pg_hba.conf` 实测内容（5 条规则，自上而下匹配）：

```
local   all   all                              trust     ← 本机 socket，免密
host    all   omm   192.168.80.139/32          trust     ← omm 从自己 IP 来，免密
host    all   all   127.0.0.1/32               trust     ← 本机回环，免密
host    all   all   192.168.80.139/32          sha256    ← 从自己 IP 来，要密码
host    all   all   ::1/128                    trust
```

### 5.2 为什么 Windows 现在连不上 26000

两个原因，缺一不可：

1. `pg_hba.conf` 里**没有** `192.168.80.0/24` 这条（Windows 的 IP 通常是 `192.168.80.1`，匹配不到任何规则 → 拒绝）；
2. 需要 `sha256` 方式认证 + 用户密码。

要开放远程，加一行再 reload：

```bash
sudo -u omm vi /opt/software/openGauss/install/data/dn/pg_hba.conf
# 追加：
host    all    all    192.168.80.0/24    sha256

su - omm
gs_om -t reload       # 或 gs_ctl reload -D /opt/software/openGauss/install/data/dn
```

然后 Windows 上用客户端（DBeaver / Navicat / `gsql`）连 `192.168.80.139:26000`。

---

## 6. 日常操作剧本（可直接复制）

### 剧本 A：进去看看

```bash
su - omm
gsql -d postgres -p 26000 -r
```
```sql
\l                     -- 列出所有库
\du                    -- 列出所有用户/角色
\c db_tpcc             -- 切到业务库
\dt                    -- 看表
\d mytable             -- 看表结构
SELECT * FROM mytable; -- 看数据
\q                     -- 退出
```

### 剧本 B：建一个 UTF8 的库

```sql
CREATE DATABASE db_test WITH ENCODING 'UTF8' TEMPLATE template0 OWNER jiang;
```

> 约定：**永远 `TEMPLATE template0` + 显式 `ENCODING`**，不受 template1 改动影响，中文不乱码。

### 剧本 C：建业务账号 + 最小授权（推荐做法）

```sql
-- 1) 建用户（omm 执行）
CREATE USER app_user WITH PASSWORD 'App@2026abc';

-- 2) 允许连库
GRANT CONNECT ON DATABASE db_tpcc TO app_user;

-- 3) 进到目标库后授权 schema 与表
\c db_tpcc
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- 4) 以后新建的表也自动授权
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
```

### 剧本 D：改密码

```sql
-- 管理员改别人（omm）
ALTER USER jiang IDENTIFIED BY 'Jiang@2026abc';

-- 用户改自己
ALTER USER CURRENT_USER IDENTIFIED BY 'NewPass@2026';
```
> 复杂度要求：长度 ≥ 8，且大写/小写/数字/特殊符号中至少三类。

### 剧本 E：看谁连着、在跑什么

```sql
SELECT datname, usename, client_addr, state, query_start
FROM pg_stat_activity
ORDER BY query_start;

-- 杀某个会话（需要 sysadmin 或 gs_role_signal_backend）
SELECT pg_terminate_backend(<pid>);
```

### 剧本 F：删库 / 删用户（顺序很重要）

```sql
-- 删库：先确认没人在连
DROP DATABASE db_test;

-- 删用户：先处理它拥有的对象，否则报 "cannot be dropped because some objects depend on it"
DROP OWNED BY app_user;      -- 在它拥有的库里执行
DROP USER app_user;
```

### 剧本 G：备份 / 恢复（omm 身份）

```bash
gs_dump -U omm -W 'wlovelu1@A' -p 26000 -f /home/omm/db_tpcc.sql db_tpcc
gs_restore -U omm -W 'wlovelu1@A' -p 26000 -d db_tpcc_new /home/omm/db_tpcc.sql
```

---

## 7. 常见报错 → 真实原因

| 报错 | 原因 | 解决 |
|---|---|---|
| `role "xxx" does not exist` | 数据库里没这个用户（可能你把它当 OS 用户了） | `\du` 查；先 `CREATE USER` |
| `permission denied to log in` | 用户存在但 `canlogin=false`（如 `gs_role_*`） | 不能用它连库 |
| `password authentication failed` | 密码错 | 管理员 `ALTER USER ... IDENTIFIED BY ...` |
| `no pg_hba.conf entry for host ...` | 来源 IP 没放行 | 加 `host all all <网段> sha256` 后 reload |
| `permission denied for table mytable` | 没 GRANT 或不是 owner | `GRANT SELECT ...` 或换 owner |
| `must be owner of table` | 想改表结构但无 owner 权限 | `ALTER TABLE ... OWNER TO xxx` |
| `must be system admin to ...` | 需要 sysadmin/omm | 用 omm 执行 |
| `cannot be dropped because some objects depend on it` | 用户还拥有对象 | 先 `DROP OWNED BY user;` |
| `FATAL: Forbid remote connection with trust method!` | pg_hba 里对远程用了 `trust` | 远程必须用 `sha256` |

---

## 8. 安全与整洁建议（按优先级）

1. **删掉残留的 `opengauss` 用户**（旧实例已卸载）：
   ```bash
   sudo ps -ef | grep [g]aussdb      # 确认没有它的进程
   sudo userdel opengauss
   ```
2. **改掉 `jiang` 的弱密码** `Bigdata123` → 至少 12 位含特殊字符。
3. **业务不要用 `omm` 连库**：用剧本 C 建最小权限账号。
4. **远程开放时用具体网段 + `sha256`**，不要 `0.0.0.0/0` + `trust`。
5. **新建库统一 `TEMPLATE template0` + `ENCODING 'UTF8'`**（现在全是 `SQL_ASCII`，存中文有隐患）。

---

## 9. 速查卡（背这 10 行）

```
1. 两类用户：OS 用户（/etc/passwd） ≠ 数据库角色（pg_roles）
2. root=系统管理员   luxun=日常+sudo   omm=数据库（两边都是它）
3. jiang 只存在于数据库里，不能 su - jiang
4. 进库：su - omm  →  gsql -d postgres -p 26000 -r
5. 切库：\c db_tpcc      看库：\l      看用户：\du      看表：\dt
6. 密码：omm=wlovelu1@A    jiang=Bigdata123
7. 本机免密（pg_hba trust），远程要 sha256 + 放行网段
8. 建库：CREATE DATABASE x WITH ENCODING 'UTF8' TEMPLATE template0 OWNER jiang;
9. 建用户：CREATE USER x WITH PASSWORD '...'; 再 GRANT（最小权限）
10. 重启机器后数据库不自启：su - omm && gs_om -t start
```
