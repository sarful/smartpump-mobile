const rawBase = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
const baseUrl = rawBase.replace(/\/+$/, "");

async function check(path, expectStatus) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url);
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
