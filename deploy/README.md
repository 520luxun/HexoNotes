# 博客部署说明

## 当前状态（2026-11）

| 入口 | 地址 | 说明 |
|---|---|---|
| 主站 | https://hexonotes.pages.dev | Cloudflare Pages，跟着 `main` 分支自动构建 |
| 备用 | https://520luxun.github.io/HexoNotes/ | GitHub Pages，Actions 自动部署 |

- **不使用 `blog.luxunacc.xyz`**：`luxunacc.xyz` 的 NS 在阿里云，且 `api` 子域承担比赛项目的 API 与视频，
  把 NS 迁到 Cloudflare 有影响线上接口的风险，因此保持原样
- 博客与 ECS 服务器、域名完全解耦，服务器到期不影响站点
- 内容更新：`git push`（或 `pnpm push:all`）后两个平台都会自动重建

---

## 如果以后仍想绑自定义域名（博客专用的新域名最安全）

不需要。域名只是 DNS 指向，指向哪里都行：

| 方案 | 需要服务器 | 备案 | 国内速度 | 适合 |
|---|---|---|---|---|
| **Cloudflare Pages（推荐）** | 否 | 不需要 | 一般 | 免费、和服务器无关 |
| EdgeOne Pages（腾讯云） | 否 | 自定义域名用国内节点需备案 | 快 | 想快、不想管服务器 |
| 自有 ECS + Caddy | 是（现有香港机，2027-01 到期） | 不需要 | 快 | 想完全自己掌控 |

> 服务器只剩两个月、域名还有一年，**优先选前两种**：博客不再依赖 ECS，服务器到期也不影响站点。
> ECS 上继续只跑 API 和 MQTT，两者互不干扰。

三种方案的构建命令都一样，因为 `astro.config.mjs` 支持用环境变量覆盖站点地址：

```bash
# 根域名/子域名部署（路径为 /）
DEPLOY_SITE=https://blog.luxunacc.xyz/ DEPLOY_BASE=/ pnpm build
# 或直接用封装好的命令
pnpm build:domain
```

---

## 方案 A：EdgeOne Pages（免服务器）

1. 腾讯云控制台 → EdgeOne Pages → 新建项目 → 关联 GitHub 仓库 `520luxun/HexoNotes`
2. 构建配置：
   - 构建命令：`pnpm install && pnpm build`
   - 输出目录：`dist`
   - Node 版本：`22`
   - 环境变量：
     - `DEPLOY_SITE` = `https://blog.luxunacc.xyz/`
     - `DEPLOY_BASE` = `/`
3. 部署完成后，在「域名管理」绑定 `blog.luxunacc.xyz`，EdgeOne 会给出一个 CNAME 目标
4. 阿里云 DNS：新增一条 `CNAME`，主机记录 `blog`，值为上一步给出的目标
   - **不要动** `@` 和 `api` 这两条现有记录
5. 未备案时：自定义域名只能选「全球（不含中国大陆）」节点；想用国内节点需先完成 ICP 备案

## 方案 B：Cloudflare Pages（免服务器、免备案）

1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → 选择 `520luxun/HexoNotes`
2. 构建命令：`pnpm install && pnpm build`，输出目录：`dist`，环境变量同上两条
3. 自定义域名填 `blog.luxunacc.xyz`，按提示在阿里云 DNS 添加它给出的 CNAME
4. 证书由 Cloudflare 自动签发

## 方案 C：挂到自己那台香港 ECS（Caddy）

服务器 `47.76.70.118`，无需备案。

1. 阿里云 DNS 新增 `A` 记录：主机记录 `blog`，记录值 `47.76.70.118`（只加这一条）
2. 服务器上准备目录：

   ```bash
   sudo mkdir -p /var/www/blog && sudo chown -R $USER /var/www/blog
   ```

3. 追加站点块（内容见 `deploy/Caddyfile.blog.snippet`），然后：

   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   sudo caddy reload --config /etc/caddy/Caddyfile
   ```

4. 本地构建并上传（本机需能 SSH 到服务器）：

   ```bash
   DEPLOY_HOST=47.76.70.118 DEPLOY_USER=root DEPLOY_PATH=/var/www/blog pnpm deploy:server
   ```

   等价于手动执行：

   ```bash
   node scripts/build.mjs --site https://blog.luxunacc.xyz/ --base /
   rsync -avz --delete dist/ root@47.76.70.118:/var/www/blog/
   ```

5. 打开 `https://blog.luxunacc.xyz/` 验证（Caddy 会自动申请证书，几秒到一分钟）

---

## 注意事项

- 只新增 `blog` 一条记录，`api.luxunacc.xyz`、根域名的 A 记录保持原样
- MQTT 走 `47.76.70.118:1883` 直连 IP，和域名无关，任何方案都不影响
- GitHub Pages 那条（`https://520luxun.github.io/HexoNotes/`）可以继续保留，作为备用入口
- 每次内容更新后：GitHub Pages 自动部署；自定义域名需重新执行一次上传（方案 A/B 自动，方案 C 手动）
