#!/usr/bin/env node
/**
 * Build the static (no-backend) site and publish it to the `gh-pages` branch.
 *
 * Fully decoupled from Vercel:
 *   - Vercel deploys `main` via vite.config.ts (base "/", backend on).
 *   - GitHub Pages serves the `gh-pages` branch built here via
 *     vite.config.pages.ts (base "/first-teaching/", backend disabled).
 *
 * The publish uses a throwaway git worktree, so your current branch and
 * working tree are never touched.
 *
 * Usage:
 *   node scripts/deploy-pages.mjs           build + publish to gh-pages
 *   node scripts/deploy-pages.mjs --build   build only (no git push)
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  rmSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "dist", "pages");
const WORKTREE = path.join(ROOT, ".gh-pages-worktree");
const BRANCH = "gh-pages";
const buildOnly = process.argv.includes("--build");

const run = (cmd, opts = {}) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
};
const tryRun = (cmd) => {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const capture = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();

// 1. Build the static client.
run("npx vite build --config vite.config.pages.ts");
if (!existsSync(path.join(OUT, "index.html"))) {
  console.error("Build did not produce dist/pages/index.html — aborting.");
  process.exit(1);
}

// 2. SPA deep-link fallback + Jekyll opt-out.
copyFileSync(path.join(OUT, "index.html"), path.join(OUT, "404.html"));
writeFileSync(path.join(OUT, ".nojekyll"), "");

// 3. Neutralize Vercel for this branch. Vercel auto-builds every pushed branch
//    using the project's cached settings ("vite build"), which fails here since
//    gh-pages has no node_modules. This vercel.json turns the branch into a
//    no-build static serve, so any Vercel pickup succeeds instead of erroring.
//    (Production at first-teaching.vercel.app still only tracks `main`.)
writeFileSync(
  path.join(OUT, "vercel.json"),
  JSON.stringify(
    { buildCommand: null, outputDirectory: ".", installCommand: null, framework: null },
    null,
    2,
  ) + "\n",
);
console.log("\nBuilt dist/pages (with 404.html, .nojekyll, vercel.json no-build).");

if (buildOnly) {
  console.log("--build given: skipping publish.");
  process.exit(0);
}

const sha = capture("git rev-parse --short HEAD");

// 3. Prepare a worktree checked out to gh-pages (created as needed).
rmSync(WORKTREE, { recursive: true, force: true });
tryRun(`git worktree remove --force "${WORKTREE}"`);

const localHas = capture(`git branch --list ${BRANCH}`);
const remoteHas = capture(`git ls-remote --heads origin ${BRANCH}`);
if (localHas) {
  run(`git worktree add "${WORKTREE}" ${BRANCH}`);
} else if (remoteHas) {
  run(`git worktree add -b ${BRANCH} "${WORKTREE}" origin/${BRANCH}`);
} else {
  run(`git worktree add --detach "${WORKTREE}"`);
  run(`git -C "${WORKTREE}" checkout --orphan ${BRANCH}`);
}

try {
  // 4. Clear previous contents (keep .git), copy the fresh build in.
  for (const entry of readdirSync(WORKTREE)) {
    if (entry === ".git") continue;
    rmSync(path.join(WORKTREE, entry), { recursive: true, force: true });
  }
  cpSync(OUT, WORKTREE, { recursive: true });

  run(`git -C "${WORKTREE}" add -A`);
  if (!capture(`git -C "${WORKTREE}" status --porcelain`)) {
    console.log("No changes — gh-pages already up to date.");
  } else {
    run(`git -C "${WORKTREE}" commit -m "Deploy static site (source main@${sha})"`);
    run(`git -C "${WORKTREE}" push origin ${BRANCH}`);
    console.log("\n✓ Published to gh-pages.");
  }
} finally {
  tryRun(`git worktree remove --force "${WORKTREE}"`);
  rmSync(WORKTREE, { recursive: true, force: true });
}
