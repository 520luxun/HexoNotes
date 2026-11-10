import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const GITEE_REPO = "https://gitee.com/luxunacc/hexo-notes.git";

process.env.CODEBUDDY_SAFE_DELETE_BULK_THRESHOLD ||= "5000";

const env = {
	...process.env,
	DEPLOY_SITE: "https://luxunacc.gitee.io/hexo-notes/",
	DEPLOY_BASE: "/hexo-notes/",
};

const sh = (command) => {
	const result = spawnSync(command, { stdio: "inherit", shell: true, env });
	if (result.status !== 0) process.exit(result.status ?? 1);
};

// Keep the GitHub-base build so we do not have to rebuild everything twice.
const distDir = path.resolve("dist");
const backupDir = path.join(os.tmpdir(), "fuwari-dist-github");
if (fs.existsSync(distDir)) {
	fs.mkdirSync(backupDir, { recursive: true });
	fs.cpSync(distDir, backupDir, { recursive: true, force: true });
}

// 1. Build with the Gitee Pages base path (build.mjs also syncs notes).
sh("pnpm build");

// 2. Publish dist/ as an orphan gh-pages branch in a temporary repository.
const tmp = path.join(os.tmpdir(), "fuwari-gitee-pages");
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
fs.cpSync(path.resolve("dist"), tmp, { recursive: true });
fs.writeFileSync(path.join(tmp, ".nojekyll"), "");

const git = (args) => {
	const result = spawnSync("git", args, { cwd: tmp, stdio: "inherit", env });
	if (result.status !== 0) process.exit(result.status ?? 1);
};

git(["init", "-b", "gh-pages"]);
git(["add", "-A"]);
git(["-c", "user.name=520luxun", "-c", "user.email=3974662082@qq.com", "commit", "-m", "Deploy to Gitee Pages"]);
git(["remote", "add", "origin", GITEE_REPO]);
git(["push", "-f", "origin", "gh-pages"]);

// Restore the GitHub-base build for local preview (no rebuild needed).
if (fs.existsSync(backupDir)) fs.cpSync(backupDir, distDir, { recursive: true, force: true });

console.log("\nGitee Pages branch pushed. Enable it at:");
console.log("https://gitee.com/luxunacc/hexo-notes/pages");
