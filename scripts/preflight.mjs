import fs from "fs";
import path from "path";

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const separator = trimmed.indexOf("=");
  if (separator <= 0) return null;

  const key = trimmed.slice(0, separator).trim();
  let value = trimmed.slice(separator + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    if (typeof process.env[parsed.key] === "undefined") {
      process.env[parsed.key] = parsed.value;
    }
  }
}

const root = path.resolve(import.meta.dirname, "..");
loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, ".env.local"));

const rawBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
if (!rawBase) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL. Set it in .env before running preflight.");
}
const baseUrl = rawBase.replace(/\/+$/, "");

const token = process.env.MOBILE_PREFLIGHT_TOKEN?.trim();
const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

async function check(path, expectStatus) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { headers: authHeader });
  const body = await res.json().catch(() => ({}));
  const ok = expectStatus.includes(res.status);
  console.log(`${ok ? "PASS" : "FAIL"} ${path} -> ${res.status}`);
  if (!ok) {
    console.log("Response:", body);
    process.exitCode = 1;
  }
}

console.log(`Preflight base URL: ${baseUrl}`);
await check("/api/mobile/health", [200]);
await check("/api/mobile/ready", [200]);
await check("/api/mobile/auth/me", [401]);

if (process.exitCode && process.exitCode !== 0) {
  throw new Error("Preflight checks failed");
}

console.log("Preflight checks passed.");
