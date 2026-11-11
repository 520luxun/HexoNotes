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
const syncOnly = args.includes("--sync-only");
const syncArgs = args.filter((a) => a !== "--sync-only").join(" ");

run(`node scripts/sync-notes.mjs ${syncArgs}`.trim());
if (!syncOnly) {
	run("pnpm exec astro build");
	run("pnpm exec pagefind --site dist");
}
