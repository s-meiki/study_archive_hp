#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = process.env.NEXT_DIST_DIR || ".next";
const SERVER_DIR = path.join(ROOT, DIST_DIR, "server");
const CHUNKS_DIR = path.join(SERVER_DIR, "chunks");
const NEXT_BIN = require.resolve("next/dist/bin/next");
const mode = process.argv[2] || "dev";
const extraArgs = process.argv.slice(3);

async function pathExists(targetPath) {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureChunkLinks() {
  if (!(await pathExists(CHUNKS_DIR))) {
    return;
  }

  const entries = await fsp.readdir(CHUNKS_DIR, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
      .map(async (entry) => {
        const linkPath = path.join(SERVER_DIR, entry.name);
        const relativeTarget = path.join("chunks", entry.name);

        try {
          const current = await fsp.readlink(linkPath);
          if (current === relativeTarget) {
            return;
          }
          await fsp.unlink(linkPath);
        } catch (error) {
          if (error && error.code !== "EINVAL" && error.code !== "ENOENT") {
            try {
              await fsp.unlink(linkPath);
            } catch {}
          }
        }

        try {
          await fsp.symlink(relativeTarget, linkPath);
        } catch (error) {
          if (error && error.code === "EEXIST") {
            return;
          }

          await fsp.copyFile(path.join(CHUNKS_DIR, entry.name), linkPath);
        }
      }),
  );
}

function startChunkSyncLoop() {
  let running = false;

  const tick = async () => {
    if (running) {
      return;
    }

    running = true;
    try {
      await ensureChunkLinks();
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, 500);
  timer.unref();
  void tick();
  return timer;
}

async function main() {
  const syncTimer = startChunkSyncLoop();
  const child = spawn(process.execPath, [NEXT_BIN, mode, ...extraArgs], {
    cwd: ROOT,
    env: process.env,
    stdio: "inherit",
  });

  const shutdown = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  child.on("exit", async (code, signal) => {
    clearInterval(syncTimer);
    await ensureChunkLinks().catch(() => {});

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
