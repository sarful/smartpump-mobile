import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : "runtime";

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

function isPlaceholder(value) {
  return !value || /your-backend-domain/i.test(value) || /example/i.test(value);
}

function validateBaseUrl(rawValue, failures, warnings) {
  if (!rawValue) {
    failures.push("Missing required env: EXPO_PUBLIC_API_BASE_URL");
    return;
  }
  if (isPlaceholder(rawValue)) {
    failures.push("EXPO_PUBLIC_API_BASE_URL must be replaced with a real backend URL");
    return;
  }

  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    failures.push("EXPO_PUBLIC_API_BASE_URL must be a valid URL");
    return;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    failures.push("EXPO_PUBLIC_API_BASE_URL must start with http:// or https://");
  }

  const host = parsed.hostname.toLowerCase();
  const isLocalhost = host === "localhost" || host === "127.0.0.1";
  if ((mode === "build:apk" || mode === "build:aab" || mode === "build") && isLocalhost) {
    failures.push("EXPO_PUBLIC_API_BASE_URL cannot use localhost for release builds");
  }
  if (mode === "dev" && isLocalhost) {
    warnings.push("Using localhost API base URL. This only works when the device/emulator can reach your machine.");
  }
}

loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, ".env.local"));

const failures = [];
const warnings = [];
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || "";

validateBaseUrl(apiBaseUrl, failures, warnings);

if (warnings.length > 0) {
  console.log(`[mobile-env-check:${mode}] warnings:`);
  for (const warning of warnings) console.log(`  - ${warning}`);
}

if (failures.length > 0) {
  console.error(`[mobile-env-check:${mode}] failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`[mobile-env-check:${mode}] PASS`);
