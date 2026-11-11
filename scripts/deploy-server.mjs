import { spawnSync } from "node:child_process";

// 把博客部署到自己的服务器（香港 ECS + Caddy）。
// 用法：
//   DEPLOY_HOST=47.76.70.118 DEPLOY_USER=root DEPLOY_PATH=/var/www/blog pnpm deploy:server
// 说明：需要本机有可用的 SSH 密钥，并且服务器上已配置好 Caddy 站点块
//（见 deploy/Caddyfile.blog.snippet）。

const host = process.env.DEPLOY_HOST;
const user = process.env.DEPLOY_USER ?? "root";
const remoteDir = process.env.DEPLOY_PATH ?? "/var/www/blog";
const port = process.env.DEPLOY_PORT ?? "22";

if (!host) {
	console.error("缺少 DEPLOY_HOST，例如：DEPLOY_HOST=47.76.70.118 node scripts/deploy-server.mjs");
	process.exit(1);
}

const run = (cmd, args) => {
	const r = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
	if (r.error || r.status !== 0) {
		console.error(`[deploy] 失败: ${cmd} ${args.join(" ")}`);
		process.exit(r.status ?? 1);
	}
};

console.log(`[deploy] 构建根域名版本 -> https://blog.luxunacc.xyz/`);
run("node", ["scripts/build.mjs", "--site", "https://blog.luxunacc.xyz/", "--base", "/"]);

console.log(`[deploy] 上传 dist/ -> ${user}@${host}:${remoteDir}/`);
run("rsync", [
	"-avz",
	"--delete",
	"-e",
	`ssh -p ${port}`,
	"dist/",
	`${user}@${host}:${remoteDir}/`,
]);

console.log("[deploy] 完成。若首次部署，请在服务器上追加 Caddy 站点块并 reload:");
console.log("        sudo caddy reload --config /etc/caddy/Caddyfile");
