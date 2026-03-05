import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const targetRoot = path.join(root, "dist", "codecanyon", "PumpPilot-Mobile");
const sourceRoot = path.join(targetRoot, "source");
const docsRoot = path.join(targetRoot, "docs");

const includeDirs = ["assets", "src", "scripts"];
const includeFiles = [
  "App.tsx",
  "index.js",
  "app.json",
  "eas.json",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  ".gitignore",
  ".env.example",
  "README.md",
  "MOBILE_CODECANYON_INSTALL.md",
  "MOBILE_CODECANYON_CHECKLIST.md",
];

function clearDist() {
  const distPath = path.join(root, "dist");
  if (fs.existsSync(distPath)) fs.rmSync(distPath, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

clearDist();
fs.mkdirSync(sourceRoot, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });

for (const dir of includeDirs) {
  copyDir(path.join(root, dir), path.join(sourceRoot, dir));
}

for (const file of includeFiles) {
  copyFile(path.join(root, file), path.join(sourceRoot, file));
}

copyFile(path.join(root, "MOBILE_BUYER_QUICK_START.md"), path.join(docsRoot, "buyer-quick-start.md"));

console.log(`[package] prepared: ${path.join(root, "dist", "codecanyon", "PumpPilot-Mobile")}`);
