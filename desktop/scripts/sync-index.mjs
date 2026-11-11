import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Build and synchronize packaging metadata from the canonical release version.
execFileSync(process.execPath, [resolve(projectRoot, "..", "tools", "build-single-file.js")], { stdio: "inherit" });
const source = process.env.PROSPECTOR_INDEX || resolve(projectRoot, "..", "index.html");
const target = resolve(projectRoot, "app", "index.html");

if (!existsSync(source)) {
  console.error(`Could not find Prospector II HTML source: ${source}`);
  console.error("Set PROSPECTOR_INDEX to the full path of your index.html if it lives somewhere else.");
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);

const bytes = statSync(target).size.toLocaleString();
console.log(`Synced ${source} -> ${target} (${bytes} bytes)`);
