#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(await readFile(path.join(root, "reference-corpus.json"), "utf8"));
const urls = [...new Map(corpus.SOURCES.map((source) => [source.OFFICIAL_URL, source.SOURCE_ID])).entries()];
const results = [];
let cursor = 0;

async function check([url, sourceId]) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    const blockedByOfficialSite = response.url.includes("/apology_objects/abuse-detection-apology.html");
    const disposition = response.status >= 200 && response.status < 400
      ? "PASS"
      : blockedByOfficialSite || [401, 403, 405, 429].includes(response.status) ? "REVIEW" : "FAIL";
    results.push({ sourceId, status: response.status, disposition, finalUrl: response.url });
  } catch (error) {
    results.push({ sourceId, status: "NETWORK_ERROR", disposition: "REVIEW", finalUrl: url, error: error.name });
  } finally {
    clearTimeout(timer);
  }
}

async function worker() {
  while (cursor < urls.length) {
    const item = urls[cursor++];
    await check(item);
  }
}

await Promise.all(Array.from({ length: 6 }, () => worker()));
results.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
const failures = results.filter((item) => item.disposition === "FAIL");
console.log(JSON.stringify({ checked: results.length, pass: results.filter((item) => item.disposition === "PASS").length, review: results.filter((item) => item.disposition === "REVIEW").length, fail: failures.length, nonPass: results.filter((item) => item.disposition !== "PASS") }, null, 2));
if (failures.length) process.exitCode = 1;
