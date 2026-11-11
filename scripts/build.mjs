import { spawnSync } from "node:child_process";

// CodeBuddy's safe-delete shim caps bulk deletions per command at 500.
// A build with 100+ posts removes more SSR chunks than that, so raise the
// limit for child processes only (harmless on CI where the shim is absent).
const env = {
	...process.env,
	CODEBUDDY_SAFE_DELETE_BULK_THRESHOLD: "5000",
};

const run = (command) => {
	const result = spawnSync(command, { stdio: "inherit", shell: true, env });
	if (result.status !== 0) process.exit(result.status ?? 1);
};

const args = process.argv.slice(2);
const takeFlag = (name) => {
	const i = args.indexOf(name);
	if (i === -1) return undefined;
	const value = args[i + 1];
	args.splice(i, 2);
	return value;
};

// Allow building for another origin/path (e.g. a custom domain served at "/").
const site = takeFlag("--site");
const base = takeFlag("--base");
if (site) env.DEPLOY_SITE = site;
if (base) env.DEPLOY_BASE = base;

const syncOnly = args.includes("--sync-only");
const syncArgs = args.filter((a) => a !== "--sync-only").join(" ");

run(`node scripts/sync-notes.mjs ${syncArgs}`.trim());
if (!syncOnly) {
	run("pnpm exec astro build");
	run("pnpm exec pagefind --site dist");
}
